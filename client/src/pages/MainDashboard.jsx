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
const CHART_COLORS = ['#003366', '#d4a843', '#004080', '#059669', '#dc2626', '#8b5cf6', '#06b6d4', '#f97316'];

export default function MainDashboard() {
  const [trendsData, setTrendsData] = useState([]);
  const [companyData, setCompanyData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [trendsRes, companyRes] = await Promise.all([
          api.get('/api/stats/historical-trends'),
          api.get('/api/stats/company-revenue-share'),
        ]);
        setTrendsData(trendsRes.data);
        setCompanyData(companyRes.data);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const latestYear =
    trendsData.length > 0 ? trendsData[trendsData.length - 1] : {};

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
            <BarChart layout="vertical" data={companyData.slice(0, 5)}>
              <CartesianGrid strokeDasharray="3 3" />
              <YAxis
                type="category"
                dataKey="company"
                width={120}
                tick={{ fontSize: 12 }}
              />
              <XAxis type="number" tickFormatter={formatINR} />
              <Tooltip formatter={(v) => formatINR(v)} />
              <Bar dataKey="revenue" fill="#d4a843" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
