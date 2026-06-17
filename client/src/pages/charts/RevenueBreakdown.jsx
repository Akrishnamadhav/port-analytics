import React, { useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Loader2, PieChart as PieChartIcon } from 'lucide-react';
import api from '../../api/axios';

const formatINR = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '₹0';
  const abs = Math.abs(num);
  if (abs >= 1e7) return `₹${(num / 1e7).toFixed(2)} Cr`;
  if (abs >= 1e5) return `₹${(num / 1e5).toFixed(2)} L`;
  return `₹${num.toLocaleString('en-IN')}`;
};
const CHART_COLORS = ['#003366', '#d4a843', '#004080', '#059669', '#dc2626', '#8b5cf6', '#06b6d4', '#f97316'];

const RADIAN = Math.PI / 180;
const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, percent }) => {
  const radius = outerRadius + 25;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="#333"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize={12}
    >
      {`${name}: ${(percent * 100).toFixed(1)}%`}
    </text>
  );
};

export default function RevenueBreakdown() {
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [breakdownData, setBreakdownData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch available years
  useEffect(() => {
    const fetchYears = async () => {
      try {
        setLoading(true);
        const res = await api.get('/api/stats/historical-trends');
        const availableYears = res.data.map((d) => d.year);
        setYears(availableYears);
        if (availableYears.length > 0) {
          setSelectedYear(availableYears[availableYears.length - 1]);
        }
      } catch (err) {
        console.error('Failed to fetch years:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchYears();
  }, []);

  // Fetch breakdown for selected year
  useEffect(() => {
    if (!selectedYear) return;
    const fetchBreakdown = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/stats/revenue-breakdown?year=${selectedYear}`);
        setBreakdownData(res.data);
      } catch (err) {
        console.error('Failed to fetch revenue breakdown:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBreakdown();
  }, [selectedYear]);

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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-port-navy flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-port-navy" />
            Revenue Breakdown
          </h2>
          <select
            value={selectedYear ?? ''}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-port-text focus:outline-none focus:ring-2 focus:ring-port-navy"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* Chart */}
        {breakdownData.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-400">
            No breakdown data available for {selectedYear}.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={450}>
            <PieChart>
              <Pie
                data={breakdownData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={120}
                label={renderLabel}
              >
                {breakdownData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(v) => formatINR(v)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
