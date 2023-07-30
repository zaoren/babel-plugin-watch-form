@Form.create({
  onValuesChange: (props, var_1690686260061_7d2dsschangedValues, var_1690686260061_7d2dssallValues) => {
    if (!window.WATCH_FORM_DATA_EXTENTIONS) {
      window.WATCH_FORM_DATA_EXTENTIONS = {};
    } else {
      window.WATCH_FORM_DATA_EXTENTIONS['var_1690686260061_qyk1c5'] = var_1690686260061_7d2dssallValues;
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