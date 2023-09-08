const fs = require('fs');
const path = require('path');
const { transformFromAstSync } = require('@babel/core');
const parser = require('@babel/parser');
const watchAntdForm = require('../packages/babel/src/plugin/watch-antd-form');

function resolveFilePathWithExtensions(filePath, extensions) {
  // 如果文件路径已经包含扩展名，直接返回
  if (path.extname(filePath)) {
    return filePath;
  }

  // 尝试按指定顺序添加扩展名并检查文件是否存在
  for (const extension of extensions) {
    const filePathWithExt = `${filePath}${extension}`;
    if (fs.existsSync(filePathWithExt)) {
      return filePathWithExt;
    }
  }

  // 如果没有找到匹配的文件，返回原始路径
  return filePath;
}

const extensionsToTry = ['.js', '.ts', '.tsx'];

const commonTest = (baseDir, antdMajorVersion) => {
  const fileList = fs.readdirSync(baseDir);

  fileList.forEach((testFile) => {
    it(`Test ${testFile}`, () => {
      const filePath = path.resolve(baseDir, testFile);
      const resolvedFilePath = resolveFilePathWithExtensions(filePath, extensionsToTry);
      const sourceCode = fs.readFileSync(resolvedFilePath, 'utf-8');

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
              antdMajorVersion,
            }
          ]
        ],
      });

      // 检查代码中是否包含特定文本
      const expectedTexts = [
        'onValuesChange',
        'window.WATCH_FORM_DATA_EXTENSIONS = {}',
        // 'window.WATCH_FORM_DATA_EXTENSIONS[*] = *',
      ];

      const expectedPattern = new RegExp(
        'window\\.WATCH_FORM_DATA_EXTENSIONS\\[.*\\] = .*',
        's'
      );

      expectedTexts.forEach(text => {
        expect(code).toContain(text);
      });

      expect(code).toMatch(expectedPattern);
    });
  });
}

describe('Test Babel Plugin: watch-antd-form__antd3-decorator', () => {
  const baseDir = path.resolve(__dirname, '../example/antd3-decorator');
  commonTest(baseDir, 3);
});

describe('Test Babel Plugin: watch-antd-form__antd3-enhance-arrow', () => {
  const baseDir = path.resolve(__dirname, '../example/antd3-enhance-arrow');
  commonTest(baseDir, 3);
});

describe('Test Babel Plugin: watch-antd-form__antd3-enhance-blockstatement', () => {
  const baseDir = path.resolve(__dirname, '../example/antd3-enhance-blockstatement');
  commonTest(baseDir, 3);
});

describe('Test Babel Plugin: watch-antd-form__antd3-enhance-identifier', () => {
  const baseDir = path.resolve(__dirname, '../example/antd3-enhance-identifier');
  commonTest(baseDir, 3);
});


describe('Test Babel Plugin: watch-antd-form__antd4-hooks', () => {
  const baseDir = path.resolve(__dirname, '../example/antd4-hooks');
  commonTest(baseDir, 4);
});
