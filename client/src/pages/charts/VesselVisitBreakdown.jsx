import React, { useState, useEffect, useCallback } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Sector,
  Label,
} from 'recharts';
import { Ship, Loader2, BarChart3 } from 'lucide-react';
import api from '../../api/axios';

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

const VesselVisitBreakdown = () => {
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
      const res = await api.get(`/api/stats/vessel-visit-breakdown?year=${selectedYear}`);
      setData(res.data || []);
    } catch (err) {
      console.error('Failed to fetch vessel visit breakdown:', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Process: sort by value desc, top 8, aggregate rest as 'Others'
  const processedData = (() => {
    if (!data.length) return [];
    const sorted = [...data].sort((a, b) => (b.value || 0) - (a.value || 0));
    const top8 = sorted.slice(0, 8);
    const rest = sorted.slice(8);

    const othersCount = rest.reduce((sum, item) => sum + (item.value || 0), 0);
    const result = top8.map((item) => ({
      name: item.name,
      value: item.value || 0,
    }));

    if (othersCount > 0) {
      result.push({ name: 'Others', value: othersCount });
    }

    return result;
  })();

  const totalVisits = processedData.reduce((sum, item) => sum + item.value, 0);

  const onPieEnter = (_, index) => setActiveIndex(index);
  const onPieLeave = () => setActiveIndex(-1);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-port-border p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-port-navy/10 rounded-xl">
            <Ship className="w-5 h-5 text-port-navy" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-port-text">Vessel Visit Breakdown</h2>
            <p className="text-sm text-port-muted">Vessel-wise distribution of port visits</p>
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
        <div className="flex items-center justify-center h-80">
          <Loader2 className="w-8 h-8 text-port-navy animate-spin" />
        </div>
      ) : processedData.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-80 text-port-muted">
          <BarChart3 className="w-12 h-12 mb-3 opacity-40" />
          <p className="text-sm">No vessel visit data available for {selectedYear}</p>
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
                <Label
                  value="Total Visits"
                  position="center"
                  dy={-10}
                  style={{ fontSize: '13px', fill: '#6b7280', fontWeight: 500 }}
                />
                <Label
                  value={totalVisits.toLocaleString()}
                  position="center"
                  dy={12}
                  style={{ fontSize: '18px', fill: '#1a1a2e', fontWeight: 700 }}
                />
              </Pie>
              <Tooltip
                formatter={(value, name) => [`${value.toLocaleString()} visits`, name]}
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
        </div>
      )}
    </div>
  );
};

export default VesselVisitBreakdown;
