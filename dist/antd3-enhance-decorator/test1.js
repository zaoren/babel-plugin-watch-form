@Form.create({
  onValuesChange: (var_1690687204569_m0icboprops, var_1690687204569_m0icbochangedValues, var_1690687204569_m0icboallValues) => {
    if (!window.WATCH_FORM_DATA_EXTENTIONS) {
      window.WATCH_FORM_DATA_EXTENTIONS = {};
    } else {
      window.WATCH_FORM_DATA_EXTENTIONS['var_1690687204569_eycsr4'] = var_1690687204569_m0icboallValues;
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