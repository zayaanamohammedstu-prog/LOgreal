import React, { useState } from 'react';
import {
  Layout,
  Card,
  Col,
  Row,
  Typography,
  Space,
  Tag,
  List,
  Avatar,
  Statistic,
  Button,
  Divider,
  Badge,
} from 'antd';
import {
  SafetyOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  CloudServerOutlined,
  TeamOutlined,
  ArrowRightOutlined,
  ThunderboltOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Layout/Navbar';
import Sidebar from '../../components/Layout/Sidebar';
import Footer from '../../components/Layout/Footer';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const ACTIVITY_FEED = [
  { id: 1, type: 'info', msg: 'System health check passed', time: '2 min ago', icon: <CheckCircleOutlined />, color: '#52c41a' },
  { id: 2, type: 'warn', msg: 'Anomaly threshold updated', time: '8 min ago', icon: <ThunderboltOutlined />, color: '#f5a623' },
  { id: 3, type: 'info', msg: '1,240 logs processed', time: '12 min ago', icon: <CloudServerOutlined />, color: '#1890ff' },
  { id: 4, type: 'info', msg: 'Daily report generated', time: '1 hr ago', icon: <BarChartOutlined />, color: '#722ed1' },
  { id: 5, type: 'success', msg: 'All services operational', time: '2 hrs ago', icon: <CheckCircleOutlined />, color: '#52c41a' },
];

const PUBLIC_STATS = [
  { title: 'System Uptime', value: 99.97, suffix: '%', color: '#52c41a', icon: <CloudServerOutlined /> },
  { title: 'Logs Today', value: '1.2M', color: '#1890ff', icon: <BarChartOutlined /> },
  { title: 'Anomalies Detected', value: 47, color: '#f5a623', icon: <ThunderboltOutlined /> },
  { title: 'Active Monitors', value: 12, color: '#722ed1', icon: <SafetyOutlined /> },
];

const ViewerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout style={{ minHeight: '100vh', background: '#0a1628' }}>
      <Navbar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <Layout>
        <Sidebar collapsed={collapsed} />
        <Layout>
          <Content style={{ padding: 24, background: '#0a1628' }}>
            {/* Welcome */}
            <div
              style={{
                background: 'linear-gradient(135deg, #0f1f3d 0%, #162447 100%)',
                borderRadius: 16,
                border: '1px solid #1e3a5f',
                padding: '28px 32px',
                marginBottom: 24,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  right: -40,
                  top: -40,
                  width: 200,
                  height: 200,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(245,166,35,0.08) 0%, transparent 70%)',
                }}
              />
              <Tag
                style={{
                  background: 'rgba(82,196,26,0.1)',
                  border: '1px solid rgba(82,196,26,0.3)',
                  color: '#52c41a',
                  marginBottom: 12,
                }}
              >
                <CheckCircleOutlined /> Viewer Access
              </Tag>
              <Title level={3} style={{ color: '#e8eaf6', margin: 0, fontWeight: 700 }}>
                Welcome back, {user?.username || 'User'} 👋
              </Title>
              <Text style={{ color: '#9da8c7' }}>
                Here's a real-time overview of the LogGuard system status.
              </Text>
            </div>

            {/* Stats */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              {PUBLIC_STATS.map((stat) => (
                <Col key={stat.title} xs={24} sm={12} lg={6}>
                  <Card
                    style={{ background: '#0f1f3d', border: '1px solid #1e3a5f', borderRadius: 12 }}
                    bodyStyle={{ padding: '20px 24px' }}
                  >
                    <Space>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          background: `${stat.color}15`,
                          border: `1px solid ${stat.color}30`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: stat.color,
                          fontSize: 20,
                        }}
                      >
                        {stat.icon}
                      </div>
                      <div>
                        <Text style={{ color: '#6b7a9e', fontSize: 12 }}>{stat.title}</Text>
                        <div style={{ color: '#e8eaf6', fontSize: 22, fontWeight: 700, lineHeight: 1.2 }}>
                          {stat.value}
                          {stat.suffix && (
                            <span style={{ fontSize: 14, color: stat.color }}>{stat.suffix}</span>
                          )}
                        </div>
                      </div>
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>

            <Row gutter={[16, 16]}>
              {/* Activity feed */}
              <Col xs={24} lg={14}>
                <Card
                  title={
                    <Space>
                      <ClockCircleOutlined style={{ color: '#f5a623' }} />
                      <Text style={{ color: '#e8eaf6', fontWeight: 600 }}>Recent Activity</Text>
                    </Space>
                  }
                  style={{ background: '#0f1f3d', border: '1px solid #1e3a5f', borderRadius: 12 }}
                  headStyle={{ borderBottom: '1px solid #1e3a5f' }}
                >
                  <List
                    dataSource={ACTIVITY_FEED}
                    renderItem={(item) => (
                      <List.Item style={{ borderBottom: '1px solid #1e3a5f', padding: '12px 0' }}>
                        <Space>
                          <Avatar
                            size={36}
                            style={{ background: `${item.color}15`, color: item.color, fontSize: 16 }}
                            icon={item.icon}
                          />
                          <div>
                            <Text style={{ color: '#e8eaf6' }}>{item.msg}</Text>
                            <div>
                              <Text style={{ color: '#6b7a9e', fontSize: 12 }}>{item.time}</Text>
                            </div>
                          </div>
                        </Space>
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>

              {/* Features */}
              <Col xs={24} lg={10}>
                <Card
                  title={
                    <Space>
                      <SafetyOutlined style={{ color: '#f5a623' }} />
                      <Text style={{ color: '#e8eaf6', fontWeight: 600 }}>Platform Features</Text>
                    </Space>
                  }
                  style={{ background: '#0f1f3d', border: '1px solid #1e3a5f', borderRadius: 12 }}
                  headStyle={{ borderBottom: '1px solid #1e3a5f' }}
                >
                  <Space direction="vertical" style={{ width: '100%' }} size={12}>
                    {[
                      { label: 'AI Anomaly Detection', color: '#f5a623', status: 'Active' },
                      { label: 'Real-Time Streaming', color: '#52c41a', status: 'Active' },
                      { label: 'Threat Intelligence', color: '#1890ff', status: 'Active' },
                      { label: 'RBAC Security', color: '#722ed1', status: 'Active' },
                      { label: 'Automated Reports', color: '#13c2c2', status: 'Active' },
                    ].map((f) => (
                      <div
                        key={f.label}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 14px',
                          background: '#162447',
                          borderRadius: 8,
                        }}
                      >
                        <Space size={8}>
                          <Badge color={f.color} />
                          <Text style={{ color: '#e8eaf6', fontSize: 13 }}>{f.label}</Text>
                        </Space>
                        <Tag
                          style={{
                            background: 'rgba(82,196,26,0.1)',
                            border: '1px solid rgba(82,196,26,0.2)',
                            color: '#52c41a',
                            fontSize: 11,
                          }}
                        >
                          {f.status}
                        </Tag>
                      </div>
                    ))}
                  </Space>
                </Card>
              </Col>
            </Row>
          </Content>
          <Footer />
        </Layout>
      </Layout>
    </Layout>
  );
};

export default ViewerDashboard;
