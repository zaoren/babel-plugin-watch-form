const onValuesChange = (a, b) => {};
export default Form.create({
  onValuesChange: function onValuesChangevar_1690687204617_wbdtbo(props, changedValues, allValues) {
    if (!window.WATCH_FORM_DATA_EXTENTIONS) {
      window.WATCH_FORM_DATA_EXTENTIONS = {};
    } else {
      window.WATCH_FORM_DATA_EXTENTIONS['var_1690687204617_m6lnkz'] = arguments[2];
    }
    onValuesChange(props, changedValues, allValues);
  }
})(WhiteListModal);