import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  Eye,
  CheckCircle,
  XCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Trash2,
} from 'lucide-react';
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

const ReviewReports = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('pending');
  const [reports, setReports] = useState([]);
  const [approvedReports, setApprovedReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [stagingData, setStagingData] = useState([]);
  const [stagingPage, setStagingPage] = useState(1);
  const [stagingTotalPages, setStagingTotalPages] = useState(1);
  const [stagingLoading, setStagingLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [message, setMessage] = useState('');

  const fetchPendingReports = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/reports/pending');
      setReports(res.data || []);
    } catch (err) {
      console.error('Failed to fetch pending reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovedReports = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/reports/approved');
      setApprovedReports(res.data || []);
    } catch (err) {
      console.error('Failed to fetch approved reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'pending') {
      fetchPendingReports();
    } else {
      fetchApprovedReports();
    }
  }, [activeTab]);

  const fetchStagingData = async (reportId, page = 1) => {
    try {
      setStagingLoading(true);
      const res = await api.get(`/api/reports/${reportId}?page=${page}&limit=20`);
      setStagingData(res.data.rows || []);
      setStagingPage(res.data.pagination?.page || page);
      setStagingTotalPages(res.data.pagination?.totalPages || 1);
    } catch (err) {
      console.error('Failed to fetch staging data:', err);
      setStagingData([]);
    } finally {
      setStagingLoading(false);
    }
  };

  const openDetail = (report) => {
    setSelectedReport(report);
    setShowRejectInput(false);
    setRejectReason('');
    setMessage('');
    fetchStagingData(report._id || report.id, 1);
  };

  const closeModal = () => {
    setSelectedReport(null);
    setStagingData([]);
    setStagingPage(1);
    setStagingTotalPages(1);
    setShowRejectInput(false);
    setRejectReason('');
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > stagingTotalPages) return;
    fetchStagingData(selectedReport._id || selectedReport.id, newPage);
  };

  const handleApprove = async () => {
    const reportId = selectedReport._id || selectedReport.id;
    try {
      setActionLoading('approve');
      await api.patch(`/api/reports/${reportId}/approve`);
      setMessage('Report approved successfully!');
      closeModal();
      fetchPendingReports();
    } catch (err) {
      console.error('Failed to approve report:', err);
      setMessage(err.response?.data?.error || 'Failed to approve report.');
    } finally {
      setActionLoading('');
    }
  };

  const handleReject = async () => {
    const reportId = selectedReport._id || selectedReport.id;
    try {
      setActionLoading('reject');
      await api.patch(`/api/reports/${reportId}/reject`, { reason: rejectReason });
      setMessage('Report rejected successfully.');
      closeModal();
      fetchPendingReports();
    } catch (err) {
      console.error('Failed to reject report:', err);
      setMessage(err.response?.data?.error || 'Failed to reject report.');
    } finally {
      setActionLoading('');
    }
  };

  const handleDelete = async (e, report) => {
    e.stopPropagation();
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the approved report for year ${report.year} (${report.original_filename})? This will permanently delete its financial statistics and operational records from the system.`
    );
    if (!confirmDelete) return;

    try {
      setLoading(true);
      await api.delete(`/api/reports/${report.id || report._id}`);
      setMessage('Report deleted successfully.');
      fetchApprovedReports();
    } catch (err) {
      console.error('Failed to delete report:', err);
      setMessage(err.response?.data?.error || 'Failed to delete report.');
    } finally {
      setLoading(false);
    }
  };

  const stagingColumns =
    stagingData.length > 0 ? Object.keys(stagingData[0]).filter((k) => k !== '_id' && k !== '__v') : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-port-accent" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-port-text flex items-center gap-2">
            <ClipboardCheck className="w-7 h-7 text-port-accent" />
            Review Reports
          </h1>
          <p className="text-port-muted text-sm mt-1">
            {activeTab === 'pending'
              ? `${reports.length} pending report${reports.length !== 1 ? 's' : ''} awaiting review`
              : `${approvedReports.length} approved report${approvedReports.length !== 1 ? 's' : ''} in system`}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'pending'
              ? 'border-port-navy text-port-navy'
              : 'border-transparent text-port-muted hover:text-port-text'
          }`}
        >
          Pending Review
        </button>
        <button
          onClick={() => setActiveTab('approved')}
          className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'approved'
              ? 'border-port-navy text-port-navy'
              : 'border-transparent text-port-muted hover:text-port-text'
          }`}
        >
          Approved Reports
        </button>
      </div>

      {/* Success/Error message */}
      {message && (
        <div
          className={`mb-4 rounded-xl p-4 flex items-center gap-2 text-sm ${
            message.includes('successfully')
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {message.includes('successfully') ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 flex-shrink-0" />
          )}
          {message}
        </div>
      )}

      {activeTab === 'pending' ? (
        reports.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <ClipboardCheck className="w-16 h-16 text-gray-300" />
            <p className="text-lg font-medium text-port-muted mt-4">No pending reports</p>
            <p className="text-sm text-gray-400">All reports have been reviewed</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-port-navy text-white text-left text-sm">
                    <th className="px-4 py-3 font-medium">Uploader</th>
                    <th className="px-4 py-3 font-medium">Year</th>
                    <th className="px-4 py-3 font-medium">Filename</th>
                    <th className="px-4 py-3 font-medium">Row Count</th>
                    <th className="px-4 py-3 font-medium">Revenue Preview</th>
                    <th className="px-4 py-3 font-medium">Upload Date</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr
                      key={report._id || report.id}
                      onClick={() => openDetail(report)}
                      className="border-b border-gray-100 hover:bg-blue-50 text-sm cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 text-port-text font-medium">
                        {report.uploader?.name || report.uploader_name || '-'}
                      </td>
                      <td className="px-4 py-3 text-port-text">{report.year}</td>
                      <td className="px-4 py-3 text-port-text">{report.original_filename}</td>
                      <td className="px-4 py-3 text-port-text">
                        {report.row_count?.toLocaleString() ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-port-text font-medium">
                        {formatINR(report.total_revenue_preview)}
                      </td>
                      <td className="px-4 py-3 text-port-muted">
                        {formatDate(report.uploaded_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        approvedReports.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <CheckCircle className="w-16 h-16 text-gray-300" />
            <p className="text-lg font-medium text-port-muted mt-4">No approved reports</p>
            <p className="text-sm text-gray-400">Approved reports will show up here</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-port-navy text-white text-left text-sm">
                    <th className="px-4 py-3 font-medium">Uploader</th>
                    <th className="px-4 py-3 font-medium">Year</th>
                    <th className="px-4 py-3 font-medium">Filename</th>
                    <th className="px-4 py-3 font-medium">Row Count</th>
                    <th className="px-4 py-3 font-medium">Total Revenue</th>
                    <th className="px-4 py-3 font-medium">Approved Date</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {approvedReports.map((report) => (
                    <tr
                      key={report._id || report.id}
                      onClick={() => openDetail(report)}
                      className="border-b border-gray-100 hover:bg-blue-50 text-sm cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 text-port-text font-medium">
                        {report.uploader_name || report.uploader?.name || '-'}
                      </td>
                      <td className="px-4 py-3 text-port-text">{report.year}</td>
                      <td className="px-4 py-3 text-port-text">{report.original_filename}</td>
                      <td className="px-4 py-3 text-port-text">
                        {report.row_count?.toLocaleString() ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-port-text font-medium">
                        {formatINR(report.total_revenue_preview)}
                      </td>
                      <td className="px-4 py-3 text-port-muted">
                        {formatDate(report.reviewed_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => handleDelete(e, report)}
                          className="p-1.5 hover:bg-red-50 text-red-600 hover:text-red-800 rounded-lg transition-all"
                          title="Delete Approved Report"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-port-text flex items-center gap-2">
                <Eye className="w-5 h-5 text-port-accent" />
                Report Details
              </h2>
              <button
                onClick={closeModal}
                className="hover:bg-gray-100 rounded-lg p-1 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Metadata Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-port-bg rounded-lg p-3">
                  <p className="text-xs text-port-muted">Uploader</p>
                  <p className="text-sm font-semibold text-port-text">
                    {selectedReport.uploader?.name || selectedReport.uploader_name || '-'}
                  </p>
                </div>
                <div className="bg-port-bg rounded-lg p-3">
                  <p className="text-xs text-port-muted">Year</p>
                  <p className="text-sm font-semibold text-port-text">{selectedReport.year}</p>
                </div>
                <div className="bg-port-bg rounded-lg p-3">
                  <p className="text-xs text-port-muted">Filename</p>
                  <p className="text-sm font-semibold text-port-text truncate">
                    {selectedReport.original_filename}
                  </p>
                </div>
                <div className="bg-port-bg rounded-lg p-3">
                  <p className="text-xs text-port-muted">Row Count</p>
                  <p className="text-sm font-semibold text-port-text">
                    {selectedReport.row_count?.toLocaleString() ?? '-'}
                  </p>
                </div>
                <div className="bg-port-bg rounded-lg p-3">
                  <p className="text-xs text-port-muted">Revenue</p>
                  <p className="text-sm font-semibold text-port-text">
                    {formatINR(selectedReport.total_revenue_preview)}
                  </p>
                </div>
              </div>

              {/* Staging Data Table */}
              {stagingLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-port-accent" />
                </div>
              ) : stagingData.length > 0 ? (
                <>
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-left">
                          {stagingColumns.map((col) => (
                            <th
                              key={col}
                              className="px-3 py-2 font-medium text-port-muted text-xs whitespace-nowrap"
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {stagingData.map((row, idx) => (
                          <tr
                            key={idx}
                            className={`border-t border-gray-100 ${
                              idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                            }`}
                          >
                            {stagingColumns.map((col) => (
                              <td
                                key={col}
                                className="px-3 py-2 text-port-text whitespace-nowrap"
                              >
                                {row[col] !== null && row[col] !== undefined
                                  ? String(row[col])
                                  : '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-sm text-port-muted">
                      Page {stagingPage} of {stagingTotalPages}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(stagingPage - 1)}
                        disabled={stagingPage <= 1}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </button>
                      <button
                        onClick={() => handlePageChange(stagingPage + 1)}
                        disabled={stagingPage >= stagingTotalPages}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-center text-port-muted py-8">No staging data available</p>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-4">
              {selectedReport.status === 'pending' ? (
                showRejectInput ? (
                  <div className="flex-1 flex items-center gap-3">
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Enter reason for rejection..."
                      rows={2}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                    />
                    <button
                      onClick={handleReject}
                      disabled={actionLoading === 'reject' || !rejectReason.trim()}
                      className="bg-red-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
                    >
                      {actionLoading === 'reject' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      Confirm Reject
                    </button>
                    <button
                      onClick={() => {
                        setShowRejectInput(false);
                        setRejectReason('');
                      }}
                      className="text-gray-500 hover:text-gray-700 px-3 py-2.5 rounded-lg hover:bg-gray-100 text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={handleApprove}
                      disabled={actionLoading === 'approve'}
                      className="bg-port-success text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-700 flex items-center gap-2 disabled:opacity-50 transition-colors"
                    >
                      {actionLoading === 'approve' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      Approve
                    </button>
                    <button
                      onClick={() => setShowRejectInput(true)}
                      disabled={!!actionLoading}
                      className="bg-port-danger text-white px-6 py-2.5 rounded-lg font-medium hover:bg-red-700 flex items-center gap-2 disabled:opacity-50 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </>
                )
              ) : (
                <button
                  onClick={closeModal}
                  className="bg-port-navy text-white px-6 py-2.5 bg-port-navy hover:bg-port-navy-dark rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewReports;
