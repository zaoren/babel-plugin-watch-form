export default Form.create({
  onValuesChange: (props, changedValues, allValues) => {
    if (!window.WATCH_FORM_DATA_EXTENTIONS) {
      window.WATCH_FORM_DATA_EXTENTIONS = {};
    } else {
      window.WATCH_FORM_DATA_EXTENTIONS['var_1690687204555_fkwt9x'] = allValues;
    }
  }
})(WhiteListModal);