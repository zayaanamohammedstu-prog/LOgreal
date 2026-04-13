import React, { useEffect, useRef, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Row,
  Space,
  Typography,
  Divider,
  Avatar,
  Tag,
  Statistic,
  Timeline,
} from 'antd';
import {
  SafetyOutlined,
  ThunderboltOutlined,
  TeamOutlined,
  FileProtectOutlined,
  LockOutlined,
  AuditOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  StarFilled,
  RightOutlined,
  BarChartOutlined,
  CloudServerOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

const FEATURES = [
  {
    icon: <ThunderboltOutlined style={{ fontSize: 32, color: '#f5a623' }} />,
    title: 'AI Anomaly Detection',
    desc: 'Machine learning models analyze log patterns in real-time, flagging threats before they become incidents.',
    color: '#f5a623',
  },
  {
    icon: <TeamOutlined style={{ fontSize: 32, color: '#1890ff' }} />,
    title: 'Role-Based Access',
    desc: 'Granular RBAC with Viewer, Auditor, Admin, and SuperAdmin roles — all with pending approval workflow.',
    color: '#1890ff',
  },
  {
    icon: <CloudServerOutlined style={{ fontSize: 32, color: '#52c41a' }} />,
    title: 'Real-Time Streaming',
    desc: 'WebSocket-powered live log streaming with instant anomaly alerts delivered to your dashboard.',
    color: '#52c41a',
  },
  {
    icon: <BarChartOutlined style={{ fontSize: 32, color: '#722ed1' }} />,
    title: 'Advanced Reports',
    desc: 'Exportable PDF/CSV reports with anomaly timelines, severity breakdowns, and trend analysis.',
    color: '#722ed1',
  },
  {
    icon: <LockOutlined style={{ fontSize: 32, color: '#eb2f96' }} />,
    title: 'MFA Security',
    desc: 'Two-factor authentication with TOTP support and email OTP verification for every account.',
    color: '#eb2f96',
  },
  {
    icon: <AuditOutlined style={{ fontSize: 32, color: '#13c2c2' }} />,
    title: 'Full Audit Trail',
    desc: 'Immutable audit logs track every user action, system change, and security event with timestamps.',
    color: '#13c2c2',
  },
];

const STATS = [
  { value: '10M+', label: 'Logs Analyzed', suffix: '' },
  { value: '99.9', label: 'Uptime', suffix: '%' },
  { value: '<50', label: 'Response Time', suffix: 'ms' },
  { value: '2.4K+', label: 'Threats Blocked', suffix: '' },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Ingest Logs',
    desc: 'Connect your applications and infrastructure. LogGuard ingests logs from any source — servers, apps, cloud services, and more.',
    icon: <CloudServerOutlined style={{ fontSize: 28, color: '#f5a623' }} />,
  },
  {
    step: '02',
    title: 'AI Analysis',
    desc: 'Our AI models analyze patterns, detect anomalies, and classify threats by severity — all in under 50ms.',
    icon: <ThunderboltOutlined style={{ fontSize: 28, color: '#1890ff' }} />,
  },
  {
    step: '03',
    title: 'Act & Report',
    desc: 'Get instant alerts, generate compliance reports, and take action with our intuitive role-based dashboards.',
    icon: <BellOutlined style={{ fontSize: 28, color: '#52c41a' }} />,
  },
];

const TESTIMONIALS = [
  {
    name: 'Sarah Chen',
    role: 'Head of Security, FinTech Corp',
    avatar: 'SC',
    color: '#1890ff',
    text: 'LogGuard cut our incident response time by 70%. The AI detection caught a data exfiltration attempt our SIEM completely missed.',
    stars: 5,
  },
  {
    name: 'Marcus Rodriguez',
    role: 'DevOps Lead, CloudScale',
    avatar: 'MR',
    color: '#52c41a',
    text: "The real-time streaming and role-based dashboards are exactly what our team needed. Onboarding took less than a day.",
    stars: 5,
  },
  {
    name: 'Priya Sharma',
    role: 'CISO, HealthTech Solutions',
    avatar: 'PS',
    color: '#722ed1',
    text: 'Audit trail and HIPAA-compliant reporting made our last compliance audit a breeze. Highly recommended.',
    stars: 5,
  },
];

const HomePage = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{ background: '#0a1628', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* ── NAVBAR ── */}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: scrolled ? 'rgba(10,22,40,0.97)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          borderBottom: scrolled ? '1px solid #1e3a5f' : 'none',
          padding: '0 40px',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'all 0.3s ease',
        }}
      >
        <Space size={8}>
          <SafetyOutlined style={{ color: '#f5a623', fontSize: 26 }} />
          <Text strong style={{ color: '#e8eaf6', fontSize: 22, letterSpacing: 1 }}>
            Log<span style={{ color: '#f5a623' }}>Guard</span>
          </Text>
        </Space>
        <Space size={8}>
          <Button
            type="text"
            onClick={() => navigate('/login')}
            style={{ color: '#9da8c7', fontWeight: 500 }}
          >
            Sign In
          </Button>
          <Button
            type="primary"
            onClick={() => navigate('/register')}
            style={{ fontWeight: 600 }}
          >
            Get Started Free
          </Button>
        </Space>
      </nav>

      {/* ── HERO ── */}
      <section
        style={{
          position: 'relative',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          paddingTop: 64,
        }}
      >
        {/* Animated background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(245,166,35,0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(24,144,255,0.1) 0%, transparent 50%)',
            pointerEvents: 'none',
          }}
        />
        {/* Grid lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(30,58,95,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(30,58,95,0.3) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
            pointerEvents: 'none',
          }}
        />

        <div style={{ textAlign: 'center', padding: '0 24px', maxWidth: 900, position: 'relative', zIndex: 1 }}>
          <Tag
            style={{
              background: 'rgba(245,166,35,0.15)',
              border: '1px solid rgba(245,166,35,0.4)',
              color: '#f5a623',
              borderRadius: 20,
              padding: '4px 16px',
              fontSize: 13,
              marginBottom: 24,
            }}
          >
            <ThunderboltOutlined /> &nbsp; AI-Powered Security Platform
          </Tag>

          <Title
            level={1}
            style={{
              color: '#e8eaf6',
              fontSize: 'clamp(36px, 6vw, 72px)',
              fontWeight: 800,
              lineHeight: 1.1,
              marginBottom: 24,
              letterSpacing: -1,
            }}
          >
            Detect Threats Before{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #f5a623, #ff6b35)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              They Strike
            </span>
          </Title>

          <Paragraph
            style={{
              color: '#9da8c7',
              fontSize: 'clamp(16px, 2vw, 20px)',
              maxWidth: 620,
              margin: '0 auto 40px',
              lineHeight: 1.7,
            }}
          >
            LogGuard uses machine learning to analyze millions of log events in real-time,
            detecting anomalies and security threats with pinpoint accuracy — before they
            become breaches.
          </Paragraph>

          <Space size={16} wrap style={{ justifyContent: 'center' }}>
            <Button
              type="primary"
              size="large"
              icon={<ArrowRightOutlined />}
              onClick={() => navigate('/register')}
              style={{
                height: 52,
                paddingInline: 32,
                fontSize: 16,
                fontWeight: 600,
                background: 'linear-gradient(135deg, #f5a623, #ff6b35)',
                border: 'none',
                boxShadow: '0 4px 24px rgba(245,166,35,0.4)',
              }}
            >
              Start Free Trial
            </Button>
            <Button
              size="large"
              onClick={() => navigate('/login')}
              style={{
                height: 52,
                paddingInline: 32,
                fontSize: 16,
                fontWeight: 500,
                color: '#e8eaf6',
                background: 'rgba(255,255,255,0.05)',
                borderColor: '#1e3a5f',
              }}
            >
              Live Demo
            </Button>
          </Space>

          {/* Trust badges */}
          <div style={{ marginTop: 56 }}>
            <Text style={{ color: '#6b7a9e', fontSize: 13, display: 'block', marginBottom: 16 }}>
              TRUSTED BY SECURITY TEAMS AT
            </Text>
            <Space size={32} wrap style={{ justifyContent: 'center' }}>
              {['FinTech Corp', 'CloudScale', 'HealthTech', 'DataSafe Inc', 'SecureOps'].map((name) => (
                <Text
                  key={name}
                  style={{
                    color: '#3a5a80',
                    fontSize: 14,
                    fontWeight: 600,
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                  }}
                >
                  {name}
                </Text>
              ))}
            </Space>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section
        style={{
          background: 'linear-gradient(180deg, #0a1628 0%, #0f1f3d 100%)',
          padding: '60px 40px',
          borderTop: '1px solid #1e3a5f',
          borderBottom: '1px solid #1e3a5f',
        }}
      >
        <Row gutter={[32, 32]} justify="center">
          {STATS.map((stat) => (
            <Col key={stat.label} xs={12} sm={6}>
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontSize: 'clamp(32px, 5vw, 52px)',
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #f5a623, #ff6b35)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    lineHeight: 1,
                  }}
                >
                  {stat.value}
                  <span style={{ fontSize: '0.5em' }}>{stat.suffix}</span>
                </div>
                <Text style={{ color: '#9da8c7', fontSize: 14, marginTop: 8, display: 'block' }}>
                  {stat.label}
                </Text>
              </div>
            </Col>
          ))}
        </Row>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: '100px 40px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <Tag
            style={{
              background: 'rgba(24,144,255,0.1)',
              border: '1px solid rgba(24,144,255,0.3)',
              color: '#1890ff',
              borderRadius: 20,
              padding: '4px 16px',
              marginBottom: 20,
            }}
          >
            PLATFORM FEATURES
          </Tag>
          <Title level={2} style={{ color: '#e8eaf6', fontWeight: 700, marginBottom: 16 }}>
            Everything You Need to Stay Secure
          </Title>
          <Text style={{ color: '#9da8c7', fontSize: 16 }}>
            Enterprise-grade security tools designed for modern security teams.
          </Text>
        </div>

        <Row gutter={[24, 24]}>
          {FEATURES.map((feat) => (
            <Col key={feat.title} xs={24} sm={12} lg={8}>
              <Card
                style={{
                  background: '#0f1f3d',
                  border: '1px solid #1e3a5f',
                  borderRadius: 16,
                  height: '100%',
                  transition: 'all 0.3s ease',
                }}
                bodyStyle={{ padding: 28 }}
                hoverable
              >
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 16,
                    background: `${feat.color}15`,
                    border: `1px solid ${feat.color}30`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 20,
                  }}
                >
                  {feat.icon}
                </div>
                <Title level={4} style={{ color: '#e8eaf6', marginBottom: 12 }}>
                  {feat.title}
                </Title>
                <Text style={{ color: '#9da8c7', lineHeight: 1.7 }}>{feat.desc}</Text>
              </Card>
            </Col>
          ))}
        </Row>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section
        style={{
          background: '#0f1f3d',
          borderTop: '1px solid #1e3a5f',
          borderBottom: '1px solid #1e3a5f',
          padding: '100px 40px',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <Tag
              style={{
                background: 'rgba(82,196,26,0.1)',
                border: '1px solid rgba(82,196,26,0.3)',
                color: '#52c41a',
                borderRadius: 20,
                padding: '4px 16px',
                marginBottom: 20,
              }}
            >
              HOW IT WORKS
            </Tag>
            <Title level={2} style={{ color: '#e8eaf6', fontWeight: 700 }}>
              Up and Running in Minutes
            </Title>
          </div>

          <Row gutter={[48, 48]} align="middle">
            {HOW_IT_WORKS.map((step, idx) => (
              <Col key={step.step} xs={24} md={8}>
                <div style={{ textAlign: 'center', padding: '0 16px' }}>
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      background: 'rgba(245,166,35,0.1)',
                      border: '2px solid rgba(245,166,35,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 20px',
                      position: 'relative',
                    }}
                  >
                    {step.icon}
                    <div
                      style={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        background: '#f5a623',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 800,
                        color: '#0a1628',
                      }}
                    >
                      {idx + 1}
                    </div>
                  </div>
                  <Title level={4} style={{ color: '#e8eaf6', marginBottom: 12 }}>
                    {step.title}
                  </Title>
                  <Text style={{ color: '#9da8c7', lineHeight: 1.7 }}>{step.desc}</Text>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ padding: '100px 40px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <Tag
            style={{
              background: 'rgba(114,46,209,0.1)',
              border: '1px solid rgba(114,46,209,0.3)',
              color: '#722ed1',
              borderRadius: 20,
              padding: '4px 16px',
              marginBottom: 20,
            }}
          >
            TESTIMONIALS
          </Tag>
          <Title level={2} style={{ color: '#e8eaf6', fontWeight: 700 }}>
            Trusted by Security Professionals
          </Title>
        </div>

        <Row gutter={[24, 24]}>
          {TESTIMONIALS.map((t) => (
            <Col key={t.name} xs={24} md={8}>
              <Card
                style={{
                  background: '#0f1f3d',
                  border: '1px solid #1e3a5f',
                  borderRadius: 16,
                  height: '100%',
                }}
                bodyStyle={{ padding: 28 }}
              >
                <Space style={{ marginBottom: 8 }}>
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <StarFilled key={i} style={{ color: '#f5a623', fontSize: 14 }} />
                  ))}
                </Space>
                <Paragraph
                  style={{ color: '#c8d0e7', lineHeight: 1.8, marginBottom: 24, fontSize: 15 }}
                >
                  "{t.text}"
                </Paragraph>
                <Space>
                  <Avatar
                    style={{ background: `${t.color}20`, color: t.color, fontWeight: 700 }}
                    size={40}
                  >
                    {t.avatar}
                  </Avatar>
                  <div>
                    <Text strong style={{ color: '#e8eaf6', display: 'block' }}>
                      {t.name}
                    </Text>
                    <Text style={{ color: '#9da8c7', fontSize: 12 }}>{t.role}</Text>
                  </div>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </section>

      {/* ── CTA ── */}
      <section
        style={{
          background: 'linear-gradient(135deg, #0f1f3d 0%, #162447 100%)',
          borderTop: '1px solid #1e3a5f',
          padding: '100px 40px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(245,166,35,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Title level={2} style={{ color: '#e8eaf6', fontWeight: 700, marginBottom: 16 }}>
            Ready to Secure Your Infrastructure?
          </Title>
          <Text
            style={{ color: '#9da8c7', fontSize: 18, display: 'block', marginBottom: 40 }}
          >
            Join thousands of security teams protecting their systems with LogGuard.
          </Text>
          <Space size={16} wrap style={{ justifyContent: 'center' }}>
            <Button
              type="primary"
              size="large"
              onClick={() => navigate('/register')}
              style={{
                height: 52,
                paddingInline: 40,
                fontSize: 16,
                fontWeight: 600,
                background: 'linear-gradient(135deg, #f5a623, #ff6b35)',
                border: 'none',
                boxShadow: '0 4px 24px rgba(245,166,35,0.4)',
              }}
            >
              Get Started Free <ArrowRightOutlined />
            </Button>
            <Button
              size="large"
              onClick={() => navigate('/login')}
              style={{
                height: 52,
                paddingInline: 40,
                fontSize: 16,
                color: '#e8eaf6',
                background: 'transparent',
                borderColor: '#1e3a5f',
              }}
            >
              Sign In
            </Button>
          </Space>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        style={{
          background: '#060f1e',
          borderTop: '1px solid #1e3a5f',
          padding: '48px 40px 24px',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Row gutter={[48, 32]}>
            <Col xs={24} md={8}>
              <Space size={8} style={{ marginBottom: 16 }}>
                <SafetyOutlined style={{ color: '#f5a623', fontSize: 22 }} />
                <Text strong style={{ color: '#e8eaf6', fontSize: 18 }}>
                  Log<span style={{ color: '#f5a623' }}>Guard</span>
                </Text>
              </Space>
              <Paragraph style={{ color: '#6b7a9e', fontSize: 14, lineHeight: 1.8 }}>
                AI-powered log anomaly detection and security monitoring for modern enterprises.
              </Paragraph>
            </Col>
            <Col xs={12} md={4}>
              <Text strong style={{ color: '#9da8c7', display: 'block', marginBottom: 16 }}>
                Product
              </Text>
              {['Features', 'Pricing', 'Security', 'Changelog'].map((link) => (
                <div key={link} style={{ marginBottom: 8 }}>
                  <Text style={{ color: '#6b7a9e', cursor: 'pointer', fontSize: 14 }}>{link}</Text>
                </div>
              ))}
            </Col>
            <Col xs={12} md={4}>
              <Text strong style={{ color: '#9da8c7', display: 'block', marginBottom: 16 }}>
                Company
              </Text>
              {['About', 'Blog', 'Careers', 'Contact'].map((link) => (
                <div key={link} style={{ marginBottom: 8 }}>
                  <Text style={{ color: '#6b7a9e', cursor: 'pointer', fontSize: 14 }}>{link}</Text>
                </div>
              ))}
            </Col>
            <Col xs={12} md={4}>
              <Text strong style={{ color: '#9da8c7', display: 'block', marginBottom: 16 }}>
                Legal
              </Text>
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'GDPR'].map((link) => (
                <div key={link} style={{ marginBottom: 8 }}>
                  <Text style={{ color: '#6b7a9e', cursor: 'pointer', fontSize: 14 }}>{link}</Text>
                </div>
              ))}
            </Col>
          </Row>
          <Divider style={{ borderColor: '#1e3a5f', margin: '32px 0 24px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <Text style={{ color: '#3a5a80', fontSize: 13 }}>
              © {new Date().getFullYear()} LogGuard. All rights reserved.
            </Text>
            <Space>
              {['SOC 2 Compliant', 'ISO 27001', 'GDPR Ready'].map((badge) => (
                <Tag
                  key={badge}
                  style={{
                    background: 'rgba(82,196,26,0.1)',
                    border: '1px solid rgba(82,196,26,0.2)',
                    color: '#52c41a',
                    fontSize: 11,
                  }}
                >
                  <CheckCircleOutlined /> {badge}
                </Tag>
              ))}
            </Space>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
