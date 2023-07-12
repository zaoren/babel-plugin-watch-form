import { formItemLayout, w300, tailFormItemLayout } from '@/configs/layout';
import { OptionItem } from '@/types/common-types';
import { Form, TreeSelect, Switch, Radio } from 'antd';
import { getUuid } from '@cfe/util';
import React, { useCallback, useEffect, useState } from 'react';
import { useCallbackOnVisible } from '@/hooks';
import { cloneDeep } from 'lodash';
import {
  ActivitySceneEnum,
  // ActivityStatusEnum,
  ActivityDmpStatusEnum,
  AssetTypeEnum,
  UserGroupTypeEnum,
} from '@/configs/enums/activity';
import UserGroupType from '@/components/user-group-type';
import { validateOrderReductionPreview } from '@/utils/validator';
import update from 'immutability-helper';
import { Match } from '@/api/ump-boss/activity';
import api from '@/api';
import { DetailTypeEnum } from '@/configs/enums';
import OrderReductionPreview from '../components/order-reduction-preview';
import RewardType, { RewardTypeValue } from '../../../components/reward-type';
import StepsAction, {
  StepsFormPropTypes,
} from '../../../components/steps-action';
import { DEFAULTS, GROUP_DEFAULT, SCENE_DEFAULT } from '../utils';
import { matchTypeModel } from '../../../utils/models';
import RewardContent from '../components/reward-content';
import MessageTipsGroup from '../../../components/message-tip-group';
import ScenesGroups from '../../../components/scenes-groups';
import { getEmptyUpgradeMoalItem } from '../components/factor-config';
import AlgoBudgetSelect from '../../../components/algo-budget-select';

type PropTypes = StepsFormPropTypes & {
  carTypeList: OptionItem<string>[];
};

const transformTreeData = (treeParams: any, parent = '') => {
  if (!treeParams) {
    return;
  }
  const cloneData = cloneDeep(treeParams);
  return cloneData.map((item: any) => ({
    key: Number.isNaN(Number(item.key)) ? item.key : Number(item.key),
    value: Number.isNaN(Number(item.key)) ? item.key : Number(item.key),
    title: item.value,
    selectable: !(item.subNode && item.subNode.length),
    children: transformTreeData(item.subNode, item),
    parent,
  }));
};

const LimitOrderReductionStrategy: React.FC<PropTypes> = (props) => {
  const {
    formDetail,
    current,
    setCurrentStep,
    steps,
    forms,
    visible,
    form,
    pageType,
    carTypeList,
    disabledSubmit,
    rawServerData,
  } = props;
  const [matchTypeOpts, setMatchTypeOpts] = useState<OptionItem<string>[]>([]);

  const [disableItems, setDisableItems] = useState({
    targetGroup: true,
    scenesEdit: true,
    groupsEdit: true,
    crowdTagList: true,
    groupRate: true,
    ruleName: true,
    groupName: true,
    rewardTypeAssetType: true,
    rewardTypeActivityType: true,
    rewardContent: true,
    noticeConfig: true,
    rewardStock: true,
    rewardCondition: true,
    interactionOrderReductionPreview: true,
    upgradePageBgImg: true,
    intelAllowance: true,
    disableFlag: true,
    copywriter: true,
  });

  useEffect(() => {
    setDisableItems((prev) => {
      const cloneItems = { ...prev };
      Object.keys(cloneItems).forEach((disableItemKey) => {
        if ([DetailTypeEnum.CREATE, DetailTypeEnum.COPY].includes(pageType)) {
          cloneItems[disableItemKey] = false;
        } else if (DetailTypeEnum.UPDATE.includes(pageType)) {
          // 未启用都可以编辑
          if (
            [
              ActivityDmpStatusEnum.NOT_ACTIVE,
              ActivityDmpStatusEnum.WAIT_APPROVAL,
            ].includes(formDetail?.dmpStatus) &&
            ![
              'scenesEdit',
              'groupsEdit',
              'groupRate',
              'groupName',
              'ruleName',
            ].includes(disableItemKey)
          ) {
            cloneItems[disableItemKey] = false;
          }
          // 未开始、进行中 禁用 部分字段可编辑
          if (
            [
              ActivityDmpStatusEnum.NOT_START,
              ActivityDmpStatusEnum.PROCESSING,
              ActivityDmpStatusEnum.DISABLE,
            ].includes(formDetail?.dmpStatus)
          ) {
            if (
              [
                'crowdTagList',
                'disableFlag',
                'rewardContent',
                'intelAllowance',
                'noticeConfig',
                'copywriter',
                'upgradePageBgImg',
                'rewardCondition',
                // 需求 http://wiki.51caocao.cn/pages/viewpage.action?pageId=81401722
              ].includes(disableItemKey)
            ) {
              cloneItems[disableItemKey] = false;
            }
          }
        } else {
          // 查看全部禁用
          cloneItems[disableItemKey] = true;
        }
      });
      return cloneItems;
    });
  }, [pageType, rawServerData, formDetail]);

  useCallbackOnVisible({
    visible,
    callback: () => {
      const refresh = async () => {
        const data = await api.umpBoss.dmp.basic.conditionTree();
        const matchTypeOpts = transformTreeData(data);
        matchTypeModel.setData(matchTypeOpts);
        setMatchTypeOpts(matchTypeModel.getData());
      };
      refresh();
    },
  });

  const onUserGroupTypeChange = (val: UserGroupTypeEnum) => {
    console.log('onUserGroupTypeChange:', val);

    form.resetFields();
    form.setFieldsValue({
      targetGroup: val,
    });
  };

  const handleRewardTypeChange = useCallback(
    (_ev: string, scenesField: any, groupField: any) => {
      const enableUpgrade = forms.baseInfoForm.getFieldValue([
        'upgradeAwardSwitch',
      ]);
      form.setFields([
        {
          name: [
            'scenes',
            scenesField.name,
            'groups',
            groupField.name,
            'rewardContent',
          ],
          value: [
            {
              groupKey: getUuid(),
              factor: {
                tripFactor: [],
                heatFactor: [],
                couponFactor: [],
                ...(enableUpgrade && {
                  upgradeFactorModels: [getEmptyUpgradeMoalItem()],
                }),
              },
            },
          ],
        },
        {
          name: [
            'scenes',
            scenesField.name,
            'groups',
            groupField.name,
            'rewardCondition',
          ],
          value: [],
        },
      ]);
    },
    [form]
  );

  const memoForConditionMatchTypeOpts = useCallback(
    (scenesField: any, groupField: any) => {
      const rewardType: RewardTypeValue = form.getFieldValue([
        'scenes',
        scenesField.name,
        'groups',
        groupField.name,
        'rewardType',
      ]);

      if (
        rewardType?.assetType === AssetTypeEnum.ORDER_LIMIT_REDUCE_INTEL_SELF
      ) {
        return matchTypeOpts.filter((item) => String(item.value) === '1');
      }

      return matchTypeOpts;
    },
    [matchTypeOpts, form]
  );

  const onValuesChange = (props, changedValues) => {
    console.log('props', props);
  }

  return (
    <Form name='strategyForm' form={form} {...formItemLayout} onValuesChange={onValuesChange}>
      <Form.Item
        name='targetGroup'
        label='策略投放人群'
        rules={[{ required: true }]}
        initialValue={formDetail.targetGroup || DEFAULTS.strategy.targetGroup}
      >
        <UserGroupType
          includeCrowdKeys={[
            UserGroupTypeEnum.ALL,
            UserGroupTypeEnum.SPECIFIED,
          ]}
          onChange={onUserGroupTypeChange}
          disabled={disableItems.targetGroup}
        />
      </Form.Item>
      <Form.Item
        noStyle
        shouldUpdate={(prevValues, curValues) =>
          prevValues.targetGroup !== curValues.targetGroup
        }
      >
        {({ getFieldValue }) => (
          <ScenesGroups
            form={form}
            GROUP_DEFAULT={GROUP_DEFAULT}
            DEFAULTS={DEFAULTS}
            SCENE_DEFAULT={SCENE_DEFAULT}
            formDetail={formDetail}
            targetGroup={getFieldValue('targetGroup')}
            disableItems={disableItems}
          >
            {({ scenesField, groupField }) => (
              <div>
                <h3>奖励策略</h3>
                <Form.Item noStyle shouldUpdate>
                  {({ getFieldValue, setFields }) =>
                    getFieldValue([
                      'scenes',
                      scenesField.name,
                      'groups',
                      groupField.name,
                      'closeFlag',
                    ]) === 1 ? (
                      <>
                        <Form.Item
                          name={[groupField.name, 'disableFlag']}
                          label='禁用策略'
                          rules={[{ required: true }]}
                          valuePropName='checked'
                        >
                          <Switch disabled={disableItems.disableFlag} />
                        </Form.Item>
                        <Form.Item
                          name={[groupField.name, 'rewardType']}
                          label='奖励类型'
                          rules={[{ required: true }]}
                          initialValue={{
                            activityType: ActivitySceneEnum.ORDER_LIMIT_REDUCE,
                            assetType:
                              AssetTypeEnum.ORDER_LIMIT_REDUCE_DISCOUNT,
                          }}
                        >
                          <RewardType
                            className='w600'
                            disabled={[true, disableItems.rewardTypeAssetType]}
                            assetTypeFilter={() => {
                              // 升舱不支持智能C补
                              // if (
                              //   forms.baseInfoForm.getFieldValue([
                              //     'upgradeAwardSwitch',
                              //   ]) &&
                              //   [
                              //     AssetTypeEnum.ORDER_LIMIT_REDUCE_INTEL_SELF,
                              //     AssetTypeEnum.ORDER_LIMIT_REDUCE_INTEL_THIRD,
                              //   ].includes(item.value)
                              // ) {
                              //   return false;
                              // }
                              return true;
                            }}
                            afterAssetsChange={(type) =>
                              handleRewardTypeChange(
                                type,
                                scenesField,
                                groupField
                              )
                            }
                          />
                        </Form.Item>
                        {getFieldValue([
                          'scenes',
                          scenesField.name,
                          'groups',
                          groupField.name,
                          'rewardType',
                        ])?.assetType ===
                          AssetTypeEnum.ORDER_LIMIT_REDUCE_INTEL_SELF && (
                          <Form.Item
                            name={[groupField.name, 'isMulBudget']}
                            label='是否配置多渠道预算'
                            rules={[{ required: true }]}
                          >
                            <Radio.Group
                              onChange={() => {
                                setFields([
                                  {
                                    name: [
                                      'scenes',
                                      scenesField.name,
                                      'groups',
                                      groupField.name,
                                      'algoBudget',
                                    ],
                                    value: {},
                                  },
                                  {
                                    name: [
                                      'scenes',
                                      scenesField.name,
                                      'groups',
                                      groupField.name,
                                      'rewardContent',
                                    ],
                                    value: GROUP_DEFAULT.rewardContent,
                                  },
                                  {
                                    name: [
                                      'scenes',
                                      scenesField.name,
                                      'groups',
                                      groupField.name,
                                      'rewardCondition',
                                    ],
                                    value: GROUP_DEFAULT.rewardCondition,
                                  },
                                ]);
                              }}
                            >
                              <Radio value={1}>是</Radio>
                              <Radio value={2}>否</Radio>
                            </Radio.Group>
                          </Form.Item>
                        )}
                        {/* {
                          getFieldValue([
                            'scenes',
                            scenesField.name,
                            'groups',
                            groupField.name,
                            'isMulBudget',
                          ]) === 2 &&
                        } */}
                        {![
                          // AssetTypeEnum.ORDER_LIMIT_REDUCE_INTEL_SELF,
                          AssetTypeEnum.ORDER_LIMIT_REDUCE_INTEL_THIRD,
                        ].includes(
                          getFieldValue([
                            'scenes',
                            scenesField.name,
                            'groups',
                            groupField.name,
                            'rewardType',
                          ])?.assetType
                        ) &&
                          getFieldValue([
                            'scenes',
                            scenesField.name,
                            'groups',
                            groupField.name,
                            'isMulBudget',
                          ]) === 2 && (
                            <Form.Item
                              name={[groupField.name, 'rewardCondition']}
                              label='发奖条件'
                              rules={[{ required: true }]}
                            >
                              <TreeSelect
                                style={w300}
                                placeholder='请选择发奖条件'
                                allowClear
                                treeData={memoForConditionMatchTypeOpts(
                                  scenesField,
                                  groupField
                                )}
                                multiple
                                disabled={disableItems.rewardCondition}
                                onChange={(v: number[]) => {
                                  const oldVal = getFieldValue([
                                    'scenes',
                                    scenesField.name,
                                    'groups',
                                    groupField.name,
                                    'rewardContent',
                                  ]);
                                  let newVal = [];
                                  const oldConditionListLength =
                                    oldVal[0]?.conditionList?.length || 0;
                                  // 判断是删除发奖条件操作时
                                  if (
                                    oldVal?.length > 0 &&
                                    oldConditionListLength > v.length
                                  ) {
                                    newVal = oldVal?.map((item: any) => {
                                      return update(item, {
                                        conditionList: {
                                          $splice: [
                                            [
                                              item?.conditionList?.findIndex(
                                                (matchItem: Match) =>
                                                  !v.includes(
                                                    matchItem?.matchType
                                                  )
                                              ),
                                              1,
                                            ],
                                          ],
                                        },
                                      });
                                    });
                                    setFields([
                                      {
                                        name: [
                                          'scenes',
                                          scenesField.name,
                                          'groups',
                                          groupField.name,
                                          'rewardContent',
                                        ],
                                        value: newVal,
                                      },
                                    ]);
                                  }
                                }}
                              />
                            </Form.Item>
                          )}
                        {getFieldValue([
                          'scenes',
                          scenesField.name,
                          'groups',
                          groupField.name,
                          'isMulBudget',
                        ]) === 1 && (
                          <Form.Item
                            name={[groupField.name, 'algoBudget']}
                            label='算法预算池'
                          >
                            <AlgoBudgetSelect disabled={false} />
                          </Form.Item>
                        )}
                        {getFieldValue([
                          'scenes',
                          scenesField.name,
                          'groups',
                          groupField.name,
                          'isMulBudget',
                        ]) === 2 && (
                          <Form.Item
                            name={[groupField.name, 'rewardContent']}
                            label=''
                            // rules={[{ required: true }]}
                            labelCol={{ span: 0 }}
                            wrapperCol={{ span: 24 }}
                            initialValue={[
                              {
                                groupKey: getUuid(),
                              },
                            ]}
                          >
                            <RewardContent
                              enableUpgrade={forms.baseInfoForm.getFieldValue([
                                'upgradeAwardSwitch',
                              ])}
                              selectedParticipateCarList={carTypeList.filter(
                                (item: any) =>
                                  forms.baseInfoForm
                                    .getFieldValue(['participateCarTypes'])
                                    ?.includes(item.value)
                              )}
                              matchTypes={getFieldValue([
                                'scenes',
                                scenesField.name,
                                'groups',
                                groupField.name,
                                'rewardCondition',
                              ])}
                              assetType={
                                getFieldValue([
                                  'scenes',
                                  scenesField.name,
                                  'groups',
                                  groupField.name,
                                  'rewardType',
                                ])?.assetType
                              }
                              disabled={disableItems.rewardContent}
                              disabledStock={disableItems.rewardStock}
                              disabledIntelAllowance={
                                disableItems.intelAllowance
                              }
                              max={
                                [
                                  // AssetTypeEnum.ORDER_LIMIT_REDUCE_INTEL_SELF,
                                  AssetTypeEnum.ORDER_LIMIT_REDUCE_INTEL_THIRD,
                                ].includes(
                                  getFieldValue([
                                    'scenes',
                                    scenesField.name,
                                    'groups',
                                    groupField.name,
                                    'rewardType',
                                  ])?.assetType
                                )
                                  ? 1
                                  : Infinity
                              }
                            />
                          </Form.Item>
                        )}

                        <h3>通知策略</h3>

                        <MessageTipsGroup
                          label='发奖通知'
                          fieldKey={[groupField.name, 'noticeConfig']}
                          // getFieldValue和setFieldValue需要完整路径
                          completeFieldKey={[
                            'scenes',
                            scenesField.name,
                            'groups',
                            groupField.name,
                            'noticeConfig',
                          ]}
                          form={form}
                          formItemLayout={formItemLayout}
                          tailFormItemLayout={tailFormItemLayout}
                          disabled={disableItems.noticeConfig}
                        />
                      </>
                    ) : (
                      <h3 style={{ textAlign: 'center' }}>空白组</h3>
                    )
                  }
                </Form.Item>
              </div>
            )}
          </ScenesGroups>
        )}
      </Form.Item>

      {/* 交互策略与活动层同级 */}
      <h3>交互策略</h3>
      <Form.Item
        name={['interaction', 'orderReductionPreview']}
        wrapperCol={{ span: 24 }}
        rules={[
          { required: true },
          {
            validator: (_rules: any, values) =>
              validateOrderReductionPreview(
                values,
                forms.baseInfoForm.getFieldValue(['upgradeAwardSwitch'])
              ),
          },
        ]}
        initialValue={
          formDetail.interaction?.orderReductionPreview ||
          DEFAULTS.strategy.interaction.orderReductionPreview
        }
      >
        <OrderReductionPreview
          disabled={disableItems.interactionOrderReductionPreview}
          enableUpgrade={forms.baseInfoForm.getFieldValue([
            'upgradeAwardSwitch',
          ])}
          disabledUpgradePageBgImg={disableItems.upgradePageBgImg}
          disabledCopywriter={disableItems.copywriter}
        />
      </Form.Item>

      <StepsAction
        disabledSubmit={disabledSubmit}
        current={current}
        setCurrentStep={setCurrentStep}
        steps={steps}
        form={form}
      />
    </Form>
  );
};
export default LimitOrderReductionStrategy;
