import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  IndianRupee,
  Ship,
  Package,
  FileText,
  TrendingUp,
  Building2,
  Loader2,
} from 'lucide-react';
import api from '../api/axios';

const formatINR = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '₹0';
  const abs = Math.abs(num);
  if (abs >= 1e7) return `₹${(num / 1e7).toFixed(2)} Cr`;
  if (abs >= 1e5) return `₹${(num / 1e5).toFixed(2)} L`;
  return `₹${num.toLocaleString('en-IN')}`;
};

const truncateName = (str, len = 20) => {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '...' : str;
};
const CHART_COLORS = ['#003366', '#d4a843', '#004080', '#059669', '#dc2626', '#8b5cf6', '#06b6d4', '#f97316'];

export default function MainDashboard() {
  const [trendsData, setTrendsData] = useState([]);
  const [companyData, setCompanyData] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch years and historical trends on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [trendsRes, tonnageRes] = await Promise.all([
          api.get('/api/stats/historical-trends'),
          api.get('/api/stats/tonnage-trends?granularity=yearly'),
        ]);
        setTrendsData(trendsRes.data || []);
        
        const yearList = (tonnageRes.data || []).map((item) => parseInt(item.name, 10)).sort((a, b) => b - a);
        setYears(yearList);
        if (yearList.length > 0) {
          setSelectedYear(yearList[0]);
        }
      } catch (err) {
        console.error('Failed to fetch initial dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // Fetch summary and company data when selectedYear changes
  useEffect(() => {
    if (!selectedYear) return;
    const fetchYearlyData = async () => {
      try {
        const [summaryRes, companyRes] = await Promise.all([
          api.get(`/api/stats/summary?year=${selectedYear}`),
          api.get(`/api/stats/company-revenue-share?year=${selectedYear}`),
        ]);
        setSummaryData(summaryRes.data);
        setCompanyData(companyRes.data);
      } catch (err) {
        console.error('Failed to fetch yearly dashboard data:', err);
      }
    };
    fetchYearlyData();
  }, [selectedYear]);

  const latestYear = summaryData || {};

  if (loading) {
    return (
      <div className="p-6 space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-200 animate-pulse rounded-xl h-32"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-200 animate-pulse rounded-xl h-80"
            />
          ))}
        </div>
      </div>
    );
  }

  const kpiCards = [
    {
      label: 'Total Revenue',
      value: formatINR(latestYear.revenue),
      icon: IndianRupee,
      gradient: 'bg-gradient-to-br from-port-navy to-port-navy-light text-white',
    },
    {
      label: 'Vessels Handled',
      value: latestYear.vessels?.toLocaleString() ?? '0',
      icon: Ship,
      gradient: 'bg-gradient-to-br from-port-accent to-port-accent-light text-port-navy',
    },
    {
      label: 'Total Tonnage',
      value: latestYear.tonnage?.toLocaleString() ?? '0',
      icon: Package,
      gradient: 'bg-gradient-to-br from-emerald-600 to-emerald-400 text-white',
    },
    {
      label: 'Total Invoices',
      value: latestYear.invoices?.toLocaleString() ?? '0',
      icon: FileText,
      gradient: 'bg-gradient-to-br from-blue-600 to-blue-400 text-white',
    },
  ];

  return (
    <div className="p-6 space-y-8">
      {/* Header with Year Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-port-navy">Port Operations Dashboard</h1>
          <p className="text-sm text-port-muted">Real-time financial and operational key performance indicators</p>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-port-text">
            Fiscal Year:
          </span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white text-port-text focus:outline-none focus:ring-2 focus:ring-port-navy/30 shadow-sm"
          >
            <option value="all">All Years</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`${card.gradient} rounded-xl p-6 shadow-lg`}
            >
              <Icon className="w-10 h-10 opacity-80" />
              <div className="text-3xl font-bold mt-3">{card.value}</div>
              <div className="text-sm opacity-80 mt-1">{card.label}</div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Revenue Trend */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-port-navy flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-port-navy" />
            Revenue Trend
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trendsData}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#003366" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#003366" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis tickFormatter={formatINR} />
              <Tooltip formatter={(v) => formatINR(v)} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#003366"
                strokeWidth={2}
                fill="url(#revenueGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top Companies by Revenue */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-port-navy flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-port-navy" />
            Top Companies by Revenue
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart layout="vertical" data={companyData.slice(0, 5)} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
              <YAxis
                type="category"
                dataKey="name"
                width={160}
                tickFormatter={(val) => truncateName(val, 20)}
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <XAxis type="number" tickFormatter={formatINR} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v) => [formatINR(v), 'Revenue']}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  fontSize: '13px',
                }}
              />
              <Bar dataKey="value" fill="#d4a843" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
