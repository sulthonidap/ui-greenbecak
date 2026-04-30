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
  PhoneCall
} from 'lucide-react';

interface Trip {
  id: string;
  customerName: string;
  customerPhone: string;
  pickupLocation: string;
  destination: string;
  distance: string;
  price: number;
  status: 'completed' | 'cancelled' | 'ongoing';
  date: string;
  time: string;
  rating?: number;
  review?: string;
}

interface DriverDetail {
  id: string;
  name: string;
  email: string;
  phone: string;
  vehicleType: 'Becak Listrik' | 'Delman';
  vehicleNumber: string;
  status: 'active' | 'inactive' | 'offline';
  rating: number;
  totalTrips: number;
  totalEarnings: number;
  joinDate: string;
  lastActive: string;
  location: string;
  isOnline: boolean;
  trips: Trip[];
}

const mockDriverDetail: DriverDetail = {
  id: '1',
  name: 'Ahmad Supriadi',
  email: 'ahmad@greenbecak.com',
  phone: '+62 812-3456-7890',
  vehicleType: 'Becak Listrik',
  vehicleNumber: 'BL-001',
  status: 'active',
  rating: 4.8,
  totalTrips: 156,
  totalEarnings: 2500000,
  joinDate: '2024-01-15',
  lastActive: '2 menit yang lalu',
  location: 'Malioboro',
  isOnline: true,
  trips: [
    {
      id: 'T001',
      customerName: 'Budi Santoso',
      customerPhone: '+62 812-1234-5678',
      pickupLocation: 'Malioboro Mall',
      destination: 'Tugu Yogyakarta',
      distance: '2.5 km',
      price: 15000,
      status: 'completed',
      date: '2024-12-20',
      time: '14:30',
      rating: 5,
      review: 'Driver sangat ramah dan aman'
    },
    {
      id: 'T002',
      customerName: 'Siti Rahma',
      customerPhone: '+62 812-2345-6789',
      pickupLocation: 'Pasar Beringharjo',
      destination: 'Kraton Yogyakarta',
      distance: '3.2 km',
      price: 18000,
      status: 'completed',
      date: '2024-12-20',
      time: '15:45',
      rating: 4,
      review: 'Perjalanan nyaman'
    },
    {
      id: 'T003',
      customerName: 'Joko Widodo',
      customerPhone: '+62 812-3456-7890',
      pickupLocation: 'Alun-Alun Utara',
      destination: 'Kota Gede',
      distance: '4.1 km',
      price: 22000,
      status: 'completed',
      date: '2024-12-20',
      time: '16:20',
      rating: 5,
      review: 'Sangat puas dengan pelayanan'
    },
    {
      id: 'T004',
      customerName: 'Dewi Lestari',
      customerPhone: '+62 812-4567-8901',
      pickupLocation: 'Tugu Yogyakarta',
      destination: 'Malioboro',
      distance: '2.8 km',
      price: 16000,
      status: 'ongoing',
      date: '2024-12-20',
      time: '17:15',
    },
    {
      id: 'T005',
      customerName: 'Rudi Hartono',
      customerPhone: '+62 812-5678-9012',
      pickupLocation: 'Kraton Yogyakarta',
      destination: 'Pasar Beringharjo',
      distance: '1.9 km',
      price: 12000,
      status: 'cancelled',
      date: '2024-12-20',
      time: '18:00',
    }
  ]
};

const DriverDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [driver, setDriver] = useState<DriverDetail | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'trips' | 'customers'>('overview');

  useEffect(() => {
    // Simulate API call to get driver detail
    setTimeout(() => {
      setDriver(mockDriverDetail);
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
      inactive: { color: 'bg-gray-100 text-gray-800', text: 'Tidak Aktif' },
      offline: { color: 'bg-red-100 text-red-800', text: 'Offline' }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getTripStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { color: 'bg-green-100 text-green-800', text: 'Selesai' },
      ongoing: { color: 'bg-blue-100 text-blue-800', text: 'Sedang Berjalan' },
      cancelled: { color: 'bg-red-100 text-red-800', text: 'Dibatalkan' }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.completed;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getOnlineStatus = (isOnline: boolean) => {
    return (
      <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
    );
  };

  if (!driver) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data driver...</p>
        </div>
      </div>
    );
  }

  const completedTrips = driver.trips.filter(trip => trip.status === 'completed');
  const ongoingTrips = driver.trips.filter(trip => trip.status === 'ongoing');
  const cancelledTrips = driver.trips.filter(trip => trip.status === 'cancelled');
  const uniqueCustomers = new Set(driver.trips.map(trip => trip.customerName)).size;
  const averageRating = completedTrips.reduce((sum, trip) => sum + (trip.rating || 0), 0) / completedTrips.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/admin/driver-performance')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Kembali</span>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Detail Driver</h1>
              <p className="text-gray-600">Informasi lengkap driver dan riwayat perjalanan</p>
            </div>
          </div>
        </div>

        {/* Driver Info Card */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-2xl font-bold text-blue-600">
                    {driver.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{driver.name}</h2>
                  <div className="flex items-center space-x-2 mt-1">
                    {getOnlineStatus(driver.isOnline)}
                    {getStatusBadge(driver.status)}
                    <span className="text-sm text-gray-500">• {driver.lastActive}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{driver.totalTrips}</div>
                  <div className="text-sm text-gray-500">Total Trip</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(driver.totalEarnings)}</div>
                  <div className="text-sm text-gray-500">Total Pendapatan</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center space-x-1">
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    <span className="text-2xl font-bold text-gray-900">{driver.rating}</span>
                  </div>
                  <div className="text-sm text-gray-500">Rating</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Email</p>
                  <p className="text-sm text-gray-500">{driver.email}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Telepon</p>
                  <p className="text-sm text-gray-500">{driver.phone}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Car className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Kendaraan</p>
                  <p className="text-sm text-gray-500">{driver.vehicleType} - {driver.vehicleNumber}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Lokasi</p>
                  <p className="text-sm text-gray-500">{driver.location}</p>
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
                onClick={() => setActiveTab('trips')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'trips'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Riwayat Trip
              </button>
              <button
                onClick={() => setActiveTab('customers')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'customers'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Daftar Customer
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Total Trip</p>
                      <p className="text-2xl font-bold text-blue-900">{driver.totalTrips}</p>
                    </div>
                    <Route className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Trip Selesai</p>
                      <p className="text-2xl font-bold text-green-900">{completedTrips.length}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-yellow-600">Customer Unik</p>
                      <p className="text-2xl font-bold text-yellow-900">{uniqueCustomers}</p>
                    </div>
                    <Users className="w-8 h-8 text-yellow-500" />
                  </div>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">Rating Rata-rata</p>
                      <p className="text-2xl font-bold text-purple-900">{averageRating.toFixed(1)}</p>
                    </div>
                    <Star className="w-8 h-8 text-purple-500" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'trips' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Riwayat Trip</h3>
                  <div className="flex space-x-2">
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                      {completedTrips.length} Selesai
                    </span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      {ongoingTrips.length} Sedang Berjalan
                    </span>
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                      {cancelledTrips.length} Dibatalkan
                    </span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {driver.trips.map((trip) => (
                    <div key={trip.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <User className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="font-medium text-gray-900">{trip.customerName}</p>
                              <p className="text-sm text-gray-500">{trip.customerPhone}</p>
                            </div>
                          </div>
                          
                          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <p className="text-sm font-medium text-gray-900">Dari</p>
                              <p className="text-sm text-gray-600">{trip.pickupLocation}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Ke</p>
                              <p className="text-sm text-gray-600">{trip.destination}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Jarak</p>
                              <p className="text-sm text-gray-600">{trip.distance}</p>
                            </div>
                          </div>
                          
                          {trip.review && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-2 mb-1">
                                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                <span className="text-sm font-medium">{trip.rating}/5</span>
                              </div>
                              <p className="text-sm text-gray-600">"{trip.review}"</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="text-right">
                          <div className="mb-2">
                            {getTripStatusBadge(trip.status)}
                          </div>
                          <p className="text-lg font-bold text-green-600">{formatCurrency(trip.price)}</p>
                          <p className="text-sm text-gray-500">{trip.date} • {trip.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'customers' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Daftar Customer</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from(new Set(driver.trips.map(trip => trip.customerName))).map((customerName, index) => {
                    const customerTrips = driver.trips.filter(trip => trip.customerName === customerName);
                    const totalSpent = customerTrips.reduce((sum, trip) => sum + trip.price, 0);
                    const lastTrip = customerTrips[customerTrips.length - 1];
                    
                    return (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {customerName.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{customerName}</p>
                            <p className="text-sm text-gray-500">{customerTrips[0].customerPhone}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Total Trip:</span>
                            <span className="font-medium">{customerTrips.length}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Total Belanja:</span>
                            <span className="font-medium text-green-600">{formatCurrency(totalSpent)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Trip Terakhir:</span>
                            <span className="font-medium">{lastTrip.date}</span>
                          </div>
                        </div>
                        
                        <div className="mt-3 flex space-x-2">
                          <button className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
                            <PhoneCall className="w-4 h-4" />
                            <span className="text-sm">Panggil</span>
                          </button>
                          <button className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors">
                            <MessageSquare className="w-4 h-4" />
                            <span className="text-sm">WhatsApp</span>
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

export default DriverDetail;
