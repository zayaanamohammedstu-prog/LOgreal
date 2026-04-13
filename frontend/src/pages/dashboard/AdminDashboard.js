import React, { useState, useMemo } from 'react';
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
  Popconfirm,
  Switch,
  Tabs,
  Statistic,
  Badge,
  Tooltip,
  message,
  Modal,
  Form,
} from 'antd';
import {
  TeamOutlined,
  CheckOutlined,
  CloseOutlined,
  SearchOutlined,
  UserOutlined,
  FileTextOutlined,
  DownloadOutlined,
  AuditOutlined,
  BarChartOutlined,
  SettingOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Layout/Navbar';
import Sidebar from '../../components/Layout/Sidebar';
import Footer from '../../components/Layout/Footer';
import AnomalyChart from '../../components/charts/AnomalyChart';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const PENDING_REGS = [
  { key: 1, username: 'alice_sec', email: 'alice@corp.com', role: 'auditor', requested: '2024-01-15 09:12', status: 'pending' },
  { key: 2, username: 'bob_admin', email: 'bob@corp.com', role: 'admin', requested: '2024-01-15 10:45', status: 'pending' },
  { key: 3, username: 'charlie_view', email: 'charlie@corp.com', role: 'auditor', requested: '2024-01-14 14:30', status: 'pending' },
  { key: 4, username: 'diana_ops', email: 'diana@corp.com', role: 'admin', requested: '2024-01-14 16:05', status: 'pending' },
];

const generateUsers = () => {
  const roles = ['viewer', 'auditor', 'admin'];
  return Array.from({ length: 20 }, (_, i) => ({
    key: i,
    id: `USR-${100 + i}`,
    username: `user_${i + 1}`,
    email: `user${i + 1}@example.com`,
    role: roles[i % 3],
    active: i % 5 !== 0,
    last_login: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
    created: new Date(Date.now() - Math.random() * 86400000 * 90).toISOString(),
  }));
};

const USERS = generateUsers();

const generateAuditLogs = () => {
  const actions = ['LOGIN', 'LOGOUT', 'VIEW_ANOMALY', 'GENERATE_REPORT', 'UPDATE_USER', 'APPROVE_USER', 'REJECT_USER'];
  return Array.from({ length: 40 }, (_, i) => ({
    key: i,
    id: `LOG-${2000 + i}`,
    user: `user_${(i % 5) + 1}`,
    action: actions[i % actions.length],
    resource: `/api/${['anomalies', 'reports', 'users'][i % 3]}`,
    ip: `10.0.${Math.floor(i / 10)}.${(i % 254) + 1}`,
    timestamp: new Date(Date.now() - i * 3600000).toISOString(),
    status: i % 10 === 0 ? 'failed' : 'success',
  }));
};

const AUDIT_LOGS = generateAuditLogs();

const ROLE_COLORS = { viewer: '#52c41a', auditor: '#1890ff', admin: '#f5a623', superadmin: '#ff4d4f' };

const AdminDashboard = () => {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [pendingList, setPendingList] = useState(PENDING_REGS);
  const [userSearch, setUserSearch] = useState('');
  const [auditSearch, setAuditSearch] = useState('');
  const [editModal, setEditModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form] = Form.useForm();

  const SYS_STATS = [
    { title: 'Total Users', value: USERS.length, color: '#1890ff', icon: <TeamOutlined /> },
    { title: 'Pending Approvals', value: pendingList.length, color: '#f5a623', icon: <SafetyOutlined /> },
    { title: 'Active Sessions', value: 14, color: '#52c41a', icon: <UserOutlined /> },
    { title: 'Audit Events Today', value: 142, color: '#722ed1', icon: <AuditOutlined /> },
  ];

  const approveUser = (key) => {
    setPendingList((prev) => prev.filter((u) => u.key !== key));
    message.success('User approved successfully');
  };

  const rejectUser = (key) => {
    setPendingList((prev) => prev.filter((u) => u.key !== key));
    message.warning('User registration rejected');
  };

  const filteredUsers = useMemo(() => {
    const s = userSearch.toLowerCase();
    return USERS.filter(
      (u) =>
        u.username.includes(s) || u.email.includes(s) || u.role.includes(s)
    );
  }, [userSearch]);

  const filteredLogs = useMemo(() => {
    const s = auditSearch.toLowerCase();
    return AUDIT_LOGS.filter(
      (l) => l.user.includes(s) || l.action.includes(s) || l.resource.includes(s)
    );
  }, [auditSearch]);

  const pendingColumns = [
    { title: 'Username', dataIndex: 'username', render: (v) => <Text style={{ color: '#e8eaf6' }}>{v}</Text> },
    { title: 'Email', dataIndex: 'email', render: (v) => <Text style={{ color: '#9da8c7' }}>{v}</Text> },
    {
      title: 'Requested Role',
      dataIndex: 'role',
      render: (v) => (
        <Tag style={{ background: `${ROLE_COLORS[v]}15`, borderColor: `${ROLE_COLORS[v]}30`, color: ROLE_COLORS[v], textTransform: 'capitalize' }}>
          {v}
        </Tag>
      ),
    },
    { title: 'Requested', dataIndex: 'requested', render: (v) => <Text style={{ color: '#6b7a9e', fontSize: 12 }}>{v}</Text> },
    {
      title: 'Actions',
      render: (_, record) => (
        <Space>
          <Popconfirm title="Approve this user?" onConfirm={() => approveUser(record.key)} okText="Approve" okButtonProps={{ style: { background: '#52c41a' } }}>
            <Button size="small" icon={<CheckOutlined />} style={{ background: 'rgba(82,196,26,0.1)', borderColor: 'rgba(82,196,26,0.3)', color: '#52c41a' }}>
              Approve
            </Button>
          </Popconfirm>
          <Popconfirm title="Reject this registration?" onConfirm={() => rejectUser(record.key)} okText="Reject" okButtonProps={{ danger: true }}>
            <Button size="small" icon={<CloseOutlined />} danger style={{ background: 'rgba(255,77,79,0.1)', borderColor: 'rgba(255,77,79,0.3)', color: '#ff4d4f' }}>
              Reject
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const userColumns = [
    { title: 'ID', dataIndex: 'id', width: 90, render: (v) => <Text style={{ color: '#6b7a9e', fontFamily: 'monospace', fontSize: 12 }}>{v}</Text> },
    { title: 'Username', dataIndex: 'username', render: (v) => <Text style={{ color: '#e8eaf6' }}>{v}</Text> },
    { title: 'Email', dataIndex: 'email', render: (v) => <Text style={{ color: '#9da8c7' }}>{v}</Text> },
    {
      title: 'Role',
      dataIndex: 'role',
      render: (v) => (
        <Tag style={{ background: `${ROLE_COLORS[v]}15`, borderColor: `${ROLE_COLORS[v]}30`, color: ROLE_COLORS[v], textTransform: 'capitalize' }}>
          {v}
        </Tag>
      ),
    },
    {
      title: 'Active',
      dataIndex: 'active',
      render: (v, record) => (
        <Switch
          checked={v}
          size="small"
          onChange={(checked) => {
            message.success(`User ${checked ? 'activated' : 'deactivated'}`);
          }}
          style={{ background: v ? '#52c41a' : '#1e3a5f' }}
        />
      ),
    },
    { title: 'Last Login', dataIndex: 'last_login', render: (v) => <Text style={{ color: '#6b7a9e', fontSize: 12 }}>{new Date(v).toLocaleDateString()}</Text> },
    {
      title: '',
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit user">
            <Button type="text" size="small" icon={<EditOutlined />} style={{ color: '#1890ff' }}
              onClick={() => { setEditUser(record); setEditModal(true); form.setFieldsValue(record); }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const auditColumns = [
    { title: 'Log ID', dataIndex: 'id', width: 90, render: (v) => <Text style={{ color: '#6b7a9e', fontFamily: 'monospace', fontSize: 12 }}>{v}</Text> },
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
      key: 'pending',
      label: (
        <Space>
          <SafetyOutlined />
          Pending Approvals
          {pendingList.length > 0 && <Badge count={pendingList.length} style={{ background: '#f5a623' }} />}
        </Space>
      ),
      children: (
        <Table
          dataSource={pendingList}
          columns={pendingColumns}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: <Text style={{ color: '#6b7a9e' }}>No pending registrations</Text> }}
        />
      ),
    },
    {
      key: 'users',
      label: <Space><TeamOutlined />User Management</Space>,
      children: (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Input
              placeholder="Search users..."
              prefix={<SearchOutlined style={{ color: '#3a5a80' }} />}
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              style={{ width: 300, background: '#162447', borderColor: '#1e3a5f', color: '#e8eaf6' }}
            />
          </div>
          <Table dataSource={filteredUsers} columns={userColumns} pagination={{ pageSize: 10 }} scroll={{ x: 700 }} />
        </div>
      ),
    },
    {
      key: 'audit',
      label: <Space><AuditOutlined />Audit Logs</Space>,
      children: (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
            <Input
              placeholder="Search audit logs..."
              prefix={<SearchOutlined style={{ color: '#3a5a80' }} />}
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              style={{ width: 300, background: '#162447', borderColor: '#1e3a5f', color: '#e8eaf6' }}
            />
            <Button
              icon={<DownloadOutlined />}
              onClick={() => message.success('Audit log export started...')}
              style={{ color: '#9da8c7', borderColor: '#1e3a5f', background: '#0f1f3d' }}
            >
              Export
            </Button>
          </div>
          <Table dataSource={filteredLogs} columns={auditColumns} pagination={{ pageSize: 10 }} scroll={{ x: 900 }} />
        </div>
      ),
    },
    {
      key: 'reports',
      label: <Space><BarChartOutlined />Reports</Space>,
      children: (
        <div>
          <AnomalyChart title="System Activity — Last 7 Days" height={280} />
          <div style={{ marginTop: 16 }}>
            <Button
              type="primary"
              icon={<FileTextOutlined />}
              onClick={() => message.success('Report generation started...')}
              style={{ background: 'linear-gradient(135deg, #f5a623, #ff6b35)', border: 'none' }}
            >
              Generate Full Report
            </Button>
          </div>
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
            <div style={{ marginBottom: 24 }}>
              <Title level={3} style={{ color: '#e8eaf6', margin: 0, fontWeight: 700 }}>
                Admin Dashboard
              </Title>
              <Text style={{ color: '#9da8c7' }}>Manage users, approvals, and system activity</Text>
            </div>

            {/* Stats */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              {SYS_STATS.map((stat) => (
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
                        <Text style={{ color: '#e8eaf6', fontSize: 26, fontWeight: 700 }}>{stat.value}</Text>
                      </div>
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>

            {/* Main tabs */}
            <Card
              style={{ background: '#0f1f3d', border: '1px solid #1e3a5f', borderRadius: 12 }}
              bodyStyle={{ padding: 0 }}
            >
              <Tabs
                defaultActiveKey="pending"
                items={tabItems}
                style={{ padding: '0 4px' }}
                tabBarStyle={{ padding: '0 20px', borderBottom: '1px solid #1e3a5f', marginBottom: 0 }}
                tabBarExtraContent={
                  <div style={{ padding: '0 4px 0 0' }}>
                    <Button
                      type="primary"
                      size="small"
                      icon={<FileTextOutlined />}
                      onClick={() => message.success('Exporting...')}
                      style={{ background: '#162447', border: '1px solid #1e3a5f', color: '#9da8c7' }}
                    >
                      Export
                    </Button>
                  </div>
                }
              />
            </Card>
          </Content>
          <Footer />
        </Layout>
      </Layout>

      <Modal
        title={<Text style={{ color: '#e8eaf6' }}>Edit User</Text>}
        open={editModal}
        onCancel={() => { setEditModal(false); form.resetFields(); }}
        onOk={() => { message.success('User updated'); setEditModal(false); }}
        styles={{ content: { background: '#0f1f3d', border: '1px solid #1e3a5f' }, header: { background: '#0f1f3d' } }}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="username" label={<Text style={{ color: '#9da8c7' }}>Username</Text>}>
            <Input style={{ background: '#162447', borderColor: '#1e3a5f', color: '#e8eaf6' }} />
          </Form.Item>
          <Form.Item name="role" label={<Text style={{ color: '#9da8c7' }}>Role</Text>}>
            <Select style={{ width: '100%' }}>
              {['viewer', 'auditor', 'admin'].map((r) => (
                <Option key={r} value={r} style={{ textTransform: 'capitalize' }}>{r}</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

// eslint-disable-next-line no-unused-vars

export default AdminDashboard;
