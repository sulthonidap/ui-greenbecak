import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { OrderProvider } from './context/OrderContext';
import LandingPage from './pages/LandingPage';
import OrderPage from './pages/OrderPage';
import PaymentPage from './pages/PaymentPage';
import AdminLogin from './pages/AdminLogin';
import DriverLogin from './pages/DriverLogin';
import AdminDashboard from './pages/AdminDashboard';
import DriverDashboard from './pages/DriverDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

const AppContent: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  
  // Cek apakah path saat ini adalah dashboard admin atau driver
  const isDashboardPath = location.pathname.startsWith('/admin') || location.pathname.startsWith('/driver');
  
  // Tampilkan Navbar dan Footer hanya jika pengguna tidak terautentikasi atau tidak berada di halaman dashboard
  const shouldShowNavbarFooter = !isAuthenticated || !isDashboardPath;

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat aplikasi...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
      {shouldShowNavbarFooter && <Navbar />}
      <main className={shouldShowNavbarFooter ? 'min-h-screen' : 'h-screen'}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/pesan" element={<OrderPage />} />
          <Route path="/pembayaran" element={<PaymentPage />} />
          <Route path="/login-admin" element={<AdminLogin />} />
          <Route path="/login-driver" element={<DriverLogin />} />
          <Route 
            path="/admin/*" 
            element={
              <ProtectedRoute userType="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/driver/*" 
            element={
              <ProtectedRoute userType="driver">
                <DriverDashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>
      {shouldShowNavbarFooter && <Footer />}
    </>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <OrderProvider>
        <Router>
          <AppContent />
        </Router>
      </OrderProvider>
    </AuthProvider>
  );
};

export default App;