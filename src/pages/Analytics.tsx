import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Users, Car, DollarSign, Calendar, BarChart3, PieChart, Activity, Target, Award, Clock } from 'lucide-react';

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  activeDrivers: number;
  averageRating: number;
  completionRate: number;
  monthlyRevenue: { month: string; revenue: number }[];
  orderStatus: { status: string; count: number }[];
  topDrivers: { name: string; earnings: number; trips: number; rating: number }[];
  vehiclePerformance: { type: string; orders: number; revenue: number }[];
}

const mockAnalyticsData: AnalyticsData = {
  totalRevenue: 15420000,
  totalOrders: 1247,
  activeDrivers: 23,
  averageRating: 4.6,
  completionRate: 94.2,
  monthlyRevenue: [
    { month: 'Jan', revenue: 1200000 },
    { month: 'Feb', revenue: 1350000 },
    { month: 'Mar', revenue: 1420000 },
    { month: 'Apr', revenue: 1380000 },
    { month: 'May', revenue: 1560000 },
    { month: 'Jun', revenue: 1620000 },
    { month: 'Jul', revenue: 1580000 },
    { month: 'Aug', revenue: 1650000 },
    { month: 'Sep', revenue: 1720000 },
    { month: 'Oct', revenue: 1680000 },
    { month: 'Nov', revenue: 1750000 },
    { month: 'Dec', revenue: 1542000 }
  ],
  orderStatus: [
    { status: 'Completed', count: 892 },
    { status: 'Ongoing', count: 156 },
    { status: 'Pending', count: 89 },
    { status: 'Cancelled', count: 110 }
  ],
  topDrivers: [
    { name: 'Budi Santoso', earnings: 3120000, trips: 156, rating: 4.8 },
    { name: 'Siti Rahma', earnings: 3340000, trips: 167, rating: 4.7 },
    { name: 'Ahmad Reza', earnings: 2860000, trips: 143, rating: 4.6 },
    { name: 'Dewi Lestari', earnings: 2680000, trips: 134, rating: 4.5 },
    { name: 'Joko Widodo', earnings: 1960000, trips: 98, rating: 4.4 }
  ],
  vehiclePerformance: [
    { type: 'Becak Listrik', orders: 756, revenue: 9450000 },
    { type: 'Delman', orders: 491, revenue: 5970000 }
  ]
};

const Analytics: React.FC = () => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [data] = useState<AnalyticsData>(mockAnalyticsData);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Ongoing': return 'bg-blue-100 text-blue-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali ke Dashboard
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Analytics & Laporan</h1>
        <p className="text-gray-600 mt-2">Dashboard analisis performa GreenBecak</p>
      </div>

      {/* Filter Time Range */}
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Periode:</span>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as 'week' | 'month' | 'quarter' | 'year')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="week">Minggu Ini</option>
            <option value="month">Bulan Ini</option>
            <option value="quarter">Kuartal Ini</option>
            <option value="year">Tahun Ini</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Pendapatan</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.totalRevenue)}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>+12.5% dari bulan lalu</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Car className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Order</p>
              <p className="text-2xl font-bold text-gray-900">{data.totalOrders.toLocaleString('id-ID')}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-blue-600">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>+8.3% dari bulan lalu</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Driver Aktif</p>
              <p className="text-2xl font-bold text-gray-900">{data.activeDrivers}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-purple-600">
            <Activity className="w-4 h-4 mr-1" />
            <span>Rata-rata {data.averageRating}/5.0</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Target className="w-6 h-6 text-amber-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{data.completionRate}%</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-amber-600">
            <Clock className="w-4 h-4 mr-1" />
            <span>Rata-rata 15 menit</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Pendapatan Bulanan</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {data.monthlyRevenue.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{item.month}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${(item.revenue / Math.max(...data.monthlyRevenue.map(m => m.revenue))) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{formatCurrency(item.revenue)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Status Chart */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Status Order</h3>
            <PieChart className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {data.orderStatus.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(item.status).split(' ')[0]}`}></div>
                  <span className="text-sm text-gray-600">{item.status}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Drivers */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top 5 Driver</h3>
            <Award className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {data.topDrivers.map((driver, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-green-600">{index + 1}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{driver.name}</p>
                    <p className="text-xs text-gray-500">{driver.trips} perjalanan • ⭐ {driver.rating}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(driver.earnings)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Vehicle Performance */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Performa Kendaraan</h3>
            <Car className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {data.vehiclePerformance.map((vehicle, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Car className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{vehicle.type}</p>
                    <p className="text-xs text-gray-500">{vehicle.orders} order</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(vehicle.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Aksi Cepat</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/admin/orders')}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Car className="w-5 h-5 text-blue-600 mr-3" />
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">Lihat Semua Order</p>
              <p className="text-xs text-gray-500">Kelola order aktif</p>
            </div>
          </button>
          
          <button
            onClick={() => navigate('/admin/users')}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Users className="w-5 h-5 text-green-600 mr-3" />
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">Kelola Driver</p>
              <p className="text-xs text-gray-500">Lihat performa driver</p>
            </div>
          </button>
          
          <button
            onClick={() => navigate('/admin/finance')}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <DollarSign className="w-5 h-5 text-amber-600 mr-3" />
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">Laporan Keuangan</p>
              <p className="text-xs text-gray-500">Detail pendapatan</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
