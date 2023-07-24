/* eslint-disable no-bitwise */
const path = require('path');
const semver = require('semver');
const { createRequire } = require('module');
const parser = require('@babel/parser');
const { declare } = require('@babel/helper-plugin-utils');
const types = require('@babel/types');
const template = require('@babel/template').default;

// 获取某个包的主版本
function getMajorVersion(packageName) {
  const requirePath = path.resolve(process.cwd(), 'package.json');
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

function generateRandomVariableName(length = 8) {
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let variableName = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    variableName += characters[randomIndex];
  }

  return variableName;
}

function convertToCamelCase(name) {
  const words = name.split('-');
  const capitalizedWords = words.map((word, index) => {
    if (index === 0) {
      return word;
    }
    const capitalized = word.charAt(0).toUpperCase() + word.slice(1);
    return capitalized;
  });
  return capitalizedWords.join('');
}

// function generateUUID() {
//   const uuidTemplate = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
//   const timestamp = new Date().getTime().toString(16);

//   return uuidTemplate.replace(/[xy]/g, (c) => {
//     const r = Math.random() * 16 | 0;
//     const v = c === 'x' ? r : (r & 0x3 | 0x8);
//     return v.toString(16);
//   }).replace('y', timestamp);
// }

const getInsertCode = (filePath) => {
  let key = generateRandomVariableName();
  if (filePath) {
    const [dirName, fileName] = filePath.split('/').slice(-2);
    const [name] = fileName.split('.');
    key = name !== 'index' ? name : dirName;
  }
  return `if (!window.WATCH_FORM_DATA_EXTENTIONS) {
    window.WATCH_FORM_DATA_EXTENTIONS = {};
  } else {
    window.WATCH_FORM_DATA_EXTENTIONS['${convertToCamelCase(key)}'] = arguments[2];
  }`;
};

const getInsertCodeWithoutArguments = (filePath, allValuesKey) => {
  let key = generateRandomVariableName();
  if (filePath) {
    const [dirName, fileName] = filePath.split('/').slice(-2);
    const [name] = fileName.split('.');
    key = name !== 'index' ? name : dirName;
  }
  return `if (!window.WATCH_FORM_DATA_EXTENTIONS) {
    window.WATCH_FORM_DATA_EXTENTIONS = {};
  } else {
    window.WATCH_FORM_DATA_EXTENTIONS['${convertToCamelCase(key)}'] = ${allValuesKey};
  }`;
};

// 定义 onValuesChange 属性有多种写法，每种写法的AST不一致，需要兼容一下
// 1. onValuesChange: () => {}; (箭头函数)  
// 2. onValuesChange() {}  (普通函数)
// 3. onValuesChange: onValuesChangeFunc (函数变量)
function processOnValuesChangeFunction(onValuesChangeProperty, state) {
  if (types.isObjectMethod(onValuesChangeProperty)) {
    value = onValuesChangeProperty.body;
  } else if (types.isObjectProperty(onValuesChangeProperty)) {
    value = onValuesChangeProperty.value;
  }
  // 需要兼容3种写法:
  // 1.onValuesChange: () => {};  箭头函数写法 （由于箭头函数中拿到的arguments是父级的，所以只能手动加参数，直到有allValues这个参数为止）
  if (types.isArrowFunctionExpression(value)) {
    // 如果缺少参数，则添加参数
    const uniquePrefix = generateRandomVariableName();
    // 构建 props 参数节点
    const propsParam = types.identifier(`${uniquePrefix}props`);
    // 构建 changedValues 参数节点
    const changedValuesParam = types.identifier(`${uniquePrefix}changedValues`);
    // 构建 allValues 参数节点
    const allValuesParam = types.identifier(`${uniquePrefix}allValues`);
    if (value.params.length === 0) {
      // 将参数节点插入到参数列表的结尾
      value.params.push(propsParam, changedValuesParam, allValuesParam);
    } else if (value.params.length === 1) {
      // 将参数节点插入到参数列表的结尾
      value.params.push(changedValuesParam, allValuesParam);
    } else if (value.params.length === 2) {
      // 构建 allValues 参数节点
      value.params.push(allValuesParam);
    }
    // 这个时候需要有一个标识名来标识Form
    const ast = parser.parse(getInsertCodeWithoutArguments(state.file.opts.filename,
      value.params.length >= 3 ? value.params[2].name : `${uniquePrefix}allValues`));
    if (types.isBlockStatement(value.body)) { // 有函数体就在开始插入埋点代码
      value.body.body.push(ast.program.body[0]);
    }
  } else if (types.isBlockStatement(value)) {
    // 2. onValuesChange() {}
    const ast = parser.parse(
      getInsertCode(state.file.opts.filename), // TODO 这里之后改成读 state.file.opts.filename
    );
    if (types.isBlockStatement(value)) { // 有函数体就在开始插入埋点代码
      value.body.unshift(ast.program.body[0]);
    }
  } else if (types.isIdentifier(value)) {
    // 3. onValuesChange: onValuesChangeFunc 
    // 对于函数变量写法，替换函数节点为新的函数节点，并插入代码
    const code = `
      function ${value.name}${generateRandomVariableName()}(props, changedValues, allValues) {
        ${getInsertCode(state.file.opts.filename)}
        ${value.name}(props, changedValues, allValues);
      }
    `;
    const ast = parser.parse(code);
    [onValuesChangeProperty.value] = ast.program.body;
  }
}

const watchAntdFormPlugin = declare((api, options, dirname) => {
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
        // Form.create
        const callee = path.get('callee');
        const calleeStr = path.get('callee').toString();

        switch (state.antdMajorVersion) {
          case 3:
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
                    onValuesChangeAst.program.body[0].body
                  )
                );

                path.node.arguments = [
                  types.objectExpression([onValuesChangeProperty])
                ];
              } else {
                // options 指的是 Form.create 的第一个参数
                // Form.create({})，我们主要处理的是其中的第一个参数
                const [ options ] = path.node.arguments;

                const getOnValuesChangeValue = (options) => {
                  if (!options) {
                    return false;
                  } if (types.isObjectExpression(options)) {
                    const { properties } = options;
                    for (const property of properties) {
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
                      types.functionExpression(null, ast.program.body[0].params, ast.program.body[0].body),
                    ),
                  ];
                  options.properties.push(...properties);
                }
              }

            }
            break;
          case 4: {
            break;
          }
          case 5: {
            break;
          }
          default:
            break;
        }
      },
    },
  };
});

module.exports = watchAntdFormPlugin;
