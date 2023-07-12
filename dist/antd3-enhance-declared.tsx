/* eslint-disable max-len */

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { dispatch } from '@cfe/caoh5-util';
import { proRequest } from '@cfe/caoh5-request';
import { PREFIX, config } from '@/configs';
import { SketchPicker } from 'react-color';
import _ from 'lodash';
import { Form, Button, Input, Row, Col, message, Upload, Icon, Radio, Modal } from 'antd';
import { formItemLayout, tailFormItemLayout } from '@/utils/layout';
import { reportCrowd, crowdValidator } from '@/utils';
import '@/styles/main.less';
import couponItemImg from '@/assets/images/red-bag-coupon.png';
import redbagSelectImg from '@/assets/images/red-bag-radiobtn.png';
import userIcon1 from '@/assets/images/user-icon-1.png';
import userIcon2 from '@/assets/images/user-icon-2.png';
import PositionPanel from '@/components/position-panel';
import PositionInput from '@/components/position-input';
import PreviewWrapper from './PreviewBox/PreviewWrapper';
import RuleSection from './PreviewBox/RuleSection';
import { getFormData, getPositionPanelConfig } from './utils';
const FormItem = Form.Item;
const {
  TextArea
} = Input;
const RadioGroup = Radio.Group;
const bottomStyle = {
  maxWidth: '600px'
};
const f15 = {
  fontSize: '15px'
};
const ml175 = {
  marginLeft: '175px'
};
const w250 = {
  width: '250px'
};
const w375 = {
  width: '375px'
};
const w295 = {
  width: '295px'
};
const w530 = {
  width: '530px'
};
const mb100 = {
  marginBottom: '100px'
};
const mb200 = {
  marginBottom: '200px'
};
const mb250 = {
  marginBottom: '250px'
};
const mb350 = {
  marginBottom: '350px'
};
const insertList = [{
  value: '{amount}',
  label: 'amount'
}, {
  value: '{startAddress}',
  label: '订单上车地点'
}, {
  value: '{endAddress}',
  label: '订单目的地'
}];
const getNameByURL = url => {
  if (!url) {
    return '';
  }
  const urlList = url?.split('/');
  return urlList[urlList.length - 1];
};
const uploadConfig = {
  name: 'pic',
  action: `${PREFIX}/oss/upLoadPic`,
  accept: 'image/*'
};
class ActivityStepTwo extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false
    };
  }
  goNext = () => {
    this.props.form.validateFieldsAndScroll({
      force: true
    }, async err => {
      // const data = getFormData(this.props);
      // console.log('data: ', JSON.stringify(data));
      // this.saveOrUpdate(data);
      if (!err) {
        const data = getFormData(this.props);
        const {
          activityRuleDTOs = [],
          startTime,
          endTime
        } = data;
        const crowdArr = activityRuleDTOs.find(item => item.ruleCode === 'PARTICIPATE_CROWD_TAG')?.ruleContent?.tags?.map(item => item.tag);
        const validator = await crowdValidator(crowdArr, 0, {
          startTime,
          endTime
        });
        console.log('validator', validator);
        if (!validator.result) {
          Modal.warning({
            title: '人群标签异常提醒',
            content: `存在人群标签${validator?.validArr.join(',')}的有效期未覆盖活动有效期，请知晓`,
            onOk: () => {
              this.saveOrUpdate(data, crowdArr);
            }
          });
          return;
        }
        this.saveOrUpdate(data, crowdArr);
      }
    });
  };
  goPrev = () => {
    const {
      dispatch
    } = this.props;
    dispatch('CUSTOMER_ACTIVITY_GO_STEP', {
      step: 2
    });
  };
  async saveOrUpdate(data, crowdArr) {
    const {
      id
    } = this.props; // 获取路由参数;
    if (!id) {
      data.interfaceVersion = '1.0';
    }
    this.setState({
      loading: true
    });
    const res = await proRequest({
      url: `${PREFIX}/activity/${id ? 'updateActivity' : 'saveActivityV3'}`,
      body: data,
      type: 'post',
      config,
      timeout: 10000
    });
    this.setState({
      loading: false
    });
    if (res.success) {
      message.success('保存成功!');
      if (Array.isArray(crowdArr) && crowdArr?.length > 0) {
        reportCrowd({
          sceneKey: '56c0823fe62175789b18883b0f8cf9e1',
          id: id || res?.data,
          name: data.name,
          startDate: data.startTime,
          endDate: data.endTime,
          urlType: 1,
          // 详情页链接类型
          crowdIds: crowdArr
        }).then(() => {
          setTimeout(() => {
            window.close();
          }, 2000);
        });
        return;
      }
      setTimeout(() => {
        window.close();
      }, 2000);
    } else {
      message.error(`保存失败: ${res.message}`);
    }
  }
  beforeUpload = (standardWidth, standardHeight, size, absolute = true) => file => {
    const {
      FileReader,
      Image
    } = window;
    const isLtSize = file.size / 1024 < size;
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        const src = e.target.result;
        const image = new Image();
        image.onload = () => {
          const {
            width,
            height
          } = image;
          if (standardWidth || standardHeight) {
            if (absolute) {
              if (width !== standardWidth || height !== standardHeight) {
                message.error(`照片分辨率必须要等于${standardWidth}*${standardHeight}`);
                reject();
              } else {
                resolve();
              }
            } else if (width > standardWidth || height > standardHeight) {
              message.error(`照片分辨率不能大于${standardWidth}*${standardHeight}`);
              reject();
            } else {
              resolve();
            }
          } else if (!isLtSize) {
            message.error(`照片要小于${size}kb`);
            reject();
          } else {
            resolve();
          }
        };
        image.src = src;
      };
      reader.readAsDataURL(file);
    });
  };
  onUploadChange = key => info => {
    const {
      dispatch
    } = this.props;
    if (info.file.response) {
      if (info.file.response.code === 200) {
        message.success('文件上传成功');
        const url = info.file.response.data;
        dispatch('UPDATE_CUSTOMER_INTERACTIVE_DETAIL', {
          [key]: url
        });
        const name = getNameByURL(url);
        info.file.name = name;
        info.fileList[0].name = name;
        delete info.file.response;
        if (info.fileList[0] && info.fileList[0].response) {
          delete info.fileList[0].response;
        }
      } else {
        delete info.file.response;
        if (info.fileList[0] && info.fileList[0].response) {
          delete info.fileList[0].response;
        }
        info.file.status = 'error';
        info.fileList[0] && (info.fileList[0].status = 'error');
        message.error(`${info.file.name} 文件上传失败`);
        dispatch('UPDATE_CUSTOMER_INTERACTIVE_DETAIL', {
          [key]: ''
        });
      }
    }
  };
  onRemove = key => () => {
    const {
      dispatch
    } = this.props;
    dispatch('UPDATE_CUSTOMER_INTERACTIVE_DETAIL', {
      [key]: ''
    });
  };
  normFile = e => {
    if (Array.isArray(e)) {
      return e;
    }
    e.fileList = e.fileList.slice(-1);
    return e && e.fileList;
  };
  checkUploadPic = key => (rule, value, callback) => {
    const uploadValue = this.props.interactiveDetail[key];
    if (!uploadValue) {
      return callback('请上传图片');
    }
    callback();
  };
  checkInputLength = len => (rule, value, callback) => {
    if (value.length > len) {
      return callback(`最多输入${len}个字`);
    }
    callback();
  };
  colorChange = color => {
    const {
      dispatch
    } = this.props;
    dispatch('UPDATE_CUSTOMER_INTERACTIVE_DETAIL', {
      backgroundColor: color.hex
    });
  };
  getDefaultFileListByKey = key => {
    const url = this.props.interactiveDetail[key];
    const fileList = [{
      uid: getNameByURL(url),
      name: getNameByURL(url),
      status: 'done',
      url
    }];
    return fileList;
  };
  componentDidMount() {}
  isShareButtonChange = () => {
    this.props.dispatch('UPDATE_CUSTOMER_INTERACTIVE_DETAIL', {
      outsidePrizeOldButtonPic: '',
      outsidePrizeOldIsShareButtonPic: ''
    });
  };
  render() {
    const {
      backgroundColor,
      insideTitle,
      insideHeadPic,
      insideDesc,
      insideButtonPic,
      outsideTitle,
      outsideDesc,
      outsideHeadPic,
      outsideButtonPic,
      outsideButtonWithoutPhonePic,
      outsidePrizeOldTitle,
      outsidePrizeOldDesc,
      outsidePrizeOldHeadPic,
      outsidePrizeOldButtonPic,
      outsidePrizeOldIsShareButtonPic,
      outsidePrizeOldIsShareButton,
      outsidePrizeEndTitle,
      outsidePrizeEndDesc,
      outsidePrizeEndHeadPic,
      outsidePrizeEndButtonPic,
      outsidePrizeNewTitle,
      outsidePrizeNewDesc,
      outsidePrizeNewHeadPic,
      outsidePrizeNewButtonPic,
      outsideNewAwardCopyWriter,
      endTitle,
      endDesc,
      endHeadPic,
      endButtonPic,
      insideIconPic,
      insideShareTitle,
      insideShareDesc,
      outsideShareTitle,
      outsideShareDesc,
      carIconPic,
      appWaitDocUrl,
      appWaitUrlType,
      appWaitIconPic,
      appWaitIconPicType,
      appWaitInteractiveType,
      appWaitContentOfMessage,
      appWaitIconPicOfMessage,
      appWaitUrlTypeOfMessage,
      appWaitDocUrlOfMessage,
      miniProgramWaitIconPicType,
      miniProgramWaitIconPic,
      miniProgramWaitUrlType,
      miniProgramWaitDocUrl,
      miniProgramWaitInteractiveType,
      evaluationDialogType,
      evaluationDialogJumpType,
      evaluationDialogJumpLink,
      evaluationDialogPic,
      orderShareType,
      waitEvaluationDialogType,
      waitEvaluationDialogDesc,
      uiType,
      travelingRedBagSignal,
      travelingRedBagIconPic,
      travelingRedBagUrlType,
      activityProgressNotification,
      pActivityName,
      pActivityProcess,
      pNextTarget,
      noticeActivityReward,
      rActivityName,
      rActivityProcess,
      rReminder,
      appletIconPic,
      // 评价成功banenr 相关字段
      evaluationBannerType,
      evaluationBannerPic,
      evaluationBannerJumpType,
      evaluationBannerJumpLink
    } = this.props.interactiveDetail;
    const {
      supportShare,
      oldAcceptRule,
      externalOldRandomType,
      participateChannelList = []
    } = this.props.redBagCarDetail;
    const {
      loading
    } = this.state;
    const {
      getFieldDecorator
    } = this.props.form;
    const checkboxPanelConfig = getPositionPanelConfig(supportShare, evaluationDialogJumpType, travelingRedBagUrlType, participateChannelList);
    const uiClass = uiType === 1 ? 'dark' : 'light';
    return <div>
        <Form className="rel" style={w530}>
          <FormItem {...formItemLayout} label="车辆图标配置">
            {getFieldDecorator('carIconPic', {
            valuePropName: 'fileList',
            getValueFromEvent: this.normFile,
            rules: [{
              validator: this.checkUploadPic('carIconPic')
            }],
            initialValue: carIconPic ? this.getDefaultFileListByKey('carIconPic') : ''
          })(<Upload {...uploadConfig} className="upload-list-inline" listType="picture" onChange={this.onUploadChange('carIconPic')} onRemove={this.onRemove('carIconPic')}>
                <Button>
                  <Icon id="carIconAnchor" className="c-anchor" type="upload" style={f15} /> 上传文件
                </Button>
              </Upload>)}
          </FormItem>

          {participateChannelList.includes('1') && <>
                <FormItem {...formItemLayout} label="app等待接驾页面">
                  <div style={{
              fontSize: '18px',
              fontWeight: '500'
            }}> 曹操出行App </div>
                  {getFieldDecorator('appWaitIconPicType', {
              rules: [{
                required: true,
                message: '请选择是否开启'
              }],
              initialValue: appWaitIconPicType
            })(<RadioGroup>
                      <Radio value={2}>开启</Radio>
                      <Radio value={1}>关闭</Radio>
                    </RadioGroup>)}
                </FormItem>
                {appWaitIconPicType === 2 && <FormItem {...tailFormItemLayout}>
                      {getFieldDecorator('appWaitInteractiveType', {
              rules: [{
                required: true,
                message: '请选择'
              }],
              initialValue: appWaitInteractiveType
            })(<RadioGroup>
                          <Radio value={1}>弹窗</Radio>
                          <Radio value={2}>消息条</Radio>
                        </RadioGroup>)}
                    </FormItem>}
                {/* app 弹窗配置 */}
                {appWaitIconPicType === 2 && appWaitInteractiveType === 1 && <FormItem className="mb0" {...tailFormItemLayout}>
                      {getFieldDecorator('appWaitIconPic', {
              valuePropName: 'fileList',
              getValueFromEvent: this.normFile,
              rules: [{
                validator: this.checkUploadPic('appWaitIconPic')
              }],
              initialValue: appWaitIconPic ? this.getDefaultFileListByKey('appWaitIconPic') : ''
            })(<Upload {...uploadConfig} className="upload-list-inline" listType="picture" onChange={this.onUploadChange('appWaitIconPic')} onRemove={this.onRemove('appWaitIconPic')} beforeUpload={this.beforeUpload(810, 1080, 1024, false)}>
                          <Button>
                            <Icon id="waitPageAnchor" className="c-anchor" type="upload" style={f15} /> 上传文件
                          </Button>
                        </Upload>)}
                      <p className="mb0 w700">
                        <span className="mr20">1、最大支持810*1080，限制格式3:4</span>
                        <span className="mr20">2、图片大小1M</span>
                        <span className="mr20"> 3、格式jpg/bmp/png/gif</span>
                      </p>
                    </FormItem>}
                {/* app 弹窗配置 */}
                {appWaitIconPicType === 2 && appWaitInteractiveType === 1 && <FormItem {...tailFormItemLayout}>
                      {getFieldDecorator('appWaitUrlType', {
              rules: [{
                required: true,
                message: '请选择是否开启'
              }],
              initialValue: appWaitUrlType
            })(<RadioGroup>
                          <Radio value={1}>点击图片关闭</Radio>
                          <Radio value={2}>点击图片跳转到指定链接</Radio>
                        </RadioGroup>)}
                    </FormItem>}
                {/* 曹操出行app:开启配置 && 交互类型为通知 && 跳转类型为跳转到指定链接 */}
                {appWaitIconPicType === 2 && appWaitUrlType === 2 && appWaitInteractiveType === 1 && <FormItem {...tailFormItemLayout}>
                      {getFieldDecorator('appWaitDocUrl', {
              rules: [{
                required: true,
                message: '请填写跳转的url'
              }],
              initialValue: appWaitDocUrl
            })(<Input addonBefore="https://" />)}
                    </FormItem>}

                {/* app消息条配置 */}
                {appWaitIconPicType === 2 && appWaitInteractiveType === 2 && <>
                      <FormItem className="mb0" {...formItemLayout} label="消息条文案">
                        <p style={{
                color: 'red'
              }}>消息条仅乘客端5.1.8及以上版本可展示，老版本默认不展示</p>
                        {getFieldDecorator('appWaitContentOfMessage', {
                rules: [{
                  validator: this.checkInputLength(25)
                }, {
                  required: true,
                  message: '此为必填项'
                }],
                initialValue: appWaitContentOfMessage
              })(<Input placeholder="请输入消息条文案" />)}
                      </FormItem>
                      <FormItem className="mb0" {...formItemLayout} label="logo图片">
                        {getFieldDecorator('appWaitIconPicOfMessage', {
                valuePropName: 'fileList',
                getValueFromEvent: this.normFile,
                rules: [{
                  validator: this.checkUploadPic('appWaitIconPicOfMessage')
                }],
                initialValue: appWaitIconPicOfMessage ? this.getDefaultFileListByKey('appWaitIconPicOfMessage') : ''
              })(<Upload {...uploadConfig} className="upload-list-inline" listType="picture" onChange={this.onUploadChange('appWaitIconPicOfMessage')} onRemove={this.onRemove('appWaitIconPicOfMessage')} beforeUpload={this.beforeUpload(90, 90, 1024, false)}>
                            <Button>
                              <Icon id="waitPageAnchor" className="c-anchor" type="upload" style={f15} /> 上传文件
                            </Button>
                          </Upload>)}
                        <p className="mb0 w700">
                          <span className="mr20">1、最大支持90*90，限制格式3:4</span>
                          <span className="mr20">2、图片大小1M</span>
                          <span className="mr20"> 3、格式jpg、png、gif</span>
                        </p>
                      </FormItem>
                    </>}

                {appWaitIconPicType === 2 && appWaitInteractiveType === 2 && <FormItem {...tailFormItemLayout}>
                      {getFieldDecorator('appWaitUrlTypeOfMessage', {
              rules: [{
                required: true,
                message: '请选择是否开启'
              }],
              initialValue: appWaitUrlTypeOfMessage
            })(<RadioGroup>
                          <Radio value={5}>点击消息条无跳转</Radio>
                          <Radio value={2}>点击图片跳转到指定链接</Radio>
                        </RadioGroup>)}
                    </FormItem>}
                {/* 曹操出行app:开启配置 && 交互类型为消息条 && 跳转类型为跳转到指定链接 */}
                {appWaitIconPicType === 2 && appWaitUrlTypeOfMessage === 2 && appWaitInteractiveType === 2 && <FormItem {...tailFormItemLayout}>
                      {getFieldDecorator('appWaitDocUrlOfMessage', {
              rules: [{
                required: true,
                message: '请填写跳转的url'
              }],
              initialValue: appWaitDocUrlOfMessage
            })(<Input addonBefore="https://" />)}
                    </FormItem>}
              </>}

          {participateChannelList.includes('12') && <>
                <FormItem {...formItemLayout} label="小程序等待接驾页面">
                  <div style={{
              fontSize: '18px',
              fontWeight: '500'
            }}> 微信小程序 </div>
                  {getFieldDecorator('miniProgramWaitIconPicType', {
              rules: [{
                required: true,
                message: '请选择是否开启'
              }],
              initialValue: miniProgramWaitIconPicType
            })(<RadioGroup>
                      <Radio value={2}>开启</Radio>
                      <Radio value={1}>关闭</Radio>
                    </RadioGroup>)}
                </FormItem>

                {miniProgramWaitIconPicType === 2 && <FormItem {...tailFormItemLayout}>
                      {getFieldDecorator('miniProgramWaitInteractiveType', {
              rules: [{
                required: true,
                message: '请选择'
              }],
              initialValue: miniProgramWaitInteractiveType
            })(<RadioGroup>
                          <Radio value={1}>弹窗</Radio>
                        </RadioGroup>)}
                    </FormItem>}

                {miniProgramWaitIconPicType === 2 && miniProgramWaitInteractiveType === 1 && <FormItem className="mb0" {...tailFormItemLayout}>
                      {getFieldDecorator('miniProgramWaitIconPic', {
              valuePropName: 'fileList',
              getValueFromEvent: this.normFile,
              rules: [{
                validator: this.checkUploadPic('miniProgramWaitIconPic')
              }],
              initialValue: miniProgramWaitIconPic ? this.getDefaultFileListByKey('miniProgramWaitIconPic') : ''
            })(<Upload {...uploadConfig} className="upload-list-inline" listType="picture" onChange={this.onUploadChange('miniProgramWaitIconPic')} onRemove={this.onRemove('miniProgramWaitIconPic')} beforeUpload={this.beforeUpload(810, 1080, 1024, false)}>
                          <Button>
                            <Icon id="waitPageAnchor" className="c-anchor" type="upload" style={f15} /> 上传文件
                          </Button>
                        </Upload>)}
                      <p className="mb0 w700">
                        <span className="mr20">1、最大支持810*1080，限制格式3:4</span>
                        <span className="mr20">2、图片大小1M</span>
                        <span className="mr20"> 3、格式jpg/bmp/png/gif</span>
                      </p>
                    </FormItem>}

                {miniProgramWaitIconPicType === 2 && miniProgramWaitInteractiveType === 1 && <FormItem {...tailFormItemLayout}>
                      {getFieldDecorator('miniProgramWaitUrlType', {
              rules: [{
                required: true,
                message: '请选择是否开启'
              }],
              initialValue: miniProgramWaitUrlType
            })(<RadioGroup>
                          <Radio value={1}>点击图片关闭</Radio>
                          <Radio value={2}>点击图片跳转到指定链接</Radio>
                        </RadioGroup>)}
                    </FormItem>}

                {miniProgramWaitIconPicType === 2 && miniProgramWaitInteractiveType === 1 && miniProgramWaitUrlType === 2 && <FormItem {...tailFormItemLayout}>
                      {getFieldDecorator('miniProgramWaitDocUrl', {
              rules: [{
                required: true,
                message: '请填写跳转的url'
              }],
              initialValue: miniProgramWaitDocUrl
            })(<Input addonBefore="https://" />)}
                    </FormItem>}
              </>}

          <FormItem {...formItemLayout} label="行程中红包标志">
            {getFieldDecorator('travelingRedBagSignal', {
            rules: [{
              required: true,
              message: '请选择是否开启'
            }],
            initialValue: travelingRedBagSignal
          })(<RadioGroup>
                <Radio value={1}>开启</Radio>
                <Radio value={2}>关闭</Radio>
              </RadioGroup>)}
          </FormItem>

          {travelingRedBagSignal === 1 && <FormItem {...tailFormItemLayout}>
                {getFieldDecorator('travelingRedBagIconPic', {
            valuePropName: 'fileList',
            getValueFromEvent: this.normFile,
            rules: [{
              validator: this.checkUploadPic('travelingRedBagIconPic')
            }],
            initialValue: travelingRedBagIconPic ? this.getDefaultFileListByKey('travelingRedBagIconPic') : ''
          })(<Upload {...uploadConfig} className="upload-list-inline" listType="picture" onChange={this.onUploadChange('travelingRedBagIconPic')} onRemove={this.onRemove('travelingRedBagIconPic')} beforeUpload={this.beforeUpload(1194, 432, 200)}>
                    <Button>
                      <Icon id="waitPageAnchor" className="c-anchor" type="upload" style={f15} /> 上传文件
                    </Button>
                  </Upload>)}
                <p className="mb0">
                  <span>1、分辨率1194*432</span><br />
                  <span>2、图片大小200k</span><br />
                  <span>3、格式jpg/bmp/png/gif</span>
                </p>
              </FormItem>}

          {travelingRedBagSignal === 1 && <FormItem {...tailFormItemLayout}>
                {getFieldDecorator('travelingRedBagUrlType', {
            rules: [{
              required: true,
              message: '请选择是否开启'
            }],
            initialValue: travelingRedBagUrlType
          })(<RadioGroup>
                    {supportShare === 2 && <Radio value={3}>点击图片分享</Radio>}
                    <Radio value={4}>点击图片跳转站内领奖页面</Radio>
                  </RadioGroup>)}
              </FormItem>}

          <FormItem {...formItemLayout} label="评价成功弹窗">
            {getFieldDecorator('evaluationDialogType', {
            rules: [{
              required: true,
              message: '请选择是否开启'
            }],
            initialValue: evaluationDialogType
          })(<RadioGroup>
                <Radio value={1}>开启</Radio>
                <Radio value={2}>关闭</Radio>
              </RadioGroup>)}
            <span id="evaluationSuccessAnchor" />
          </FormItem>
          {evaluationDialogType === 1 && <FormItem className="mb0" {...tailFormItemLayout}>
                {getFieldDecorator('evaluationDialogPic', {
            valuePropName: 'fileList',
            getValueFromEvent: this.normFile,
            rules: [{
              validator: this.checkUploadPic('evaluationDialogPic')
            }],
            initialValue: evaluationDialogPic ? this.getDefaultFileListByKey('evaluationDialogPic') : ''
          })(<Upload {...uploadConfig} className="upload-list-inline" listType="picture" onChange={this.onUploadChange('evaluationDialogPic')} onRemove={this.onRemove('evaluationDialogPic')} beforeUpload={this.beforeUpload(810, 1080, 1024, false)}>
                    <Button>
                      <Icon id="evaluationDialogAnchor" className="c-anchor" type="upload" style={f15} /> 上传文件
                    </Button>
                  </Upload>)}
                <p className="mb0 w700">
                  <span className="mr20">1、最大支持810*1080，限制格式3:4</span>
                  <span className="mr20">2、图片大小1M</span>
                  <span className="mr20"> 3、格式jpg/bmp/png/gif</span>
                </p>
              </FormItem>}

          {evaluationDialogType === 1 && <FormItem {...tailFormItemLayout}>
                {getFieldDecorator('evaluationDialogJumpType', {
            rules: [{
              required: true,
              message: '请选择是否开启'
            }],
            initialValue: evaluationDialogJumpType
          })(<RadioGroup style={{
            width: '700px'
          }}>
                    <Radio value={1}>点击图片关闭</Radio>
                    {supportShare === 2 && <Radio value={3}>点击图片分享</Radio>}
                    <Radio value={4}>点击图片跳转站内领奖页面</Radio>
                    <Radio value={2}>点击图片跳转到指定链接</Radio>
                  </RadioGroup>)}
              </FormItem>}

          {evaluationDialogType === 1 && evaluationDialogJumpType === 2 && <FormItem {...tailFormItemLayout}>
                {getFieldDecorator('evaluationDialogJumpLink', {
            rules: [{
              required: true,
              message: '请填写跳转的url'
            }],
            initialValue: evaluationDialogJumpLink
          })(<Input addonBefore="https://" />)}
              </FormItem>}
          {participateChannelList?.includes('1') && <FormItem {...formItemLayout} label="评价成功banner">
                {getFieldDecorator('evaluationBannerType', {
            rules: [{
              required: true,
              message: '请选择是否开启'
            }],
            initialValue: evaluationBannerType
          })(<RadioGroup>
                    <Radio value={1}>开启</Radio>
                    <Radio value={2}>关闭</Radio>
                  </RadioGroup>)}
                <span id="evaluationSuccessBannerAnchor" />
              </FormItem>}

          {evaluationBannerType === 1 && <>
                <FormItem className="mb0" {...tailFormItemLayout}>
                  {getFieldDecorator('evaluationBannerPic', {
              valuePropName: 'fileList',
              getValueFromEvent: this.normFile,
              rules: [{
                validator: this.checkUploadPic('evaluationBannerPic')
              }],
              initialValue: evaluationBannerPic ? this.getDefaultFileListByKey('evaluationBannerPic') : ''
            })(<Upload {...uploadConfig} className="upload-list-inline" listType="picture" onChange={this.onUploadChange('evaluationBannerPic')} onRemove={this.onRemove('evaluationBannerPic')} beforeUpload={this.beforeUpload(1029, 240, 1024, false)}>
                      <Button>
                        <Icon id="evaluationSuccessBannerAnchor" className="c-anchor" type="upload" style={f15} /> 上传文件
                      </Button>
                    </Upload>)}
                  <p className="mb0 w700">
                    <span className="mr20">1、最大支持1029*240</span>
                    <span className="mr20">2、图片大小1M</span>
                    <span className="mr20"> 3、格式jpg/bmp/png/gif</span>
                  </p>
                </FormItem>
                <FormItem {...tailFormItemLayout}>
                  {getFieldDecorator('evaluationBannerJumpType', {
              rules: [{
                required: true,
                message: '请选择是否开启'
              }],
              initialValue: evaluationBannerJumpType
            })(<RadioGroup style={{
              width: '700px'
            }}>
                      {/* <Radio value={1}>点击图片关闭</Radio> */}
                      {supportShare === 2 && <Radio value={3}>点击图片分享</Radio>}
                      <Radio value={4}>点击图片跳转站内领奖页面</Radio>
                      <Radio value={2}>点击图片跳转到指定链接</Radio>
                    </RadioGroup>)}
                </FormItem>
                {evaluationBannerJumpType === 2 && <FormItem {...tailFormItemLayout}>
                      {getFieldDecorator('evaluationBannerJumpLink', {
              rules: [{
                required: true,
                message: '请填写跳转的url'
              }],
              initialValue: evaluationBannerJumpLink
            })(<Input addonBefore="https://" />)}
                    </FormItem>}
              </>}

          <FormItem {...formItemLayout} label="订单分享有礼" className="mb0">
            {getFieldDecorator('orderShareType', {
            rules: [{
              required: true,
              message: '请选择是否开启订单分享有礼'
            }],
            initialValue: orderShareType
          })(<RadioGroup>
                <Radio value={1}>开启</Radio>
                <Radio value={2}>关闭</Radio>
              </RadioGroup>)}
            <span id="shareOrderAnchor" />
          </FormItem>

          {orderShareType === 1 && <FormItem {...tailFormItemLayout}>
                <span>选择开启，点击分享有礼唤起红包车站内分享</span>
              </FormItem>}

          <FormItem {...formItemLayout} label="待评价弹窗文案" className="mb0">
            {getFieldDecorator('waitEvaluationDialogType', {
            rules: [{
              required: true,
              message: '请选择是否开启订单分享有礼'
            }],
            initialValue: waitEvaluationDialogType
          })(<RadioGroup>
                <Radio value={1}>开启</Radio>
                <Radio value={2}>关闭</Radio>
              </RadioGroup>)}
            <span id="waitEvaluationAnchor" />
          </FormItem>

          {waitEvaluationDialogType === 1 && <FormItem {...tailFormItemLayout} className="mb0">
                {getFieldDecorator('waitEvaluationDialogDesc', {
            rules: [{
              required: true,
              message: '请填写待评价弹窗文案'
            }, {
              validator: this.checkInputLength(12)
            }],
            initialValue: waitEvaluationDialogDesc
          })(<Input />)}
              </FormItem>}

          {waitEvaluationDialogType === 1 && <FormItem {...tailFormItemLayout}>
                <span>选择开启，待评价弹窗显示文案配置</span>
              </FormItem>}

          <h4 id="colorAnchor">活动页底色</h4>
          <div className="mb10" style={ml175}>
            <SketchPicker width="260px" onChange={this.colorChange} color={backgroundColor} />
          </div>
          <FormItem {...formItemLayout} label="活动页外观">
            {getFieldDecorator('uiType', {
            rules: [{
              required: true,
              message: '请选择颜色模式'
            }],
            initialValue: uiType
          })(<RadioGroup>
                <Radio value={1}>浅色模式</Radio>
                <Radio value={2}>深色模式</Radio>
              </RadioGroup>)}
            <span id="UIAnchor" />
          </FormItem>

          {(evaluationDialogJumpType === 4 || travelingRedBagUrlType === 4) && <div>
                <h4 id="insidePrizeAnchor">站内领奖页面</h4>
                <div className="rel" style={supportShare === 2 ? mb200 : mb350}>
                  <FormItem {...formItemLayout} label="页面标题">
                    {getFieldDecorator('insideTitle', {
                rules: [{
                  required: true,
                  message: '请填写页面标题'
                }],
                initialValue: insideTitle
              })(<Input style={w250} />)}
                  </FormItem>

                  <FormItem {...formItemLayout} label="头图">
                    {getFieldDecorator('insideHeadPic', {
                valuePropName: 'fileList',
                getValueFromEvent: this.normFile,
                rules: [{
                  validator: this.checkUploadPic('insideHeadPic')
                }],
                initialValue: insideHeadPic ? this.getDefaultFileListByKey('insideHeadPic') : ''
              })(<Upload {...uploadConfig} onChange={this.onUploadChange('insideHeadPic')} beforeUpload={this.beforeUpload(1125, 480, 400)} onRemove={this.onRemove('insideHeadPic')}>
                        <Button>
                          <Icon type="upload" style={f15} /> 上传文件
                        </Button>
                      </Upload>)}
                    <p className="mb0">
                      <span>1、分辨率1125*480</span><br />
                      <span>2、图片大小400KB</span>
                    </p>
                  </FormItem>
                  <FormItem {...formItemLayout} label="活动规则">
                    {getFieldDecorator('insideDesc', {
                rules: [{
                  required: true,
                  message: '请填写活动规则'
                }],
                initialValue: insideDesc
              })(<TextArea style={w250} rows={4} />)}
                  </FormItem>
                  {supportShare === 2 && <FormItem {...formItemLayout} label="分享button">
                        {getFieldDecorator('insideButtonPic', {
                valuePropName: 'fileList',
                getValueFromEvent: this.normFile,
                rules: [{
                  validator: this.checkUploadPic('insideButtonPic')
                }],
                initialValue: insideButtonPic ? this.getDefaultFileListByKey('insideButtonPic') : ''
              })(<Upload {...uploadConfig} onChange={this.onUploadChange('insideButtonPic')} beforeUpload={this.beforeUpload(981, 165, 50)} onRemove={this.onRemove('insideButtonPic')}>
                            <Button>
                              <Icon type="upload" style={f15} /> 上传文件
                            </Button>
                          </Upload>)}
                        <p className="mb0">
                          <span>1、分辨率981*165</span><br />
                          <span>2、图片大小50KB</span>
                        </p>
                      </FormItem>}

                  <PreviewWrapper backgroundColor={backgroundColor} className={`${uiClass}`}>
                    <p className="bgwh tc mb0">{insideTitle}</p>
                    <img src={insideHeadPic} style={w375} alt="" />
                    <a className="activity-link">活动规则</a>
                    <div className="radius-section">
                      {supportShare === 2 && oldAcceptRule === 2 ? '' : <p className="title">恭喜您领到红包</p>}
                      {supportShare === 2 && oldAcceptRule === 2 ? '' : <ul className="preview-coupon-list">
                              <li className="preview-coupon-item">
                                <img src={couponItemImg} alt="" />
                              </li>
                              <li className="preview-coupon-item">
                                <img src={couponItemImg} alt="" />
                              </li>
                              <li className="preview-coupon-item">
                                <img src={couponItemImg} alt="" />
                              </li>
                            </ul>}
                    </div>
                    <RuleSection text="活动规则">
                      <pre className="m10">{insideDesc}</pre>
                    </RuleSection>
                    <div className="bottom-btn-wrapper">
                      {supportShare !== 1 && <img src={insideButtonPic} alt="" />}
                    </div>

                  </PreviewWrapper>
                </div>
              </div>}

          {supportShare === 2 && <h4 id="outsideJoinAnchor">站外参与页面</h4>}
          {supportShare === 2 && <div className="rel" style={mb100}>
                <FormItem {...formItemLayout} label="页面标题">
                  {getFieldDecorator('outsideTitle', {
              rules: [{
                required: true,
                message: '请填写页面标题'
              }],
              initialValue: outsideTitle
            })(<Input style={w250} />)}
                </FormItem>

                <FormItem {...formItemLayout} label="头图">
                  {getFieldDecorator('outsideHeadPic', {
              valuePropName: 'fileList',
              getValueFromEvent: this.normFile,
              // rules: [{ required: true, message: '请上传文件' }],
              rules: [{
                validator: this.checkUploadPic('outsideHeadPic')
              }],
              initialValue: outsideHeadPic ? this.getDefaultFileListByKey('outsideHeadPic') : ''
            })(<Upload {...uploadConfig} onChange={this.onUploadChange('outsideHeadPic')} beforeUpload={this.beforeUpload(1125, 1272, 400)} onRemove={this.onRemove('outsideHeadPic')}>
                      <Button>
                        <Icon type="upload" style={f15} /> 上传文件
                      </Button>
                    </Upload>)}
                  <p className="mb0">
                    <span>1、分辨率1125*1272</span><br />
                    <span>2、图片大小400KB</span>
                  </p>
                </FormItem>
                <FormItem {...formItemLayout} label="领取button">
                  {getFieldDecorator('outsideButtonPic', {
              valuePropName: 'fileList',
              getValueFromEvent: this.normFile,
              // rules: [{ required: true, message: '请上传文件' }],
              rules: [{
                validator: this.checkUploadPic('outsideButtonPic')
              }],
              initialValue: outsideButtonPic ? this.getDefaultFileListByKey('outsideButtonPic') : ''
            })(<Upload {...uploadConfig} onChange={this.onUploadChange('outsideButtonPic')} beforeUpload={this.beforeUpload(885, 165, 50)} onRemove={this.onRemove('outsideButtonPic')}>
                      <Button>
                        <Icon type="upload" style={f15} /> 上传文件
                      </Button>
                    </Upload>)}
                  <p className="mb0">
                    <span>1、分辨率885*165</span><br />
                    <span>2、图片大小50KB</span>
                  </p>
                </FormItem>
                <FormItem {...formItemLayout} label="领取button(无手机号)">
                  {getFieldDecorator('outsideButtonWithoutPhonePic', {
              valuePropName: 'fileList',
              getValueFromEvent: this.normFile,
              // rules: [{ required: true, message: '请上传文件' }],
              rules: [{
                validator: this.checkUploadPic('outsideButtonWithoutPhonePic')
              }],
              initialValue: outsideButtonWithoutPhonePic ? this.getDefaultFileListByKey('outsideButtonWithoutPhonePic') : ''
            })(<Upload {...uploadConfig} onChange={this.onUploadChange('outsideButtonWithoutPhonePic')} beforeUpload={this.beforeUpload(885, 165, 50)} onRemove={this.onRemove('outsideButtonWithoutPhonePic')}>
                      <Button>
                        <Icon type="upload" style={f15} /> 上传文件
                      </Button>
                    </Upload>)}
                  <p className="mb0">
                    <span>1、分辨率885*165</span><br />
                    <span>2、图片大小50KB</span><br />
                    <span>3、不支持页面预览</span>
                  </p>
                </FormItem>
                <FormItem {...formItemLayout} label="活动规则">
                  {getFieldDecorator('outsideDesc', {
              rules: [{
                required: true,
                message: '请填写活动规则'
              }],
              initialValue: outsideDesc
            })(<TextArea style={w250} rows={4} />)}
                </FormItem>
                <PreviewWrapper backgroundColor={backgroundColor} className={`${uiClass}`}>
                  <p className="bgwh tc mb0">{outsideTitle}</p>
                  <img src={outsideHeadPic} style={w375} alt="" />
                  <div className="radius-section">
                    <p className="title">您的好友邀请您领取打车券</p>
                    <p className="mobile-input">
                      请输入您的手机号
                    </p>
                    <img src={outsideButtonPic} style={w295} className="br5" alt="" />
                    <p className="mobile-select">
                      <img src={redbagSelectImg} alt="" />
                      <span className="text">我已阅读并同意曹操专车的</span>
                      <span className="protocol">《活动协议》</span>
                    </p>

                  </div>
                  <RuleSection text="活动规则">
                    <pre className="m10">{outsideDesc}</pre>
                  </RuleSection>
                </PreviewWrapper>
              </div>}

          {supportShare === 2 && <h4 id="outsidePrizeOldAnchor">站外领奖页面-老用户</h4>}
          {supportShare === 2 && <div className="rel" style={mb250}>
                <FormItem {...formItemLayout} label="页面标题">
                  {getFieldDecorator('outsidePrizeOldTitle', {
              rules: [{
                required: true,
                message: '请填写页面标题'
              }],
              initialValue: outsidePrizeOldTitle
            })(<Input style={w250} />)}
                </FormItem>

                <FormItem {...formItemLayout} label="头图">
                  {getFieldDecorator('outsidePrizeOldHeadPic', {
              valuePropName: 'fileList',
              getValueFromEvent: this.normFile,
              rules: [{
                validator: this.checkUploadPic('outsidePrizeOldHeadPic')
              }],
              initialValue: outsidePrizeOldHeadPic ? this.getDefaultFileListByKey('outsidePrizeOldHeadPic') : ''
            })(<Upload {...uploadConfig} onChange={this.onUploadChange('outsidePrizeOldHeadPic')} beforeUpload={this.beforeUpload(1125, 480, 400)} onRemove={this.onRemove('outsidePrizeOldHeadPic')}>
                      <Button>
                        <Icon type="upload" style={f15} /> 上传文件
                      </Button>
                    </Upload>)}
                  <p className="mb0">
                    <span>1、分辨率1125*480</span><br />
                    <span>2、图片大小500KB</span>
                  </p>
                </FormItem>
                <FormItem {...formItemLayout} label="分享button">
                  {getFieldDecorator('outsidePrizeOldIsShareButton', {
              rules: [{
                required: true,
                message: '请选择颜色模式'
              }],
              initialValue: outsidePrizeOldIsShareButton
            })(<RadioGroup onChange={this.isShareButtonChange}>
                      <Radio value={1}>不展示</Radio>
                      <Radio value={2}>展示</Radio>
                    </RadioGroup>)}
                </FormItem>
                {outsidePrizeOldIsShareButton === 2 && <FormItem {...tailFormItemLayout} label="">
                      {getFieldDecorator('outsidePrizeOldIsShareButtonPic', {
              valuePropName: 'fileList',
              getValueFromEvent: this.normFile,
              rules: [{
                validator: this.checkUploadPic('outsidePrizeOldIsShareButtonPic')
              }],
              initialValue: outsidePrizeOldIsShareButtonPic ? this.getDefaultFileListByKey('outsidePrizeOldIsShareButtonPic') : ''
            })(<Upload {...uploadConfig} onChange={this.onUploadChange('outsidePrizeOldIsShareButtonPic')} beforeUpload={this.beforeUpload(160, 50, 50)} onRemove={this.onRemove('outsidePrizeOldIsShareButtonPic')}>
                          <Button>
                            <Icon type="upload" style={f15} /> 上传文件
                          </Button>
                        </Upload>)}
                      <p className="mb0">
                        <span>1、分辨率160*50</span><br />
                        <span>2、图片大小50KB</span><br />
                        <span>3、仅支持投放到微信小程序时展示</span>
                      </p>
                    </FormItem>}
                <FormItem {...formItemLayout} label="引流回站button">
                  {getFieldDecorator('outsidePrizeOldButtonPic', {
              valuePropName: 'fileList',
              getValueFromEvent: this.normFile,
              rules: [{
                validator: this.checkUploadPic('outsidePrizeOldButtonPic')
              }],
              initialValue: outsidePrizeOldButtonPic ? this.getDefaultFileListByKey('outsidePrizeOldButtonPic') : ''
            })(<Upload {...uploadConfig} onChange={this.onUploadChange('outsidePrizeOldButtonPic')} beforeUpload={outsidePrizeOldIsShareButton === 2 ? this.beforeUpload(160, 50, 50) : this.beforeUpload(981, 165, 50)} onRemove={this.onRemove('outsidePrizeOldButtonPic')}>
                      <Button>
                        <Icon type="upload" style={f15} /> 上传文件
                      </Button>
                    </Upload>)}
                  <p className="mb0">
                    <span>1、分辨率{outsidePrizeOldIsShareButton === 2 ? '160*50' : '981*165'}</span><br />
                    <span>2、图片大小50KB</span>
                  </p>
                </FormItem>
                <FormItem {...formItemLayout} label="活动规则">
                  {getFieldDecorator('outsidePrizeOldDesc', {
              rules: [{
                required: true,
                message: '请填写活动规则'
              }],
              initialValue: outsidePrizeOldDesc
            })(<TextArea style={w250} rows={4} />)}
                </FormItem>

                <PreviewWrapper backgroundColor={backgroundColor} style={{
            overflow: 'hidden'
          }} className={`${uiClass}`}>
                  <div className="scroll-wrapper">
                    <p className="bgwh tc mb0">{outsidePrizeOldTitle}</p>
                    <img src={outsidePrizeOldHeadPic} style={w375} alt="" />
                    <div className="radius-section">
                      <p className="title">优惠券已到账</p>
                      <ul className="preview-coupon-list">
                        <li className="preview-coupon-item">
                          <img src={couponItemImg} alt="" />
                        </li>
                        <li className="preview-coupon-item">
                          <img src={couponItemImg} alt="" />
                        </li>
                        <li className="preview-coupon-item">
                          <img src={couponItemImg} alt="" />
                        </li>
                      </ul>
                    </div>
                    {externalOldRandomType === 1 && <RuleSection text="看看朋友手气如何">
                          <ul className="preview-phone-list">
                            <li className="preview-phone-item">
                              <img alt="" src={userIcon1} />
                              <span>180****5553</span>
                              <span className="r">￥77</span>
                            </li>
                            <li className="preview-phone-item">
                              <img alt="" src={userIcon2} />
                              <span>137****1535</span>
                              <span className="r">￥77</span>
                            </li>
                            <li className="preview-phone-item">
                              <img alt="" src={userIcon1} />
                              <span>180****5553</span>
                              <span className="r">￥77</span>
                            </li>
                          </ul>
                        </RuleSection>}

                    <RuleSection text="活动规则">
                      <pre className="m10">{outsidePrizeOldDesc}</pre>
                    </RuleSection>
                  </div>
                  <div className="bottom-wrapper">
                    <img style={{
                width: outsidePrizeOldIsShareButton === 2 ? '50%' : '100%'
              }} src={outsidePrizeOldButtonPic} alt="" />
                    {outsidePrizeOldIsShareButton === 2 && <img style={{
                width: '50%'
              }} src={outsidePrizeOldIsShareButtonPic} alt="" />}
                  </div>
                </PreviewWrapper>
              </div>}

          {supportShare === 2 && <h4 id="outsidePrizeEndAnchor">站外奖品领完页面-老用户</h4>}
          {supportShare === 2 && <div className="rel" style={mb250}>
                <FormItem {...formItemLayout} label="页面标题">
                  {getFieldDecorator('outsidePrizeEndTitle', {
              rules: [{
                required: true,
                message: '请填写页面标题'
              }],
              initialValue: outsidePrizeEndTitle
            })(<Input style={w250} />)}
                </FormItem>

                <FormItem {...formItemLayout} label="头图">
                  {getFieldDecorator('outsidePrizeEndHeadPic', {
              valuePropName: 'fileList',
              getValueFromEvent: this.normFile,
              rules: [{
                validator: this.checkUploadPic('outsidePrizeEndHeadPic')
              }],
              initialValue: outsidePrizeEndHeadPic ? this.getDefaultFileListByKey('outsidePrizeEndHeadPic') : ''
            })(<Upload {...uploadConfig} onChange={this.onUploadChange('outsidePrizeEndHeadPic')} beforeUpload={this.beforeUpload(1125, 1272, 400)} onRemove={this.onRemove('outsidePrizeEndHeadPic')}>
                      <Button>
                        <Icon type="upload" style={f15} /> 上传文件
                      </Button>
                    </Upload>)}
                  <p className="mb0">
                    <span>1、分辨率1125*1272</span><br />
                    <span>2、图片大小400KB</span>
                  </p>
                </FormItem>
                <FormItem {...formItemLayout} label="引流回站button">
                  {getFieldDecorator('outsidePrizeEndButtonPic', {
              valuePropName: 'fileList',
              getValueFromEvent: this.normFile,
              rules: [{
                validator: this.checkUploadPic('outsidePrizeEndButtonPic')
              }],
              initialValue: outsidePrizeEndButtonPic ? this.getDefaultFileListByKey('outsidePrizeEndButtonPic') : ''
            })(<Upload {...uploadConfig} onChange={this.onUploadChange('outsidePrizeEndButtonPic')} beforeUpload={this.beforeUpload(981, 165, 50)} onRemove={this.onRemove('outsidePrizeEndButtonPic')}>
                      <Button>
                        <Icon type="upload" style={f15} /> 上传文件
                      </Button>
                    </Upload>)}
                  <p className="mb0">
                    <span>1、分辨率981*165</span><br />
                    <span>2、图片大小50KB</span>
                  </p>
                </FormItem>
                <FormItem {...formItemLayout} label="活动规则">
                  {getFieldDecorator('outsidePrizeEndDesc', {
              rules: [{
                required: true,
                message: '请填写活动规则'
              }],
              initialValue: outsidePrizeEndDesc
            })(<TextArea style={w250} rows={4} />)}
                </FormItem>

                <PreviewWrapper backgroundColor={backgroundColor} style={{
            overflow: 'hidden'
          }} className={`${uiClass}`}>
                  <div className="scroll-wrapper">
                    <p className="bgwh tc mb0">{outsidePrizeEndTitle}</p>
                    <img src={outsidePrizeEndHeadPic} style={w375} alt="" />
                    <p className="text-late">来迟了，红包被抢光了</p>

                    <RuleSection text="活动规则">
                      <pre className="m10">{outsidePrizeEndDesc}</pre>
                    </RuleSection>
                  </div>
                  <div className="bottom-wrapper">
                    <img src={outsidePrizeEndButtonPic} alt="" />
                  </div>
                </PreviewWrapper>
              </div>}

          {supportShare === 2 && <h4 id="outsidePrizeNewAnchor">站外领奖页面-新用户</h4>}
          {supportShare === 2 && <div className="rel" style={mb250}>
                <FormItem {...formItemLayout} label="页面标题">
                  {getFieldDecorator('outsidePrizeNewTitle', {
              rules: [{
                required: true,
                message: '请填写页面标题'
              }],
              initialValue: outsidePrizeNewTitle
            })(<Input style={w250} />)}
                </FormItem>

                <FormItem {...formItemLayout} label="头图">
                  {getFieldDecorator('outsidePrizeNewHeadPic', {
              valuePropName: 'fileList',
              getValueFromEvent: this.normFile,
              rules: [{
                validator: this.checkUploadPic('outsidePrizeNewHeadPic')
              }],
              initialValue: outsidePrizeNewHeadPic ? this.getDefaultFileListByKey('outsidePrizeNewHeadPic') : ''
            })(<Upload {...uploadConfig} onChange={this.onUploadChange('outsidePrizeNewHeadPic')} beforeUpload={this.beforeUpload(1125, 1272, 400)} onRemove={this.onRemove('outsidePrizeNewHeadPic')}>
                      <Button>
                        <Icon type="upload" style={f15} /> 上传文件
                      </Button>
                    </Upload>)}
                  <p className="mb0">
                    <span>1、分辨率1125*1272</span><br />
                    <span>2、图片大小400KB</span>
                  </p>
                </FormItem>
                <FormItem {...formItemLayout} label="新用户获奖文案">
                  {getFieldDecorator('outsideNewAwardCopyWriter', {
              rules: [{
                required: true,
                message: '请填写新用户获奖文案'
              }],
              initialValue: outsideNewAwardCopyWriter
            })(<TextArea style={w250} rows={4} />)}
                </FormItem>
                <FormItem {...formItemLayout} label="引流回站button">
                  {getFieldDecorator('outsidePrizeNewButtonPic', {
              valuePropName: 'fileList',
              getValueFromEvent: this.normFile,
              // rules: [{ required: true, message: '请上传文件' }],
              rules: [{
                validator: this.checkUploadPic('outsidePrizeNewButtonPic')
              }],
              initialValue: outsidePrizeNewButtonPic ? this.getDefaultFileListByKey('outsidePrizeNewButtonPic') : ''
            })(<Upload {...uploadConfig} onChange={this.onUploadChange('outsidePrizeNewButtonPic')} beforeUpload={this.beforeUpload(981, 165, 50)} onRemove={this.onRemove('outsidePrizeNewButtonPic')}>
                      <Button>
                        <Icon type="upload" style={f15} /> 上传文件
                      </Button>
                    </Upload>)}
                  <p className="mb0">
                    <span>1、分辨率981*165</span><br />
                    <span>2、图片大小50KB</span>
                  </p>
                </FormItem>
                <FormItem {...formItemLayout} label="活动规则">
                  {getFieldDecorator('outsidePrizeNewDesc', {
              rules: [{
                required: true,
                message: '请填写活动规则'
              }],
              initialValue: outsidePrizeNewDesc
            })(<TextArea style={w250} rows={4} />)}
                </FormItem>

                <PreviewWrapper backgroundColor={backgroundColor} style={{
            overflow: 'hidden'
          }} className={`${uiClass}`}>
                  <div className="scroll-wrapper">
                    <p className="bgwh tc mb0">{outsidePrizeNewTitle}</p>
                    <img src={outsidePrizeNewHeadPic} style={w375} alt="" />
                    <p className="text-late">{outsideNewAwardCopyWriter}</p>
                    <RuleSection text="活动规则">
                      <pre className="m10">{outsidePrizeNewDesc}</pre>
                    </RuleSection>
                  </div>
                  <div className="bottom-wrapper">
                    <img src={outsidePrizeNewButtonPic} alt="" />
                  </div>
                </PreviewWrapper>

              </div>}

          <h4 id="endAnchor">活动结束页面</h4>
          <div className="rel" style={mb250}>
            <FormItem {...formItemLayout} label="页面标题">
              {getFieldDecorator('endTitle', {
              rules: [{
                required: true,
                message: '请填写页面标题'
              }],
              initialValue: endTitle
            })(<Input style={w250} />)}
            </FormItem>

            <FormItem {...formItemLayout} label="头图">
              {getFieldDecorator('endHeadPic', {
              valuePropName: 'fileList',
              getValueFromEvent: this.normFile,
              rules: [{
                validator: this.checkUploadPic('endHeadPic')
              }],
              initialValue: endHeadPic ? this.getDefaultFileListByKey('endHeadPic') : ''
            })(<Upload {...uploadConfig} onChange={this.onUploadChange('endHeadPic')} beforeUpload={this.beforeUpload(1125, 1272, 400)} onRemove={this.onRemove('endHeadPic')}>
                  <Button>
                    <Icon type="upload" style={f15} /> 上传文件
                  </Button>
                </Upload>)}
              <p className="mb0">
                <span>1、分辨率1125*1272</span><br />
                <span>2、图片大小400KB</span>
              </p>
            </FormItem>
            <FormItem {...formItemLayout} label="活动结束文案">
              {getFieldDecorator('endDesc', {
              rules: [{
                required: true,
                message: '请填写活动结束文案'
              }],
              initialValue: endDesc
            })(<TextArea style={w250} rows={4} />)}
            </FormItem>
            <FormItem {...formItemLayout} label="引流回站button">
              {getFieldDecorator('endButtonPic', {
              valuePropName: 'fileList',
              getValueFromEvent: this.normFile,
              rules: [{
                validator: this.checkUploadPic('endButtonPic')
              }],
              initialValue: endButtonPic ? this.getDefaultFileListByKey('endButtonPic') : ''
            })(<Upload {...uploadConfig} onChange={this.onUploadChange('endButtonPic')} beforeUpload={this.beforeUpload(981, 165, 50)} onRemove={this.onRemove('endButtonPic')}>
                  <Button>
                    <Icon type="upload" style={f15} /> 上传文件
                  </Button>
                </Upload>)}
              <p className="mb0">
                <span>1、分辨率981*165</span><br />
                <span>2、图片大小50KB</span>
              </p>
            </FormItem>

            <PreviewWrapper backgroundColor={backgroundColor} style={{
            overflow: 'hidden'
          }} className={`${uiClass}`}>
              <div className="scroll-wrapper">
                <p className="bgwh tc mb0">{endTitle}</p>
                <img src={endHeadPic} style={w375} alt="" />
                <p className="text-late">{endDesc}</p>
              </div>
              <div className="bottom-wrapper">
                <img src={endButtonPic} alt="" />
              </div>
            </PreviewWrapper>

          </div>

          {supportShare === 2 && <h4 id="insideShareAnchor">分享设置</h4>}
          {supportShare === 2 && <div>
                <FormItem {...formItemLayout} label="H5分享图标">
                  {getFieldDecorator('insideIconPic', {
              valuePropName: 'fileList',
              getValueFromEvent: this.normFile,
              // rules: [{ required: true, message: '请上传文件' }],
              rules: [{
                validator: this.checkUploadPic('insideIconPic')
              }],
              initialValue: insideIconPic ? this.getDefaultFileListByKey('insideIconPic') : ''
            })(<Upload {...uploadConfig} className="upload-list-inline" listType="picture" onChange={this.onUploadChange('insideIconPic')} beforeUpload={this.beforeUpload(150, 150, 10)} onRemove={this.onRemove('insideIconPic')}>
                      <Button>
                        <Icon type="upload" style={f15} /> 上传文件
                      </Button>
                    </Upload>)}
                  <p className="mb0">
                    <span>1、分辨率150*150</span><br />
                    <span>2、图片大小10KB</span>
                  </p>
                </FormItem>
                <FormItem {...formItemLayout} label="小程序分享图标">
                  {getFieldDecorator('appletIconPic', {
              valuePropName: 'fileList',
              getValueFromEvent: this.normFile,
              // rules: [{ required: true, message: '请上传文件' }],
              rules: [{
                validator: this.checkUploadPic('appletIconPic')
              }],
              initialValue: appletIconPic ? this.getDefaultFileListByKey('appletIconPic') : ''
            })(<Upload {...uploadConfig} className="upload-list-inline" listType="picture" onChange={this.onUploadChange('appletIconPic')} beforeUpload={this.beforeUpload(630, 504, 200)} onRemove={this.onRemove('appletIconPic')}>
                      <Button>
                        <Icon type="upload" style={f15} /> 上传文件
                      </Button>
                    </Upload>)}
                  <p className="mb0">
                    <span>1、分辨率630*504</span><br />
                    <span>2、图片大小200KB</span>
                  </p>
                </FormItem>

                <FormItem {...formItemLayout} label="分享标题">
                  {getFieldDecorator('insideShareTitle', {
              rules: [{
                required: true,
                message: '请填写页面标题'
              }],
              initialValue: insideShareTitle
            })(<PositionInput insertList={insertList} />)}
                  {/* {
                    <span style={{ fontWeight: 'bold' }}>H5和小程序公用分享标题</span>
                   } */}
                </FormItem>
                <FormItem {...formItemLayout} label="分享正文">
                  {getFieldDecorator('insideShareDesc', {
              rules: [{
                required: true,
                message: '请填写活动规则'
              }],
              initialValue: insideShareDesc
            })(<PositionInput componentType="area" insertList={insertList} />)}
                </FormItem>
                <p className="ml150 w700">
                  {'1、标题和正文中均可引用{amount}表示手气最佳人数，例如：第{amount}个人领取最佳手气'}
                  <br />
                  {'2、标题和正文中均可引用{订单上车地点}表示订单上车点，例如：送你一张上车点为{startAddress}的优惠券'}
                  <br />
                  {'2、标题和正文中均可引用{订单目的地}表示订单的目的地，例如：送你一张目的地为{endAddress}的优惠券'}
                </p>

                <FormItem {...formItemLayout} label="二次分享标题">
                  {getFieldDecorator('outsideShareTitle', {
              rules: [{
                required: true,
                message: '请填写页面标题'
              }],
              initialValue: outsideShareTitle
            })(<Input style={w250} />)}
                </FormItem>
                <FormItem {...formItemLayout} label="二次分享正文">
                  {getFieldDecorator('outsideShareDesc', {
              rules: [{
                required: true,
                message: '请填写活动规则'
              }],
              initialValue: outsideShareDesc
            })(<TextArea style={w250} rows={4} />)}
                </FormItem>
              </div>}

          {participateChannelList?.includes('12') && <>
              <h4 id="wechatAppletActivityNotification">微信小程序活动通知</h4>
              <FormItem {...formItemLayout} label="活动进度通知">
                {getFieldDecorator('activityProgressNotification', {
              rules: [{
                required: true,
                message: '请选择是否开启微信小程序活动通知'
              }],
              initialValue: activityProgressNotification
            })(<RadioGroup>
                    <Radio value={1}>开启</Radio>
                    <Radio value={2}>关闭</Radio>
                  </RadioGroup>)}
              </FormItem>

              {activityProgressNotification === 1 && <>
                    <FormItem {...formItemLayout} label="活动名称：">
                      {getFieldDecorator('pActivityName', {
                rules: [{
                  required: true,
                  message: '此为必填项'
                }],
                initialValue: pActivityName
              })(<Input className="dib w250" />)}
                    </FormItem>
                    <FormItem {...formItemLayout} label="活动进度：">
                      {getFieldDecorator('pActivityProcess', {
                rules: [{
                  required: true,
                  message: '此为必填项'
                }],
                initialValue: pActivityProcess
              })(<Input className="dib w250" />)}
                    </FormItem>
                    <FormItem {...formItemLayout} label="下一目标：">
                      {getFieldDecorator('pNextTarget', {
                rules: [{
                  required: true,
                  message: '此为必填项'
                }],
                initialValue: pNextTarget
              })(<Input className="dib w250" />)}
                    </FormItem>
                    <FormItem {...tailFormItemLayout} label="">
                      <p className="w700">订单支付6分钟后发送通知，用户点击消息跳转到订单详情页</p>
                    </FormItem>
                  </>}
              <FormItem {...formItemLayout} label="优惠到帐通知">
                {getFieldDecorator('noticeActivityReward', {
              rules: [{
                required: true,
                message: '请选择是否开启优惠到帐通知'
              }],
              initialValue: noticeActivityReward || 1
            })(<RadioGroup>
                    <Radio value={1}>开启</Radio>
                    <Radio value={2}>关闭</Radio>
                  </RadioGroup>)}
              </FormItem>

              {noticeActivityReward === 1 && <>
                    <FormItem {...formItemLayout} label="优惠详情：">
                      {getFieldDecorator('rActivityName', {
                rules: [{
                  required: true,
                  message: '此为必填项'
                }],
                initialValue: rActivityName
              })(<Input className="dib w250" />)}
                    </FormItem>
                    <FormItem {...formItemLayout} label="有效时间：">
                      {getFieldDecorator('rActivityProcess', {
                rules: [{
                  required: true,
                  message: '此为必填项'
                }],
                initialValue: rActivityProcess
              })(<Input className="dib w250" />)}
                    </FormItem>
                    <FormItem {...formItemLayout} label="温馨提示：">
                      {getFieldDecorator('rReminder', {
                rules: [{
                  required: true,
                  message: '此为必填项'
                }],
                initialValue: rReminder
              })(<Input className="dib w250" />)}
                    </FormItem>
                    <FormItem {...tailFormItemLayout} label="">
                      <p className="w700">订单评价完成后发送通知，用户点击消息跳转到订单详情页</p>
                    </FormItem>
                  </>}</>}

          <div className="activity-mask" style={{
          display: this.props.type === 'viewActivityDetail' ? 'block' : 'none'
        }} />

        </Form>

        <Row style={bottomStyle}>
          <Col offset={7}>
            <Button className="mr10" onClick={this.goPrev} disabled={loading}>上一步</Button>
            {this.props.type === 'viewActivityDetail' ? '' : <Button type="primary" className="mr10" onClick={this.goNext} loading={loading}>提交</Button>}
          </Col>
        </Row>

        <PositionPanel {...checkboxPanelConfig} />
      </div>;
  }
}
const WrappedActivityStepTwo = Form.create({
  onValuesChange: (props, changedValues, allValues) => {
    if (!window.WATCH_FORM_DATA_EXTENTIONS) {
      window.WATCH_FORM_DATA_EXTENTIONS = {};
    } else {
      window.WATCH_FORM_DATA_EXTENTIONS.undefined = {
        ...arguments[2]
      };
    }
    console.log('changedValues', changedValues, allValues);
  },
  onFieldsChange(props, fields) {
    // console.log('onFieldsChange', fields);
    const {
      interactiveDetail
    } = props;
    const keys = Object.keys(fields);
    const ignoreKeys = ['insideHeadPic', 'insideButtonPic', 'insideIconPic', 'appletIconPic', 'outsideButtonPic', 'outsideHeadPic', 'outsidePrizeOldHeadPic', 'outsidePrizeOldButtonPic', 'outsidePrizeOldIsShareButtonPic', 'outsidePrizeNewHeadPic', 'outsidePrizeNewButtonPic', 'endHeadPic', 'endButtonPic', 'carIconPic', 'appWaitIconPic', 'appWaitIconPicOfMessage', 'miniProgramWaitIconPic', 'outsidePrizeEndButtonPic', 'outsidePrizeEndHeadPic', 'outsideButtonWithoutPhonePic', 'evaluationDialogPic', 'travelingRedBagIconPic', 'evaluationBannerPic'];
    for (let i = 0, l = keys.length; i < l; i += 1) {
      const key = keys[i];
      const {
        name
      } = fields[key];
      const {
        value
      } = fields[key];
      if (ignoreKeys.includes(key)) {
        break;
      }
      if (_.eq(interactiveDetail[key], value)) {
        break;
      }
      props.dispatch('UPDATE_CUSTOMER_INTERACTIVE_DETAIL', {
        [name]: value
      });
    }
  }
})(ActivityStepTwo);
export default connect(state => ({
  detail: state.customerReducer.customerActivityReducer.detail,
  redBagCarDetail: state.customerReducer.customerActivityReducer.redBagCarDetail,
  currentStep: state.customerReducer.customerActivityReducer.currentStep,
  detailDisabled: state.customerReducer.customerActivityReducer.detailDisabled,
  interactiveDetail: state.customerReducer.customerInteractiveReducer.interactiveDetail
}), {
  dispatch
})(WrappedActivityStepTwo);