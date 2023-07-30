const onValuesChange = a => {};
export default Form.create({
  onValuesChange: function onValuesChangevar_1690687204611_h29pmt(props, changedValues, allValues) {
    if (!window.WATCH_FORM_DATA_EXTENTIONS) {
      window.WATCH_FORM_DATA_EXTENTIONS = {};
    } else {
      window.WATCH_FORM_DATA_EXTENTIONS['var_1690687204611_96vajf'] = arguments[2];
    }
    onValuesChange(props, changedValues, allValues);
  }
})(WhiteListModal);