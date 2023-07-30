const onValuesChange = (a, b, c) => {};
export default Form.create({
  onValuesChange: function onValuesChangevar_1690687204622_hvd88f(props, changedValues, allValues) {
    if (!window.WATCH_FORM_DATA_EXTENTIONS) {
      window.WATCH_FORM_DATA_EXTENTIONS = {};
    } else {
      window.WATCH_FORM_DATA_EXTENTIONS['var_1690687204622_3fwrx3'] = arguments[2];
    }
    onValuesChange(props, changedValues, allValues);
  }
})(WhiteListModal);