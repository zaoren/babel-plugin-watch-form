import React, { Component } from 'react';
import { connect } from 'react-redux';
import { dispatch } from '@cfe/caoh5-util';
import _ from 'lodash';
import request from '@cfe/venom-request';
import {
  Form,
  Row,
  Col,
  Button,
  InputNumber,
  message,
} from 'antd';
// import produce from 'immer';
import {
  formItemLayout,
} from '@/utils/layout';
import {
  // EntryRule,
  EntryRuleV2,
  // DriverCertificateRule,
  DriverCertificateRuleV2,
  // DriverStandardRule,
  DriverStandardRuleV2,
} from './components';
import '@/styles/main.less';

const FormItem = Form.Item;

const bottomStyle = { maxWidth: '600px' };

@connect((state) => ({
  detail: state.driverReducer.driverActivityReducer.detail,
  driverInviteDriverDetail: state.driverReducer.driverActivityReducer.driverInviteDriverDetail,
  currentStep: state.driverReducer.driverActivityReducer.currentStep,
  detailDisabled: state.driverReducer.driverActivityReducer.detailDisabled,
}), {
  dispatch,
})
@Form.create({
  onValues(props, fields) {
    const { driverInviteDriverDetail } = props;
    const keys = Object.keys(fields);
    for (let i = 0, l = keys.length; i < l; i += 1) {
      const key = keys[i];
      const { name } = fields[key];
      const { value } = fields[key];
      if (_.eq(driverInviteDriverDetail[key], value)) {
        break;
      }
      if (key === 'timePeriods') {
        break;
      }
      props.dispatch('UPDATE_DRIVER_INVITE_DRIVER_DETAIL', {
        [name]: value,
      });
    }
  },
})
export default class NewStep2 extends Component {
  constructor(props) {
    super(props);
    this.state = {
      rewardPolicyList: [],
      driverCertificatePolicyList: [],
      driverStandardPolicyList: [],
    };
  }

  driverCertificateRuleValidator = (rules, value, cb) => {
    console.log(value, 'driverCertificateRuleValidator');
    cb();
  }

  driverStandardRuleValidator = (rules, value, cb) => {
    console.log(value, 'driverStandardRuleValidator');
    cb();
  }

  goNext = () => {
    const { dispatch } = this.props;
    // dispatch('DRIVER_ACTIVITY_GO_STEP', {
    //   step: 2,
    // });
    this.props.form.validateFieldsAndScroll({ force: true }, (err, values) => {
      if (!err) {
        const {
          rewardCloseFlag,
          certificateCloseFlag,
          driverStandardCloseFlag,
        } = values;

        console.log(values, 'values');

        if (rewardCloseFlag === 2
          && certificateCloseFlag === 2
          && driverStandardCloseFlag === 2) {
          message.warn('至少需要配置一个奖励');
          return;
        }

        dispatch('DRIVER_ACTIVITY_GO_STEP', {
          step: 2,
        });
      }
    });
  }

  goPrev = () => {
    const { dispatch } = this.props;
    dispatch('DRIVER_ACTIVITY_GO_STEP', {
      step: 0,
    });
  }

  componentDidMount() {
    const {
      detail: { joinCities },
    } = this.props;

    // const cityCodeParams = {
    //   cityCodes: joinCities,
    // };

    const policyUrl = {
      url: '/center-driver/common/queryAuthTags',
      method: 'post',
      data: joinCities,
    };

    request({
      ...policyUrl,
    })
      .then((res) => {
        const tmpList = res?.map((item) => ({ key: item.id, value: item.tagName })) || [];
        if (tmpList.length > 0) {
          // 新增其他选项
          tmpList.push({
            key: '-1',
            value: '其他',
          });
        }
        this.setState({
          rewardPolicyList: _.cloneDeep(tmpList),
          driverCertificatePolicyList: _.cloneDeep(tmpList),
          driverStandardPolicyList: _.cloneDeep(tmpList),
        });
      });
  }

  render() {
    const {
      form: { getFieldDecorator },
      driverInviteDriverDetail,
    } = this.props;
    const {
      entryRule,
      dutyCycle,
      driverCertificateRule,
      driverStandardRule,
    } = driverInviteDriverDetail;
    const {
      rewardPolicyList,
      driverCertificatePolicyList,
      driverStandardPolicyList,
    } = this.state;

    return (
      <>
        <Form className="rel">
          <FormItem {...formItemLayout} label="注册到运营周期">
            {getFieldDecorator('dutyCycle', {
              rules: [{ required: true, message: '请填写注册到运营周期' }],
              initialValue: dutyCycle,
            })(
              <InputNumber
                style={{ width: '200px' }}
                placeholder="最多填写365"
                precision={0}
                max={365}
                min={1}
              />,
            )}
            <span style={{ marginLeft: '10px' }}>天</span>
          </FormItem>
          <span className="ant-col-sm-offset-7" style={{ color: 'red' }}>注释：对被邀请司机注册变为可运营状态的时间限制，超时则邀请无效</span>
          <FormItem
            {...formItemLayout}
            label={(<span style={{ fontSize: '18px', fontWeight: 'bold' }}>入职奖</span>)}
          >
            {getFieldDecorator('entryRule', {
              initialValue: entryRule,
            })(
              <EntryRuleV2
                form={this.props.form}
                policyList={rewardPolicyList}
              />,
            )}
          </FormItem>
          <FormItem
            {...formItemLayout}
            label={(<span style={{ fontSize: '18px', fontWeight: 'bold' }}>补考网约车证奖</span>)}
          >
            {getFieldDecorator('driverCertificateRule', {
              initialValue: driverCertificateRule,
            })(
              <DriverCertificateRuleV2
                form={this.props.form}
                policyList={driverCertificatePolicyList}
              />,
            )}
          </FormItem>
          <FormItem
            {...formItemLayout}
            label={(<span style={{ fontSize: '18px', fontWeight: 'bold' }}>达标奖</span>)}
          >
            {getFieldDecorator('driverStandardRule', {
              initialValue: driverStandardRule,
            })(
              <DriverStandardRuleV2
                form={this.props.form}
                policyList={driverStandardPolicyList}
              />,
            )}
          </FormItem>
          {/* <div
            className="activity-mask"
            style={{ display: this.props.type === 'viewActivityDetail' ? 'block' : 'none' }}
          /> */}
        </Form>
        <Row style={bottomStyle}>
          <Col offset={7}>
            <Button className="mr10" onClick={this.goPrev}>上一步</Button>
            <Button type="primary" className="mr10" onClick={this.goNext}>下一步</Button>
          </Col>
        </Row>
      </>
    );
  }
}
