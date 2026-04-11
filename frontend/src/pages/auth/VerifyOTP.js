import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  Typography,
  Button,
  Space,
  Alert,
  Input,
  Divider,
  message,
} from 'antd';
import {
  SafetyOutlined,
  MailOutlined,
  ReloadOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';

const { Title, Text, Paragraph } = Typography;

const VerifyOTP = () => {
  const { verifyOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || '';
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const refs = useRef([]);

  useEffect(() => {
    if (!email) navigate('/register', { replace: true });
  }, [email, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleOtpChange = (idx, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[idx] = value.slice(-1);
    setOtp(next);
    if (value && idx < 5) {
      refs.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      refs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = [...otp];
    pasted.split('').forEach((ch, i) => {
      if (i < 6) next[i] = ch;
    });
    setOtp(next);
    if (pasted.length > 0) {
      refs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await verifyOtp(email, code);
      message.success('Email verified! Welcome to LogGuard.');
      const role = result.user?.role;
      const paths = {
        viewer: '/dashboard/viewer',
        auditor: '/dashboard/auditor',
        admin: '/dashboard/admin',
        superadmin: '/dashboard/superadmin',
      };
      navigate(paths[role] || '/dashboard/viewer', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired code. Please try again.');
      setOtp(['', '', '', '', '', '']);
      refs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      await authService.resendOtp(email);
      message.success('A new code has been sent to your email.');
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      refs.current[0]?.focus();
    } catch {
      message.error('Failed to resend code. Please try again.');
    } finally {
      setResendLoading(false);
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
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: 'rgba(24,144,255,0.15)',
              border: '1px solid rgba(24,144,255,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <MailOutlined style={{ fontSize: 34, color: '#1890ff' }} />
          </div>
          <Title level={2} style={{ color: '#e8eaf6', margin: 0, fontWeight: 700 }}>
            Verify your email
          </Title>
          <Paragraph style={{ color: '#9da8c7', marginTop: 8 }}>
            We sent a 6-digit code to{' '}
            <Text strong style={{ color: '#e8eaf6' }}>
              {email}
            </Text>
          </Paragraph>
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

          <div
            style={{
              display: 'flex',
              gap: 10,
              justifyContent: 'center',
              marginBottom: 32,
            }}
            onPaste={handlePaste}
          >
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (refs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                style={{
                  width: 52,
                  height: 60,
                  textAlign: 'center',
                  fontSize: 24,
                  fontWeight: 700,
                  background: '#162447',
                  border: `2px solid ${digit ? '#f5a623' : '#1e3a5f'}`,
                  borderRadius: 10,
                  color: '#e8eaf6',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  cursor: 'text',
                }}
                onFocus={(e) =>
                  (e.target.style.borderColor = '#f5a623')
                }
                onBlur={(e) =>
                  (e.target.style.borderColor = digit ? '#f5a623' : '#1e3a5f')
                }
              />
            ))}
          </div>

          <Button
            type="primary"
            block
            size="large"
            loading={loading}
            disabled={otp.join('').length < 6}
            onClick={handleVerify}
            style={{
              height: 48,
              fontWeight: 600,
              background: 'linear-gradient(135deg, #f5a623, #ff6b35)',
              border: 'none',
              marginBottom: 16,
            }}
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </Button>

          <div style={{ textAlign: 'center' }}>
            <Text style={{ color: '#9da8c7', fontSize: 14 }}>
              Didn't receive the code?{' '}
            </Text>
            {countdown > 0 ? (
              <Text style={{ color: '#6b7a9e', fontSize: 14 }}>
                Resend in {countdown}s
              </Text>
            ) : (
              <Button
                type="link"
                loading={resendLoading}
                icon={<ReloadOutlined />}
                onClick={handleResend}
                style={{ color: '#f5a623', padding: 0, fontWeight: 600 }}
              >
                Resend code
              </Button>
            )}
          </div>
        </Card>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link to="/login" style={{ color: '#9da8c7', fontSize: 13 }}>
            <ArrowLeftOutlined /> Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
