const { transformFromAstSync } = require('@babel/core');
const  parser = require('@babel/parser');
// const autoExportForm = require('./plugin/auto-export-form');
const watchAntdForm = require('./plugin/watch-antd-form');
const fs = require('fs');
const path = require('path');

// const sourceCode = `
// import React from 'react';
// import { Form } from 'antd';

// const Component = (props) => {
//   const form = Form.useForm();

//   console.log('form', form);
//   return <Form form={form} />;
// };
// export default Component;
// `

const fileName = 'test.js'

const filePath = path.resolve(process.cwd(), `example/${fileName}`);
const sourceCode = fs.readFileSync(
    filePath,
    "utf-8",
);

const ast = parser.parse(sourceCode, {
    sourceType: 'unambiguous',
    plugins: ['jsx']
});

const { code } = transformFromAstSync(ast, sourceCode, {
    plugins: [watchAntdForm]
});

!fs.existsSync("./dist") && fs.mkdirSync("./dist");
fs.writeFileSync(`./dist/${fileName}`, code);