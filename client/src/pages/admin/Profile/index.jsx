import React, { useEffect, useState } from 'react';
import { Card, Form, Input, Button, Space, message, Typography } from 'antd';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../../hooks/useApi.js';
import { useAuth } from '../../../hooks/useAuth.js';
import { setUser, logout as logoutAction } from '../../../store/userSlice.js';

const { Title, Text } = Typography;

export default function Profile() {
  const api = useApi();
  const { user } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [profileForm] = Form.useForm();
  const [pwdForm] = Form.useForm();

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPwd, setLoadingPwd] = useState(false);

  useEffect(() => {
    if (user?.username) {
      profileForm.setFieldsValue({ username: user.username });
    }
  }, [profileForm, user?.username]);

  async function onSaveProfile(values) {
    setLoadingProfile(true);
    try {
      const res = await api.put('/api/auth/profile', { username: values.username });
      dispatch(setUser(res.data.user));
      message.success('已保存');
    } catch (e) {
      message.error(e.message || '保存失败');
    } finally {
      setLoadingProfile(false);
    }
  }

  async function onChangePassword(values) {
    setLoadingPwd(true);
    try {
      await api.put('/api/auth/password', {
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
      pwdForm.resetFields();
      message.success('密码已修改，请重新登录');
      dispatch(logoutAction());
      navigate('/admin/login', { replace: true });
    } catch (e) {
      message.error(e.message || '修改失败');
    } finally {
      setLoadingPwd(false);
    }
  }

  function onBack() {
    if (user?.role === 'admin') navigate('/admin/audit');
    else navigate('/admin/merchant/hotel-edit');
  }

  return (
    <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Card>
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Title level={4} style={{ margin: 0 }}>个人中心</Title>
            <Text type="secondary">账号：{user?.username || '-'}</Text>
            <Text type="secondary">角色：{user?.role || '-'}</Text>
          </Space>
        </Card>

        <Card title="修改用户名">
          <Form
            form={profileForm}
            layout="vertical"
            onFinish={onSaveProfile}
          >
            <Form.Item
              name="username"
              label="用户名"
              rules={[{ required: true, message: '请输入用户名' }, { min: 3, message: '至少 3 个字符' }]}
            >
              <Input placeholder="请输入新的用户名" />
            </Form.Item>

            <Space>
              <Button onClick={onBack}>返回</Button>
              <Button type="primary" htmlType="submit" loading={loadingProfile}>保存</Button>
            </Space>
          </Form>
        </Card>

        <Card title="修改密码">
          <Form
            form={pwdForm}
            layout="vertical"
            onFinish={onChangePassword}
          >
            <Form.Item
              name="oldPassword"
              label="旧密码"
              rules={[{ required: true, message: '请输入旧密码' }]}
            >
              <Input.Password placeholder="请输入旧密码" />
            </Form.Item>

            <Form.Item
              name="newPassword"
              label="新密码"
              rules={[{ required: true, message: '请输入新密码' }, { min: 6, message: '至少 6 位' }]}
            >
              <Input.Password placeholder="请输入新密码" />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="确认新密码"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: '请确认新密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                    return Promise.reject(new Error('两次输入的新密码不一致'));
                  },
                }),
              ]}
            >
              <Input.Password placeholder="再次输入新密码" />
            </Form.Item>

            <Button danger type="primary" htmlType="submit" loading={loadingPwd}>
              修改密码并重新登录
            </Button>
          </Form>
        </Card>
      </Space>
    </div>
  );
}
