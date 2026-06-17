import React, { useState } from 'react';
import {
  UserPlus,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Shield,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const CreateUser = () => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('viewer');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' | 'error'

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setMessageType('');

    try {
      await api.post('/api/users', { name, email, password, role });
      setMessage('User created successfully!');
      setMessageType('success');
      setName('');
      setEmail('');
      setPassword('');
      setRole('viewer');
    } catch (err) {
      setMessage(err.response?.data?.error || err.response?.data?.message || 'Failed to create user');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-xl shadow-md p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-port-accent/10 rounded-lg flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-port-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-port-text">Create New User</h1>
              <p className="text-port-muted text-sm mt-1">Add a new user to the platform</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Name Field */}
          <div className="mb-5">
            <label className="text-sm font-medium text-port-text mb-1.5 block">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-port-muted" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter full name"
                required
                className="w-full bg-port-bg border border-gray-200 rounded-xl px-4 py-3 pl-11 text-sm focus:outline-none focus:ring-2 focus:ring-port-accent focus:border-port-accent transition-all"
              />
            </div>
          </div>

          {/* Email Field */}
          <div className="mb-5">
            <label className="text-sm font-medium text-port-text mb-1.5 block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-port-muted" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                required
                className="w-full bg-port-bg border border-gray-200 rounded-xl px-4 py-3 pl-11 text-sm focus:outline-none focus:ring-2 focus:ring-port-accent focus:border-port-accent transition-all"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="mb-5">
            <label className="text-sm font-medium text-port-text mb-1.5 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-port-muted" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="w-full bg-port-bg border border-gray-200 rounded-xl px-4 py-3 pl-11 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-port-accent focus:border-port-accent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-port-muted hover:text-port-text transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Role Field */}
          <div className="mb-5">
            <label className="text-sm font-medium text-port-text mb-1.5 block">Role</label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-port-muted" />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-port-bg border border-gray-200 rounded-xl px-4 py-3 pl-11 text-sm focus:outline-none focus:ring-2 focus:ring-port-accent focus:border-port-accent transition-all appearance-none"
              >
                <option value="viewer">Viewer</option>
                <option value="analyst">Analyst</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {/* Message Area */}
          {message && (
            <div
              className={`mb-4 rounded-xl p-4 flex items-center gap-2 text-sm ${
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
              <span>{message}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-port-accent text-port-navy font-semibold py-3 rounded-xl hover:bg-port-accent-light transition-all duration-300 hover:shadow-lg disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating User...
              </>
            ) : (
              'Create User'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateUser;
