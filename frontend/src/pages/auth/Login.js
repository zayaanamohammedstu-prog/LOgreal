import React, { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Checkbox,
  Card,
  Typography,
  Space,
  Divider,
  Alert,
  message,
} from 'antd';
import {
  MailOutlined,
  LockOutlined,
  SafetyOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
} from '@ant-design/icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const { Title, Text, Paragraph } = Typography;

const Login = () => {
  const [form] = Form.useForm();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || null;

  const handleSubmit = async (values) => {
    setLoading(true);
    setError('');
    try {
      const result = await login(values.email, values.password);
      if (result.mfa_required) {
        navigate('/setup-totp', { state: { email: values.email } });
        return;
      }
      if (result.success) {
        const role = result.user?.role;
        const paths = {
          viewer: '/dashboard/viewer',
          auditor: '/dashboard/auditor',
          admin: '/dashboard/admin',
          superadmin: '/dashboard/superadmin',
        };
        navigate(from || paths[role] || '/dashboard/viewer', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
      {/* Background glow */}
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,166,35,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      {/* Grid */}
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

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              background: 'rgba(245,166,35,0.15)',
              border: '1px solid rgba(245,166,35,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <SafetyOutlined style={{ fontSize: 32, color: '#f5a623' }} />
          </div>
          <Title level={2} style={{ color: '#e8eaf6', margin: 0, fontWeight: 700 }}>
            Welcome back
          </Title>
          <Text style={{ color: '#9da8c7', fontSize: 15 }}>
            Sign in to your LogGuard account
          </Text>
        </div>

        <Card
          style={{
            background: '#0f1f3d',
            border: '1px solid #1e3a5f',
            borderRadius: 16,
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}
          bodyStyle={{ padding: '32px 32px 24px' }}
        >
          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              style={{ marginBottom: 24, background: 'rgba(255,77,79,0.1)', borderColor: '#ff4d4f' }}
              closable
              onClose={() => setError('')}
            />
          )}

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            requiredMark={false}
            size="large"
          >
            <Form.Item
              name="email"
              label={<Text style={{ color: '#9da8c7' }}>Email address</Text>}
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Please enter a valid email' },
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
              rules={[{ required: true, message: 'Please enter your password' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#3a5a80' }} />}
                placeholder="Enter your password"
                iconRender={(visible) =>
                  visible ? <EyeTwoTone twoToneColor="#f5a623" /> : <EyeInvisibleOutlined style={{ color: '#3a5a80' }} />
                }
                style={{ background: '#162447', borderColor: '#1e3a5f', color: '#e8eaf6' }}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox style={{ color: '#9da8c7' }}>Remember me</Checkbox>
                </Form.Item>
                <Link
                  to="/forgot-password"
                  style={{ color: '#f5a623', fontSize: 13, fontWeight: 500 }}
                >
                  Forgot password?
                </Link>
              </div>
            </Form.Item>

            <Form.Item style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{
                  height: 48,
                  fontSize: 16,
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #f5a623, #ff6b35)',
                  border: 'none',
                  boxShadow: '0 4px 16px rgba(245,166,35,0.3)',
                }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </Form.Item>
          </Form>

          <Divider style={{ borderColor: '#1e3a5f', color: '#6b7a9e', fontSize: 12 }}>
            OR
          </Divider>

          <div style={{ textAlign: 'center' }}>
            <Text style={{ color: '#9da8c7' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: '#f5a623', fontWeight: 600 }}>
                Create account
              </Link>
            </Text>
          </div>
        </Card>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Space split={<Divider type="vertical" style={{ borderColor: '#1e3a5f' }} />}>
            <Text style={{ color: '#3a5a80', fontSize: 12 }}>Privacy Policy</Text>
            <Text style={{ color: '#3a5a80', fontSize: 12 }}>Terms of Service</Text>
            <Link to="/" style={{ color: '#3a5a80', fontSize: 12 }}>
              ← Back to home
            </Link>
          </Space>
        </div>
      </div>
    </div>
  );
};

export default Login;
