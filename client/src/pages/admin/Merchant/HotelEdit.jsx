import React, { useEffect, useState } from 'react';
import { 
  Form, Input, Button, Card, Row, Col, 
  DatePicker, InputNumber, List, Tag, 
  Space, message, Typography, 
  Layout, Avatar, Dropdown, Tooltip 
} from 'antd';
import { 
  PlusOutlined, DeleteOutlined, SaveOutlined, 
  ReloadOutlined, HomeOutlined, UserOutlined,
  LogoutOutlined, SettingOutlined, ShopOutlined,
  EnvironmentOutlined, ClockCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useApi } from '../../../hooks/useApi';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth.js';
import { logout as logoutAction } from '../../../store/userSlice.js';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

export default function HotelEdit() {
  const api = useApi();
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();

  // --- 状态管理 ---
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [myHotels, setMyHotels] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [currentTime, setCurrentTime] = useState(dayjs().format('YYYY-MM-DD HH:mm'));

  useEffect(() => {
    refreshList();
    const timer = setInterval(() => {
      setCurrentTime(dayjs().format('YYYY-MM-DD HH:mm'));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // --- 业务逻辑 ---
  async function refreshList() {
    setListLoading(true);
    try {
      const res = await api.get('/api/merchant/hotel/list');
      setMyHotels(res.data.items || []);
    } catch (e) {
      message.error('加载列表失败');
    } finally {
      setListLoading(false);
    }
  }

  function handleReset() {
    setSelectedId(null);
    form.resetFields();
    form.setFieldsValue({
      star: 5,
      openTime: dayjs('2020-01-01'),
      roomTypes: [{ name: '标准间', price: 299 }]
    });
  }

  async function handleSelectHotel(id) {
    setLoading(true);
    try {
      const res = await api.get(`/api/merchant/hotel/${id}`);
      const h = res.data.hotel;
      const rooms = res.data.rooms || [];

      setSelectedId(h.id);
      form.setFieldsValue({
        nameZh: h.nameZh,
        nameEn: h.nameEn,
        city: h.city,
        address: h.address,
        star: h.star,
        openTime: h.openTime ? dayjs(h.openTime) : null,
        roomTypes: rooms.length > 0 
          ? rooms.map(r => ({ ...r, price: Number(r.price) })) 
          : [{ name: '标准间', price: 299 }]
      });
    } catch (e) {
      message.error(e.message || '加载详情失败');
    } finally {
      setLoading(false);
    }
  }

  async function onFinish(values) {
    setLoading(true);
    try {
      const payload = {
        ...values,
        openTime: values.openTime ? values.openTime.format('YYYY-MM-DD') : '',
      };

      if (selectedId) {
        await api.put(`/api/merchant/hotel/${selectedId}`, payload);
        message.success('更新成功，已提交审核');
      } else {
        await api.post('/api/merchant/hotel', payload);
        message.success('创建成功，已提交审核');
      }
      
      await refreshList();
      if (!selectedId) handleReset();
      
    } catch (e) {
      message.error(e.message || '保存失败');
    } finally {
      setLoading(false);
    }
  }

  const getStatusTag = (status, reason) => {
    switch (status) {
      case 'Pass': return <Tag color="success">已发布</Tag>;
      case 'Reject': return <Tag color="error" title={reason}>已驳回</Tag>;
      default: return <Tag color="processing">审核中</Tag>;
    }
  };

  // --- 修复点 1：Dropdown 菜单数据结构化 (v5 写法) ---
  const handleMenuClick = ({ key }) => {
    if (key === 'logout') {
      dispatch(logoutAction());
      navigate('/admin/login', { replace: true });
    } else if (key === 'profile') {
      navigate('/admin/profile');
    }
  };

  // 定义菜单项 items 数组
  const userMenuItems = [
    { key: 'profile', label: '个人中心', icon: <UserOutlined /> },
    { type: 'divider' },
    { key: 'logout', label: '退出登录', icon: <LogoutOutlined />, danger: true },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        position: 'sticky', top: 0, zIndex: 1, width: '100%', 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', background: '#001529', boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ 
            width: 32, height: 32, background: '#1890ff', borderRadius: 6, 
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12 
          }}>
            <ShopOutlined style={{ color: '#fff', fontSize: 20 }} />
          </div>
          <div>
            <span style={{ color: '#fff', fontSize: 18, fontWeight: 600, letterSpacing: 1 }}>
              易宿商户中心
            </span>
            <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginLeft: 16, borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 16 }}>
              <ClockCircleOutlined style={{ marginRight: 6 }} />
              {currentTime}
            </span>
          </div>
        </div>

        {/* 修复点 1：使用 menu={{ items }} 替代 overlay */}
        <Dropdown menu={{ items: userMenuItems, onClick: handleMenuClick }} placement="bottomRight" arrow>
          <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '0 12px', transition: 'all 0.3s' }}>
            <Avatar style={{ backgroundColor: '#1890ff', marginRight: 8 }} icon={<UserOutlined />} />
            <span style={{ color: '#fff' }}>{user?.username || 'Account'}</span>
          </div>
        </Dropdown>
      </Header>

      <Content style={{ padding: '24px', background: '#f0f2f5' }}>
        <Row gutter={24}>
          <Col xs={24} md={8} lg={6}>
            <Card 
              title={<Space><ShopOutlined />我的酒店</Space>} 
              extra={<Tooltip title="刷新列表"><Button type="text" icon={<ReloadOutlined />} onClick={refreshList} /></Tooltip>}
              // 修复点 2：bodyStyle 改为 styles.body
              styles={{ body: { padding: 0, height: 'calc(100vh - 180px)', overflowY: 'auto' } }}
              style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)', borderRadius: 8 }}
            >
              <List
                loading={listLoading}
                dataSource={myHotels}
                renderItem={(item) => (
                  <List.Item 
                    onClick={() => handleSelectHotel(item.id)}
                    style={{ 
                      padding: '16px 20px', 
                      cursor: 'pointer',
                      background: selectedId === item.id ? '#e6f7ff' : 'transparent',
                      borderLeft: selectedId === item.id ? '4px solid #1890ff' : '4px solid transparent',
                      transition: 'all 0.3s'
                    }}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar shape="square" size="large" icon={<HomeOutlined />} style={{ backgroundColor: selectedId === item.id ? '#1890ff' : '#ddd' }} />
                      }
                      title={<span style={{ fontWeight: 500, color: selectedId === item.id ? '#1890ff' : '#333' }}>{item.nameZh}</span>}
                      description={
                        <Space direction="vertical" size={2} style={{ width: '100%' }}>
                          <Text type="secondary" ellipsis style={{ fontSize: 12 }}>{item.nameEn}</Text>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                             {getStatusTag(item.status, item.rejectReason)}
                             <Text type="secondary" style={{ fontSize: 12 }}>{item.city}</Text>
                          </div>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
              {myHotels.length === 0 && !listLoading && (
                <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>
                   <EnvironmentOutlined style={{ fontSize: 24, marginBottom: 8, color: '#ccc' }} />
                   <div>暂无酒店数据</div>
                </div>
              )}
            </Card>
          </Col>

          <Col xs={24} md={16} lg={18}>
            <Card style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)', borderRadius: 8, minHeight: 'calc(100vh - 112px)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #f0f0f0' }}>
                <Space align="center">
                   <div style={{ fontSize: 20, color: '#1890ff' }}>
                      {selectedId ? <SettingOutlined /> : <PlusOutlined />}
                   </div>
                   <Title level={4} style={{ margin: 0 }}>
                    {selectedId ? '编辑酒店信息' : '录入新酒店'}
                  </Title>
                </Space>
                
                <Button onClick={handleReset} type={!selectedId ? 'primary' : 'default'} icon={<PlusOutlined />}>
                  新建录入
                </Button>
              </div>

              <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={{ star: 5, roomTypes: [{ name: '标准间', price: 299 }] }}
              >
                <div style={{ background: '#fff', marginBottom: 24 }}>
                  <Text strong style={{ display: 'block', marginBottom: 16, fontSize: 15 }}>
                    <span style={{ borderLeft: '3px solid #1890ff', paddingLeft: 8 }}>基本信息</span>
                  </Text>
                  
                  <Row gutter={24}>
                    <Col span={12}>
                      <Form.Item name="nameZh" label="酒店名 (中文)" rules={[{ required: true, message: '请输入中文名称' }]}>
                        <Input placeholder="例：上海和平饭店" size="large" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="nameEn" label="酒店名 (英文)" rules={[{ required: true, message: '请输入英文名称' }]}>
                        <Input placeholder="Example: Peace Hotel" size="large" />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="city" label="所在城市" rules={[{ required: true, message: '请输入城市' }]}>
                        <Input prefix={<EnvironmentOutlined style={{color:'#ccc'}} />} placeholder="例：上海" />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="star" label="酒店星级" rules={[{ required: true, message: '请输入星级' }]}>
                        <InputNumber min={1} max={5} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="openTime" label="开业时间" rules={[{ required: true, message: '请选择开业时间' }]}>
                        <DatePicker style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item name="address" label="详细地址" rules={[{ required: true, message: '请输入详细地址' }]}>
                        <Input.TextArea rows={2} placeholder="请输入详细街道地址" showCount maxLength={100} />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>

                <div style={{ background: '#fff' }}>
                  <Text strong style={{ display: 'block', marginBottom: 16, fontSize: 15 }}>
                    <span style={{ borderLeft: '3px solid #1890ff', paddingLeft: 8 }}>房型管理</span>
                    <Text type="secondary" style={{ fontWeight: 'normal', fontSize: 12, marginLeft: 8 }}>(至少添加一种房型)</Text>
                  </Text>

                  <Form.List 
                    name="roomTypes"
                    rules={[{ validator: async (_, names) => {
                        if (!names || names.length < 1) return Promise.reject(new Error('至少需要添加一个房型'));
                    }}]}
                  >
                    {(fields, { add, remove }, { errors }) => (
                      <div style={{ background: '#fafafa', padding: 20, borderRadius: 8, border: '1px dashed #d9d9d9' }}>
                        {fields.map(({ key, name, ...restField }, index) => (
                          <Row key={key} gutter={16} align="middle" style={{ marginBottom: 12 }}>
                            <Col span={10}>
                              <Form.Item
                                {...restField}
                                name={[name, 'name']}
                                label={index === 0 ? "房型名称" : ""}
                                rules={[{ required: true, message: '必填' }]}
                                style={{ marginBottom: 0 }}
                              >
                                <Input placeholder="例：豪华大床房" />
                              </Form.Item>
                            </Col>
                            <Col span={8}>
                              <Form.Item
                                {...restField}
                                name={[name, 'price']}
                                label={index === 0 ? "价格 (元)" : ""}
                                rules={[{ required: true, message: '必填' }]}
                                style={{ marginBottom: 0 }}
                              >
                                <InputNumber min={0} prefix="￥" style={{ width: '100%' }} placeholder="299" />
                              </Form.Item>
                            </Col>
                            <Col span={4}>
                               <Button 
                                 type="text" danger icon={<DeleteOutlined />} 
                                 onClick={() => remove(name)}
                                 style={{ marginTop: index === 0 ? 30 : 0 }}
                               >
                                 删除
                               </Button>
                            </Col>
                          </Row>
                        ))}
                        <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} style={{ marginTop: 12 }}>
                          添加房型
                        </Button>
                        <Form.ErrorList errors={errors} />
                      </div>
                    )}
                  </Form.List>

                  <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid #f0f0f0', textAlign: 'right' }}>
                    <Space size="middle">
                       {selectedId && <Button onClick={handleReset} size="large">取消编辑</Button>}
                       <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading} size="large">
                         {selectedId ? '保存修改' : '立即创建'}
                       </Button>
                    </Space>
                  </div>
                </div>
              </Form>
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
}