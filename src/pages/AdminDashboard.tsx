import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Users, Clock, CheckSquare, BarChart2, LogOut, 
  Settings, ChevronDown, ChevronUp, DollarSign, UserPlus, X,
  BarChart3, Car, TrendingUp, MapPin
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOrder, Order } from '../context/OrderContext';
import CreateDriver from './CreateDriver';
import CreateUser from './CreateUser';
import EditUser from './EditUser';
import UserManagement from './UserManagement';
import Analytics from './Analytics';
import OrderManagement from './OrderManagement';
import FinanceManagement from './FinanceManagement';
import WithdrawalManagement from './WithdrawalManagement';
import TariffSettings from './TariffSettings';
import DriverPerformance from './DriverPerformance';
import DriverDetail from './DriverDetail';
import CustomerManagement from './CustomerManagement';
import CustomerDetail from './CustomerDetail';
import StandManagement from './StandManagement';

interface DriverStatus {
  id: string;
  name: string;
  status: 'online' | 'offline';
  lastActive: Date;
  location: string;
  totalTrips: number;
  totalEarnings: number;
}

// Mock data
const drivers: DriverStatus[] = [
  { 
    id: 'D001', 
    name: 'Budi Santoso', 
    status: 'online', 
    lastActive: new Date(), 
    location: 'Jl. Malioboro',
    totalTrips: 156,
    totalEarnings: 3120000
  },
  { 
    id: 'D002', 
    name: 'Ahmad Reza', 
    status: 'online', 
    lastActive: new Date(), 
    location: 'Jl. Pasar Kembang',
    totalTrips: 143,
    totalEarnings: 2860000
  },
  { 
    id: 'D003', 
    name: 'Joko Widodo', 
    status: 'offline', 
    lastActive: new Date(Date.now() - 3600000), 
    location: 'Jl. Kaliurang',
    totalTrips: 98,
    totalEarnings: 1960000
  },
  { 
    id: 'D004', 
    name: 'Siti Rahma', 
    status: 'online', 
    lastActive: new Date(), 
    location: 'Jl. Magelang',
    totalTrips: 167,
    totalEarnings: 3340000
  },
  { 
    id: 'D005', 
    name: 'Dewi Lestari', 
    status: 'offline', 
    lastActive: new Date(Date.now() - 7200000), 
    location: 'Jl. Solo',
    totalTrips: 134,
    totalEarnings: 2680000
  },
];

const Dashboard: React.FC = () => {
  const { orders } = useOrder();
  const location = useLocation();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  // Check for success message from navigation state
  useEffect(() => {
    if (location.state?.message) {
      setShowSuccessMessage(true);
      // Clear the message from state
      window.history.replaceState({}, document.title);
      // Auto hide after 5 seconds
      setTimeout(() => setShowSuccessMessage(false), 5000);
    }
  }, [location.state]);
  
  const activeOrders = (orders || []).filter(order => order.status === 'accepted');
  const completedOrders = (orders || []).filter(order => order.status === 'completed');
  const onlineDrivers = drivers.filter(driver => driver.status === 'online');
  
  const totalSystemEarnings = drivers.reduce((sum, driver) => sum + driver.totalEarnings, 0);
  const totalSystemTrips = drivers.reduce((sum, driver) => sum + driver.totalTrips, 0);
  
  return (
    <div className="p-6">
      {showSuccessMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckSquare className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                {location.state?.message || 'Driver berhasil ditambahkan!'}
              </p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setShowSuccessMessage(false)}
                className="inline-flex text-green-400 hover:text-green-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 p-5 rounded-lg border border-blue-100">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
              <Users size={24} className="text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-blue-500">Driver Online</p>
              <h3 className="text-2xl font-bold text-blue-700">{onlineDrivers.length}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 p-5 rounded-lg border border-green-100">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
              <Clock size={24} className="text-green-800" />
            </div>
            <div>
              <p className="text-sm text-green-800">Pesanan Aktif</p>
              <h3 className="text-2xl font-bold text-green-700">{activeOrders.length}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 p-5 rounded-lg border border-purple-100">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
              <CheckSquare size={24} className="text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-purple-500">Total Perjalanan</p>
              <h3 className="text-2xl font-bold text-purple-700">{totalSystemTrips}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-amber-50 p-5 rounded-lg border border-amber-100">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mr-4">
              <DollarSign size={24} className="text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-amber-500">Total Pendapatan</p>
              <h3 className="text-2xl font-bold text-amber-700">
                Rp {totalSystemEarnings.toLocaleString('id-ID')}
              </h3>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Pendapatan Driver</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID Driver
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Perjalanan
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Pendapatan
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lokasi Terakhir
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {drivers.map((driver) => (
                  <tr key={driver.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {driver.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {driver.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        driver.status === 'online' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {driver.status === 'online' ? 'Online' : 'Offline'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {driver.totalTrips}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Rp {driver.totalEarnings.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {driver.location}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={3} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Total Keseluruhan
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    {totalSystemTrips}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                    Rp {totalSystemEarnings.toLocaleString('id-ID')}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-4">Pesanan Terbaru</h2>
        {(orders || []).length > 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID Pesanan
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kode Becak
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jarak
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Harga
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Waktu
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(orders || []).map((order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.pedicabCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.distanceOption?.name || 'N/A'} ({order.distanceOption?.distance || 'N/A'})
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Rp {order.distanceOption?.price?.toLocaleString('id-ID') || '0'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {order.status === 'pending' ? 'Menunggu' :
                         order.status === 'accepted' ? 'Diterima' :
                         order.status === 'completed' ? 'Selesai' :
                         'Dibatalkan'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.timestamp?.toLocaleString('id-ID') || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
            Belum ada pesanan yang dibuat.
          </div>
        )}
      </div>
    </div>
  );
};

const SettingsPage: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Pengaturan</h1>
      <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900">Pengaturan Umum</h3>
          <p className="mt-1 text-sm text-gray-500">
            Pengaturan umum aplikasi GreenBecak.
          </p>
        </div>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900">Pengaturan Tarif</h3>
          <p className="mt-1 text-sm text-gray-500">
            Atur tarif untuk berbagai jarak perjalanan.
          </p>
        </div>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900">Pengaturan Notifikasi</h3>
          <p className="mt-1 text-sm text-gray-500">
            Atur notifikasi untuk admin dan pengemudi.
          </p>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar for larger screens */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64 bg-gray-800">
          <div className="flex items-center h-16 px-4 bg-gray-900">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-800 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">GT</span>
              </div>
              <span className="ml-2 text-white text-lg font-semibold">Admin Panel</span>
            </div>
          </div>
          <div className="flex flex-col flex-grow pt-5 overflow-y-auto">
            <nav className="flex-1 px-2 space-y-1">
              <Link 
                to="/admin" 
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  location.pathname === '/admin' 
                    ? 'text-white bg-gray-900' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <BarChart2 className={`mr-3 h-6 w-6 ${
                  location.pathname === '/admin' ? 'text-gray-300' : 'text-gray-400'
                }`} />
                Dashboard
              </Link>
              <Link 
                to="/admin/users" 
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  location.pathname === '/admin/users' || location.pathname === '/admin/create-user'
                    ? 'text-white bg-gray-900' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <UserPlus className={`mr-3 h-6 w-6 ${
                  location.pathname === '/admin/users' || location.pathname === '/admin/create-user' ? 'text-gray-300' : 'text-gray-400'
                }`} />
                User Management
              </Link>
              <Link 
                to="/admin/driver-performance" 
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  location.pathname === '/admin/driver-performance' || location.pathname.startsWith('/admin/driver-detail/')
                    ? 'text-white bg-gray-900' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <TrendingUp className={`mr-3 h-6 w-6 ${
                  location.pathname === '/admin/driver-performance' || location.pathname.startsWith('/admin/driver-detail/') ? 'text-gray-300' : 'text-gray-400'
                }`} />
                Driver Performance
              </Link>
              {/* <Link 
                to="/admin/customers" 
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  location.pathname === '/admin/customers' || location.pathname.startsWith('/admin/customer-detail/')
                    ? 'text-white bg-gray-900' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Users className={`mr-3 h-6 w-6 ${
                  location.pathname === '/admin/customers' || location.pathname.startsWith('/admin/customer-detail/') ? 'text-gray-300' : 'text-gray-400'
                }`} />
                Customer Management
              </Link>
              <Link 
                to="/admin/analytics" 
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  location.pathname === '/admin/analytics' 
                    ? 'text-white bg-gray-900' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <BarChart3 className={`mr-3 h-6 w-6 ${
                  location.pathname === '/admin/analytics' ? 'text-gray-300' : 'text-gray-400'
                }`} />
                Analytics & Laporan
              </Link> */}
              <Link 
                to="/admin/orders" 
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  location.pathname === '/admin/orders' 
                    ? 'text-white bg-gray-900' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Car className={`mr-3 h-6 w-6 ${
                  location.pathname === '/admin/orders' ? 'text-gray-300' : 'text-gray-400'
                }`} />
                Order Management
              </Link>
              <Link 
                to="/admin/finance" 
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  location.pathname === '/admin/finance' 
                    ? 'text-white bg-gray-900' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <DollarSign className={`mr-3 h-6 w-6 ${
                  location.pathname === '/admin/finance' ? 'text-gray-300' : 'text-gray-400'
                }`} />
                Financial Management
              </Link>
              
              <Link 
                to="/admin/tariff" 
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  location.pathname === '/admin/tariff' 
                    ? 'text-white bg-gray-900' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <DollarSign className={`mr-3 h-6 w-6 ${
                  location.pathname === '/admin/tariff' ? 'text-gray-300' : 'text-gray-400'
                }`} />
                Pengaturan Tarif
              </Link>
              {/* <Link 
                to="/admin/settings" 
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  location.pathname === '/admin/settings' 
                    ? 'text-white bg-gray-900' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Settings className={`mr-3 h-6 w-6 ${
                  location.pathname === '/admin/settings' ? 'text-gray-300' : 'text-gray-400'
                }`} />
                Pengaturan
              </Link>
              <Link 
                to="/admin/stands" 
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  location.pathname === '/admin/stands' 
                    ? 'text-white bg-gray-900' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <MapPin className={`mr-3 h-6 w-6 ${
                  location.pathname === '/admin/stands' ? 'text-gray-300' : 'text-gray-400'
                }`} />
                Stand Management
              </Link> */}
              <button
                onClick={handleLogout}
                className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white w-full text-left"
              >
                <LogOut className="mr-3 h-6 w-6 text-gray-400" />
                Keluar
              </button>
            </nav>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top navigation for mobile */}
        <div className="md:hidden">
          <div className="flex items-center justify-between bg-gray-800 border-b border-gray-700 px-4 py-2">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-800 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">GT</span>
              </div>
              <span className="ml-2 text-white text-lg font-semibold">Admin</span>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-400 hover:text-white focus:outline-none"
            >
              {isMobileMenuOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </button>
          </div>
          
          {/* Mobile menu */}
          {isMobileMenuOpen && (
            <div className="bg-gray-800 pt-2 pb-3 space-y-1 sm:px-3">
              <Link 
                to="/admin" 
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  location.pathname === '/admin' 
                    ? 'text-white bg-gray-900' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link 
                to="/admin/users" 
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  location.pathname === '/admin/users' || location.pathname === '/admin/create-user'
                    ? 'text-white bg-gray-900' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                User Management
              </Link>
              <Link 
                to="/admin/driver-performance" 
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  location.pathname === '/admin/driver-performance' || location.pathname.startsWith('/admin/driver-detail/')
                    ? 'text-white bg-gray-900' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Driver Performance
              </Link>
              <Link 
                to="/admin/customers" 
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  location.pathname === '/admin/customers' || location.pathname.startsWith('/admin/customer-detail/')
                    ? 'text-white bg-gray-900' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Customer Management
              </Link>
              <Link 
                to="/admin/analytics" 
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  location.pathname === '/admin/analytics' 
                    ? 'text-white bg-gray-900' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Analytics & Laporan
              </Link>
              <Link 
                to="/admin/orders" 
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  location.pathname === '/admin/orders' 
                    ? 'text-white bg-gray-900' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Order Management
              </Link>
              <Link 
                to="/admin/finance" 
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  location.pathname === '/admin/finance' 
                    ? 'text-white bg-gray-900' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Financial Management
              </Link>
              <Link 
                to="/admin/withdrawals" 
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  location.pathname === '/admin/withdrawals' 
                    ? 'text-white bg-gray-900' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Withdrawal Management
              </Link>
              <Link 
                to="/admin/tariff" 
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  location.pathname === '/admin/tariff' 
                    ? 'text-white bg-gray-900' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Pengaturan Tarif
              </Link>
              <Link 
                to="/admin/settings" 
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  location.pathname === '/admin/settings' 
                    ? 'text-white bg-gray-900' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Pengaturan
              </Link>
              <Link 
                to="/admin/stands" 
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  location.pathname === '/admin/stands' 
                    ? 'text-white bg-gray-900' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Stand Management
              </Link>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                Keluar
              </button>
            </div>
          )}
        </div>
        
        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-gray-100">
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="create-user" element={<CreateUser />} />
            <Route path="edit-user/:userId" element={<EditUser />} />
            <Route path="create-driver" element={<CreateDriver />} />
            <Route path="driver-performance" element={<DriverPerformance />} />
            <Route path="driver-detail/:id" element={<DriverDetail />} />
            <Route path="customers" element={<CustomerManagement />} />
            <Route path="customer-detail/:id" element={<CustomerDetail />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="orders" element={<OrderManagement />} />
            <Route path="finance" element={<FinanceManagement />} />
            <Route path="withdrawals" element={<WithdrawalManagement />} />
            <Route path="tariff" element={<TariffSettings />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="stands" element={<StandManagement />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;