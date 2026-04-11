import React from 'react';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

const LoadingSpinner = ({ fullscreen = false, size = 'large', tip = 'Loading...' }) => {
  const antIcon = <LoadingOutlined style={{ fontSize: size === 'large' ? 40 : 24, color: '#f5a623' }} spin />;

  if (fullscreen) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'rgba(10, 22, 40, 0.95)',
          zIndex: 9999,
          gap: 16,
        }}
      >
        <Spin indicator={antIcon} size={size} />
        <span style={{ color: '#9da8c7', fontSize: 14 }}>{tip}</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 48 }}>
      <Spin indicator={antIcon} size={size} />
    </div>
  );
};

export default LoadingSpinner;
