## 还存在的问题

1. 通过 form.setFieldsValue 的事件监听不到
2. 初始化的数据也监听不到


要实现监听Antd Form组件的变化效果并将表单数据展示在Google插件中，需要对插件进行一些额外的修改和完善，以处理以下两个问题：

setFieldsValue 和 setFieldValue 不触发 onValuesChange：
这个问题需要在插件中添加代码以监听 setFieldsValue 和 setFieldValue 方法的调用，并在这些方法被调用时手动触发 onValuesChange。这可以通过在Babel插件的适当位置添加代码来完成，例如，在处理CallExpression时，检测到 setFieldsValue 和 setFieldValue 方法的调用时，调用相应的 onValuesChange 函数。 （我觉得这个可行）
初始化的数据：

是的，你可以在声明 Antd Form 组件的同时，在 JSXOpeningElement 处理中调用 Form.getFieldsValue 来获取初始化数据。这样，你可以确保始终以 Form 组件内部的数据为准，而不需要依赖于 initialValues 属性。

以下是一个示例修改，展示如何在 JSXOpeningElement 处理中调用 Form.getFieldsValue 来获取初始化数据：

(我觉得可以和form同步去获取一下数据)