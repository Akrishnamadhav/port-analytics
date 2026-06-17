import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Anchor,
  LayoutDashboard,
  FileBarChart,
  Upload,
  ClipboardCheck,
  Shield,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const roleDescriptions = {
    admin: 'Full access to all features including user management and report approvals',
    analyst: 'Can upload reports and view all analytics dashboards',
    viewer: 'Can view dashboards and analytics reports',
  };

  const allCards = [
    {
      title: 'Main Dashboard',
      description: 'View comprehensive financial overview and key metrics',
      icon: LayoutDashboard,
      iconColor: 'text-port-navy',
      iconBg: 'bg-port-navy/5',
      path: '/dashboard',
      roles: ['viewer', 'analyst', 'admin'],
    },
    {
      title: 'Customs Reports',
      description: 'Analyze customs data with interactive charts and visualizations',
      icon: FileBarChart,
      iconColor: 'text-port-accent',
      iconBg: 'bg-port-accent/10',
      path: '/charts/yearly-comparison',
      roles: ['viewer', 'analyst', 'admin'],
    },
    {
      title: 'Upload Report',
      description: 'Upload new financial and customs reports for analysis',
      icon: Upload,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
      path: '/upload',
      roles: ['analyst', 'admin'],
    },
    {
      title: 'Review Reports',
      description: 'Review and approve pending report submissions',
      icon: ClipboardCheck,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
      path: '/review',
      roles: ['admin'],
    },
  ];

  const visibleCards = allCards.filter((card) =>
    card.roles.includes(user?.role)
  );

  return (
    <div>
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-port-navy to-port-navy-light rounded-2xl p-8 relative overflow-hidden">
        <Anchor className="absolute right-8 top-1/2 -translate-y-1/2 w-32 h-32 text-white/10" />
        <h1 className="text-3xl font-bold text-white">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-port-accent-light mt-2">
          Port Financial Analytics Platform
        </p>
        <p className="text-white/60 text-sm mt-4">{today}</p>
      </div>

      {/* Navigation Cards Grid */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleCards.map((card, index) => {
          const IconComponent = card.icon;
          return (
            <div
              key={card.title}
              onClick={() => navigate(card.path)}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border border-gray-100 group animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${card.iconBg}`}
              >
                <IconComponent className={`w-6 h-6 ${card.iconColor}`} />
              </div>
              <h3 className="text-lg font-semibold text-port-text group-hover:text-port-navy transition-colors">
                {card.title}
              </h3>
              <p className="text-port-muted text-sm mt-2">{card.description}</p>
              <ArrowRight className="w-5 h-5 mt-4 text-port-muted group-hover:text-port-navy group-hover:translate-x-1 transition-all" />
            </div>
          );
        })}
      </div>

      {/* Role Info Card */}
      <div className="mt-8 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <Shield className="w-5 h-5 text-port-navy" />
          <h3 className="text-lg font-semibold text-port-text">
            Your Access Level
          </h3>
        </div>
        <p className="text-port-text">
          <span className="font-bold capitalize">{user?.role}</span>
          {' — '}
          {roleDescriptions[user?.role] || 'Standard access to the platform'}
        </p>
      </div>
    </div>
  );
};

export default Home;
