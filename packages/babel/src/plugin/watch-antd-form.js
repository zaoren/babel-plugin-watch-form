/* eslint-disable consistent-return */
/* eslint-disable no-param-reassign */
const parser = require('@babel/parser');
const { declare } = require('@babel/helper-plugin-utils');
const types = require('@babel/types');
const {
  getMajorVersion,
  generateRandomVariableName,
  getInsertCode,
  getInsertCodeWithoutArguments,
  processOnValuesChangeFunction,
} = require('../util/index');

const watchAntdFormPlugin = declare((api) => {
  api.assertVersion(7);

  return {
    visitor: {
      Program: {
        enter: (path, state) => {
          // 在处理当前文件的时候，做两件事：
          //    1.读取Antd的Major版本(后续对于不同版本的Antd组件需要做不同的处理)
          //    2.提前判断一下是否有Import Form组件，如果没有，也不需要处理当前文件
          state.antdMajorVersion = getMajorVersion('antd');
          if (!state.antdMajorVersion) {
            path.stop(); // 不存在antd版本，直接stop，不做额外的AST操作
          }
          path.traverse({
            ImportDeclaration(curPath) {
              const requirePath = curPath.get('source').node.value;
              if (requirePath === 'antd') {
                // 如果已经引入了form，记录一下
                if (
                  curPath
                    .get('specifiers')
                    .some((item) => item.toString() === 'Form')
                ) {
                  state.importedFormComponent = true;
                  // TODO 这个想一下怎么优化一下 skip 好像也不行，跳过了当前节点就不会继续遍历了
                  // path.skip(); // 找到了就跳过当前节点
                }
              }
            },
          });
        },
      },
      CallExpression(path, state) {
        if (state.antdMajorVersion !== 3) {
          return;
        }
        // Form.create
        const callee = path.get('callee');
        const calleeStr = path.get('callee').toString();

        if (callee.isMemberExpression() && calleeStr === 'Form.create') {
          // 处理Form.create(), 没有任何参数的情况
          if (path.node.arguments.length === 0) {
            const onValuesChangeCode = `
              function onValuesChange(props, changedValues, allValues) {
                ${getInsertCode(state.file.opts.filename)}
              }
            `;
            const onValuesChangeAst = parser.parse(onValuesChangeCode);

            const onValuesChangeProperty = types.objectProperty(
              types.identifier('onValuesChange'),
              types.functionExpression(
                types.identifier('onValuesChange'),
                onValuesChangeAst.program.body[0].params,
                onValuesChangeAst.program.body[0].body,
              ),
            );

            path.node.arguments = [
              types.objectExpression([onValuesChangeProperty]),
            ];
          } else {
            // options 指的是 Form.create 的第一个参数
            // Form.create({})，我们主要处理的是其中的第一个参数
            const [options] = path.node.arguments;

            const getOnValuesChangeValue = (options1) => {
              if (!options1) {
                return false;
              } if (types.isObjectExpression(options1)) {
                const { properties } = options1;
                const len = properties.length;
                // eslint-disable-next-line no-unreachable-loop
                for (let i = 0; i < len; i += 1) {
                  const property = properties[i];
                  if ((types.isObjectProperty(property) || types.isObjectMethod(property))
                  && types.isIdentifier(property.key, { name: 'onValuesChange' })
                  ) {
                    return property;
                  }
                  return false;
                }
              } else {
                return false;
              }
            };

            const onValuesChangeProperty = getOnValuesChangeValue(options);
            // 如果声明了 onValuesChange函数，在原有的onValuesChange上注入代码
            if (onValuesChangeProperty) {
              processOnValuesChangeFunction(onValuesChangeProperty, state);
            } else {
              // 没有声明，直接注入 onValuesChange 函数
              const code = `
                function onValuesChange(props, changedValues, allValues) {
                  ${getInsertCode(state.file.opts.filename)}
                }
              `;
              const ast = parser.parse(code);
              const properties = [
                types.objectProperty(
                  types.identifier('onValuesChange'),
                  types.functionExpression(
                    null,
                    ast.program.body[0].params,
                    ast.program.body[0].body,
                  ),
                ),
              ];
              options.properties.push(...properties);
            }
          }
        }
      },
      JSXOpeningElement(path, state) {
        if (![4, 5].includes(state.antdMajorVersion)) {
          return;
        }
        // 对Form的jsx attributes进行操作
        if (path.get('name').isJSXIdentifier({ name: 'Form' })) {
          const attributes = path.get('attributes');
          // 看看是否有 onValuesChange 属性，有的话，改造，没有的话直接添加
          const onValuesChangeAttribute = attributes.find(
            (attribute) => attribute.get('name').isJSXIdentifier({ name: 'onValuesChange' }),
          );

          if (onValuesChangeAttribute) {
            // 改造 onValuesChange 属性
            const onValuesChangeExpression = onValuesChangeAttribute.get('value.expression');
            if (onValuesChangeExpression.isArrowFunctionExpression()) {
              const { params, body } = onValuesChangeExpression.node;
              const uniquePrefix = generateRandomVariableName();
              // 构建 props 参数节点
              const propsParam = types.identifier(`${uniquePrefix}props`);
              // 构建 changedValues 参数节点
              const changedValuesParam = types.identifier(`${uniquePrefix}changedValues`);
              // 构建 allValues 参数节点
              const allValuesParam = types.identifier(`${uniquePrefix}allValues`);
              if (params.length === 0) {
                // 将参数节点插入到参数列表的结尾
                params.push(propsParam, changedValuesParam, allValuesParam);
              } else if (params.length === 1) {
                // 将参数节点插入到参数列表的结尾
                params.push(changedValuesParam, allValuesParam);
              } else if (params.length === 2) {
                // 构建 allValues 参数节点
                params.push(allValuesParam);
              }
              // 这个时候需要有一个标识名来标识Form
              const ast = parser.parse(
                getInsertCodeWithoutArguments(
                  state.file.opts.filename,
                  params.length >= 3 ? params[2].name : `${uniquePrefix}allValues`,
                ),
              );
              if (body.type === 'BlockStatement') {
                // 有函数体就在开始插入监控代码
                body.body.unshift(ast.program.body[0]);
              }
            } else if (onValuesChangeExpression.isIdentifier()) {
              // 处理函数变量写法 onValuesChange: onValuesChangeFunc
              const onValuesChangeName = onValuesChangeExpression.node.name;
              const uniquePrefix = generateRandomVariableName();
              const propsParam = types.identifier(`${uniquePrefix}props`);
              const changedValuesParam = types.identifier(`${uniquePrefix}changedValues`);
              const allValuesParam = types.identifier(`${uniquePrefix}allValues`);
              const ast = parser.parse(
                getInsertCodeWithoutArguments(state.file.opts.filename, `${uniquePrefix}allValues`),
              );
              const newExpression = types.arrowFunctionExpression(
                [propsParam, changedValuesParam, allValuesParam],
                types.blockStatement([
                  ...ast.program.body,
                  types.expressionStatement(
                    types.callExpression(
                      types.identifier(onValuesChangeName),
                      [propsParam, changedValuesParam, allValuesParam],
                    ),
                  ),
                ]),
              );
              onValuesChangeAttribute.get('value').replaceWith(types.jsxExpressionContainer(newExpression));
            }
          } else {
            const ast = parser.parse(
              getInsertCodeWithoutArguments(state.file.opts.filename, 'allValues'),
            );
            // 没有声明 onValuesChange，直接添加属性
            const newOnValuesChangeAttribute = types.jsxAttribute(
              types.jsxIdentifier('onValuesChange'),
              types.jsxExpressionContainer(
                types.arrowFunctionExpression(
                  [
                    types.identifier('props'),
                    types.identifier('changedValues'),
                    types.identifier('allValues'),
                  ],
                  types.blockStatement([ast.program.body[0]]),
                ),
              ),
            );

            // attributes.push(onValuesChangeAttribute);
            // 将新的属性添加到 JSX Opening Element 的 attributes 属性中
            path.pushContainer('attributes', newOnValuesChangeAttribute);
          }
        }
      },
    },
  };
});

module.exports = watchAntdFormPlugin;
