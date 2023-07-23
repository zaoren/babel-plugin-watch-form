export default Form.create({
  onValuesChange: function onValuesChange(props, changedValues, allValues) {
    if (!window.WATCH_FORM_DATA_EXTENTIONS) {
      window.WATCH_FORM_DATA_EXTENTIONS = {};
    } else {
      window.WATCH_FORM_DATA_EXTENTIONS['fxQgGPAR'] = arguments[2];
    }
  }
})(WhiteListModal);