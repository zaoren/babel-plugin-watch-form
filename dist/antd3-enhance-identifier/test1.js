export default Form.create({
  onValuesChange() {
    if (!window.WATCH_FORM_DATA_EXTENTIONS) {
      window.WATCH_FORM_DATA_EXTENTIONS = {};
    } else {
      window.WATCH_FORM_DATA_EXTENTIONS['DGGJHoxt'] = arguments[2];
    }
  }
})(WhiteListModal);