import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Building2, Loader2, BarChart3 } from 'lucide-react';
import api from '../../api/axios';

const formatINR = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '₹0';
  const abs = Math.abs(num);
  if (abs >= 1e7) return `₹${(num / 1e7).toFixed(2)} Cr`;
  if (abs >= 1e5) return `₹${(num / 1e5).toFixed(2)} L`;
  return `₹${num.toLocaleString('en-IN')}`;
};

const TopShippingLines = () => {
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [data, setData] = useState([]);
  const [metric, setMetric] = useState('revenue');
  const [limit, setLimit] = useState(5);
  const [loading, setLoading] = useState(true);

  // Fetch available years on mount
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const res = await api.get('/api/stats/historical-trends');
        const yearList = res.data.map((item) => item.year).sort((a, b) => b - a);
        setYears(yearList);
        if (yearList.length > 0) {
          setSelectedYear(yearList[0]);
        }
      } catch (err) {
        console.error('Failed to fetch years:', err);
      }
    };
    fetchYears();
  }, []);

  // Fetch company revenue share data when year changes
  const fetchData = useCallback(async () => {
    if (!selectedYear) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/stats/company-revenue-share?year=${selectedYear}`);
      setData(res.data || []);
    } catch (err) {
      console.error('Failed to fetch company data:', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Process data: sort by selected metric, take top N
  const processedData = [...data]
    .sort((a, b) => (b[metric] || 0) - (a[metric] || 0))
    .slice(0, limit);

  const tooltipFormatter = (value) => {
    if (metric === 'revenue') return formatINR(value);
    return value?.toLocaleString('en-IN') || '0';
  };

  const xAxisFormatter = (value) => {
    if (metric === 'revenue') return formatINR(value);
    return value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-port-border p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-port-navy/10 rounded-xl">
          <Building2 className="w-5 h-5 text-port-navy" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-port-text">Top Shipping Lines</h2>
          <p className="text-sm text-port-muted">
            Ranked by {metric === 'revenue' ? 'revenue' : 'vessel visits'}
          </p>
        </div>
      </div>

      {/* Controls Row */}
      <div className="flex flex-wrap gap-4 items-center mb-6">
        {/* Year Select */}
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="px-3 py-2 border border-port-border rounded-lg text-sm bg-white text-port-text focus:outline-none focus:ring-2 focus:ring-port-navy/30"
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>

        {/* Metric Toggle */}
        <div className="flex rounded-lg overflow-hidden border border-port-border">
          {[
            { key: 'revenue', label: 'By Revenue' },
            { key: 'visits', label: 'By Visits' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setMetric(key)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                metric === key
                  ? 'bg-port-navy text-white'
                  : 'bg-white text-port-text hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Limit Buttons */}
        <div className="flex rounded-lg overflow-hidden border border-port-border">
          {[5, 10, 20].map((n) => (
            <button
              key={n}
              onClick={() => setLimit(n)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                limit === n
                  ? 'bg-port-accent text-port-navy'
                  : 'bg-white text-port-text hover:bg-gray-50'
              }`}
            >
              Top {n}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-port-navy animate-spin" />
        </div>
      ) : processedData.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-port-muted">
          <BarChart3 className="w-12 h-12 mb-3 opacity-40" />
          <p className="text-sm">No data available for {selectedYear}</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(300, processedData.length * 40)}>
          <BarChart data={processedData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
            <YAxis
              type="category"
              dataKey="company"
              width={150}
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
            />
            <XAxis
              type="number"
              tickFormatter={xAxisFormatter}
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value) => [tooltipFormatter(value), metric === 'revenue' ? 'Revenue' : 'Visits']}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                fontSize: '13px',
              }}
            />
            <Bar dataKey={metric} fill="#d4a843" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default TopShippingLines;
