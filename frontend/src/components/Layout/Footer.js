import React from 'react';
import { Layout, Space, Typography, Divider } from 'antd';
import { SafetyOutlined, GithubOutlined, LinkedinOutlined } from '@ant-design/icons';

const { Footer: AntFooter } = Layout;
const { Text, Link } = Typography;

const Footer = () => (
  <AntFooter
    style={{
      background: '#0a1628',
      borderTop: '1px solid #1e3a5f',
      padding: '16px 24px',
      textAlign: 'center',
    }}
  >
    <Space split={<Divider type="vertical" style={{ borderColor: '#1e3a5f' }} />}>
      <Space size={6}>
        <SafetyOutlined style={{ color: '#f5a623', fontSize: 14 }} />
        <Text style={{ color: '#6b7a9e', fontSize: 12 }}>
          LogGuard &copy; {new Date().getFullYear()}
        </Text>
      </Space>
      <Text style={{ color: '#6b7a9e', fontSize: 12 }}>AI-Powered Security</Text>
      <Link href="#" style={{ color: '#6b7a9e', fontSize: 12 }}>
        Privacy Policy
      </Link>
      <Link href="#" style={{ color: '#6b7a9e', fontSize: 12 }}>
        Terms of Service
      </Link>
    </Space>
  </AntFooter>
);

export default Footer;
