import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  Car, 
  Clock, 
  Star, 
  Phone, 
  Mail, 
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  Route,
  User,
  MessageSquare,
  PhoneCall,
  CreditCard
} from 'lucide-react';

interface OrderHistory {
  id: string;
  date: string;
  vehicleCode: string;
  driver: string;
  tripType: string;
  distance: string;
  amount: number;
  paymentMethod: string;
  status: 'completed' | 'cancelled' | 'ongoing' | 'pending' | 'accepted';
  rating?: number;
  review?: string;
}

interface CustomerDetail {
  id: string;
  name: string;
  phone: string;
  firstOrder: string;
  lastOrder: string;
  totalOrders: number;
  totalSpent: number;
  averageRating: number;
  status: 'active' | 'inactive';
  favoriteDriver?: string;
  orderHistory: OrderHistory[];
}

const mockCustomerDetail: CustomerDetail = {
  id: '1',
  name: 'Customer 5678',
  phone: '+62 812-1234-5678',
  firstOrder: '2024-12-15',
  lastOrder: '2024-12-20',
  totalOrders: 3,
  totalSpent: 45000,
  averageRating: 4.8,
  status: 'active',
  favoriteDriver: 'Ahmad Supriadi',
  orderHistory: [
    {
      id: 'O001',
      date: '2024-12-20',
      vehicleCode: '1231',
      driver: 'Ahmad Supriadi',
      tripType: 'Dekat',
      distance: '< 3 km',
      amount: 15000,
      paymentMethod: 'QRIS',
      status: 'completed',
      rating: 5,
      review: 'Driver sangat ramah dan aman'
    },
    {
      id: 'O002',
      date: '2024-12-18',
      vehicleCode: '1233',
      driver: 'Citra Dewi',
      tripType: 'Sedang',
      distance: '3-7 km',
      amount: 18000,
      paymentMethod: 'QRIS',
      status: 'completed',
      rating: 4,
      review: 'Perjalanan nyaman'
    },
    {
      id: 'O003',
      date: '2024-12-15',
      vehicleCode: '1232',
      driver: 'Budi Santoso',
      tripType: 'Jauh',
      distance: '> 7 km',
      amount: 12000,
      paymentMethod: 'QRIS',
      status: 'completed',
      rating: 5,
      review: 'Sangat puas dengan pelayanan'
    }
  ]
};

const CustomerDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'drivers'>('overview');

  useEffect(() => {
    // Simulate API call to get customer detail
    setTimeout(() => {
      setCustomer(mockCustomerDetail);
    }, 500);
  }, [id]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', text: 'Aktif' },
      inactive: { color: 'bg-gray-100 text-gray-800', text: 'Tidak Aktif' }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getOrderStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { color: 'bg-green-100 text-green-800', text: 'Selesai' },
      ongoing: { color: 'bg-blue-100 text-blue-800', text: 'Sedang Berjalan' },
      accepted: { color: 'bg-yellow-100 text-yellow-800', text: 'Diterima' },
      pending: { color: 'bg-gray-100 text-gray-800', text: 'Menunggu' },
      cancelled: { color: 'bg-red-100 text-red-800', text: 'Dibatalkan' }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data customer...</p>
        </div>
      </div>
    );
  }

  const completedOrders = customer.orderHistory.filter(order => order.status === 'completed');
  const uniqueDrivers = new Set(customer.orderHistory.map(order => order.driver));
  const averageSpent = customer.totalSpent / customer.totalOrders;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/admin/customers')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Kembali</span>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Detail Customer</h1>
              <p className="text-gray-600">Informasi lengkap customer dan riwayat order</p>
            </div>
          </div>
        </div>

        {/* Customer Info Card */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-2xl font-bold text-green-600">
                    {customer.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{customer.name}</h2>
                  <div className="flex items-center space-x-2 mt-1">
                    {getStatusBadge(customer.status)}
                    <span className="text-sm text-gray-500">• Bergabung {formatDate(customer.firstOrder)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{customer.totalOrders}</div>
                  <div className="text-sm text-gray-500">Total Order</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(customer.totalSpent)}</div>
                  <div className="text-sm text-gray-500">Total Belanja</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center space-x-1">
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    <span className="text-2xl font-bold text-gray-900">{customer.averageRating}</span>
                  </div>
                  <div className="text-sm text-gray-500">Rating</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">WhatsApp</p>
                  <p className="text-sm text-gray-500">{customer.phone}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Order Pertama</p>
                  <p className="text-sm text-gray-500">{formatDate(customer.firstOrder)}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Order Terakhir</p>
                  <p className="text-sm text-gray-500">{formatDate(customer.lastOrder)}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Driver Favorit</p>
                  <p className="text-sm text-gray-500">{customer.favoriteDriver || 'Belum ada'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'orders'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Riwayat Order
              </button>
              <button
                onClick={() => setActiveTab('drivers')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'drivers'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Daftar Driver
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Total Order</p>
                      <p className="text-2xl font-bold text-blue-900">{customer.totalOrders}</p>
                    </div>
                    <Route className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Order Selesai</p>
                      <p className="text-2xl font-bold text-green-900">{completedOrders.length}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-yellow-600">Driver Unik</p>
                      <p className="text-2xl font-bold text-yellow-900">{uniqueDrivers.size}</p>
                    </div>
                    <Users className="w-8 h-8 text-yellow-500" />
                  </div>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">Rata-rata Belanja</p>
                      <p className="text-2xl font-bold text-purple-900">{formatCurrency(averageSpent)}</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-purple-500" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Riwayat Order</h3>
                  <div className="flex space-x-2">
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                      {completedOrders.length} Selesai
                    </span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      {customer.orderHistory.filter(o => o.status === 'ongoing').length} Sedang Berjalan
                    </span>
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                      {customer.orderHistory.filter(o => o.status === 'cancelled').length} Dibatalkan
                    </span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {customer.orderHistory.map((order) => (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <Car className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="font-medium text-gray-900">Kode Kendaraan: {order.vehicleCode}</p>
                              <p className="text-sm text-gray-500">Driver: {order.driver}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                            <div>
                              <p className="text-sm font-medium text-gray-900">Jenis Trip</p>
                              <p className="text-sm text-gray-600">{order.tripType} ({order.distance})</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Metode Pembayaran</p>
                              <p className="text-sm text-gray-600">{order.paymentMethod}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Tanggal</p>
                              <p className="text-sm text-gray-600">{order.date}</p>
                            </div>
                          </div>
                          
                          {order.review && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-2 mb-1">
                                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                <span className="text-sm font-medium">{order.rating}/5</span>
                              </div>
                              <p className="text-sm text-gray-600">"{order.review}"</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="text-right">
                          <div className="mb-2">
                            {getOrderStatusBadge(order.status)}
                          </div>
                          <p className="text-lg font-bold text-green-600">{formatCurrency(order.amount)}</p>
                          <p className="text-sm text-gray-500">Order #{order.id}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'drivers' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Daftar Driver</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from(uniqueDrivers).map((driverName, index) => {
                    const driverOrders = customer.orderHistory.filter(order => order.driver === driverName);
                    const totalSpent = driverOrders.reduce((sum, order) => sum + order.amount, 0);
                    const lastOrder = driverOrders[driverOrders.length - 1];
                    
                    return (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {driverName.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{driverName}</p>
                            <p className="text-sm text-gray-500">{driverOrders.length} order</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Total Belanja:</span>
                            <span className="font-medium text-green-600">{formatCurrency(totalSpent)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Order Terakhir:</span>
                            <span className="font-medium">{lastOrder.date}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Kode Kendaraan:</span>
                            <span className="font-medium">{lastOrder.vehicleCode}</span>
                          </div>
                        </div>
                        
                        <div className="mt-3 flex space-x-2">
                          <button className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
                            <MessageSquare className="w-4 h-4" />
                            <span className="text-sm">WhatsApp</span>
                          </button>
                          <button className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors">
                            <PhoneCall className="w-4 h-4" />
                            <span className="text-sm">Panggil</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetail;
