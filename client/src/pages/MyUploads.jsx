import React, { useState, useEffect } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const formatINR = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '₹0';
  const abs = Math.abs(num);
  if (abs >= 1e7) return `₹${(num / 1e7).toFixed(2)} Cr`;
  if (abs >= 1e5) return `₹${(num / 1e5).toFixed(2)} L`;
  return `₹${num.toLocaleString('en-IN')}`;
};

const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const StatusBadge = ({ status }) => {
  const styles = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };

  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
        styles[status] || 'bg-gray-100 text-gray-800'
      }`}
    >
      {status}
    </span>
  );
};

const MyUploads = () => {
  const { user } = useAuth();
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUploads = async () => {
      try {
        const res = await api.get('/api/reports/my-uploads');
        const sorted = (res.data || []).sort(
          (a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at)
        );
        setUploads(sorted);
      } catch (err) {
        console.error('Failed to fetch uploads:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUploads();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-port-accent" />
      </div>
    );
  }

  if (uploads.length === 0) {
    return (
      <div className="flex flex-col items-center py-16">
        <FileText className="w-16 h-16 text-gray-300" />
        <p className="text-lg font-medium text-port-muted mt-4">No uploads yet</p>
        <p className="text-sm text-gray-400">Upload your first report to get started</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-port-text mb-6">My Uploads</h1>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-port-navy text-white text-left text-sm">
                <th className="px-4 py-3 font-medium">Filename</th>
                <th className="px-4 py-3 font-medium">Year</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Row Count</th>
                <th className="px-4 py-3 font-medium">Revenue</th>
                <th className="px-4 py-3 font-medium">Uploaded At</th>
                <th className="px-4 py-3 font-medium">Reviewed At</th>
                <th className="px-4 py-3 font-medium">Rejection Reason</th>
              </tr>
            </thead>
            <tbody>
              {uploads.map((upload) => (
                <tr
                  key={upload._id || upload.id}
                  className="border-b border-gray-100 hover:bg-gray-50 text-sm"
                >
                  <td className="px-4 py-3 text-port-text font-medium">
                    {upload.filename}
                  </td>
                  <td className="px-4 py-3 text-port-text">{upload.year}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={upload.status} />
                  </td>
                  <td className="px-4 py-3 text-port-text">
                    {upload.row_count?.toLocaleString() ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-port-text font-medium">
                    {formatINR(upload.revenue)}
                  </td>
                  <td className="px-4 py-3 text-port-muted">
                    {formatDate(upload.uploaded_at)}
                  </td>
                  <td className="px-4 py-3 text-port-muted">
                    {formatDate(upload.reviewed_at)}
                  </td>
                  <td className="px-4 py-3 text-port-muted">
                    {upload.rejection_reason || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MyUploads;
