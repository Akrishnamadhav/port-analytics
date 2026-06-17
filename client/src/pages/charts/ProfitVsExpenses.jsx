import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Loader2, DollarSign, Info } from 'lucide-react';
import api from '../../api/axios';

const formatINR = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '₹0';
  const abs = Math.abs(num);
  if (abs >= 1e7) return `₹${(num / 1e7).toFixed(2)} Cr`;
  if (abs >= 1e5) return `₹${(num / 1e5).toFixed(2)} L`;
  return `₹${num.toLocaleString('en-IN')}`;
};
const CHART_COLORS = ['#003366', '#d4a843', '#004080', '#059669', '#dc2626', '#8b5cf6', '#06b6d4', '#f97316'];

export default function ProfitVsExpenses() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await api.get('/api/stats/historical-trends');
        setData(res.data);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const hasExpenses = useMemo(() => {
    return data.some(
      (d) => d.expenses !== null && d.expenses !== undefined && d.expenses !== 0
    );
  }, [data]);

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
          <DollarSign className="w-5 h-5 text-port-navy" />
          Profit vs Expenses
        </h2>

        {/* Info Banner */}
        {!hasExpenses && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-xl p-4 flex items-center gap-2 mb-6">
            <Info className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">
              Expense data is not currently available. Contact admin to enable profit analysis.
            </span>
          </div>
        )}

        {/* Chart */}
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-400">
            No data available.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis tickFormatter={formatINR} />
              <Tooltip formatter={(v) => formatINR(v)} />
              <Legend />
              <Bar dataKey="revenue" name="Revenue" fill="#003366" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#dc2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
