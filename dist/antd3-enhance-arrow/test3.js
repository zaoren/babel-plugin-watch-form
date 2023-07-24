export default Form.create({
  onValuesChange: (props, changedValues, NLasrVxTallValues) => {
    if (!window.WATCH_FORM_DATA_EXTENTIONS) {
      window.WATCH_FORM_DATA_EXTENTIONS = {};
    } else {
      window.WATCH_FORM_DATA_EXTENTIONS['biYtMKjE'] = NLasrVxTallValues;
    }
  }
})(WhiteListModal);