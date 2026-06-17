import React, { useState, useEffect, useCallback } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Package, Loader2 } from 'lucide-react';
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

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
  if (percent < 0.05) return null;

  const radius = outerRadius + 28;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#334155"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize={11}
      fontWeight={500}
    >
      {name} ({(percent * 100).toFixed(1)}%)
    </text>
  );
};

const CargoBreakdown = () => {
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [data, setData] = useState([]);
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

  // Fetch cargo breakdown when year changes
  const fetchData = useCallback(async () => {
    if (!selectedYear) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/stats/cargo-breakdown?year=${selectedYear}`);
      setData(res.data || []);
    } catch (err) {
      console.error('Failed to fetch cargo breakdown:', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Process: group small categories (< 2% of total) as 'Other' if more than 8
  const processedData = (() => {
    if (!data.length) return [];

    const totalValue = data.reduce((sum, item) => sum + (item.value || 0), 0);
    if (totalValue === 0) return [];

    const threshold = totalValue * 0.02;
    const sorted = [...data].sort((a, b) => (b.value || 0) - (a.value || 0));

    if (sorted.length <= 8) {
      return sorted.map((item) => ({ name: item.name, value: item.value || 0 }));
    }

    const significant = [];
    let otherValue = 0;

    sorted.forEach((item) => {
      const val = item.value || 0;
      if (val >= threshold && significant.length < 8) {
        significant.push({ name: item.name, value: val });
      } else {
        otherValue += val;
      }
    });

    if (otherValue > 0) {
      significant.push({ name: 'Other', value: otherValue });
    }

    return significant;
  })();

  const totalValue = processedData.reduce((sum, item) => sum + item.value, 0);

  const tooltipContent = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const entry = payload[0];
    const percent = totalValue > 0 ? ((entry.value / totalValue) * 100).toFixed(1) : 0;
    return (
      <div className="bg-white border border-port-border rounded-xl shadow-lg px-4 py-3">
        <p className="text-sm font-semibold text-port-text">{entry.name}</p>
        <p className="text-sm text-port-muted">
          Value: <span className="font-medium text-port-text">{entry.value?.toLocaleString('en-IN')}</span>
        </p>
        <p className="text-sm text-port-muted">
          Share: <span className="font-medium text-port-text">{percent}%</span>
        </p>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-port-border p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-port-navy/10 rounded-xl">
            <Package className="w-5 h-5 text-port-navy" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-port-text">Cargo Breakdown</h2>
            <p className="text-sm text-port-muted">Category-wise cargo distribution</p>
          </div>
        </div>

        {/* Year Select */}
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
      </div>

      {/* Chart */}
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 text-port-navy animate-spin" />
        </div>
      ) : processedData.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 text-port-muted">
          <Package className="w-12 h-12 mb-3 opacity-40" />
          <p className="text-sm">No cargo data available for {selectedYear}</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={420}>
          <PieChart>
            <Pie
              data={processedData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={130}
              paddingAngle={1}
              label={renderCustomLabel}
              labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
            >
              {processedData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                  stroke="none"
                />
              ))}
            </Pie>
            <Tooltip content={tooltipContent} />
            <Legend
              verticalAlign="bottom"
              align="center"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '12px', paddingTop: '16px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default CargoBreakdown;
