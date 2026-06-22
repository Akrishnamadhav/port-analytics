import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Home from './pages/Home';
import MainDashboard from './pages/MainDashboard';
import UploadReport from './pages/UploadReport';
import MyUploads from './pages/MyUploads';
import ReviewReports from './pages/ReviewReports';
import CreateUser from './pages/CreateUser';

// Chart Pages
import YearlyComparison from './pages/charts/YearlyComparison';
import HistoricalTrends from './pages/charts/HistoricalTrends';
import VesselVisitBreakdown from './pages/charts/VesselVisitBreakdown';
import TopShippingLines from './pages/charts/TopShippingLines';
import CompanyRevenueShare from './pages/charts/CompanyRevenueShare';
import VesselRevenueBreakdown from './pages/charts/VesselRevenueBreakdown';
import RevenueTrends from './pages/charts/RevenueTrends';
import TonnageTrends from './pages/charts/TonnageTrends';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Login Route */}
          <Route path="/" element={<Login />} />

          {/* Authenticated Shared Routes */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['viewer', 'analyst', 'admin']}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/home" element={<Home />} />
            <Route path="/dashboard" element={<MainDashboard />} />
            
            {/* Customs Report charts */}
            <Route path="/charts/yearly-comparison" element={<YearlyComparison />} />
            <Route path="/charts/historical-trends" element={<HistoricalTrends />} />
            <Route path="/charts/vessel-visit-breakdown" element={<VesselVisitBreakdown />} />
            <Route path="/charts/top-shipping-lines" element={<TopShippingLines />} />
            <Route path="/charts/company-revenue-share" element={<CompanyRevenueShare />} />
            <Route path="/charts/vessel-revenue-breakdown" element={<VesselRevenueBreakdown />} />
            <Route path="/charts/revenue-trends" element={<RevenueTrends />} />
            <Route path="/charts/tonnage-trends" element={<TonnageTrends />} />
          </Route>

          {/* Analyst & Admin Routes */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['analyst', 'admin']}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/upload" element={<UploadReport />} />
            <Route path="/my-uploads" element={<MyUploads />} />
          </Route>

          {/* Admin Only Routes */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/review" element={<ReviewReports />} />
            <Route path="/create-user" element={<CreateUser />} />
          </Route>

          {/* Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
