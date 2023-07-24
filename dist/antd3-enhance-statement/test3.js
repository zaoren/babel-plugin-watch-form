const onValuesChange = (a, b) => {};
export default Form.create({
  onValuesChange: function onValuesChangeMFpnqHRD(props, changedValues, allValues) {
    if (!window.WATCH_FORM_DATA_EXTENTIONS) {
      window.WATCH_FORM_DATA_EXTENTIONS = {};
    } else {
      window.WATCH_FORM_DATA_EXTENTIONS['QRAyfZsa'] = arguments[2];
    }
    onValuesChange(props, changedValues, allValues);
  }
})(WhiteListModal);