import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, X, Loader2 } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const UploadReport = () => {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [year, setYear] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' | 'error'
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setMessage('');
      setMessageType('');
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setMessage('');
      setMessageType('');
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current.click();
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleUpload = async () => {
    if (!file || !year) return;

    setUploading(true);
    setMessage('');
    setMessageType('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('year', year);

      await api.post('/api/reports/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setMessage('Report uploaded successfully!');
      setMessageType('success');
      setFile(null);
      setYear('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Upload failed. Please try again.');
      setMessageType('error');
    } finally {
      setUploading(false);
    }
  };

  const years = [];
  for (let y = 2026; y >= 2000; y--) {
    years.push(y);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-port-text mb-1">Upload Report</h1>
        <p className="text-port-muted text-sm mb-6">Upload an Excel file to submit a financial report</p>

        {/* Drag and Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
            isDragOver
              ? 'border-port-accent bg-port-accent/5'
              : 'border-gray-300 bg-white'
          }`}
        >
          <Upload className="w-12 h-12 text-port-muted mx-auto" />
          <p className="text-lg font-medium text-port-text mt-4">
            Drag & drop your Excel file here
          </p>
          <p className="text-port-muted my-2">or</p>
          <button
            type="button"
            onClick={handleBrowseClick}
            className="bg-port-navy text-white px-6 py-2 rounded-lg hover:bg-port-navy-light transition-colors"
          >
            Browse Files
          </button>
          <input
            type="file"
            accept=".xlsx,.xls"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* File Selected Card */}
        {file && (
          <div className="mt-4 bg-port-bg rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-port-text">{file.name}</p>
                <p className="text-xs text-port-muted">{formatFileSize(file.size)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={removeFile}
              className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Year Selector */}
        <div className="mt-6">
          <label className="text-sm font-medium text-port-text mb-1.5 block">
            Financial Year
          </label>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-port-accent focus:outline-none focus:border-port-accent text-sm transition-all"
          >
            <option value="">Select year</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Message Area */}
        {message && (
          <div
            className={`mt-4 rounded-xl p-4 flex items-center gap-2 ${
              messageType === 'success'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            {messageType === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span className="text-sm">{message}</span>
          </div>
        )}

        {/* Upload Button */}
        <div className="mt-6">
          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || !year || uploading}
            className="w-full bg-port-accent text-port-navy font-semibold py-3 px-8 rounded-xl hover:bg-port-accent-light disabled:opacity-50 transition-all duration-300 hover:shadow-lg flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Upload Report
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadReport;
