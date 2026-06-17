import React, { useState, useEffect, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Loader2, TrendingUp } from 'lucide-react';
import api from '../../api/axios';

const formatINR = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '₹0';
  const abs = Math.abs(num);
  if (abs >= 1e7) return `₹${(num / 1e7).toFixed(2)} Cr`;
  if (abs >= 1e5) return `₹${(num / 1e5).toFixed(2)} L`;
  return `₹${num.toLocaleString('en-IN')}`;
};
const CHART_COLORS = ['#003366', '#d4a843', '#004080', '#059669', '#dc2626', '#8b5cf6', '#06b6d4', '#f97316'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
      <p className="text-sm font-semibold text-port-navy">Year: {label}</p>
      <p className="text-sm text-port-text">
        Revenue: <span className="font-medium">{formatINR(payload[0].value)}</span>
      </p>
    </div>
  );
};

export default function HistoricalTrends() {
  const [data, setData] = useState([]);
  const [range, setRange] = useState('5');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await api.get('/api/stats/historical-trends');
        setData(res.data);
      } catch (err) {
        console.error('Failed to fetch historical trends:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    if (range === 'all') return data;
    const count = parseInt(range, 10);
    return data.slice(-count);
  }, [data, range]);

  const rangeOptions = [
    { key: '5', label: '5 Years' },
    { key: '10', label: '10 Years' },
    { key: 'all', label: 'All Data' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-port-navy" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-lg font-semibold text-port-navy flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-port-navy" />
          Historical Revenue Trends
        </h2>

        {/* Range Toggle */}
        <div className="flex flex-wrap gap-2 mb-6">
          {rangeOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setRange(opt.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                range === opt.key
                  ? 'bg-port-navy text-white'
                  : 'bg-white text-port-text border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Chart */}
        {filteredData.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-400">
            No data available.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#003366" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#003366" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="year" />
              <YAxis tickFormatter={formatINR} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#003366"
                strokeWidth={3}
                fill="url(#areaGradient)"
                dot={{ fill: '#d4a843', strokeWidth: 2, r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
