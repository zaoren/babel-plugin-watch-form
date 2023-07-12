/* eslint-disable import/no-extraneous-dependencies */
const { declare } = require('@babel/helper-plugin-utils');
const types = require('@babel/types');
const template = require('@babel/template').default;

const listenFormValuePlugin = declare((api, options, dirname) => {
  api.assertVersion(7);

  return {
    visitor: {
      Program: {
        enter(path, state) {
          console.log('path,state', path,state);
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
                  path.stop(); 
                  // 找到了就终止遍历
                }
              }
            },
          });
        },
      },
      CallExpression(path, state) {
        console.log(
          'state.filename',
          state.filename,
          state.importedFormComponent
        );
        if (!state.importedFormComponent) {
          return;
        }
        if (
          types.isMemberExpression(path.node.callee) &&
          path.node.callee.object.name === 'Form' &&
          path.node.callee.property.name === 'useForm'
        ) {
          const insertNode = template.expression(`window.form = form`)();
          path
            .findParent((item) => item.isVariableDeclaration())
            .insertAfter(insertNode);
        }
      },
    },
  };
});
module.exports = listenFormValuePlugin;
