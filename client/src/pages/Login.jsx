import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Anchor, Mail, Lock, Eye, EyeOff, XCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const auth = useAuth();
  const navigate = useNavigate();

  if (auth.user) {
    return <Navigate to="/home" />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await auth.login(email, password);
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel — Branding */}
      <div className="lg:w-1/2 bg-gradient-to-br from-port-navy to-port-navy-dark hidden sm:flex flex-col items-center justify-center relative overflow-hidden">
        {/* Decorative Circles */}
        <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute bottom-10 -right-16 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute top-1/3 right-10 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute -bottom-12 left-1/4 w-72 h-72 rounded-full bg-white/5" />

        {/* Content */}
        <Anchor className="w-24 h-24 text-port-accent animate-wave" />
        <h1 className="text-4xl lg:text-5xl font-extrabold text-white mt-6">
          Port Authority
        </h1>
        <p className="text-xl text-port-accent-light mt-2">
          Financial Analytics Platform
        </p>
        <p className="text-white/60 mt-4 text-sm">
          Comprehensive customs and financial data analytics
        </p>
      </div>

      {/* Right Panel — Login Form */}
      <div className="lg:w-1/2 flex items-center justify-center bg-port-bg p-8">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-10">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-port-text">Welcome Back</h2>
            <p className="text-port-muted text-sm mt-1">Sign in to your account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-port-text mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-port-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@portauthority.com"
                  className="w-full bg-port-bg border border-gray-200 rounded-xl px-4 py-3 pl-11 text-sm focus:outline-none focus:ring-2 focus:ring-port-accent focus:border-port-accent transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-port-text mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-port-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-port-bg border border-gray-200 rounded-xl px-4 py-3 pl-11 text-sm focus:outline-none focus:ring-2 focus:ring-port-accent focus:border-port-accent transition-all"
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

            {/* Error Area */}
            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
                <XCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full bg-port-accent hover:bg-port-accent-light text-port-navy font-semibold py-3 rounded-xl transition-all duration-300 hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
