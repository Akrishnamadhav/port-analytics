import React, { useState, useEffect, useCallback } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Sector,
} from 'recharts';
import { PieChart as PieChartIcon, Loader2 } from 'lucide-react';
import api from '../../api/axios';

const formatINR = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '₹0';
  const abs = Math.abs(num);
  if (abs >= 1e7) return `₹${(num / 1e7).toFixed(2)} Cr`;
  if (abs >= 1e5) return `₹${(num / 1e5).toFixed(2)} L`;
  return `₹${num.toLocaleString('en-IN')}`;
};

const CHART_COLORS = ['#003366', '#d4a843', '#004080', '#059669', '#dc2626', '#8b5cf6', '#06b6d4', '#f97316', '#94a3b8'];

const renderActiveShape = (props) => {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent, value,
  } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 4}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.9}
      />
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
};

const CompanyRevenueShare = () => {
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [data, setData] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
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

  // Fetch data when year changes
  const fetchData = useCallback(async () => {
    if (!selectedYear) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/stats/company-revenue-share?year=${selectedYear}`);
      setData(res.data || []);
    } catch (err) {
      console.error('Failed to fetch revenue share:', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Process: sort by revenue desc, top 8, aggregate rest as 'Others'
  const processedData = (() => {
    if (!data.length) return [];
    const sorted = [...data].sort((a, b) => (b.revenue || 0) - (a.revenue || 0));
    const top8 = sorted.slice(0, 8);
    const rest = sorted.slice(8);

    const othersRevenue = rest.reduce((sum, item) => sum + (item.revenue || 0), 0);
    const result = top8.map((item) => ({
      name: item.company,
      value: item.revenue || 0,
    }));

    if (othersRevenue > 0) {
      result.push({ name: 'Others', value: othersRevenue });
    }

    return result;
  })();

  const totalRevenue = processedData.reduce((sum, item) => sum + item.value, 0);

  const onPieEnter = (_, index) => setActiveIndex(index);
  const onPieLeave = () => setActiveIndex(-1);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-port-border p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-port-navy/10 rounded-xl">
            <PieChartIcon className="w-5 h-5 text-port-navy" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-port-text">Revenue Share</h2>
            <p className="text-sm text-port-muted">Company-wise revenue distribution</p>
          </div>
        </div>

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
      </div>

      {/* Chart */}
      {loading ? (
        <div className="flex items-center justify-center h-80">
          <Loader2 className="w-8 h-8 text-port-navy animate-spin" />
        </div>
      ) : processedData.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-80 text-port-muted">
          <PieChartIcon className="w-12 h-12 mb-3 opacity-40" />
          <p className="text-sm">No revenue data available for {selectedYear}</p>
        </div>
      ) : (
        <div className="relative">
          <ResponsiveContainer width="100%" height={360}>
            <PieChart>
              <Pie
                data={processedData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="45%"
                innerRadius={70}
                outerRadius={120}
                paddingAngle={2}
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                onMouseEnter={onPieEnter}
                onMouseLeave={onPieLeave}
              >
                {processedData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                    stroke="none"
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [formatINR(value), name]}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  fontSize: '13px',
                }}
              />
              <Legend
                verticalAlign="bottom"
                align="center"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Center Label */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: '45%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="text-center">
              <p className="text-sm text-port-muted">Total</p>
              <p className="text-xl font-bold text-port-text">{formatINR(totalRevenue)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyRevenueShare;
