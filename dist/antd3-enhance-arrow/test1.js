export default Form.create({
  onValuesChange: (MNWJBLrTprops, MNWJBLrTchangedValues, MNWJBLrTallValues) => {
    if (!window.WATCH_FORM_DATA_EXTENTIONS) {
      window.WATCH_FORM_DATA_EXTENTIONS = {};
    } else {
      window.WATCH_FORM_DATA_EXTENTIONS['jTutCDQV'] = MNWJBLrTallValues;
    }
  }
})(WhiteListModal);