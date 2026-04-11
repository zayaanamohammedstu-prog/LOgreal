import React from 'react';
import { Navigate } from 'react-router-dom';
import { Result, Button } from 'antd';
import { useAuth } from '../../context/AuthContext';

const ROLE_HIERARCHY = {
  viewer: 1,
  auditor: 2,
  admin: 3,
  superadmin: 4,
};

const RoleGuard = ({ children, requiredRole }) => {
  const { user, getDashboardPath } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  const userLevel = ROLE_HIERARCHY[user.role] || 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;

  if (userLevel < requiredLevel) {
    return (
      <Result
        status="403"
        title="403"
        subTitle="You don't have permission to access this page."
        extra={
          <Button
            type="primary"
            onClick={() => (window.location.href = getDashboardPath(user.role))}
          >
            Go to Your Dashboard
          </Button>
        }
        style={{ paddingTop: 80 }}
      />
    );
  }

  return children;
};

export default RoleGuard;
