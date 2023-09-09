import React from 'react';
import type { FormInstance as RcFormInstance } from 'rc-field-form';
// import type { FormInstance } from 'antd/lib/form/hooks/useForm';
// eslint-disable-next-line import/no-extraneous-dependencies
import { useForm as useRcForm } from 'rc-field-form';
import { InternalNamePath, NamePath } from 'antd/lib/form/interface';
import { toArray, getFieldId } from 'antd/lib/form/util';
import scrollIntoView from 'scroll-into-view-if-needed';
import { ScrollOptions } from 'antd/lib/form/interface';

export interface FormInstance<Values = any> extends RcFormInstance<Values> {
  scrollToField: (name: NamePath, options?: ScrollOptions) => void;
  /** @internal: This is an internal usage. Do not use in your prod */
  __INTERNAL__: {
    /** No! Do not use this in your code! */
    name?: string;
    /** No! Do not use this in your code! */
    itemRef: (name: InternalNamePath) => (node: React.ReactElement) => void;
  };
  getFieldInstance: (name: NamePath) => any;
}

function toNamePathStr(name: NamePath) {
  const namePath = toArray(name);
  return namePath.join('_');
}

/** Only return partial when type is not any */
declare type RecursivePartial<T> = T extends object ? {
  [P in keyof T]?: T[P] extends (infer U)[] ? RecursivePartial<U>[] : T[P] extends object ? RecursivePartial<T[P]> : T[P];
} : any;

export default function useForm<Values = any>(
  form?: FormInstance<Values>
): [FormInstance<Values>] {
  const [rcForm] = useRcForm();
  const itemsRef = React.useRef<Record<string, React.ReactElement>>({});

  const wrapForm: FormInstance<Values> = React.useMemo(
    () =>
      form ?? {
        ...rcForm,
        setFieldValue: (name: NamePath, value: any) => {
          if (!window.WATCH_FORM_DATA_EXTENSIONS) {
            // TODO 之后这个初始化的工作感觉可以不用重复做了
            window.WATCH_FORM_DATA_EXTENSIONS = {};
          } else {
            window.WATCH_FORM_DATA_EXTENSIONS[`${(form as any).__INTERNALNAME__.name}_changedFields}`] = name;
            window.WATCH_FORM_DATA_EXTENSIONS[`${(form as any).__INTERNALNAME__.name}_changedValue`] = value;
          }
          rcForm.setFieldValue(name, value);
        },
        setFieldsValue: (values: RecursivePartial<Values>) => {
          if (!window.WATCH_FORM_DATA_EXTENSIONS) {
            // TODO 之后这个初始化的工作感觉可以不用重复做了
            window.WATCH_FORM_DATA_EXTENSIONS = {};
          } else {
            window.WATCH_FORM_DATA_EXTENSIONS[`${(form as any).__INTERNALNAME__.name}_changedFields}`] = Object.keys(values);
            window.WATCH_FORM_DATA_EXTENSIONS[`${(form as any).__INTERNALNAME__.name}_changedValue`] = values;
          }
          rcForm.setFieldsValue(values);
        },
        __INTERNAL__: {
          itemRef: (name: InternalNamePath) => (node: React.ReactElement) => {
            const namePathStr = toNamePathStr(name);
            if (node) {
              itemsRef.current[namePathStr] = node;
            } else {
              delete itemsRef.current[namePathStr];
            }
          },
        },
        scrollToField: (name: NamePath, options: ScrollOptions = {}) => {
          const namePath = toArray(name);
          // eslint-disable-next-line no-underscore-dangle
          const fieldId = getFieldId(namePath, wrapForm.__INTERNAL__.name);
          const node: HTMLElement | null = fieldId
            ? document.getElementById(fieldId)
            : null;

          if (node) {
            scrollIntoView(node, {
              scrollMode: 'if-needed',
              block: 'nearest',
              ...options,
            } as any);
          }
        },
        getFieldInstance: (name: NamePath) => {
          const namePathStr = toNamePathStr(name);
          return itemsRef.current[namePathStr];
        },
      },
    [form, rcForm]
  );

  return [wrapForm];
}
