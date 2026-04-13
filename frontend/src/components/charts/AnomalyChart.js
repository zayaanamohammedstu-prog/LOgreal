import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { Card, Select, Space, Typography, Tag } from 'antd';

const { Text } = Typography;
const { Option } = Select;

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: '#162447',
          border: '1px solid #1e3a5f',
          borderRadius: 8,
          padding: '10px 14px',
        }}
      >
        <Text style={{ color: '#9da8c7', fontSize: 12 }}>{label}</Text>
        {payload.map((entry) => (
          <div key={entry.name} style={{ marginTop: 4 }}>
            <Text style={{ color: entry.color, fontSize: 13, fontWeight: 600 }}>
              {entry.name}: {entry.value}
            </Text>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const AnomalyChart = ({ data, title = 'Anomaly Trend', height = 300 }) => {
  const [chartType, setChartType] = useState('area');
  const [timeRange, setTimeRange] = useState('24h');

  const chartData = data || generateMockData(timeRange);

  return (
    <Card
      title={
        <Space>
          <Text style={{ color: '#e8eaf6', fontWeight: 600 }}>{title}</Text>
          <Tag color="orange" style={{ fontSize: 11 }}>
            Live
          </Tag>
        </Space>
      }
      extra={
        <Space size={8}>
          <Select
            value={timeRange}
            onChange={setTimeRange}
            size="small"
            style={{ width: 80 }}
          >
            <Option value="1h">1H</Option>
            <Option value="24h">24H</Option>
            <Option value="7d">7D</Option>
            <Option value="30d">30D</Option>
          </Select>
          <Select
            value={chartType}
            onChange={setChartType}
            size="small"
            style={{ width: 80 }}
          >
            <Option value="area">Area</Option>
            <Option value="line">Line</Option>
          </Select>
        </Space>
      }
      style={{ background: '#0f1f3d', border: '1px solid #1e3a5f' }}
      headStyle={{ borderBottom: '1px solid #1e3a5f' }}
    >
      <ResponsiveContainer width="100%" height={height}>
        {chartType === 'area' ? (
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="criticalGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff4d4f" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ff4d4f" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="warningGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f5a623" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f5a623" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="normalGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#52c41a" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#52c41a" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
            <XAxis dataKey="time" tick={{ fill: '#6b7a9e', fontSize: 11 }} axisLine={{ stroke: '#1e3a5f' }} />
            <YAxis tick={{ fill: '#6b7a9e', fontSize: 11 }} axisLine={{ stroke: '#1e3a5f' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ color: '#9da8c7', fontSize: 12, paddingTop: 8 }}
            />
            <Area type="monotone" dataKey="critical" stroke="#ff4d4f" fill="url(#criticalGrad)" strokeWidth={2} name="Critical" />
            <Area type="monotone" dataKey="warning" stroke="#f5a623" fill="url(#warningGrad)" strokeWidth={2} name="Warning" />
            <Area type="monotone" dataKey="normal" stroke="#52c41a" fill="url(#normalGrad)" strokeWidth={2} name="Normal" />
          </AreaChart>
        ) : (
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
            <XAxis dataKey="time" tick={{ fill: '#6b7a9e', fontSize: 11 }} axisLine={{ stroke: '#1e3a5f' }} />
            <YAxis tick={{ fill: '#6b7a9e', fontSize: 11 }} axisLine={{ stroke: '#1e3a5f' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: '#9da8c7', fontSize: 12, paddingTop: 8 }} />
            <Line type="monotone" dataKey="critical" stroke="#ff4d4f" strokeWidth={2} dot={false} name="Critical" />
            <Line type="monotone" dataKey="warning" stroke="#f5a623" strokeWidth={2} dot={false} name="Warning" />
            <Line type="monotone" dataKey="normal" stroke="#52c41a" strokeWidth={2} dot={false} name="Normal" />
          </LineChart>
        )}
      </ResponsiveContainer>
    </Card>
  );
};

function generateMockData(range) {
  const points = range === '1h' ? 12 : range === '24h' ? 24 : range === '7d' ? 7 : 30;
  const labels =
    range === '1h'
      ? Array.from({ length: points }, (_, i) => `${i * 5}m`)
      : range === '24h'
      ? Array.from({ length: points }, (_, i) => `${i}:00`)
      : range === '7d'
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : Array.from({ length: points }, (_, i) => `Day ${i + 1}`);

  return labels.map((time) => ({
    time,
    critical: Math.floor(Math.random() * 15 + 2),
    warning: Math.floor(Math.random() * 30 + 10),
    normal: Math.floor(Math.random() * 100 + 50),
  }));
}

export default AnomalyChart;
