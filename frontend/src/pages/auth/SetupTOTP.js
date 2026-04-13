import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  Typography,
  Button,
  Space,
  Alert,
  Steps,
  Divider,
  message,
  Spin,
} from 'antd';
import {
  SafetyOutlined,
  MobileOutlined,
  CheckCircleOutlined,
  QrcodeOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';

const { Title, Text, Paragraph } = Typography;

const SetupTOTP = () => {
  const { verifyTotp, user, getDashboardPath } = useAuth();
  const navigate = useNavigate();

  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [setupLoading, setSetupLoading] = useState(true);
  const [error, setError] = useState('');
  const [step, setStep] = useState(0);
  const refs = useRef([]);

  useEffect(() => {
    const initSetup = async () => {
      try {
        const response = await authService.setupTotp();
        setQrCodeUrl(response.data.qr_code_url || response.data.qr_code);
        setSecret(response.data.secret || '');
      } catch {
        message.error('Failed to initialize TOTP setup');
      } finally {
        setSetupLoading(false);
      }
    };
    initSetup();
  }, []);

  const handleCodeChange = (idx, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...code];
    next[idx] = value.slice(-1);
    setCode(next);
    if (value && idx < 5) refs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !code[idx] && idx > 0) {
      refs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = pasted.split('').concat(Array(6).fill('')).slice(0, 6);
    setCode(next);
    if (pasted.length > 0) refs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleVerify = async () => {
    const totpCode = code.join('');
    if (totpCode.length < 6) {
      setError('Please enter the 6-digit code from your authenticator app.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await verifyTotp(totpCode);
      message.success('Two-factor authentication enabled!');
      navigate(getDashboardPath(user?.role), { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid code. Please try again.');
      setCode(['', '', '', '', '', '']);
      refs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigate(getDashboardPath(user?.role), { replace: true });
  };

  const steps = [
    {
      title: 'Install App',
      icon: <MobileOutlined />,
    },
    {
      title: 'Scan QR',
      icon: <QrcodeOutlined />,
    },
    {
      title: 'Verify',
      icon: <CheckCircleOutlined />,
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

      <div style={{ width: '100%', maxWidth: 500, position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              background: 'rgba(114,46,209,0.15)',
              border: '1px solid rgba(114,46,209,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <SafetyOutlined style={{ fontSize: 30, color: '#722ed1' }} />
          </div>
          <Title level={2} style={{ color: '#e8eaf6', margin: 0, fontWeight: 700 }}>
            Enable Two-Factor Auth
          </Title>
          <Text style={{ color: '#9da8c7' }}>
            Secure your account with an authenticator app
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
          <Steps
            current={step}
            size="small"
            style={{ marginBottom: 32 }}
            items={steps}
          />

          {step === 0 && (
            <div>
              <Paragraph style={{ color: '#9da8c7', marginBottom: 20 }}>
                Install an authenticator app on your mobile device:
              </Paragraph>
              <Space direction="vertical" style={{ width: '100%' }} size={12}>
                {[
                  { name: 'Google Authenticator', platforms: 'iOS & Android' },
                  { name: 'Microsoft Authenticator', platforms: 'iOS & Android' },
                  { name: 'Authy', platforms: 'iOS, Android & Desktop' },
                  { name: '1Password', platforms: 'iOS, Android & Desktop' },
                ].map((app) => (
                  <div
                    key={app.name}
                    style={{
                      padding: '12px 16px',
                      background: '#162447',
                      border: '1px solid #1e3a5f',
                      borderRadius: 8,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <Text strong style={{ color: '#e8eaf6', display: 'block' }}>
                        {app.name}
                      </Text>
                      <Text style={{ color: '#6b7a9e', fontSize: 12 }}>{app.platforms}</Text>
                    </div>
                    <MobileOutlined style={{ color: '#722ed1', fontSize: 20 }} />
                  </div>
                ))}
              </Space>
              <Button
                type="primary"
                block
                size="large"
                icon={<ArrowRightOutlined />}
                onClick={() => setStep(1)}
                style={{
                  marginTop: 24,
                  height: 48,
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #722ed1, #531dab)',
                  border: 'none',
                }}
              >
                I have the app
              </Button>
            </div>
          )}

          {step === 1 && (
            <div style={{ textAlign: 'center' }}>
              <Paragraph style={{ color: '#9da8c7', marginBottom: 24 }}>
                Scan this QR code with your authenticator app, or enter the secret key
                manually.
              </Paragraph>

              {setupLoading ? (
                <Spin size="large" style={{ margin: '40px auto', display: 'block' }} />
              ) : qrCodeUrl ? (
                <div
                  style={{
                    display: 'inline-block',
                    padding: 16,
                    background: '#fff',
                    borderRadius: 12,
                    marginBottom: 20,
                  }}
                >
                  <img
                    src={qrCodeUrl}
                    alt="TOTP QR Code"
                    style={{ width: 180, height: 180, display: 'block' }}
                  />
                </div>
              ) : (
                <Alert
                  message="QR code unavailable"
                  type="warning"
                  style={{ marginBottom: 20 }}
                />
              )}

              {secret && (
                <div
                  style={{
                    background: '#162447',
                    border: '1px solid #1e3a5f',
                    borderRadius: 8,
                    padding: '12px 16px',
                    marginBottom: 24,
                    textAlign: 'left',
                  }}
                >
                  <Text style={{ color: '#6b7a9e', fontSize: 12, display: 'block' }}>
                    Manual entry key:
                  </Text>
                  <Text
                    copyable
                    style={{
                      color: '#f5a623',
                      fontFamily: 'monospace',
                      fontSize: 15,
                      letterSpacing: 2,
                      wordBreak: 'break-all',
                    }}
                  >
                    {secret}
                  </Text>
                </div>
              )}

              <Space style={{ width: '100%' }} direction="vertical" size={8}>
                <Button
                  type="primary"
                  block
                  size="large"
                  onClick={() => setStep(2)}
                  style={{
                    height: 48,
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #722ed1, #531dab)',
                    border: 'none',
                  }}
                >
                  I've scanned the code
                </Button>
                <Button
                  block
                  onClick={() => setStep(0)}
                  style={{ color: '#9da8c7', borderColor: '#1e3a5f', background: 'transparent' }}
                >
                  Back
                </Button>
              </Space>
            </div>
          )}

          {step === 2 && (
            <div>
              <Paragraph style={{ color: '#9da8c7', marginBottom: 24 }}>
                Enter the 6-digit code from your authenticator app to verify setup.
              </Paragraph>

              {error && (
                <Alert
                  message={error}
                  type="error"
                  showIcon
                  style={{ marginBottom: 20, background: 'rgba(255,77,79,0.1)', borderColor: '#ff4d4f' }}
                  closable
                  onClose={() => setError('')}
                />
              )}

              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  justifyContent: 'center',
                  marginBottom: 28,
                }}
                onPaste={handlePaste}
              >
                {code.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (refs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    style={{
                      width: 52,
                      height: 60,
                      textAlign: 'center',
                      fontSize: 24,
                      fontWeight: 700,
                      background: '#162447',
                      border: `2px solid ${digit ? '#722ed1' : '#1e3a5f'}`,
                      borderRadius: 10,
                      color: '#e8eaf6',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      cursor: 'text',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#722ed1')}
                    onBlur={(e) =>
                      (e.target.style.borderColor = digit ? '#722ed1' : '#1e3a5f')
                    }
                  />
                ))}
              </div>

              <Space style={{ width: '100%' }} direction="vertical" size={8}>
                <Button
                  type="primary"
                  block
                  size="large"
                  loading={loading}
                  disabled={code.join('').length < 6}
                  onClick={handleVerify}
                  style={{
                    height: 48,
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #722ed1, #531dab)',
                    border: 'none',
                  }}
                >
                  {loading ? 'Verifying...' : 'Enable 2FA'}
                </Button>
                <Button
                  block
                  onClick={() => setStep(1)}
                  style={{ color: '#9da8c7', borderColor: '#1e3a5f', background: 'transparent' }}
                >
                  Back
                </Button>
              </Space>
            </div>
          )}

          <Divider style={{ borderColor: '#1e3a5f', margin: '24px 0 16px' }} />
          <div style={{ textAlign: 'center' }}>
            <Button
              type="link"
              onClick={handleSkip}
              style={{ color: '#6b7a9e', fontSize: 13 }}
            >
              Skip for now (not recommended)
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SetupTOTP;
