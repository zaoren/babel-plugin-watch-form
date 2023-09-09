/* eslint-disable no-bitwise */
const path = require('path');
const { createRequire } = require('module');
const semver = require('semver');
const types = require('@babel/types');
const parser = require('@babel/parser');

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

function generateRandomVariableName() {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const uniqueVariableName = `var_${timestamp}_${randomSuffix}`;
  return uniqueVariableName;
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

const getInsertCode = (filePath, version) => {
  let key = generateRandomVariableName();
  if (filePath) {
    const [dirName, fileName] = filePath.split('/').slice(-2);
    const [name] = fileName.split('.');
    key = name !== 'index' ? name : dirName;
  }
  return `if (!window.WATCH_FORM_DATA_EXTENSIONS) {
    window.WATCH_FORM_DATA_EXTENSIONS = {};
  } else {
    window.WATCH_FORM_DATA_EXTENSIONS['changedValues_${convertToCamelCase(key)}'] = arguments[${version === '3' ? 1 : 0}]; 
    window.WATCH_FORM_DATA_EXTENSIONS['allValues_${convertToCamelCase(key)}'] = arguments[${version === '3' ? 2 : 1}];
  }`;
};

const getInsertCodeWithoutArguments = (filePath, onChangedValuesKey, allValuesKey) => {
  let key = generateRandomVariableName();
  if (filePath) {
    const [dirName, fileName] = filePath.split('/').slice(-2);
    const [name] = fileName.split('.');
    key = name !== 'index' ? name : dirName;
  }
  return `if (!window.WATCH_FORM_DATA_EXTENSIONS) {
    window.WATCH_FORM_DATA_EXTENSIONS = {};
  } else {
    window.WATCH_FORM_DATA_EXTENSIONS['changedValues_${convertToCamelCase(key)}'] = ${onChangedValuesKey};
    window.WATCH_FORM_DATA_EXTENSIONS['allValues_${convertToCamelCase(key)}'] = ${allValuesKey};
  }`;
};

// 定义 onValuesChange 属性有多种写法，每种写法的AST不一致，需要兼容一下
// 1. onValuesChange: () => {}; (箭头函数)
// 2. onValuesChange() {}  (普通函数)
// 3. onValuesChange: onValuesChangeFunc (函数变量)
function processOnValuesChangeFunction(onValuesChangeProperty, state) {
  let value;
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
    const ast = parser.parse(getInsertCodeWithoutArguments(
      state.file.opts.filename,
      value.params.length >= 2 ? value.params[1].name : `${uniquePrefix}changedValues`,
      value.params.length >= 3 ? value.params[2].name : `${uniquePrefix}allValues`,
    ));
    if (types.isBlockStatement(value.body)) { // 有函数体就在开始插入监控代码
      value.body.body.push(ast.program.body[0]);
    }
  } else if (types.isBlockStatement(value)) {
    // 2. onValuesChange() {}
    const ast = parser.parse(
      getInsertCode(state.file.opts.filename), // TODO 这里之后改成读 state.file.opts.filename
    );
    if (types.isBlockStatement(value)) { // 有函数体就在开始插入监控代码
      value.body.unshift(ast.program.body[0]);
    }
  } else if (types.isIdentifier(value)) {
    // 3. onValuesChange () {}
    // 对于函数变量写法，替换函数节点为新的函数节点，并插入代码
    const code = `
      function ${value.name}${generateRandomVariableName()}(props, changedValues, allValues) {
        ${getInsertCode(state.file.opts.filename)}
        ${value.name}(props, changedValues, allValues);
      }
    `;
    const ast = parser.parse(code);
    // eslint-disable-next-line no-param-reassign
    [onValuesChangeProperty.value] = ast.program.body;
  }
}

module.exports = {
  getMajorVersion,
  generateRandomVariableName,
  convertToCamelCase,
  getInsertCode,
  getInsertCodeWithoutArguments,
  processOnValuesChangeFunction,
};
