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
  DatePicker,
  Input,
  Drawer,
  Form,
  Badge,
  Tooltip,
  message,
} from 'antd';
import {
  AlertOutlined,
  FilterOutlined,
  FileTextOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DownloadOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Layout/Navbar';
import Sidebar from '../../components/Layout/Sidebar';
import Footer from '../../components/Layout/Footer';
import AnomalyChart from '../../components/charts/AnomalyChart';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const SEVERITY_CONFIG = {
  critical: { color: '#ff4d4f', bg: 'rgba(255,77,79,0.1)', border: 'rgba(255,77,79,0.3)', icon: <AlertOutlined /> },
  high: { color: '#ff7a45', bg: 'rgba(255,122,69,0.1)', border: 'rgba(255,122,69,0.3)', icon: <WarningOutlined /> },
  warning: { color: '#f5a623', bg: 'rgba(245,166,35,0.1)', border: 'rgba(245,166,35,0.3)', icon: <WarningOutlined /> },
  normal: { color: '#52c41a', bg: 'rgba(82,196,26,0.1)', border: 'rgba(82,196,26,0.3)', icon: <CheckCircleOutlined /> },
  info: { color: '#1890ff', bg: 'rgba(24,144,255,0.1)', border: 'rgba(24,144,255,0.3)', icon: <InfoCircleOutlined /> },
};

const generateAnomalies = () => {
  const types = ['SQL Injection', 'Brute Force', 'Port Scan', 'XSS Attempt', 'DDoS', 'Data Exfiltration', 'Privilege Escalation'];
  const severities = ['critical', 'high', 'warning', 'normal'];
  const statuses = ['Open', 'Investigating', 'Resolved', 'False Positive'];
  return Array.from({ length: 50 }, (_, i) => ({
    key: i,
    id: `EVT-${1000 + i}`,
    timestamp: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
    source_ip: `192.168.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 254) + 1}`,
    type: types[Math.floor(Math.random() * types.length)],
    severity: severities[Math.floor(Math.random() * severities.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    score: (Math.random() * 100).toFixed(1),
  }));
};

const ANOMALIES = generateAnomalies();

const AuditorDashboard = () => {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [filterDrawer, setFilterDrawer] = useState(false);
  const [noteDrawer, setNoteDrawer] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [filters, setFilters] = useState({ severity: [], status: '', search: '' });
  const [noteForm] = Form.useForm();

  const STAT_CARDS = useMemo(() => [
    {
      title: 'Total Anomalies',
      value: ANOMALIES.length,
      color: '#1890ff',
      icon: <ThunderboltOutlined />,
      change: '+12%',
    },
    {
      title: 'Critical',
      value: ANOMALIES.filter((a) => a.severity === 'critical').length,
      color: '#ff4d4f',
      icon: <AlertOutlined />,
      change: '+3',
    },
    {
      title: 'Warning',
      value: ANOMALIES.filter((a) => a.severity === 'warning').length,
      color: '#f5a623',
      icon: <WarningOutlined />,
      change: '-5%',
    },
    {
      title: 'Resolved',
      value: ANOMALIES.filter((a) => a.status === 'Resolved').length,
      color: '#52c41a',
      icon: <CheckCircleOutlined />,
      change: '+8',
    },
  ], []);

  const filteredData = useMemo(() => {
    return ANOMALIES.filter((row) => {
      if (filters.severity.length > 0 && !filters.severity.includes(row.severity)) return false;
      if (filters.status && row.status !== filters.status) return false;
      if (
        filters.search &&
        !row.source_ip.includes(filters.search) &&
        !row.type.toLowerCase().includes(filters.search.toLowerCase()) &&
        !row.id.includes(filters.search)
      )
        return false;
      return true;
    });
  }, [filters]);

  const columns = [
    {
      title: 'Event ID',
      dataIndex: 'id',
      width: 100,
      render: (v) => <Text style={{ color: '#9da8c7', fontFamily: 'monospace', fontSize: 12 }}>{v}</Text>,
    },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      width: 160,
      render: (v) => (
        <Text style={{ color: '#9da8c7', fontSize: 12 }}>
          {new Date(v).toLocaleString()}
        </Text>
      ),
      sorter: (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
      defaultSortOrder: 'descend',
    },
    {
      title: 'Source IP',
      dataIndex: 'source_ip',
      width: 130,
      render: (v) => <Text style={{ color: '#e8eaf6', fontFamily: 'monospace' }}>{v}</Text>,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      render: (v) => <Text style={{ color: '#c8d0e7' }}>{v}</Text>,
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      width: 110,
      render: (v) => {
        const cfg = SEVERITY_CONFIG[v] || SEVERITY_CONFIG.normal;
        return (
          <Tag
            style={{
              background: cfg.bg,
              border: `1px solid ${cfg.border}`,
              color: cfg.color,
              textTransform: 'capitalize',
            }}
          >
            {cfg.icon} {v}
          </Tag>
        );
      },
      filters: Object.keys(SEVERITY_CONFIG).map((s) => ({ text: s, value: s })),
      onFilter: (v, r) => r.severity === v,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 130,
      render: (v) => {
        const colorMap = {
          Open: '#ff4d4f',
          Investigating: '#f5a623',
          Resolved: '#52c41a',
          'False Positive': '#9da8c7',
        };
        return (
          <Tag
            style={{
              background: `${colorMap[v] || '#9da8c7'}15`,
              border: `1px solid ${colorMap[v] || '#9da8c7'}30`,
              color: colorMap[v] || '#9da8c7',
            }}
          >
            {v}
          </Tag>
        );
      },
    },
    {
      title: 'Score',
      dataIndex: 'score',
      width: 80,
      render: (v) => (
        <Text style={{ color: parseFloat(v) > 70 ? '#ff4d4f' : '#f5a623', fontWeight: 600 }}>
          {v}
        </Text>
      ),
      sorter: (a, b) => parseFloat(a.score) - parseFloat(b.score),
    },
    {
      title: 'Actions',
      width: 100,
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="Investigate">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              style={{ color: '#1890ff' }}
              onClick={() => {
                setSelectedEvent(record);
                setNoteDrawer(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Add note">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              style={{ color: '#f5a623' }}
              onClick={() => {
                setSelectedEvent(record);
                setNoteDrawer(true);
              }}
            />
          </Tooltip>
        </Space>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <Title level={3} style={{ color: '#e8eaf6', margin: 0, fontWeight: 700 }}>
                  Anomaly Analysis
                </Title>
                <Text style={{ color: '#9da8c7' }}>Monitor, investigate, and resolve security anomalies</Text>
              </div>
              <Space>
                <Button
                  icon={<FilterOutlined />}
                  onClick={() => setFilterDrawer(true)}
                  style={{ color: '#9da8c7', borderColor: '#1e3a5f', background: '#0f1f3d' }}
                >
                  Filters
                </Button>
                <Button
                  type="primary"
                  icon={<FileTextOutlined />}
                  onClick={() => message.success('Report generation started...')}
                  style={{ background: 'linear-gradient(135deg, #f5a623, #ff6b35)', border: 'none' }}
                >
                  Generate Report
                </Button>
              </Space>
            </div>

            {/* Stat cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              {STAT_CARDS.map((stat) => (
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
                        <Text style={{ color: '#6b7a9e', fontSize: 12, display: 'block' }}>{stat.title}</Text>
                        <Text style={{ color: '#e8eaf6', fontSize: 26, fontWeight: 700, lineHeight: 1 }}>
                          {stat.value}
                        </Text>
                        <Text style={{ color: stat.color, fontSize: 11, marginLeft: 4 }}>{stat.change}</Text>
                      </div>
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>

            {/* Chart */}
            <div style={{ marginBottom: 24 }}>
              <AnomalyChart title="Anomaly Trend — Last 24 Hours" height={280} />
            </div>

            {/* Filter bar */}
            <Card
              style={{ background: '#0f1f3d', border: '1px solid #1e3a5f', borderRadius: 12, marginBottom: 16 }}
              bodyStyle={{ padding: '16px 20px' }}
            >
              <Row gutter={[12, 12]} align="middle">
                <Col xs={24} sm={12} md={8}>
                  <Input
                    placeholder="Search by IP, type, event ID..."
                    prefix={<SearchOutlined style={{ color: '#3a5a80' }} />}
                    value={filters.search}
                    onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                    style={{ background: '#162447', borderColor: '#1e3a5f', color: '#e8eaf6' }}
                  />
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Select
                    mode="multiple"
                    placeholder="Filter severity"
                    value={filters.severity}
                    onChange={(v) => setFilters((f) => ({ ...f, severity: v }))}
                    style={{ width: '100%' }}
                    maxTagCount={2}
                  >
                    {Object.keys(SEVERITY_CONFIG).map((s) => (
                      <Option key={s} value={s} style={{ textTransform: 'capitalize' }}>
                        {s}
                      </Option>
                    ))}
                  </Select>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Select
                    placeholder="Filter status"
                    value={filters.status || undefined}
                    onChange={(v) => setFilters((f) => ({ ...f, status: v || '' }))}
                    style={{ width: '100%' }}
                    allowClear
                  >
                    {['Open', 'Investigating', 'Resolved', 'False Positive'].map((s) => (
                      <Option key={s} value={s}>{s}</Option>
                    ))}
                  </Select>
                </Col>
                <Col xs={24} sm={12} md={4}>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={() => setFilters({ severity: [], status: '', search: '' })}
                    style={{ color: '#9da8c7', borderColor: '#1e3a5f', background: 'transparent', width: '100%' }}
                  >
                    Reset
                  </Button>
                </Col>
              </Row>
            </Card>

            {/* Events table */}
            <Card
              title={
                <Space>
                  <AlertOutlined style={{ color: '#f5a623' }} />
                  <Text style={{ color: '#e8eaf6', fontWeight: 600 }}>
                    Anomaly Events ({filteredData.length})
                  </Text>
                </Space>
              }
              style={{ background: '#0f1f3d', border: '1px solid #1e3a5f', borderRadius: 12 }}
              headStyle={{ borderBottom: '1px solid #1e3a5f' }}
            >
              <Table
                dataSource={filteredData}
                columns={columns}
                size="small"
                scroll={{ x: 900 }}
                pagination={{ pageSize: 15, showSizeChanger: true, showQuickJumper: true }}
                style={{ background: 'transparent' }}
              />
            </Card>
          </Content>
          <Footer />
        </Layout>
      </Layout>

      {/* Investigation drawer */}
      <Drawer
        title={
          <Space>
            <EyeOutlined style={{ color: '#1890ff' }} />
            <Text style={{ color: '#e8eaf6' }}>Investigate Event</Text>
            {selectedEvent && (
              <Tag style={{ background: '#162447', borderColor: '#1e3a5f', color: '#9da8c7' }}>
                {selectedEvent.id}
              </Tag>
            )}
          </Space>
        }
        open={noteDrawer}
        onClose={() => setNoteDrawer(false)}
        width={480}
        styles={{
          header: { background: '#0f1f3d', borderBottom: '1px solid #1e3a5f' },
          body: { background: '#0f1f3d' },
          mask: { background: 'rgba(0,0,0,0.6)' },
        }}
      >
        {selectedEvent && (
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            {[
              ['Event ID', selectedEvent.id],
              ['Timestamp', new Date(selectedEvent.timestamp).toLocaleString()],
              ['Source IP', selectedEvent.source_ip],
              ['Type', selectedEvent.type],
              ['Severity', selectedEvent.severity],
              ['Anomaly Score', selectedEvent.score],
              ['Status', selectedEvent.status],
            ].map(([label, value]) => (
              <div key={label} style={{ padding: '12px 16px', background: '#162447', borderRadius: 8 }}>
                <Text style={{ color: '#6b7a9e', fontSize: 12, display: 'block' }}>{label}</Text>
                <Text style={{ color: '#e8eaf6', fontWeight: 500 }}>{value}</Text>
              </div>
            ))}
            <Form form={noteForm} layout="vertical">
              <Form.Item name="note" label={<Text style={{ color: '#9da8c7' }}>Investigation Notes</Text>}>
                <Input.TextArea
                  rows={4}
                  placeholder="Add your investigation notes..."
                  style={{ background: '#162447', borderColor: '#1e3a5f', color: '#e8eaf6' }}
                />
              </Form.Item>
              <Button
                type="primary"
                block
                onClick={() => {
                  message.success('Notes saved');
                  setNoteDrawer(false);
                  noteForm.resetFields();
                }}
                style={{ background: 'linear-gradient(135deg, #1890ff, #096dd9)', border: 'none' }}
              >
                Save Notes
              </Button>
            </Form>
          </Space>
        )}
      </Drawer>
    </Layout>
  );
};

export default AuditorDashboard;
