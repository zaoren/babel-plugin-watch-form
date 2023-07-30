const onValuesChange = () => {};
export default Form.create({
  onValuesChange: function onValuesChangevar_1690687204607_k6ogat(props, changedValues, allValues) {
    if (!window.WATCH_FORM_DATA_EXTENTIONS) {
      window.WATCH_FORM_DATA_EXTENTIONS = {};
    } else {
      window.WATCH_FORM_DATA_EXTENTIONS['var_1690687204607_9usjl7'] = arguments[2];
    }
    onValuesChange(props, changedValues, allValues);
  }
})(WhiteListModal);