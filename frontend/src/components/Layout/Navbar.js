import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Button, Space, Typography, Tooltip } from 'antd';
import {
  BellOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  DashboardOutlined,
  SafetyOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SunOutlined,
  MoonOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const { Header } = Layout;
const { Text } = Typography;

const ROLE_LABELS = {
  viewer: { label: 'Viewer', color: '#52c41a' },
  auditor: { label: 'Auditor', color: '#1890ff' },
  admin: { label: 'Admin', color: '#f5a623' },
  superadmin: { label: 'Super Admin', color: '#ff4d4f' },
};

const Navbar = ({ collapsed, onToggle }) => {
  const { user, logout, getDashboardPath } = useAuth();
  const navigate = useNavigate();
  const [notifCount] = useState(3);

  const roleInfo = ROLE_LABELS[user?.role] || ROLE_LABELS.viewer;

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: () => navigate('/settings'),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
      onClick: () => {
        logout();
        navigate('/login');
      },
    },
  ];

  const notificationItems = [
    {
      key: '1',
      label: (
        <div>
          <div style={{ fontWeight: 600, color: '#ff4d4f' }}>Critical anomaly detected</div>
          <div style={{ fontSize: 12, color: '#9da8c7' }}>192.168.1.45 — SQL Injection attempt</div>
        </div>
      ),
    },
    {
      key: '2',
      label: (
        <div>
          <div style={{ fontWeight: 600, color: '#f5a623' }}>High severity alert</div>
          <div style={{ fontSize: 12, color: '#9da8c7' }}>Multiple failed login attempts</div>
        </div>
      ),
    },
    {
      key: '3',
      label: (
        <div>
          <div style={{ fontWeight: 600, color: '#9da8c7' }}>System report ready</div>
          <div style={{ fontSize: 12, color: '#9da8c7' }}>Daily anomaly report generated</div>
        </div>
      ),
    },
  ];

  return (
    <Header
      style={{
        background: '#0f1f3d',
        borderBottom: '1px solid #1e3a5f',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        height: 64,
      }}
    >
      <Space size={16}>
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={onToggle}
          style={{ color: '#9da8c7', fontSize: 16 }}
        />
        <Space
          size={8}
          style={{ cursor: 'pointer' }}
          onClick={() => navigate(getDashboardPath(user?.role))}
        >
          <SafetyOutlined style={{ color: '#f5a623', fontSize: 22 }} />
          <Text strong style={{ color: '#e8eaf6', fontSize: 18, letterSpacing: 1 }}>
            Log<span style={{ color: '#f5a623' }}>Guard</span>
          </Text>
        </Space>
      </Space>

      <Space size={16}>
        <Tooltip title="Notifications">
          <Dropdown
            menu={{ items: notificationItems }}
            placement="bottomRight"
            overlayStyle={{ width: 300 }}
          >
            <Badge count={notifCount} size="small" offset={[-2, 2]}>
              <Button
                type="text"
                icon={<BellOutlined style={{ fontSize: 18 }} />}
                style={{ color: '#9da8c7' }}
              />
            </Badge>
          </Dropdown>
        </Tooltip>

        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Space
            style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 8 }}
            className="navbar-user"
          >
            <Avatar
              size={36}
              style={{ background: '#1e3a5f', color: roleInfo.color, fontWeight: 700 }}
              icon={<UserOutlined />}
            >
              {user?.username?.[0]?.toUpperCase()}
            </Avatar>
            <div style={{ lineHeight: 1.2 }}>
              <div style={{ color: '#e8eaf6', fontSize: 13, fontWeight: 600 }}>
                {user?.username || 'User'}
              </div>
              <div style={{ fontSize: 11, color: roleInfo.color, fontWeight: 500 }}>
                {roleInfo.label}
              </div>
            </div>
          </Space>
        </Dropdown>
      </Space>
    </Header>
  );
};

export default Navbar;
