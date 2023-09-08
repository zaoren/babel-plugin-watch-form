const fs = require('fs');
const path = require('path');
const { transformFromAstSync } = require('@babel/core');
const parser = require('@babel/parser');
const minimist = require('minimist');
const watchAntdForm = require('./plugin/watch-antd-form');

const args = process.argv.slice(2);
// 使用 minimist 解析参数
const envArgs = minimist(args);

function compileFile(filePath) {
  const sourceCode = fs.readFileSync(filePath, 'utf-8');

  const ast = parser.parse(sourceCode, {
    sourceType: 'unambiguous',
    plugins: [
      'decorators',
      'jsx',
      'typescript',
    ],
  });

  const { code } = transformFromAstSync(ast, sourceCode, {
    plugins: [
      [
        watchAntdForm, {
          antdMajorVersion: envArgs.antdMajorVersion
        }
      ]
    ],
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
    } else if (stats.isDirectory() && file.includes(`antd${envArgs.antdMajorVersion}`)) {
      compileFilesInDirectory(filePath); // 递归处理子目录
    }
  });
}

const targetDirectories = ['./example'];

targetDirectories.forEach((directoryPath) => {
  compileFilesInDirectory(directoryPath);
});
