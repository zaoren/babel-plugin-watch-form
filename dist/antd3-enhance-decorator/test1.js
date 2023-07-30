@Form.create({
  onValuesChange: (var_1690686260046_89kigoprops, var_1690686260046_89kigochangedValues, var_1690686260046_89kigoallValues) => {
    if (!window.WATCH_FORM_DATA_EXTENTIONS) {
      window.WATCH_FORM_DATA_EXTENTIONS = {};
    } else {
      window.WATCH_FORM_DATA_EXTENTIONS['var_1690686260048_proxro'] = var_1690686260046_89kigoallValues;
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