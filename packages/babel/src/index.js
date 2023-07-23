const { transformFromAstSync } = require('@babel/core');
const parser = require('@babel/parser');
// const autoExportForm = require('./plugin/auto-export-form');
const watchAntdForm = require('./plugin/watch-antd-form');
const fs = require('fs');
const path = require('path');

function compileFile(filePath) {
  const sourceCode = fs.readFileSync(filePath, 'utf-8');

  const ast = parser.parse(sourceCode, {
    sourceType: 'unambiguous',
    plugins: ['jsx']
  });

  const { code } = transformFromAstSync(ast, sourceCode, {
    plugins: [watchAntdForm]
  });

  const distDir = './dist';
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
  }

  const relativeDir = path.dirname(path.relative('./example', filePath));
  const distDirPath = path.join(distDir, relativeDir);

  if (!fs.existsSync(distDirPath)) {
    fs.mkdirSync(distDirPath, { recursive: true });
  }

  const fileName = path.basename(filePath);
  const distFilePath = path.join(distDirPath, fileName);

  fs.writeFileSync(distFilePath, code);
}


function compileFilesInDirectory(directoryPath) {
  const files = fs.readdirSync(directoryPath);

  files.forEach((file) => {
    const filePath = path.join(directoryPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isFile()) {
      compileFile(filePath);
    }
  });
}

const exampleDir = './example';
const targetDirectories = ['antd3-enhance-arrow', 'antd3-enhance-identifier', 'antd3-enhance-statement'];

targetDirectories.forEach((directory) => {
  const directoryPath = path.join(exampleDir, directory);
  compileFilesInDirectory(directoryPath);
});
