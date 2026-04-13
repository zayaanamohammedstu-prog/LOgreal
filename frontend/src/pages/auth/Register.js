import React, { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Steps,
  Space,
  Radio,
  Progress,
  Alert,
  Divider,
  Tag,
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
  SafetyOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const { Title, Text, Paragraph } = Typography;

const ROLES = [
  {
    value: 'viewer',
    label: 'Viewer',
    color: '#52c41a',
    desc: 'Read-only access to public dashboards and system status.',
    approval: false,
  },
  {
    value: 'auditor',
    label: 'Auditor',
    color: '#1890ff',
    desc: 'Full anomaly analysis, report generation, and investigation tools.',
    approval: true,
  },
  {
    value: 'admin',
    label: 'Admin',
    color: '#f5a623',
    desc: 'User management, system configuration, and full audit access.',
    approval: true,
  },
  {
    value: 'superadmin',
    label: 'Super Admin',
    color: '#ff4d4f',
    desc: 'Unrestricted system access including all admin and system controls.',
    approval: true,
  },
];

const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', color: '#1e3a5f' };
  let score = 0;
  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 15;
  if (/[A-Z]/.test(password)) score += 20;
  if (/[a-z]/.test(password)) score += 10;
  if (/[0-9]/.test(password)) score += 20;
  if (/[^A-Za-z0-9]/.test(password)) score += 15;

  if (score < 30) return { score, label: 'Very Weak', color: '#ff4d4f' };
  if (score < 50) return { score, label: 'Weak', color: '#ff7a45' };
  if (score < 70) return { score, label: 'Fair', color: '#f5a623' };
  if (score < 90) return { score, label: 'Strong', color: '#73d13d' };
  return { score, label: 'Very Strong', color: '#52c41a' };
};

const Register = () => {
  const [form] = Form.useForm();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [selectedRole, setSelectedRole] = useState('viewer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [formData, setFormData] = useState({});

  const strength = getPasswordStrength(passwordValue);
  const roleInfo = ROLES.find((r) => r.value === selectedRole);

  const handleStep0 = () => setCurrent(1);

  const handleStep1 = async () => {
    try {
      const values = await form.validateFields();
      setFormData((prev) => ({ ...prev, ...values, role: selectedRole }));
      setLoading(true);
      setError('');
      await register({ ...values, role: selectedRole });
      setCurrent(2);
    } catch (err) {
      if (err?.response) {
        setError(err.response?.data?.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      title: 'Choose Role',
      content: (
        <div>
          <Paragraph style={{ color: '#9da8c7', marginBottom: 24 }}>
            Select your role in the system. Privileged roles require admin approval before
            access is granted.
          </Paragraph>
          <Radio.Group
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            style={{ width: '100%' }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size={12}>
              {ROLES.map((role) => (
                <div
                  key={role.value}
                  onClick={() => setSelectedRole(role.value)}
                  style={{
                    padding: '16px 20px',
                    border: `1px solid ${selectedRole === role.value ? role.color : '#1e3a5f'}`,
                    borderRadius: 12,
                    background:
                      selectedRole === role.value
                        ? `${role.color}10`
                        : '#162447',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Space>
                      <Radio value={role.value} />
                      <Text strong style={{ color: role.color, fontSize: 15 }}>
                        {role.label}
                      </Text>
                    </Space>
                    {role.approval && (
                      <Tag
                        style={{
                          background: 'rgba(245,166,35,0.1)',
                          border: '1px solid rgba(245,166,35,0.3)',
                          color: '#f5a623',
                          fontSize: 11,
                        }}
                      >
                        Requires Approval
                      </Tag>
                    )}
                  </div>
                  <Text style={{ color: '#9da8c7', fontSize: 13, marginLeft: 28 }}>
                    {role.desc}
                  </Text>
                </div>
              ))}
            </Space>
          </Radio.Group>

          {roleInfo?.approval && (
            <Alert
              icon={<InfoCircleOutlined />}
              message="Approval required"
              description="Your account will be created but requires admin approval before you can access privileged features."
              type="info"
              style={{
                marginTop: 20,
                background: 'rgba(24,144,255,0.1)',
                borderColor: 'rgba(24,144,255,0.3)',
              }}
            />
          )}

          <Button
            type="primary"
            block
            size="large"
            onClick={handleStep0}
            style={{
              marginTop: 24,
              height: 48,
              fontWeight: 600,
              background: 'linear-gradient(135deg, #f5a623, #ff6b35)',
              border: 'none',
            }}
          >
            Continue
          </Button>
        </div>
      ),
    },
    {
      title: 'Your Details',
      content: (
        <Form form={form} layout="vertical" requiredMark={false} size="large">
          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              style={{ marginBottom: 16, background: 'rgba(255,77,79,0.1)', borderColor: '#ff4d4f' }}
              closable
              onClose={() => setError('')}
            />
          )}

          <Form.Item
            name="username"
            label={<Text style={{ color: '#9da8c7' }}>Username</Text>}
            rules={[
              { required: true, message: 'Username is required' },
              { min: 3, message: 'At least 3 characters' },
              { pattern: /^[a-zA-Z0-9_]+$/, message: 'Letters, numbers, underscores only' },
            ]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#3a5a80' }} />}
              placeholder="john_doe"
              style={{ background: '#162447', borderColor: '#1e3a5f', color: '#e8eaf6' }}
            />
          </Form.Item>

          <Form.Item
            name="email"
            label={<Text style={{ color: '#9da8c7' }}>Email address</Text>}
            rules={[
              { required: true, message: 'Email is required' },
              { type: 'email', message: 'Invalid email address' },
            ]}
          >
            <Input
              prefix={<MailOutlined style={{ color: '#3a5a80' }} />}
              placeholder="you@company.com"
              style={{ background: '#162447', borderColor: '#1e3a5f', color: '#e8eaf6' }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={<Text style={{ color: '#9da8c7' }}>Password</Text>}
            rules={[
              { required: true, message: 'Password is required' },
              { min: 8, message: 'At least 8 characters' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#3a5a80' }} />}
              placeholder="Create a strong password"
              onChange={(e) => setPasswordValue(e.target.value)}
              iconRender={(visible) =>
                visible ? <EyeTwoTone twoToneColor="#f5a623" /> : <EyeInvisibleOutlined style={{ color: '#3a5a80' }} />
              }
              style={{ background: '#162447', borderColor: '#1e3a5f', color: '#e8eaf6' }}
            />
          </Form.Item>

          {passwordValue && (
            <div style={{ marginTop: -16, marginBottom: 16 }}>
              <Progress
                percent={strength.score}
                strokeColor={strength.color}
                trailColor="#162447"
                showInfo={false}
                size="small"
              />
              <Text style={{ color: strength.color, fontSize: 12 }}>
                Password strength: {strength.label}
              </Text>
            </div>
          )}

          <Form.Item
            name="confirm_password"
            label={<Text style={{ color: '#9da8c7' }}>Confirm password</Text>}
            dependencies={['password']}
            rules={[
              { required: true, message: 'Please confirm your password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value)
                    return Promise.resolve();
                  return Promise.reject(new Error('Passwords do not match'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#3a5a80' }} />}
              placeholder="Repeat your password"
              iconRender={(visible) =>
                visible ? <EyeTwoTone twoToneColor="#f5a623" /> : <EyeInvisibleOutlined style={{ color: '#3a5a80' }} />
              }
              style={{ background: '#162447', borderColor: '#1e3a5f', color: '#e8eaf6' }}
            />
          </Form.Item>

          <Space style={{ width: '100%', marginTop: 8 }} direction="vertical" size={8}>
            <Button
              type="primary"
              block
              size="large"
              loading={loading}
              onClick={handleStep1}
              style={{
                height: 48,
                fontWeight: 600,
                background: 'linear-gradient(135deg, #f5a623, #ff6b35)',
                border: 'none',
              }}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
            <Button
              block
              size="large"
              onClick={() => setCurrent(0)}
              style={{ height: 44, color: '#9da8c7', borderColor: '#1e3a5f', background: 'transparent' }}
            >
              Back
            </Button>
          </Space>
        </Form>
      ),
    },
    {
      title: 'Verify Email',
      content: (
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'rgba(82,196,26,0.15)',
              border: '2px solid rgba(82,196,26,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}
          >
            <CheckCircleOutlined style={{ fontSize: 36, color: '#52c41a' }} />
          </div>
          <Title level={4} style={{ color: '#e8eaf6', marginBottom: 12 }}>
            Check your email
          </Title>
          <Paragraph style={{ color: '#9da8c7', marginBottom: 24 }}>
            We've sent a verification code to <strong style={{ color: '#e8eaf6' }}>
              {formData.email}
            </strong>. Enter the code to activate your account.
          </Paragraph>
          <Button
            type="primary"
            size="large"
            block
            onClick={() =>
              navigate('/verify-otp', { state: { email: formData.email } })
            }
            style={{
              height: 48,
              fontWeight: 600,
              background: 'linear-gradient(135deg, #f5a623, #ff6b35)',
              border: 'none',
            }}
          >
            Enter Verification Code
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a1628',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(30,58,95,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(30,58,95,0.2) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          pointerEvents: 'none',
        }}
      />

      <div style={{ width: '100%', maxWidth: 480, position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Space size={8}>
            <SafetyOutlined style={{ color: '#f5a623', fontSize: 24 }} />
            <Text strong style={{ color: '#e8eaf6', fontSize: 20 }}>
              Log<span style={{ color: '#f5a623' }}>Guard</span>
            </Text>
          </Space>
          <div style={{ marginTop: 12 }}>
            <Title level={3} style={{ color: '#e8eaf6', margin: 0, fontWeight: 700 }}>
              Create your account
            </Title>
          </div>
        </div>

        <Card
          style={{
            background: '#0f1f3d',
            border: '1px solid #1e3a5f',
            borderRadius: 16,
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}
          bodyStyle={{ padding: '32px 32px 28px' }}
        >
          <Steps
            current={current}
            size="small"
            style={{ marginBottom: 32 }}
            items={steps.map((s) => ({ title: s.title }))}
          />
          {steps[current].content}
        </Card>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Text style={{ color: '#9da8c7' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#f5a623', fontWeight: 600 }}>
              Sign in
            </Link>
          </Text>
        </div>
      </div>
    </div>
  );
};

export default Register;
