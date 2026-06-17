import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Anchor,
  Home,
  LayoutDashboard,
  FileBarChart,
  ChevronDown,
  ChevronRight,
  Upload,
  FileText,
  ClipboardCheck,
  UserPlus,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const chartSubItems = [
  { label: 'Yearly Comparison', path: '/charts/yearly-comparison' },
  { label: 'Historical Trends', path: '/charts/historical-trends' },
  { label: 'Top Shipping Lines', path: '/charts/top-shipping-lines' },
  { label: 'Company Revenue Share', path: '/charts/company-revenue-share' },
  { label: 'Tonnage Trends', path: '/charts/tonnage-trends' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [chartsOpen, setChartsOpen] = useState(false);

  useEffect(() => {
    if (location.pathname.startsWith('/charts')) {
      setChartsOpen(true);
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const role = user?.role;

  const linkBase =
    'flex items-center gap-3 px-5 py-3 text-sm font-medium transition-all duration-200 border-l-4';
  const activeClass = 'bg-port-navy-dark border-port-accent text-white';
  const inactiveClass =
    'text-white/70 hover:bg-white/5 hover:text-white border-transparent';

  return (
    <aside className="fixed left-0 top-0 w-[260px] h-screen bg-port-navy text-white overflow-y-auto flex flex-col z-30">
      {/* Logo */}
      <div className="py-6 px-5 flex items-center gap-3 border-b border-white/10">
        <Anchor className="w-8 h-8 text-port-accent" />
        <span className="text-xl font-bold">Port Analytics</span>
      </div>

      {/* Navigation */}
      <nav className="mt-4 flex-1">
        {/* Home */}
        <NavLink
          to="/home"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? activeClass : inactiveClass}`
          }
        >
          <Home className="w-5 h-5" />
          Home
        </NavLink>

        {/* Main Dashboard */}
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? activeClass : inactiveClass}`
          }
        >
          <LayoutDashboard className="w-5 h-5" />
          Main Dashboard
        </NavLink>

        {/* Customs Report — Expandable */}
        <button
          onClick={() => setChartsOpen((prev) => !prev)}
          className={`${linkBase} w-full border-transparent text-white/70 hover:bg-white/5 hover:text-white`}
        >
          <FileBarChart className="w-5 h-5" />
          <span className="flex-1 text-left">Customs Report</span>
          {chartsOpen ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>

        {/* Chart Sub-items */}
        <div
          className={`overflow-hidden transition-all duration-300 ${
            chartsOpen ? 'max-h-[500px]' : 'max-h-0'
          }`}
        >
          {chartSubItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `${linkBase} pl-12 ${isActive ? activeClass : inactiveClass}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* Upload Report — analyst, admin */}
        {(role === 'analyst' || role === 'admin') && (
          <NavLink
            to="/upload"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? activeClass : inactiveClass}`
            }
          >
            <Upload className="w-5 h-5" />
            Upload Report
          </NavLink>
        )}

        {/* My Uploads — analyst, admin */}
        {(role === 'analyst' || role === 'admin') && (
          <NavLink
            to="/my-uploads"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? activeClass : inactiveClass}`
            }
          >
            <FileText className="w-5 h-5" />
            My Uploads
          </NavLink>
        )}

        {/* Review Reports — admin only */}
        {role === 'admin' && (
          <NavLink
            to="/review"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? activeClass : inactiveClass}`
            }
          >
            <ClipboardCheck className="w-5 h-5" />
            Review Reports
          </NavLink>
        )}

        {/* Create User — admin only */}
        {role === 'admin' && (
          <NavLink
            to="/create-user"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? activeClass : inactiveClass}`
            }
          >
            <UserPlus className="w-5 h-5" />
            Create User
          </NavLink>
        )}
      </nav>

      {/* Logout */}
      <div className="border-t border-white/10 mt-auto">
        <button
          onClick={handleLogout}
          className={`${linkBase} w-full border-transparent text-white/70 hover:bg-white/5 hover:text-white`}
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
