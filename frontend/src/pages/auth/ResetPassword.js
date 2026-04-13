import React, { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Alert,
  Progress,
} from 'antd';
import {
  LockOutlined,
  SafetyOutlined,
  CheckCircleOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
} from '@ant-design/icons';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { message } from 'antd';
import authService from '../../services/authService';

const { Title, Text, Paragraph } = Typography;

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

const ResetPassword = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');

  const strength = getPasswordStrength(passwordValue);

  const handleSubmit = async ({ password }) => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new link.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authService.resetPassword(token, password);
      setSuccess(true);
      message.success('Password reset successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
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
        {success ? (
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
              <CheckCircleOutlined style={{ fontSize: 36, color: '#52c41a' }} />
            </div>
            <Title level={3} style={{ color: '#e8eaf6', marginBottom: 12 }}>
              Password reset!
            </Title>
            <Paragraph style={{ color: '#9da8c7', marginBottom: 32 }}>
              Your password has been successfully reset. You can now sign in with your
              new password.
            </Paragraph>
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
              Sign in
            </Button>
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
                <LockOutlined style={{ fontSize: 30, color: '#f5a623' }} />
              </div>
              <Title level={2} style={{ color: '#e8eaf6', margin: 0, fontWeight: 700 }}>
                Set new password
              </Title>
              <Text style={{ color: '#9da8c7' }}>
                Your new password must be at least 8 characters.
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

              {!token && (
                <Alert
                  message="Invalid reset link"
                  description="Please request a new password reset email."
                  type="warning"
                  style={{ marginBottom: 24, background: 'rgba(245,166,35,0.1)', borderColor: 'rgba(245,166,35,0.3)' }}
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
                  name="password"
                  label={<Text style={{ color: '#9da8c7' }}>New password</Text>}
                  rules={[
                    { required: true, message: 'Please enter a new password' },
                    { min: 8, message: 'At least 8 characters required' },
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined style={{ color: '#3a5a80' }} />}
                    placeholder="Enter new password"
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
                      {strength.label}
                    </Text>
                  </div>
                )}

                <Form.Item
                  name="confirm_password"
                  label={<Text style={{ color: '#9da8c7' }}>Confirm new password</Text>}
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
                    placeholder="Confirm new password"
                    iconRender={(visible) =>
                      visible ? <EyeTwoTone twoToneColor="#f5a623" /> : <EyeInvisibleOutlined style={{ color: '#3a5a80' }} />
                    }
                    style={{ background: '#162447', borderColor: '#1e3a5f', color: '#e8eaf6' }}
                  />
                </Form.Item>

                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  size="large"
                  disabled={!token}
                  style={{
                    height: 48,
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #f5a623, #ff6b35)',
                    border: 'none',
                  }}
                >
                  {loading ? 'Resetting...' : 'Reset password'}
                </Button>
              </Form>
            </Card>

            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <Link to="/login" style={{ color: '#9da8c7', fontSize: 13 }}>
                ← Back to sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
