import React, { useEffect } from 'react';
import { Form as AntdForm } from 'antd';
import type { FormProps } from 'antd';
// 灵魂依赖，不过可以忽略
// eslint-disable-next-line import/no-extraneous-dependencies
import { FieldData } from 'rc-field-form/lib/interface';
import { useForm, useWatch } from 'antd/lib/form/Form';
import useFormInstance from 'antd/lib/form/hooks/useFormInstance';
import Item from 'antd/lib/form/FormItem';
import List from 'antd/lib/form/FormList';
import ErrorList from 'antd/lib/form/ErrorList';
import { FormProvider } from 'antd/lib/form/context';
import useInternalUseForm from './useForm';

type IFormProps = FormProps & {
  name: string;
};

// step1: 劫持onValuesChange事件，监听组件交互后的数据变化
// step2: 劫持setFieldValue,setFildsValue，监听js改变的数据
// step3: 获取Form的初始化数据给到 window.WATCH_FORM_DATA_EXTENSIONS
const InternalForm: React.FunctionComponent<IFormProps> = (props) => {
  const { children, form, onValuesChange, ...resetProps } = props;

  useEffect(() => {
    window.WATCH_FORM_DATA_EXTENSIONS = {};
    const intialValue = form?.getFieldsValue();
    window.WATCH_FORM_DATA_EXTENSIONS[`${props.name}`] = intialValue;
  }, [form]);

  const innerOnValuesChange = (
    changedFields: FieldData[],
    values: FieldData[]
  ) => {
    window.WATCH_FORM_DATA_EXTENSIONS[`${props.name}_changedFields}`] =
      changedFields;
    window.WATCH_FORM_DATA_EXTENSIONS[`${props.name}`] = values;
    onValuesChange && onValuesChange(changedFields, values);
  };

  return (
    <AntdForm onValuesChange={innerOnValuesChange} form={form} {...resetProps}>
      {children as React.ReactNode}
    </AntdForm>
  );
};

type InternalFormType = typeof InternalForm;

type CompoundedComponent = InternalFormType & {
  useForm: typeof useForm;
  useFormInstance: typeof useFormInstance;
  useWatch: typeof useWatch;
  Item: typeof Item;
  List: typeof List;
  ErrorList: typeof ErrorList;
  Provider: typeof FormProvider;

  /** @deprecated Only for warning usage. Do not use. */
  create: () => void;
};

const Form = InternalForm as CompoundedComponent;

Form.Item = AntdForm.Item;
Form.List = AntdForm.List;
Form.ErrorList = AntdForm.ErrorList;
Form.useForm = useInternalUseForm;
Form.useFormInstance = AntdForm.useFormInstance;
Form.useWatch = AntdForm.useWatch;
Form.Provider = AntdForm.Provider;
Form.create = () => {
  console.error(
    'Form',
    'antd v4 removed `Form.create`. Please remove or use `@ant-design/compatible` instead.'
  );
};

export default Form;
