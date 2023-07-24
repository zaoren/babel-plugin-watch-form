export default Form.create({
  onValuesChange: (props, ivptEZiZchangedValues, ivptEZiZallValues) => {
    if (!window.WATCH_FORM_DATA_EXTENTIONS) {
      window.WATCH_FORM_DATA_EXTENTIONS = {};
    } else {
      window.WATCH_FORM_DATA_EXTENTIONS['xtLtcchr'] = ivptEZiZallValues;
    }
  }
})(WhiteListModal);