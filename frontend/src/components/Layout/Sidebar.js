import React from 'react';
import { Layout, Menu, Typography, Space, Tooltip } from 'antd';
import {
  DashboardOutlined,
  SafetyOutlined,
  FileSearchOutlined,
  TeamOutlined,
  SettingOutlined,
  AuditOutlined,
  BarChartOutlined,
  HomeOutlined,
  CrownOutlined,
  AlertOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const { Sider } = Layout;
const { Text } = Typography;

const Sidebar = ({ collapsed }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const role = user?.role || 'viewer';

  const allMenuItems = [
    {
      key: '/dashboard/viewer',
      icon: <HomeOutlined />,
      label: 'Overview',
      roles: ['viewer', 'auditor', 'admin', 'superadmin'],
    },
    {
      key: '/dashboard/auditor',
      icon: <AlertOutlined />,
      label: 'Anomaly Analysis',
      roles: ['auditor', 'admin', 'superadmin'],
    },
    {
      key: '/dashboard/admin',
      icon: <TeamOutlined />,
      label: 'User Management',
      roles: ['admin', 'superadmin'],
    },
    {
      key: '/dashboard/superadmin',
      icon: <CrownOutlined />,
      label: 'Super Admin',
      roles: ['superadmin'],
    },
    { type: 'divider' },
    {
      key: '/reports',
      icon: <BarChartOutlined />,
      label: 'Reports',
      roles: ['auditor', 'admin', 'superadmin'],
    },
    {
      key: '/audit-logs',
      icon: <AuditOutlined />,
      label: 'Audit Logs',
      roles: ['admin', 'superadmin'],
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      roles: ['viewer', 'auditor', 'admin', 'superadmin'],
    },
  ];

  const ROLE_HIERARCHY = { viewer: 1, auditor: 2, admin: 3, superadmin: 4 };
  const userLevel = ROLE_HIERARCHY[role] || 1;

  const menuItems = allMenuItems
    .filter((item) => {
      if (item.type === 'divider') return true;
      return item.roles.some((r) => ROLE_HIERARCHY[r] <= userLevel);
    })
    .map((item) => {
      if (item.type === 'divider') return { type: 'divider' };
      return {
        key: item.key,
        icon: item.icon,
        label: item.label,
        onClick: () => navigate(item.key),
      };
    });

  return (
    <Sider
      collapsed={collapsed}
      width={220}
      collapsedWidth={64}
      style={{
        background: '#0a1628',
        borderRight: '1px solid #1e3a5f',
        minHeight: 'calc(100vh - 64px)',
        position: 'sticky',
        top: 64,
        overflow: 'auto',
      }}
    >
      {!collapsed && (
        <div
          style={{
            padding: '16px 20px 8px',
            borderBottom: '1px solid #1e3a5f',
            marginBottom: 8,
          }}
        >
          <Text style={{ color: '#6b7a9e', fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>
            Navigation
          </Text>
        </div>
      )}

      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        style={{
          background: 'transparent',
          border: 'none',
          padding: '8px 0',
        }}
        theme="dark"
      />

      {!collapsed && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '12px 20px',
            borderTop: '1px solid #1e3a5f',
            background: '#0a1628',
          }}
        >
          <Space>
            <SafetyOutlined style={{ color: '#f5a623', fontSize: 14 }} />
            <Text style={{ color: '#6b7a9e', fontSize: 11 }}>LogGuard v1.0</Text>
          </Space>
        </div>
      )}
    </Sider>
  );
};

export default Sidebar;
