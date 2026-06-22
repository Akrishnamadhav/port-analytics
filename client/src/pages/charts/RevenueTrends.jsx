import React, { useState, useEffect, useCallback } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, Loader2, BarChart3 } from 'lucide-react';
import api from '../../api/axios';

const formatINR = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '₹0';
  const abs = Math.abs(num);
  if (abs >= 1e7) return `₹${(num / 1e7).toFixed(2)} Cr`;
  if (abs >= 1e5) return `₹${(num / 1e5).toFixed(2)} L`;
  return `₹${num.toLocaleString('en-IN')}`;
};

const RevenueTrends = () => {
  const [mode, setMode] = useState('yearly');
  const [selectedYear, setSelectedYear] = useState('');
  const [data, setData] = useState([]);
  const [years, setYears] = useState([]);
  const [yearlyData, setYearlyData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch historical trends on mount (for yearly data and years list)
  useEffect(() => {
    const fetchHistorical = async () => {
      setLoading(true);
      try {
        const res = await api.get('/api/stats/revenue-trends?granularity=yearly');
        const trends = res.data || [];
        const yearList = trends.map((item) => parseInt(item.name, 10)).sort((a, b) => b - a);
        setYears(yearList);
        const yearlyMapped = trends
          .map((item) => ({
            name: item.name,
            revenue: item.value || 0,
          }))
          .sort((a, b) => parseInt(a.name, 10) - parseInt(b.name, 10));
        setYearlyData(yearlyMapped);
        if (yearList.length > 0) {
          setSelectedYear(yearList[0]);
        }
        if (mode === 'yearly') {
          setData(yearlyMapped);
        }
      } catch (err) {
        console.error('Failed to fetch historical trends:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistorical();
  }, []);

  // Fetch monthly data when mode is monthly and selectedYear changes
  const fetchMonthlyData = useCallback(async () => {
    if (mode !== 'monthly' || !selectedYear) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/stats/revenue-trends?granularity=monthly&year=${selectedYear}`);
      const monthlyMapped = (res.data || []).map((item) => ({
        name: item.name,
        revenue: item.value || 0,
      }));
      setData(monthlyMapped);
    } catch (err) {
      console.error('Failed to fetch revenue trends:', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [mode, selectedYear]);

  useEffect(() => {
    if (mode === 'yearly') {
      setData(yearlyData);
    } else {
      fetchMonthlyData();
    }
  }, [mode, fetchMonthlyData, yearlyData]);

  const yAxisFormatter = (v) => {
    if (v === 0) return '₹0';
    const abs = Math.abs(v);
    if (abs >= 1e7) return `₹${(v / 1e7).toFixed(1)} Cr`;
    if (abs >= 1e5) return `₹${(v / 1e5).toFixed(1)} L`;
    return `₹${v.toLocaleString('en-IN')}`;
  };

  const tooltipFormatter = (value, name) => {
    return [formatINR(value), name === 'revenue' ? 'Revenue' : 'Trend'];
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-port-border p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-port-navy/10 rounded-xl">
            <TrendingUp className="w-5 h-5 text-port-navy" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-port-text">Revenue Trends</h2>
            <p className="text-sm text-port-muted">
              {mode === 'yearly' ? 'Year-over-year revenue trend' : `Monthly revenue for ${selectedYear}`}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* Mode Toggle */}
          <div className="flex rounded-lg overflow-hidden border border-port-border">
            {[
              { key: 'yearly', label: 'Yearly' },
              { key: 'monthly', label: 'Monthly' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setMode(key)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  mode === key
                    ? 'bg-port-navy text-white'
                    : 'bg-white text-port-text hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Year Select (only in monthly mode) */}
          {mode === 'monthly' && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-2 border border-port-border rounded-lg text-sm bg-white text-port-text focus:outline-none focus:ring-2 focus:ring-port-navy/30"
            >
              <option value="all">All Years</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Chart */}
      {loading ? (
        <div className="flex items-center justify-center h-80">
          <Loader2 className="w-8 h-8 text-port-navy animate-spin" />
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-80 text-port-muted">
          <BarChart3 className="w-12 h-12 mb-3 opacity-40" />
          <p className="text-sm">No revenue data available</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={380}>
          <ComposedChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={yAxisFormatter}
              tick={{ fontSize: 12, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={tooltipFormatter}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                fontSize: '13px',
              }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
            />
            <Bar
              dataKey="revenue"
              fill="#003366"
              radius={[4, 4, 0, 0]}
              barSize={mode === 'yearly' ? 40 : 20}
              name="Revenue"
            />
            <Line
              dataKey="revenue"
              stroke="#d4a843"
              strokeWidth={2}
              type="monotone"
              dot={{ fill: '#d4a843', r: 4 }}
              activeDot={{ r: 6, fill: '#d4a843', stroke: '#fff', strokeWidth: 2 }}
              name="Trend"
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default RevenueTrends;
