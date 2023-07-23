export default Form.create({
  onValuesChange: (dxITCawqprops, dxITCawqchangedValues, dxITCawqallValues) => {
    if (!window.WATCH_FORM_DATA_EXTENTIONS) {
      window.WATCH_FORM_DATA_EXTENTIONS = {};
    } else {
      window.WATCH_FORM_DATA_EXTENTIONS['TQKOhZjL'] = dxITCawqallValues;
    }
  }
})(WhiteListModal);