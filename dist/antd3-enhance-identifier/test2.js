export default Form.create({
  onValuesChange(props) {
    if (!window.WATCH_FORM_DATA_EXTENTIONS) {
      window.WATCH_FORM_DATA_EXTENTIONS = {};
    } else {
      window.WATCH_FORM_DATA_EXTENTIONS['WituNUph'] = arguments[2];
    }
  }
})(WhiteListModal);