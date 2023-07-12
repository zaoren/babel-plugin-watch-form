const fs = require('fs');
const path = require('path');
const semver = require('semver');
const { createRequire } = require('module');
const  parser = require('@babel/parser');
const template = require('@babel/template').default;

// 获取某个包的主版本
function getMajorVersion(packageName) {
  const requirePath = nodePath.resolve(process.cwd(), 'package.json');
  const requireFn = createRequire(requirePath);
  const packageJson = requireFn(requirePath);
  const version = packageJson.dependencies[packageName];
  if (version) {
    const parsedVersion = semver.coerce(version);
    if (parsedVersion) {
      return parsedVersion.major;
    }
  }
  return '';
}

const nodePath = path;
module.exports = function ({ types }) {
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
        }
      },
      CallExpression(path, state) {
        // Form.create
        const callee = path.get('callee');
        const calleeStr = path.get('callee').toString();

        switch (state.antdMajorVersion) {
          case 3:
            if (callee.isMemberExpression() && calleeStr === 'Form.create') {
              // options 指的是 Form.create 的第一个参数
              const [options] = path.node.arguments;

              const getOnValuesChangeValue = (options) => {
                if (!options) {
                  return false;
                } else if (types.isObjectExpression(options)) {
                  const properties = options.properties;
                  for (const property of properties) {
                    if (
                      types.isObjectProperty(property) &&
                      types.isIdentifier(property.key, { name: 'onValuesChange' })
                    ) {
                      return property.value;
                    } else {
                      return false
                    }
                  }
                } else {
                  return false;
                }
              }
              // onValuesChange
              const value = getOnValuesChangeValue(options);
              // 如果已经声明了 onValuesChange 函数
              if (value) {
                // 需要兼容3种写法:
                // 1.onValuesChange: () => {}; 
                if ( types.isArrowFunctionExpression(value)) {
                  const inserAST = template.expression(`window.WATCH_FORM_DATA_EXTENTIONS.a = allValues;`)();
                  value.body.body.unshift(inserAST);
                } else if (types.isFunctionExpression(value)) {
                // 2.onValuesChange {}
                  const inserAST = template.expression(`window.WATCH_FORM_DATA_EXTENTIONS.a = allValues;`)();
                  value.body.body.unshift(inserAST);
                } else if (types.isIdentifier(value)) {
                // 3. onValuesChange: onValuesChangeFunc 这三种写法
                  // 对于函数变量写法，替换函数节点为新的函数节点，并插入代码
                  const code = `
                    function ${value.name}(props, changedValues) {
                      window.WATCH_FORM_DATA_EXTENTIONS = allValues;
                      ${value.name}(...arguments);
                    }
                  `;
                  const ast = parser.parse(code);
                  // const replaceAST = template.expression(code)();
                  path.replaceWith(ast.program.body[0]);
                }
              } else {

              }

              const parentFunction = path.getFunctionParent();
              // const params = parentFunction.node.params;

              // 在 onValuesChange 事件处理函数中插入代码
              //   const code = `
              //   // 在这里插入你的代码，用于监听表单数据变化
              // `;

              //   // 将代码转换为 AST
              //   const ast = types.parse(code);

              //   // 在 onValuesChange 函数体的开头插入代码
              //   parentFunction.get('body').unshiftContainer('body', ast.program.body[0]);
            }
          case 4: {

          }
          case 5: {

          }
        }
      }
    }
  };
};
