import React from 'react';
import { Button, Form } from 'antd';
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface TestProps {
  // className?: string;
}

const Test = () => {
  const [form] = Form.useForm();

  return (
    <Form
      form={form}
      name='form-hooks'
      style={{
        position: 'relative',
        left: '50%',
        marginTop: '20%',
      }}
    />
  );
};

export default Test;
