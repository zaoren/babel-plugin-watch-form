/* eslint-disable no-whitespace-before-property */
// /* eslint-disable */
import React, { Component } from 'react';
import { Form, Modal, Input, Button, Tag, message } from 'antd';
import { request } from '@cfe/caopc-center-common';
const FormItem = Form.Item;
const formItemLayout = {
  labelCol: {
    span: 4
  },
  wrapperCol: {
    span: 18
  }
};
class WhiteListModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      whiteList: [],
      blackList: []
    };
    this.id = '';
  }
  async fetchDetail(id) {
    const res = await request({
      url: '/ump-boss/activityRule/query',
      method: 'post',
      data: {
        activityId: id,
        ruleCode: 'BLACK_WHITE_LIST_RULE',
        version: '1.0'
      }
    });
    this.id = res.id || '';
    const ruleContent = res.ruleContent ? JSON.parse(res.ruleContent) : {};
    const whiteList = ruleContent?.whiteList?.userNos || [];
    const blackList = ruleContent?.blackList?.userNos || [];
    this.setState({
      blackList,
      whiteList
    });
  }
  componentWillReceiveProps(nextProps) {
    const {
      visible,
      id
    } = nextProps;
    if (visible === true && id !== this.props.id) {
      this.fetchDetail(id);
    }
  }
  hideModal = () => {
    const {
      hideModal
    } = this.props;
    this.props.form.resetFields();
    hideModal && hideModal();
  };
  handleClose = (tag, type) => () => {
    if (type === 'white') {
      this.setState(prevState => ({
        whiteList: prevState.whiteList.filter(item => item !== tag)
      }));
    } else {
      this.setState(prevState => ({
        blackList: prevState.blackList.filter(item => item !== tag)
      }));
    }
  };
  handleAdd = type => () => {
    const {
      getFieldValue,
      setFieldsValue
    } = this.props.form;
    const {
      whiteList,
      blackList
    } = this.state;
    const value = getFieldValue(type);
    const numReg = /^[0-9]*$/;
    if (!numReg.test(value)) {
      message.warning('编号必须为数字');
      return;
    }
    if (!value) {
      message.warning('请填写编号');
      return;
    }
    if (type === 'whiteNo') {
      if (whiteList.every(item => item !== value)) {
        this.setState({
          whiteList: [...whiteList, value]
        });
      } else {
        message.warning('不能重复添加');
        return;
      }
    } else if (blackList.every(item => item !== value)) {
      this.setState({
        blackList: [...blackList, value]
      });
    } else {
      message.warning('不能重复添加');
      return;
    }
    setFieldsValue({
      [type]: ''
    });
  };
  onOk = () => {
    const {
      onOk,
      id
    } = this.props;
    const {
      whiteList,
      blackList
    } = this.state;

    // if (!whiteList.length && !blackList.length) {
    //   message.warning('名单不能为空');
    //   return;
    // }

    const ruleContent = {
      blackList: {
        userNos: blackList || []
      },
      closeFlag: 1,
      whiteList: {
        userNos: whiteList || []
      },
      ruleCode: 'BLACK_WHITE_LIST_RULE',
      version: '1.0'
    };
    request({
      url: '/ump-boss/activityRule/saveOrUpdate',
      method: 'post',
      data: {
        id: this.id,
        activityId: id,
        ruleCode: 'BLACK_WHITE_LIST_RULE',
        version: '1.0',
        ruleContent: JSON.stringify(ruleContent)
      }
    }).then(() => {
      message.success('操作成功');
      this.setState({
        whiteList: [],
        blackList: []
      });
      this.id = '';
      onOk && onOk();
    });
  };
  render() {
    const {
      visible,
      form,
      disabled
    } = this.props;
    const {
      whiteList,
      blackList
    } = this.state;
    const {
      getFieldDecorator
    } = form;
    return <Modal visible={visible} title="黑白名单" cancelText="取消" okText="确定" onCancel={this.hideModal} onOk={this.onOk} maskClosable={false} width={600} footer={disabled ? null : undefined}>
        <Form style={{
        maxHeight: '300px',
        overflowY: 'auto'
      }}>
          <FormItem label="用户编号" {...formItemLayout}>
            {getFieldDecorator('whiteNo', {})(<Input disabled={disabled} style={{
            width: '300px'
          }} />)}
            <Button className="ml10" disabled={disabled} onClick={this.handleAdd('whiteNo')}>添加</Button>
          </FormItem>
          <FormItem label="白名单列表" {...formItemLayout}>
            {whiteList.map(item => <Tag key={item} closable={!disabled} onClose={this.handleClose(item, 'white')}>
                  {item}
                </Tag>)}
          </FormItem>
          <FormItem label="用户编号" {...formItemLayout}>
            {getFieldDecorator('blackNo', {})(<Input disabled={disabled} style={{
            width: '300px'
          }} />)}
            <Button className="ml10" disabled={disabled} onClick={this.handleAdd('blackNo')}>添加</Button>
          </FormItem>
          <FormItem label="黑名单列表" {...formItemLayout}>
            {blackList.map(item => <Tag key={item} closable={!disabled} onClose={this.handleClose(item, 'black')}>
                  {item}
                </Tag>)}
          </FormItem>
        </Form>
      </Modal>;
  }
}
export default Form.create({
  onValuesChange: () => {
    if (!window.WATCH_FORM_DATA_EXTENTIONS) {
      window.WATCH_FORM_DATA_EXTENTIONS = {};
    } else {
      window.WATCH_FORM_DATA_EXTENTIONS.undefined = arguments[2];
    }
  }
})(WhiteListModal);