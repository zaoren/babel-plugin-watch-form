export default Form.create({
  onValuesChange(props, changedValues) {
    if (!window.WATCH_FORM_DATA_EXTENTIONS) {
      window.WATCH_FORM_DATA_EXTENTIONS = {};
    } else {
      window.WATCH_FORM_DATA_EXTENTIONS['IvumuLGP'] = arguments[2];
    }
  }
})(WhiteListModal);