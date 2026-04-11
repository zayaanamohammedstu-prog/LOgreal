import React, { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Alert,
  Space,
  Result,
} from 'antd';
import {
  MailOutlined,
  SafetyOutlined,
  ArrowLeftOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

const { Title, Text, Paragraph } = Typography;

const ForgotPassword = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const handleSubmit = async ({ email }) => {
    setLoading(true);
    setError('');
    try {
      await authService.forgotPassword(email);
      setSentEmail(email);
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset email. Please try again.');
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
        {sent ? (
          <Card
            style={{
              background: '#0f1f3d',
              border: '1px solid #1e3a5f',
              borderRadius: 16,
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}
            bodyStyle={{ padding: '40px 32px', textAlign: 'center' }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'rgba(82,196,26,0.15)',
                border: '2px solid rgba(82,196,26,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
              }}
            >
              <MailOutlined style={{ fontSize: 32, color: '#52c41a' }} />
            </div>
            <Title level={3} style={{ color: '#e8eaf6', marginBottom: 12 }}>
              Check your inbox
            </Title>
            <Paragraph style={{ color: '#9da8c7', marginBottom: 32 }}>
              We sent a password reset link to{' '}
              <Text strong style={{ color: '#e8eaf6' }}>
                {sentEmail}
              </Text>
              . The link expires in 30 minutes.
            </Paragraph>
            <Space direction="vertical" style={{ width: '100%' }} size={12}>
              <Button
                type="primary"
                block
                size="large"
                onClick={() => navigate('/login')}
                style={{
                  height: 48,
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #f5a623, #ff6b35)',
                  border: 'none',
                }}
              >
                Back to sign in
              </Button>
              <Button
                block
                size="large"
                onClick={() => setSent(false)}
                style={{ height: 44, color: '#9da8c7', borderColor: '#1e3a5f', background: 'transparent' }}
              >
                Resend email
              </Button>
            </Space>
          </Card>
        ) : (
          <>
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
                <SafetyOutlined style={{ fontSize: 30, color: '#f5a623' }} />
              </div>
              <Title level={2} style={{ color: '#e8eaf6', margin: 0, fontWeight: 700 }}>
                Forgot password?
              </Title>
              <Text style={{ color: '#9da8c7' }}>
                No worries, we'll send you reset instructions.
              </Text>
            </div>

            <Card
              style={{
                background: '#0f1f3d',
                border: '1px solid #1e3a5f',
                borderRadius: 16,
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              }}
              bodyStyle={{ padding: '32px' }}
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
                    { type: 'email', message: 'Invalid email address' },
                  ]}
                >
                  <Input
                    prefix={<MailOutlined style={{ color: '#3a5a80' }} />}
                    placeholder="you@company.com"
                    style={{ background: '#162447', borderColor: '#1e3a5f', color: '#e8eaf6' }}
                  />
                </Form.Item>

                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  size="large"
                  icon={<SendOutlined />}
                  style={{
                    height: 48,
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #f5a623, #ff6b35)',
                    border: 'none',
                  }}
                >
                  {loading ? 'Sending...' : 'Send reset link'}
                </Button>
              </Form>
            </Card>

            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <Link to="/login" style={{ color: '#9da8c7', fontSize: 13 }}>
                <ArrowLeftOutlined /> Back to sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
