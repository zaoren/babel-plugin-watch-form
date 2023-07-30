export default Form.create({
  onValuesChange: (props, var_1690683522578_2d10mqchangedValues, var_1690683522578_2d10mqallValues) => {
    if (!window.WATCH_FORM_DATA_EXTENTIONS) {
      window.WATCH_FORM_DATA_EXTENTIONS = {};
    } else {
      window.WATCH_FORM_DATA_EXTENTIONS['var_1690683522578_l9c07m'] = var_1690683522578_2d10mqallValues;
    }
  }
})(WhiteListModal);