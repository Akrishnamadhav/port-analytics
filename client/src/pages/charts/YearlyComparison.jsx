import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Loader2, BarChart3 } from 'lucide-react';
import api from '../../api/axios';

const formatINR = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '₹0';
  const abs = Math.abs(num);
  if (abs >= 1e7) return `₹${(num / 1e7).toFixed(2)} Cr`;
  if (abs >= 1e5) return `₹${(num / 1e5).toFixed(2)} L`;
  return `₹${num.toLocaleString('en-IN')}`;
};
const CHART_COLORS = ['#003366', '#d4a843', '#004080', '#059669', '#dc2626', '#8b5cf6', '#06b6d4', '#f97316'];

export default function YearlyComparison() {
  const [data, setData] = useState([]);
  const [selectedYears, setSelectedYears] = useState(new Set());
  const [activeMetric, setActiveMetric] = useState('revenue');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await api.get('/api/stats/historical-trends');
        const trends = res.data;
        setData(trends);
        // Default: last 3 years
        const defaultYears = trends.slice(-3).map((d) => d.year);
        setSelectedYears(new Set(defaultYears));
      } catch (err) {
        console.error('Failed to fetch historical trends:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredData = useMemo(
    () => data.filter((d) => selectedYears.has(d.year)),
    [data, selectedYears]
  );

  const toggleYear = (year) => {
    setSelectedYears((prev) => {
      const next = new Set(prev);
      if (next.has(year)) {
        next.delete(year);
      } else {
        next.add(year);
      }
      return next;
    });
  };

  const metrics = [
    { key: 'revenue', label: 'Revenue' },
    { key: 'vessels', label: 'Vessels' },
    { key: 'tonnage', label: 'Tonnage' },
  ];

  const tickFormatter = (value) => {
    if (activeMetric === 'revenue') return formatINR(value);
    return value?.toLocaleString() ?? value;
  };

  const tooltipFormatter = (value) => {
    if (activeMetric === 'revenue') return formatINR(value);
    return value?.toLocaleString() ?? value;
  };

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
          <BarChart3 className="w-5 h-5 text-port-navy" />
          Yearly Comparison
        </h2>

        {/* Metric Tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {metrics.map((m) => (
            <button
              key={m.key}
              onClick={() => setActiveMetric(m.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeMetric === m.key
                  ? 'bg-port-navy text-white'
                  : 'bg-white text-port-text border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Year Checkboxes */}
        <div className="flex flex-wrap gap-3 mb-6">
          {data.map((d) => (
            <label
              key={d.year}
              className="flex items-center gap-1.5 text-sm text-port-text cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedYears.has(d.year)}
                onChange={() => toggleYear(d.year)}
                className="rounded border-gray-300 text-port-navy focus:ring-port-navy"
              />
              {d.year}
            </label>
          ))}
        </div>

        {/* Chart */}
        {filteredData.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-400">
            Select at least one year to display data.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis tickFormatter={tickFormatter} />
              <Tooltip formatter={tooltipFormatter} />
              <Bar dataKey={activeMetric} fill="#003366" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
