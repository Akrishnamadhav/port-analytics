import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

const pageTitleMap = {
  '/home': 'Home',
  '/dashboard': 'Main Dashboard',
  '/charts/yearly-comparison': 'Yearly Comparison',
  '/charts/historical-trends': 'Historical Trends',
  '/charts/revenue-breakdown': 'Revenue Breakdown',
  '/charts/profit-vs-expenses': 'Profit vs. Expenses',
  '/charts/top-shipping-lines': 'Top Shipping Lines',
  '/charts/company-revenue-share': 'Company Revenue Share',
  '/charts/cargo-breakdown': 'Cargo Breakdown',
  '/charts/tonnage-trends': 'Tonnage Trends',
  '/upload': 'Upload Report',
  '/my-uploads': 'My Uploads',
  '/review': 'Review Reports',
  '/create-user': 'Create User',
};

export default function Layout() {
  const { user } = useAuth();
  const location = useLocation();

  const pageTitle = pageTitleMap[location.pathname] || 'Port Analytics';
  const userInitial = user?.name?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className="flex">
      <Sidebar />

      <main className="ml-[260px] min-h-screen flex flex-col bg-port-bg w-full">
        {/* Top Bar */}
        <div className="h-16 bg-white shadow-sm px-6 flex items-center justify-between border-b border-gray-100">
          <h1 className="text-lg font-semibold text-port-text">{pageTitle}</h1>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">{user?.name}</span>
            <span className="text-xs px-2 py-1 rounded-full bg-port-navy/10 text-port-navy capitalize">
              {user?.role}
            </span>
            <div className="w-9 h-9 rounded-full bg-port-navy text-white flex items-center justify-center text-sm font-semibold">
              {userInitial}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
