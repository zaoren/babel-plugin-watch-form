export default Form.create({
  onValuesChange: (props, changedValues, allValues) => {
    if (!window.WATCH_FORM_DATA_EXTENTIONS) {
      window.WATCH_FORM_DATA_EXTENTIONS = {};
    } else {
      window.WATCH_FORM_DATA_EXTENTIONS['var_1690683522588_sqj4xw'] = allValues;
    }
  }
})(WhiteListModal);