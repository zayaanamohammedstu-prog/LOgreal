import React, { useState } from 'react';
import {
  Layout,
  Card,
  Col,
  Row,
  Typography,
  Space,
  Tag,
  Table,
  Button,
  Select,
  Input,
  Switch,
  Tabs,
  Progress,
  Divider,
  Alert,
  Popconfirm,
  message,
  Modal,
  Form,
  Slider,
  Badge,
  Tooltip,
} from 'antd';
import {
  CrownOutlined,
  TeamOutlined,
  SafetyOutlined,
  BarChartOutlined,
  SettingOutlined,
  DeleteOutlined,
  DownloadOutlined,
  CloudServerOutlined,
  AlertOutlined,
  AuditOutlined,
  ThunderboltOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  EditOutlined,
  ReloadOutlined,
  FileTextOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Layout/Navbar';
import Sidebar from '../../components/Layout/Sidebar';
import Footer from '../../components/Layout/Footer';
import AnomalyChart from '../../components/charts/AnomalyChart';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const ROLE_COLORS = {
  viewer: '#52c41a',
  auditor: '#1890ff',
  admin: '#f5a623',
  superadmin: '#ff4d4f',
};

const HEALTH_METRICS = [
  { name: 'API Server', status: 'healthy', uptime: 99.99, latency: 12, load: 32 },
  { name: 'Database', status: 'healthy', uptime: 99.95, latency: 3, load: 45 },
  { name: 'Log Ingestor', status: 'healthy', uptime: 99.98, latency: 8, load: 67 },
  { name: 'ML Engine', status: 'healthy', uptime: 99.87, latency: 45, load: 78 },
  { name: 'WebSocket Server', status: 'warning', uptime: 98.5, latency: 120, load: 89 },
  { name: 'Email Service', status: 'healthy', uptime: 99.90, latency: 200, load: 20 },
];

const generateAllUsers = () => {
  const roles = ['viewer', 'auditor', 'admin', 'superadmin'];
  return Array.from({ length: 30 }, (_, i) => ({
    key: i,
    id: `USR-${100 + i}`,
    username: `user_${i + 1}`,
    email: `user${i + 1}@example.com`,
    role: i === 0 ? 'superadmin' : roles[i % 4],
    active: i % 7 !== 0,
    mfa_enabled: i % 3 === 0,
    last_login: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
  }));
};

const ALL_USERS = generateAllUsers();

const generateAuditLogs = () => {
  const actions = ['LOGIN', 'LOGOUT', 'DELETE_USER', 'SYSTEM_CONFIG', 'EXPORT_DATA', 'APPROVE_USER', 'SYSTEM_RESET_ATTEMPT'];
  return Array.from({ length: 60 }, (_, i) => ({
    key: i,
    id: `SLOG-${3000 + i}`,
    user: `user_${(i % 8) + 1}`,
    action: actions[i % actions.length],
    resource: `/api/${['system', 'users', 'config', 'export'][i % 4]}`,
    ip: `10.${Math.floor(i / 20)}.${Math.floor(i / 5)}.${(i % 254) + 1}`,
    timestamp: new Date(Date.now() - i * 1800000).toISOString(),
    status: i % 12 === 0 ? 'failed' : 'success',
  }));
};

const AUDIT_LOGS = generateAuditLogs();

const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [logSearch, setLogSearch] = useState('');
  const [dangerModal, setDangerModal] = useState(false);
  const [dangerAction, setDangerAction] = useState('');
  const [configForm] = Form.useForm();

  const TOP_STATS = [
    { title: 'Total Users', value: ALL_USERS.length, color: '#1890ff', icon: <TeamOutlined /> },
    { title: 'System Health', value: '98.7', suffix: '%', color: '#52c41a', icon: <CloudServerOutlined /> },
    { title: 'Active Threats', value: 3, color: '#ff4d4f', icon: <AlertOutlined /> },
    { title: 'Total Logs (24h)', value: '1.2M', color: '#722ed1', icon: <DatabaseOutlined /> },
  ];

  const filteredUsers = ALL_USERS.filter((u) => {
    const s = userSearch.toLowerCase();
    return u.username.includes(s) || u.email.includes(s) || u.role.includes(s);
  });

  const filteredLogs = AUDIT_LOGS.filter((l) => {
    const s = logSearch.toLowerCase();
    return l.user.includes(s) || l.action.includes(s) || l.resource.includes(s);
  });

  const userColumns = [
    { title: 'ID', dataIndex: 'id', width: 90, render: (v) => <Text style={{ color: '#6b7a9e', fontFamily: 'monospace', fontSize: 12 }}>{v}</Text> },
    { title: 'Username', dataIndex: 'username', render: (v) => <Text style={{ color: '#e8eaf6' }}>{v}</Text> },
    { title: 'Email', dataIndex: 'email', render: (v) => <Text style={{ color: '#9da8c7' }}>{v}</Text> },
    {
      title: 'Role',
      dataIndex: 'role',
      render: (v, record) => {
        const color = ROLE_COLORS[v] || '#9da8c7';
        return (
          <Select
            value={v}
            size="small"
            style={{ width: 120 }}
            onChange={(newRole) => message.success(`Role changed to ${newRole}`)}
          >
            {Object.keys(ROLE_COLORS).map((r) => (
              <Option key={r} value={r}>
                <span style={{ color: ROLE_COLORS[r], textTransform: 'capitalize' }}>{r}</span>
              </Option>
            ))}
          </Select>
        );
      },
    },
    {
      title: 'MFA',
      dataIndex: 'mfa_enabled',
      render: (v) => (
        <Tag style={{ background: v ? 'rgba(82,196,26,0.1)' : 'rgba(255,77,79,0.1)', borderColor: v ? 'rgba(82,196,26,0.3)' : 'rgba(255,77,79,0.3)', color: v ? '#52c41a' : '#ff4d4f' }}>
          {v ? 'Enabled' : 'Disabled'}
        </Tag>
      ),
    },
    {
      title: 'Active',
      dataIndex: 'active',
      render: (v) => (
        <Switch checked={v} size="small" onChange={() => message.success('User status updated')} style={{ background: v ? '#52c41a' : '#1e3a5f' }} />
      ),
    },
    { title: 'Last Login', dataIndex: 'last_login', render: (v) => <Text style={{ color: '#6b7a9e', fontSize: 12 }}>{new Date(v).toLocaleDateString()}</Text> },
    {
      title: '',
      render: (_, record) => (
        <Popconfirm title="Permanently delete this user?" onConfirm={() => message.warning('User deleted')} okButtonProps={{ danger: true }}>
          <Button type="text" size="small" icon={<DeleteOutlined />} danger />
        </Popconfirm>
      ),
    },
  ];

  const auditColumns = [
    { title: 'Log ID', dataIndex: 'id', width: 100, render: (v) => <Text style={{ color: '#6b7a9e', fontFamily: 'monospace', fontSize: 12 }}>{v}</Text> },
    { title: 'User', dataIndex: 'user', render: (v) => <Text style={{ color: '#e8eaf6' }}>{v}</Text> },
    { title: 'Action', dataIndex: 'action', render: (v) => <Tag style={{ background: '#162447', borderColor: '#1e3a5f', color: '#1890ff', fontFamily: 'monospace' }}>{v}</Tag> },
    { title: 'Resource', dataIndex: 'resource', render: (v) => <Text style={{ color: '#9da8c7', fontFamily: 'monospace', fontSize: 12 }}>{v}</Text> },
    { title: 'IP', dataIndex: 'ip', render: (v) => <Text style={{ color: '#9da8c7', fontFamily: 'monospace', fontSize: 12 }}>{v}</Text> },
    { title: 'Time', dataIndex: 'timestamp', render: (v) => <Text style={{ color: '#6b7a9e', fontSize: 12 }}>{new Date(v).toLocaleString()}</Text> },
    {
      title: 'Status', dataIndex: 'status', render: (v) => (
        <Tag style={{ background: v === 'success' ? 'rgba(82,196,26,0.1)' : 'rgba(255,77,79,0.1)', borderColor: v === 'success' ? 'rgba(82,196,26,0.3)' : 'rgba(255,77,79,0.3)', color: v === 'success' ? '#52c41a' : '#ff4d4f' }}>
          {v}
        </Tag>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'health',
      label: <Space><CloudServerOutlined />System Health</Space>,
      children: (
        <div>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            {HEALTH_METRICS.map((m) => (
              <Col key={m.name} xs={24} sm={12} lg={8}>
                <Card style={{ background: '#162447', border: '1px solid #1e3a5f', borderRadius: 8 }} bodyStyle={{ padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ color: '#e8eaf6', fontWeight: 600 }}>{m.name}</Text>
                    <Tag style={{
                      background: m.status === 'healthy' ? 'rgba(82,196,26,0.1)' : 'rgba(245,166,35,0.1)',
                      borderColor: m.status === 'healthy' ? 'rgba(82,196,26,0.3)' : 'rgba(245,166,35,0.3)',
                      color: m.status === 'healthy' ? '#52c41a' : '#f5a623',
                    }}>{m.status}</Tag>
                  </div>
                  <Row gutter={8}>
                    <Col span={8}><Text style={{ color: '#6b7a9e', fontSize: 11 }}>Uptime</Text><div style={{ color: '#52c41a', fontWeight: 700 }}>{m.uptime}%</div></Col>
                    <Col span={8}><Text style={{ color: '#6b7a9e', fontSize: 11 }}>Latency</Text><div style={{ color: '#1890ff', fontWeight: 700 }}>{m.latency}ms</div></Col>
                    <Col span={8}><Text style={{ color: '#6b7a9e', fontSize: 11 }}>Load</Text><div style={{ color: m.load > 80 ? '#ff4d4f' : '#f5a623', fontWeight: 700 }}>{m.load}%</div></Col>
                  </Row>
                  <Progress
                    percent={m.load}
                    size="small"
                    showInfo={false}
                    strokeColor={m.load > 80 ? '#ff4d4f' : m.load > 60 ? '#f5a623' : '#52c41a'}
                    trailColor="#1e3a5f"
                    style={{ marginTop: 8 }}
                  />
                </Card>
              </Col>
            ))}
          </Row>
          <AnomalyChart title="System Load — Last 24 Hours" height={240} />
        </div>
      ),
    },
    {
      key: 'users',
      label: <Space><TeamOutlined />All Users</Space>,
      children: (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
            <Input
              placeholder="Search all users..."
              prefix={<SafetyOutlined style={{ color: '#3a5a80' }} />}
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              style={{ width: 300, background: '#162447', borderColor: '#1e3a5f', color: '#e8eaf6' }}
            />
            <Button
              icon={<DownloadOutlined />}
              onClick={() => message.success('User export started...')}
              style={{ color: '#9da8c7', borderColor: '#1e3a5f', background: 'transparent' }}
            >
              Export
            </Button>
          </div>
          <Table dataSource={filteredUsers} columns={userColumns} pagination={{ pageSize: 10 }} scroll={{ x: 900 }} />
        </div>
      ),
    },
    {
      key: 'audit',
      label: <Space><AuditOutlined />Full Audit Log</Space>,
      children: (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
            <Input
              placeholder="Search audit logs..."
              prefix={<SafetyOutlined style={{ color: '#3a5a80' }} />}
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
              style={{ width: 300, background: '#162447', borderColor: '#1e3a5f', color: '#e8eaf6' }}
            />
            <Button
              icon={<DownloadOutlined />}
              onClick={() => message.success('Audit log export started...')}
              style={{ color: '#9da8c7', borderColor: '#1e3a5f', background: 'transparent' }}
            >
              Export CSV
            </Button>
          </div>
          <Table dataSource={filteredLogs} columns={auditColumns} pagination={{ pageSize: 10 }} scroll={{ x: 1000 }} />
        </div>
      ),
    },
    {
      key: 'config',
      label: <Space><SettingOutlined />Configuration</Space>,
      children: (
        <Form form={configForm} layout="vertical">
          <Row gutter={[24, 0]}>
            <Col xs={24} md={12}>
              <Form.Item label={<Text style={{ color: '#9da8c7' }}>Anomaly Detection Sensitivity</Text>} name="sensitivity" initialValue={75}>
                <Slider min={0} max={100} trackStyle={{ background: '#f5a623' }} handleStyle={{ borderColor: '#f5a623' }} />
              </Form.Item>
              <Form.Item label={<Text style={{ color: '#9da8c7' }}>Max Login Attempts</Text>} name="maxLogins" initialValue={5}>
                <Input type="number" min={1} max={20} style={{ background: '#162447', borderColor: '#1e3a5f', color: '#e8eaf6' }} />
              </Form.Item>
              <Form.Item label={<Text style={{ color: '#9da8c7' }}>Session Timeout (minutes)</Text>} name="sessionTimeout" initialValue={60}>
                <Input type="number" min={5} max={480} style={{ background: '#162447', borderColor: '#1e3a5f', color: '#e8eaf6' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label={<Text style={{ color: '#9da8c7' }}>Require MFA for All Users</Text>} name="requireMfa" valuePropName="checked" initialValue={false}>
                <Switch style={{ background: '#162447' }} />
              </Form.Item>
              <Form.Item label={<Text style={{ color: '#9da8c7' }}>Real-Time Alerts</Text>} name="realtimeAlerts" valuePropName="checked" initialValue={true}>
                <Switch style={{ background: '#52c41a' }} defaultChecked />
              </Form.Item>
              <Form.Item label={<Text style={{ color: '#9da8c7' }}>Auto-Block Threshold (score)</Text>} name="autoBlock" initialValue={95}>
                <Slider min={50} max={100} trackStyle={{ background: '#ff4d4f' }} handleStyle={{ borderColor: '#ff4d4f' }} />
              </Form.Item>
            </Col>
          </Row>
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => message.success('Configuration saved')}
            style={{ background: 'linear-gradient(135deg, #f5a623, #ff6b35)', border: 'none' }}
          >
            Save Configuration
          </Button>
        </Form>
      ),
    },
    {
      key: 'danger',
      label: <Space><WarningOutlined style={{ color: '#ff4d4f' }} /><span style={{ color: '#ff4d4f' }}>Danger Zone</span></Space>,
      children: (
        <div>
          <Alert
            message="Danger Zone — Irreversible Actions"
            description="The actions below are permanent and cannot be undone. Proceed with extreme caution."
            type="error"
            showIcon
            style={{ marginBottom: 24, background: 'rgba(255,77,79,0.1)', borderColor: 'rgba(255,77,79,0.3)' }}
          />
          <Space direction="vertical" style={{ width: '100%' }} size={12}>
            {[
              { label: 'Export All Data', desc: 'Download a full export of all system data, logs, and user information.', action: 'export', btnLabel: 'Export All Data', color: '#f5a623' },
              { label: 'Clear All Anomaly Logs', desc: 'Permanently delete all anomaly event records from the database.', action: 'clear_logs', btnLabel: 'Clear Logs', color: '#ff7a45' },
              { label: 'Reset System Settings', desc: 'Restore all system configuration to factory defaults.', action: 'reset_config', btnLabel: 'Reset Settings', color: '#ff4d4f' },
              { label: 'System Factory Reset', desc: 'Wipe all data and return the system to initial state. CANNOT BE UNDONE.', action: 'factory_reset', btnLabel: 'Factory Reset', color: '#ff4d4f' },
            ].map((item) => (
              <div
                key={item.action}
                style={{
                  padding: '16px 20px',
                  background: '#162447',
                  border: '1px solid #1e3a5f',
                  borderRadius: 8,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div>
                  <Text strong style={{ color: '#e8eaf6', display: 'block' }}>{item.label}</Text>
                  <Text style={{ color: '#9da8c7', fontSize: 13 }}>{item.desc}</Text>
                </div>
                <Button
                  danger={item.color === '#ff4d4f'}
                  onClick={() => {
                    setDangerAction(item.action);
                    setDangerModal(true);
                  }}
                  style={item.color !== '#ff4d4f' ? { borderColor: item.color, color: item.color, background: `${item.color}10` } : {}}
                >
                  {item.btnLabel}
                </Button>
              </div>
            ))}
          </Space>
        </div>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#0a1628' }}>
      <Navbar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <Layout>
        <Sidebar collapsed={collapsed} />
        <Layout>
          <Content style={{ padding: 24, background: '#0a1628' }}>
            {/* Header */}
            <div
              style={{
                background: 'linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 100%)',
                borderRadius: 16,
                border: '1px solid rgba(255,77,79,0.2)',
                padding: '24px 32px',
                marginBottom: 24,
              }}
            >
              <Space>
                <CrownOutlined style={{ color: '#ff4d4f', fontSize: 28 }} />
                <div>
                  <Title level={3} style={{ color: '#e8eaf6', margin: 0, fontWeight: 700 }}>
                    Super Admin Console
                  </Title>
                  <Text style={{ color: '#9da8c7' }}>
                    Full system access — {user?.username}
                  </Text>
                </div>
              </Space>
            </div>

            {/* Stats */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              {TOP_STATS.map((stat) => (
                <Col key={stat.title} xs={24} sm={12} lg={6}>
                  <Card
                    style={{ background: '#0f1f3d', border: '1px solid #1e3a5f', borderRadius: 12 }}
                    bodyStyle={{ padding: '20px 24px' }}
                  >
                    <Space>
                      <div
                        style={{
                          width: 44, height: 44, borderRadius: 12,
                          background: `${stat.color}15`, border: `1px solid ${stat.color}30`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: stat.color, fontSize: 20,
                        }}
                      >
                        {stat.icon}
                      </div>
                      <div>
                        <Text style={{ color: '#6b7a9e', fontSize: 12, display: 'block' }}>{stat.title}</Text>
                        <Text style={{ color: '#e8eaf6', fontSize: 24, fontWeight: 700 }}>
                          {stat.value}{stat.suffix}
                        </Text>
                      </div>
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>

            {/* Tabs */}
            <Card
              style={{ background: '#0f1f3d', border: '1px solid #1e3a5f', borderRadius: 12 }}
              bodyStyle={{ padding: 0 }}
            >
              <Tabs
                defaultActiveKey="health"
                items={tabItems}
                tabBarStyle={{ padding: '0 20px', borderBottom: '1px solid #1e3a5f', marginBottom: 0 }}
              />
            </Card>
          </Content>
          <Footer />
        </Layout>
      </Layout>

      <Modal
        title={<Text style={{ color: '#ff4d4f' }}><WarningOutlined /> Confirm Dangerous Action</Text>}
        open={dangerModal}
        onCancel={() => setDangerModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setDangerModal(false)}>Cancel</Button>,
          <Button
            key="confirm"
            danger
            onClick={() => {
              message.warning(`Action "${dangerAction}" executed`);
              setDangerModal(false);
            }}
          >
            Confirm
          </Button>,
        ]}
        styles={{ content: { background: '#0f1f3d', border: '1px solid rgba(255,77,79,0.3)' }, header: { background: '#0f1f3d' } }}
      >
        <Alert
          message="This action is irreversible"
          description="Are you absolutely sure you want to proceed? This cannot be undone."
          type="error"
          showIcon
          style={{ background: 'rgba(255,77,79,0.1)', borderColor: 'rgba(255,77,79,0.3)' }}
        />
      </Modal>
    </Layout>
  );
};

export default SuperAdminDashboard;
