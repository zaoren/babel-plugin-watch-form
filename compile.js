const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const inputDir = './packages';
const outputDir = './build';

// 递归遍历目录，找到所有的 index.ts 文件
function findIndexFiles(dir) {
  let indexFiles = [];
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      indexFiles = indexFiles.concat(findIndexFiles(filePath));
    } else if (file === 'index.ts') {
      indexFiles.push(filePath);
    }
  }

  return indexFiles;
}

// 编译 TypeScript 文件
function compileFile(inputFile, outputFile) {
  const compilerOptions = {
    module: ts.ModuleKind.CommonJS,
    outDir: outputDir,
    esModuleInterop: true,
  };

  const program = ts.createProgram([inputFile], compilerOptions);
  const emitResult = program.emit();

  const allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);
  allDiagnostics.forEach(diagnostic => {
    if (diagnostic.file) {
      const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
      const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
      console.log(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
    } else {
      console.log(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
    }
  });

  const exitCode = emitResult.emitSkipped ? 1 : 0;
  return exitCode === 0;
}

// 创建输出目录
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// 找到所有 index.ts 文件并进行编译
const indexFiles = findIndexFiles(inputDir);
for (const inputFile of indexFiles) {
  const relativePath = path.relative(inputDir, inputFile);
  const outputFile = path.join(outputDir, relativePath.replace(/\.ts$/, '.js'));

  const success = compileFile(inputFile, outputFile);
  if (success) {
    console.log(`Compiled: ${inputFile} -> ${outputFile}`);
  } else {
    console.log(`Failed to compile: ${inputFile}`);
  }
}
