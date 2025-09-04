import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { adminAPI } from '../services/api';
import {
  ArrowLeft,
  Search,
  Clock,
  MapPin,
  Car,
  Users,
  Eye,
  MoreHorizontal,
  CalendarDays,
  DollarSign
} from 'lucide-react';

interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  vehicleType: 'Becak Listrik' | 'Delman';
  vehicleNumber: string;
  status: 'active' | 'inactive' | 'offline';
  totalTrips: number;
  selectedDateTrips: number;
  totalEarnings: number;
  selectedDateEarnings: number;
  lastActive: string;
  location: string;
  isOnline: boolean;
  startTime?: string;
  endTime?: string;
  workingHours?: number;
  averagePerHour?: number;
}


const DriverPerformance: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [vehicleFilter, setVehicleFilter] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);

  // Fetch drivers from backend
  const fetchDrivers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await adminAPI.getDrivers();

      const normalized = (response.drivers || [])
        .filter((d: any) => !d.deleted_at) // Filter out soft deleted drivers
        .map((d: any) => ({
          id: d.id?.toString() || d.driver_code,
          name: d.name,
          email: d.email,
          phone: d.phone,
          vehicleType: d.vehicle_type === 'andong' ? 'Delman' : 'Becak Listrik',
          vehicleNumber: d.driver_code,
          status: d.is_active ? 'active' : 'inactive',
          rating: d.rating || 4.5, // fallback rating
          totalTrips: d.total_trips || 0,
          selectedDateTrips: Math.floor((d.total_trips || 0) / 30), // dummy calculation
          totalEarnings: d.total_earnings || 0,
          selectedDateEarnings: Math.floor((d.total_earnings || 0) / 30), // dummy calculation
          lastActive: '2 menit yang lalu', // dummy data
          location: d.address || 'Unknown',
          isOnline: d.is_active,
        }));

      setDrivers(normalized);

    } catch (error: any) {
      console.error('Failed to fetch drivers:', error);

      if (error.response?.status === 401) {
        setError('Anda harus login sebagai admin untuk mengakses data driver');
      } else if (error.response?.status === 403) {
        setError('Anda tidak memiliki akses ke halaman ini');
      } else if (error.code === 'ERR_NETWORK') {
        setError('Tidak dapat terhubung ke server. Pastikan backend sudah running di port 8080');
      } else {
        setError(error.response?.data?.message || 'Gagal mengambil data driver');
      }

    } finally {
      setLoading(false);
    }
  };

  // Load drivers on component mount
  useEffect(() => {
    fetchDrivers();
  }, []);

  // Filter data when selected date changes
  useEffect(() => {
    // In a real implementation, you would fetch data for the selected date
    // For now, we'll just update the mock data to simulate date filtering
    console.log('Filtering data for date:', selectedDate);
    setCurrentPage(1); // Reset to first page when date changes
  }, [selectedDate]);

  useEffect(() => {
    if (location.state?.message) {
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);
    }
  }, [location.state?.message]);

  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.phone.includes(searchTerm) ||
      driver.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || driver.status === statusFilter;
    const matchesVehicle = vehicleFilter === 'all' || driver.vehicleType === vehicleFilter;

    return matchesSearch && matchesStatus && matchesVehicle;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredDrivers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDrivers = filteredDrivers.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, vehicleFilter]);

  const totalDrivers = drivers.length;
  const activeDrivers = drivers.filter(d => d.status === 'active').length;
  const totalSelectedDateTrips = drivers.reduce((sum, d) => sum + d.selectedDateTrips, 0);
  const totalSelectedDateEarnings = drivers.reduce((sum, d) => sum + d.selectedDateEarnings, 0);
  const averageEarningsPerTrip = totalSelectedDateTrips > 0 ? totalSelectedDateEarnings / totalSelectedDateTrips : 0;
  const totalWorkingHours = drivers.reduce((sum, d) => sum + (d.workingHours || 0), 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
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

  const getOnlineStatus = (isOnline: boolean) => {
    return (
      <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data driver performance...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 max-w-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <div className="w-5 h-5 text-red-400">⚠️</div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">
                Error: {error}
              </p>
              <button
                onClick={fetchDrivers}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                Coba lagi
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {location.state?.message}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/admin')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Driver Performance</h1>
              <p className="text-gray-600">
                Monitor performa driver pada tanggal{' '}
                <span className="font-semibold text-green-600">
                  {new Date(selectedDate).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={fetchDrivers}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <span>Refresh Data</span>
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Driver</p>
                <p className="text-2xl font-bold text-gray-900">{totalDrivers}</p>
                <p className="text-xs text-gray-500 mt-1">{activeDrivers} aktif hari ini</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Trip</p>
                <p className="text-2xl font-bold text-gray-900">{totalSelectedDateTrips}</p>
                <p className="text-xs text-gray-500 mt-1">{formatCurrency(averageEarningsPerTrip)}/trip</p>
              </div>
              <Car className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Pendapatan</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalSelectedDateEarnings)}</p>
                <p className="text-xs text-gray-500 mt-1">Hari ini</p>
              </div>
              <DollarSign className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Jam Kerja</p>
                <p className="text-2xl font-bold text-gray-900">{totalWorkingHours}h</p>
                <p className="text-xs text-gray-500 mt-1">Keseluruhan driver</p>
              </div>
              <Clock className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </div>

                 {/* Filters */}
         <div className="bg-white rounded-lg shadow mb-6">
           <div className="p-6 border-b border-gray-200">
             <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter & Pencarian</h2>
             <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
               <div className="relative">
                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                 <input
                   type="text"
                   placeholder="Cari driver..."
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                 />
               </div>

               <select
                 value={statusFilter}
                 onChange={(e) => setStatusFilter(e.target.value)}
                 className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
               >
                 <option value="all">Semua Status</option>
                 <option value="active">Aktif</option>
                 <option value="inactive">Tidak Aktif</option>
                 <option value="offline">Offline</option>
               </select>

               <select
                 value={vehicleFilter}
                 onChange={(e) => setVehicleFilter(e.target.value)}
                 className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
               >
                 <option value="all">Semua Kendaraan</option>
                 <option value="Becak Listrik">Becak Listrik</option>
                 <option value="Delman">Delman</option>
               </select>

               <div className="relative">
                 <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                 <input
                   type="date"
                   value={selectedDate}
                   onChange={(e) => setSelectedDate(e.target.value)}
                   className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                 />
               </div>

               <button 
                 onClick={() => {
                   setSearchTerm('');
                   setStatusFilter('all');
                   setVehicleFilter('all');
                   setSelectedDate(new Date().toISOString().split('T')[0]);
                 }}
                 className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
               >
                 <span>Reset</span>
               </button>
             </div>
           </div>
         </div>

        {/* Driver List */}
        <div className="bg-white rounded-lg shadow">
                     <div className="p-6 border-b border-gray-200">
             <h2 className="text-lg font-semibold text-gray-900">Daftar Driver Performance</h2>
             <p className="text-gray-600">
               Total {filteredDrivers.length} driver ditemukan
               {filteredDrivers.length > 0 && (
                 <span className="ml-2 text-sm text-gray-500">
                   (Menampilkan {startIndex + 1} - {Math.min(endIndex, filteredDrivers.length)} dari {filteredDrivers.length})
                 </span>
               )}
             </p>
           </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Driver
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kendaraan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status & Lokasi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trip Hari Ini
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pendapatan Hari Ini
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jam Kerja
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
                             <tbody className="bg-white divide-y divide-gray-200">
                 {currentDrivers.map((driver) => (
                  <tr
                    key={driver.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/admin/driver-detail/${driver.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {driver.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{driver.name}</div>
                          <div className="text-sm text-gray-500">{driver.phone}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Car className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{driver.vehicleType}</div>
                          <div className="text-sm text-gray-500">{driver.vehicleNumber}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getOnlineStatus(driver.isOnline)}
                        <div>
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(driver.status)}
                            <span className="text-xs text-gray-500">{driver.lastActive}</span>
                          </div>
                          <div className="flex items-center space-x-1 mt-1">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            <span className="text-sm text-gray-600">{driver.location}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">{driver.selectedDateTrips}</div>
                        <div className="text-xs text-gray-500">
                          {driver.selectedDateTrips > 0 ? formatCurrency(driver.selectedDateEarnings / driver.selectedDateTrips) : 'Rp 0'}/trip
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">{formatCurrency(driver.selectedDateEarnings)}</div>
                        <div className="text-xs text-gray-500">
                          {driver.averagePerHour ? formatCurrency(driver.averagePerHour) + '/jam' : 'N/A'}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-600">{driver.workingHours || 0}h</div>
                        <div className="text-xs text-gray-500">
                          {driver.startTime && driver.endTime ? `${driver.startTime} - ${driver.endTime}` : 'N/A'}
                        </div>
                      </div>
                    </td>



                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="text-blue-600 hover:text-blue-900"
                          onClick={() => navigate(`/admin/driver-detail/${driver.id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-900">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

                     {currentDrivers.length === 0 && (
             <div className="text-center py-12">
               <div className="text-gray-500">
                 {filteredDrivers.length === 0 ? 'Tidak ada driver ditemukan' : 'Tidak ada data untuk halaman ini'}
               </div>
             </div>
           )}

           {/* Pagination */}
           {totalPages > 1 && (
             <div className="px-6 py-4 border-t border-gray-200">
               <div className="flex items-center justify-between">
                 <div className="text-sm text-gray-700">
                   Menampilkan {startIndex + 1} sampai {Math.min(endIndex, filteredDrivers.length)} dari {filteredDrivers.length} hasil
                 </div>
                 <div className="flex items-center space-x-2">
                   <button
                     onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                     disabled={currentPage === 1}
                     className={`px-3 py-1 text-sm rounded-md ${
                       currentPage === 1
                         ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                         : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                     }`}
                   >
                     Sebelumnya
                   </button>
                   
                   <div className="flex items-center space-x-1">
                     {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                       <button
                         key={page}
                         onClick={() => setCurrentPage(page)}
                         className={`px-3 py-1 text-sm rounded-md ${
                           currentPage === page
                             ? 'bg-blue-600 text-white'
                             : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                         }`}
                       >
                         {page}
                       </button>
                     ))}
                   </div>
                   
                   <button
                     onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                     disabled={currentPage === totalPages}
                     className={`px-3 py-1 text-sm rounded-md ${
                       currentPage === totalPages
                         ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                         : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                     }`}
                   >
                     Selanjutnya
                   </button>
                 </div>
               </div>
             </div>
           )}
         </div>
      </div>
    </div>
  );
};

export default DriverPerformance;
