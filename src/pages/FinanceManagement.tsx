import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, TrendingUp, TrendingDown, Users, Car, Calendar, BarChart3, PieChart, Download, Filter, Eye, Edit3, Trash2, Plus, Wallet, CreditCard, Banknote, Receipt, Clock, AlertCircle, CheckCircle, XCircle, ArrowUpRight, ArrowDownRight, Target, Award, Zap, Settings, AlertTriangle, X, RefreshCcw } from 'lucide-react';
import WithdrawalManagement from './WithdrawalManagement';
import { adminAPI } from '../services/api';

interface DriverFinancialData {
  id: string;
  name: string;
  currentBalance: number;
  totalEarnings: number;
  thisMonthEarnings: number;
  lastMonthEarnings: number;
  pendingWithdrawals: number;
  completedWithdrawals: number;
  totalTrips: number;
  averagePerTrip: number;
  rating: number;
  status: 'active' | 'inactive';
  lastWithdrawal: {
    amount: number;
    date: Date;
    status: 'pending' | 'approved' | 'rejected';
  };
  monthlyEarnings: { month: string; earnings: number; trips: number }[];
  recentTransactions: { type: 'trip' | 'withdrawal' | 'bonus'; amount: number; date: Date; description: string }[];
}

// Mock data removed - now using real API data

const FinanceManagement: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'withdrawals'>('dashboard');
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');
  const [data, setData] = useState<DriverFinancialData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showWithdrawalAlert, setShowWithdrawalAlert] = useState(false);
  const [newWithdrawals, setNewWithdrawals] = useState<DriverFinancialData[]>([]);

  // Fetch driver financial data from API
  const fetchDriverFinancialData = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching driver financial data...');
      const response = await adminAPI.getDriverFinancialData();
      console.log('Driver financial data response:', response);
      console.log('Response drivers:', response.drivers);
      
      // Validate response
      if (!response.drivers || !Array.isArray(response.drivers)) {
        throw new Error('Invalid response format: drivers data is missing or not an array');
      }
      
      // Transform API response to match interface
      const transformedData: DriverFinancialData[] = response.drivers.map((driver: any) => ({
        id: driver.id.toString(),
        name: driver.name,
        currentBalance: driver.current_balance || 0,
        totalEarnings: driver.total_earnings || 0,
        thisMonthEarnings: driver.this_month_earnings || 0,
        lastMonthEarnings: driver.last_month_earnings || 0,
        pendingWithdrawals: driver.pending_withdrawals || 0,
        completedWithdrawals: driver.completed_withdrawals || 0,
        totalTrips: driver.total_trips || 0,
        averagePerTrip: driver.average_per_trip || 0,
        rating: driver.rating || 0,
        status: driver.status === 'active' ? 'active' : 'inactive',
        lastWithdrawal: {
          amount: driver.last_withdrawal?.amount || 0,
          date: new Date(driver.last_withdrawal?.date || new Date()),
          status: driver.last_withdrawal?.status || 'pending'
        },
        monthlyEarnings: driver.monthly_earnings?.map((item: any) => ({
          month: item.month,
          earnings: item.earnings,
          trips: item.trips
        })) || [],
        recentTransactions: driver.recent_transactions?.map((item: any) => ({
          type: item.type,
          amount: item.amount,
          date: new Date(item.date),
          description: item.description
        })) || []
      }));
      
      // Check for new withdrawal requests
      const pendingWithdrawals = transformedData.filter(driver => driver.pendingWithdrawals > 0);
      if (pendingWithdrawals.length > 0) {
        setNewWithdrawals(pendingWithdrawals);
        setShowWithdrawalAlert(true);
        
        // Play notification sound for new withdrawals (optional)
        try {
          const audio = new Audio('/notification.mp3');
          audio.play().catch(() => {
            // Ignore audio play errors
          });
        } catch (error) {
          // Ignore audio errors
        }
      }
      
      setData(transformedData);
      
      // Set first driver as selected if available
      if (transformedData.length > 0 && !selectedDriver) {
        setSelectedDriver(transformedData[0].id);
      }
      
    } catch (error: any) {
      console.error('Failed to fetch driver financial data:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: error.config
      });
      
      // Provide more specific error messages
      if (error.response?.status === 401) {
        setError('Anda harus login sebagai admin untuk mengakses data keuangan driver');
      } else if (error.response?.status === 403) {
        setError('Anda tidak memiliki akses ke data keuangan driver');
      } else if (error.code === 'ERR_NETWORK') {
        setError('Tidak dapat terhubung ke server. Pastikan backend sudah running di port 8080');
      } else if (error.response?.status === 500) {
        setError('Terjadi kesalahan internal server. Silakan coba lagi nanti.');
      } else {
        setError(error.response?.data?.message || 'Gagal memuat data keuangan driver. Silakan coba lagi.');
      }
      
      setData([]);
      
      // Fallback to mock data for development
      if (import.meta.env.DEV) {
        console.log('Using mock data as fallback...');
        const mockData: DriverFinancialData[] = [
          {
            id: '1',
            name: 'Budi Santoso',
            currentBalance: 2450000,
            totalEarnings: 3120000,
            thisMonthEarnings: 450000,
            lastMonthEarnings: 380000,
            pendingWithdrawals: 500000,
            completedWithdrawals: 1200000,
            totalTrips: 156,
            averagePerTrip: 20000,
            rating: 4.8,
            status: 'active',
            lastWithdrawal: {
              amount: 300000,
              date: new Date('2024-12-15'),
              status: 'approved'
            },
            monthlyEarnings: [
              { month: 'Jan', earnings: 380000, trips: 19 },
              { month: 'Feb', earnings: 420000, trips: 21 },
              { month: 'Mar', earnings: 450000, trips: 22 }
            ],
            recentTransactions: [
              { type: 'trip', amount: 25000, date: new Date('2024-12-19T10:30:00'), description: 'Trip dari Malioboro ke Taman Sari' },
              { type: 'withdrawal', amount: -300000, date: new Date('2024-12-15T14:20:00'), description: 'Penarikan ke Bank BCA' },
              { type: 'trip', amount: 32000, date: new Date('2024-12-18T16:45:00'), description: 'Trip dari Keraton ke Alun-Alun' }
            ]
          },
          {
            id: '2',
            name: 'Siti Rahma',
            currentBalance: 1890000,
            totalEarnings: 3340000,
            thisMonthEarnings: 520000,
            lastMonthEarnings: 480000,
            pendingWithdrawals: 0,
            completedWithdrawals: 1500000,
            totalTrips: 167,
            averagePerTrip: 20000,
            rating: 4.9,
            status: 'active',
            lastWithdrawal: {
              amount: 300000,
              date: new Date('2024-12-19T09:15:00'),
              status: 'approved'
            },
            monthlyEarnings: [
              { month: 'Jan', earnings: 480000, trips: 24 },
              { month: 'Feb', earnings: 520000, trips: 26 },
              { month: 'Mar', earnings: 580000, trips: 29 }
            ],
            recentTransactions: [
              { type: 'trip', amount: 28000, date: new Date('2024-12-19T11:20:00'), description: 'Trip dari Pasar Kembang ke Malioboro' },
              { type: 'withdrawal', amount: -300000, date: new Date('2024-12-19T09:15:00'), description: 'Penarikan ke OVO' },
              { type: 'trip', amount: 35000, date: new Date('2024-12-18T15:30:00'), description: 'Trip dari UGM ke Malioboro' }
            ]
          }
        ];
        setData(mockData);
        if (!selectedDriver) {
          setSelectedDriver('1');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchDriverFinancialData();
    
    // Auto-refresh every 2 minutes to check for new withdrawals
    const interval = setInterval(() => {
      fetchDriverFinancialData();
    }, 120000); // 2 minutes
    
    return () => clearInterval(interval);
  }, []);

  const currentDriver = data.find(driver => driver.id === selectedDriver);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getGrowthRate = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const getWithdrawalStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'trip':
        return <Car className="w-4 h-4 text-blue-500" />;
      case 'withdrawal':
        return <CreditCard className="w-4 h-4 text-red-500" />;
      case 'bonus':
        return <Award className="w-4 h-4 text-green-500" />;
      default:
        return <DollarSign className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <span className="ml-3 text-lg text-gray-600">Memuat data keuangan driver...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
          <button 
            onClick={fetchDriverFinancialData}
            className="mt-3 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  if (!currentDriver) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Tidak ada data driver yang tersedia</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Financial Management</h1>
            <p className="text-gray-600 mt-2">Kelola keuangan dan saldo driver GreenBecak</p>
          </div>
          <button
            onClick={fetchDriverFinancialData}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-400 flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Loading...
              </>
            ) : (
              <>
                <div className="w-4 h-4 mr-2"><RefreshCcw className="w-4 h-4 mr-2" /></div>
                Refresh
              </>
            )}
          </button>
        </div>
      </div>

      {/* Withdrawal Alert */}
      {showWithdrawalAlert && newWithdrawals.length > 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-amber-600 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-amber-800">
                  Ada {newWithdrawals.length} driver mengajukan penarikan dana!
                </h3>
                <p className="text-sm text-amber-700 mt-1">
                  Total penarikan pending: {formatCurrency(newWithdrawals.reduce((sum, driver) => sum + driver.pendingWithdrawals, 0))}
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('withdrawals')}
                className="px-3 py-1 bg-amber-600 text-white text-sm rounded-md hover:bg-amber-700"
              >
                Lihat Detail
              </button>
              <button
                onClick={() => setShowWithdrawalAlert(false)}
                className="text-amber-600 hover:text-amber-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          <button
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'dashboard'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('dashboard')}
          >
            Keuangan & Saldo Driver
          </button>
          <button
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'withdrawals'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('withdrawals')}
          >
            Withdrawal
          </button>
        </nav>
      </div>

      {activeTab === 'dashboard' ? (
        <>
          {/* Driver Selection */}
          <div className="mb-6">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Pilih Driver:</span>
              <select
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {data.map(driver => (
                  <option key={driver.id} value={driver.id}>{driver.name}</option>
                ))}
              </select>
              <span className="text-sm font-medium text-gray-700">Periode:</span>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as 'week' | 'month' | 'quarter')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="week">Minggu Ini</option>
                <option value="month">Bulan Ini</option>
                <option value="quarter">Kuartal Ini</option>
              </select>
            </div>
          </div>

          {/* Driver Info Card */}
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{currentDriver.name}</h2>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>ID: {currentDriver.id}</span>
                    <span>•</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      currentDriver.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {currentDriver.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                    </span>
                    <span>•</span>
                    <div className="flex items-center">
                      <span>Rating: {currentDriver.rating}</span>
                      <Award className="w-4 h-4 text-yellow-500 ml-1" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Perjalanan</p>
                <p className="text-2xl font-bold text-blue-600">{currentDriver.totalTrips}</p>
              </div>
            </div>
          </div>

          {/* Key Financial Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Wallet className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Saldo Saat Ini</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(currentDriver.currentBalance)}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-green-600">
                <ArrowUpRight className="w-4 h-4 mr-1" />
                <span>+{formatCurrency(currentDriver.thisMonthEarnings)} bulan ini</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pendapatan Bulan Ini</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(currentDriver.thisMonthEarnings)}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-blue-600">
                {getGrowthRate(currentDriver.thisMonthEarnings, currentDriver.lastMonthEarnings) > 0 ? (
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 mr-1" />
                )}
                <span>{getGrowthRate(currentDriver.thisMonthEarnings, currentDriver.lastMonthEarnings).toFixed(1)}% dari bulan lalu</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <CreditCard className="w-6 h-6 text-amber-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Penarikan Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(currentDriver.pendingWithdrawals)}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-amber-600">
                <Clock className="w-4 h-4 mr-1" />
                <span>Menunggu approval</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Rata-rata per Trip</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(currentDriver.averagePerTrip)}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-purple-600">
                <Zap className="w-4 h-4 mr-1" />
                <span>{currentDriver.totalTrips} perjalanan total</span>
              </div>
            </div>
          </div>

          {/* Charts and Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Monthly Earnings Chart */}
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Pendapatan Bulanan</h3>
                <BarChart3 className="w-5 h-5 text-gray-400" />
              </div>
              <div className="space-y-3">
                {currentDriver.monthlyEarnings.slice(-6).map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{item.month}</span>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded"></div>
                        <span className="text-sm text-gray-900">{formatCurrency(item.earnings)}</span>
                      </div>
                      <span className="text-xs text-gray-500">({item.trips} trips)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Withdrawal Status */}
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Status Penarikan Terakhir</h3>
                <Receipt className="w-5 h-5 text-gray-400" />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getWithdrawalStatusIcon(currentDriver.lastWithdrawal.status)}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(currentDriver.lastWithdrawal.amount)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(currentDriver.lastWithdrawal.date)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      currentDriver.lastWithdrawal.status === 'approved' 
                        ? 'bg-green-100 text-green-800'
                        : currentDriver.lastWithdrawal.status === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {currentDriver.lastWithdrawal.status === 'approved' ? 'Disetujui' :
                       currentDriver.lastWithdrawal.status === 'pending' ? 'Menunggu' : 'Ditolak'}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-600">Total Penarikan</p>
                    <p className="text-lg font-bold text-green-700">
                      {formatCurrency(currentDriver.completedWithdrawals)}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-amber-50 rounded-lg">
                    <p className="text-sm text-amber-600">Pending</p>
                    <p className="text-lg font-bold text-amber-700">
                      {formatCurrency(currentDriver.pendingWithdrawals)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Transaksi Terbaru</h3>
              <button className="text-sm text-green-600 hover:text-green-700 font-medium">
                Lihat Semua
              </button>
            </div>
            <div className="space-y-3">
              {currentDriver.recentTransactions.map((transaction, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getTransactionIcon(transaction.type)}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-xs text-gray-500">{formatDate(transaction.date)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${
                      transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{transaction.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          
        </>
      ) : (
        <WithdrawalManagement embedded />
      )}
    </div>
  );
};

export default FinanceManagement;
