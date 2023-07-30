@Form.create({
  onValuesChange: function onValuesChange(props, changedValues, allValues) {
    if (!window.WATCH_FORM_DATA_EXTENTIONS) {
      window.WATCH_FORM_DATA_EXTENTIONS = {};
    } else {
      window.WATCH_FORM_DATA_EXTENTIONS['var_1690687204590_yenqbo'] = arguments[2];
    }
  }
})
export default class InviteDriver extends Component {
  constructor(props) {
    super(props);
    this.state = {
      requesting: false
    };
  }
}