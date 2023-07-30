@Form.create({
  onValuesChange: (props, changedValues, var_1690687204580_i8xo7mallValues) => {
    if (!window.WATCH_FORM_DATA_EXTENTIONS) {
      window.WATCH_FORM_DATA_EXTENTIONS = {};
    } else {
      window.WATCH_FORM_DATA_EXTENTIONS['var_1690687204580_t5e555'] = var_1690687204580_i8xo7mallValues;
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