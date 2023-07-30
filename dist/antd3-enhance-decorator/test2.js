@Form.create({
  onValuesChange: (props, var_1690687204574_3sbvv1changedValues, var_1690687204574_3sbvv1allValues) => {
    if (!window.WATCH_FORM_DATA_EXTENTIONS) {
      window.WATCH_FORM_DATA_EXTENTIONS = {};
    } else {
      window.WATCH_FORM_DATA_EXTENTIONS['var_1690687204574_co33pg'] = var_1690687204574_3sbvv1allValues;
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