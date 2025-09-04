import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Edit3, Trash2, Plus, Users, MapPin, Phone, Car, X, CheckSquare } from 'lucide-react';
import { adminAPI } from '../services/api';

interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  vehicleType: 'becak-listrik' | 'delman';
  vehicleCode: string;
  licenseNumber: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  status: 'active' | 'inactive';
  joinDate: Date;
  totalTrips: number;
  totalEarnings: number;
}


const DriverList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<'all' | 'becak-listrik' | 'delman'>('all');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  // Fetch drivers from backend
  const fetchDrivers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await adminAPI.getDrivers();
      const normalized = (response.drivers || []).map((d: any) => ({
        id: d.id?.toString() || d.driver_code,
        name: d.name,
        email: d.email,
        phone: d.phone,
        vehicleType: d.vehicle_type || 'becak-listrik', // fallback
        vehicleCode: d.driver_code,
        licenseNumber: d.license_number || '',
        address: d.address || '',
        emergencyContact: d.id_card || '',
        emergencyPhone: d.phone || '',
        status: d.is_active ? 'active' : 'inactive',
        joinDate: d.created_at ? new Date(d.created_at) : new Date(),
        totalTrips: d.total_trips || 0,
        totalEarnings: d.total_earnings || 0,
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
  
  // Check for success message from navigation state
  React.useEffect(() => {
    if (location.state?.message) {
      setShowSuccessMessage(true);
      // Clear the message from state
      window.history.replaceState({}, document.title);
      // Auto hide after 5 seconds
      setTimeout(() => setShowSuccessMessage(false), 5000);
    }
  }, [location.state]);

  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         driver.vehicleCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         driver.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || driver.status === statusFilter;
    const matchesVehicleType = vehicleTypeFilter === 'all' || driver.vehicleType === vehicleTypeFilter;
    return matchesSearch && matchesStatus && matchesVehicleType;
  });

  const handleEdit = (driverId: string) => {
    // Navigate to edit driver page
    navigate(`/admin/edit-driver/${driverId}`);
  };

  const handleDelete = async (driverId: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus driver ini?')) {
      try {
        await adminAPI.deleteDriver(driverId);
        
        // Remove from local state
        setDrivers(prev => prev.filter(driver => driver.id !== driverId));
        
        // Show success message
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
        
      } catch (error: any) {
        console.error('Failed to delete driver:', error);
        
        if (error.response?.status === 401) {
          alert('Anda harus login sebagai admin untuk menghapus driver');
        } else if (error.response?.status === 403) {
          alert('Anda tidak memiliki akses untuk menghapus driver');
        } else if (error.code === 'ERR_NETWORK') {
          alert('Tidak dapat terhubung ke server. Pastikan backend sudah running');
        } else {
          alert(error.response?.data?.message || 'Gagal menghapus driver');
        }
      }
    }
  };

  const handleStatusToggle = async (driverId: string) => {
    try {
      const driver = drivers.find(d => d.id === driverId);
      if (!driver) return;
      
      const newStatus = driver.status === 'active' ? 'inactive' : 'active';
      
      await adminAPI.updateDriver(driverId, { 
        status: newStatus,
        is_active: newStatus === 'active'
      });
      
      // Update local state
      setDrivers(prev => prev.map(driver => 
        driver.id === driverId 
          ? { ...driver, status: newStatus }
          : driver
      ));
      
    } catch (error: any) {
      console.error('Failed to update driver status:', error);
      
      if (error.response?.status === 401) {
        alert('Anda harus login sebagai admin untuk mengubah status driver');
      } else if (error.response?.status === 403) {
        alert('Anda tidak memiliki akses untuk mengubah status driver');
      } else if (error.code === 'ERR_NETWORK') {
        alert('Tidak dapat terhubung ke server. Pastikan backend sudah running');
      } else {
        alert(error.response?.data?.message || 'Gagal mengubah status driver');
      }
    }
  };

  const activeDrivers = drivers.filter(driver => driver.status === 'active');
  const totalEarnings = drivers.reduce((sum, driver) => sum + driver.totalEarnings, 0);
  const totalTrips = drivers.reduce((sum, driver) => sum + driver.totalTrips, 0);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat data driver...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <X className="h-5 w-5 text-red-400" />
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
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali ke Dashboard
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Daftar Driver</h1>
        <p className="text-gray-600 mt-2">Kelola semua driver GreenBecak</p>
      </div>

      {/* Statistik */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-blue-600">Total Driver</p>
              <p className="text-2xl font-bold text-blue-700">{drivers.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-green-600">Driver Aktif</p>
              <p className="text-2xl font-bold text-green-700">{activeDrivers.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
          <div className="flex items-center">
            <Car className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-purple-600">Total Perjalanan</p>
              <p className="text-2xl font-bold text-purple-700">{totalTrips}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
          <div className="flex items-center">
            <MapPin className="w-8 h-8 text-amber-600 mr-3" />
            <div>
              <p className="text-sm text-amber-600">Total Pendapatan</p>
              <p className="text-2xl font-bold text-amber-700">Rp {totalEarnings.toLocaleString('id-ID')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center">
              <Users className="w-6 h-6 text-green-600 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">Daftar Driver</h2>
            </div>
            <button
              onClick={() => navigate('/admin/create-user')}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Driver
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Filter dan Search */}
          <div className="mb-6 flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Cari driver berdasarkan nama, kode kendaraan, atau nomor telepon..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div className="md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">Semua Status</option>
                <option value="active">Aktif</option>
                <option value="inactive">Tidak Aktif</option>
              </select>
            </div>
            <div className="md:w-48">
              <select
                value={vehicleTypeFilter}
                onChange={(e) => setVehicleTypeFilter(e.target.value as 'all' | 'becak-listrik' | 'delman')}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">Semua Kendaraan</option>
                <option value="becak-listrik">Becak Listrik</option>
                <option value="delman">Delman</option>
              </select>
            </div>
          </div>

          {/* Tabel Driver */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Driver
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kendaraan
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kontak
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statistik
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDrivers.map((driver) => (
                  <tr key={driver.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                          <Users className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{driver.name}</div>
                          <div className="text-sm text-gray-500">{driver.email}</div>
                          <div className="text-xs text-gray-400">Bergabung: {driver.joinDate.toLocaleDateString('id-ID')}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{driver.vehicleCode}</div>
                        <div className="text-sm text-gray-500 capitalize">{driver.vehicleType.replace('-', ' ')}</div>
                        <div className="text-xs text-gray-400">SIM: {driver.licenseNumber}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="flex items-center text-sm text-gray-900">
                          <Phone className="w-4 h-4 mr-1" />
                          {driver.phone}
                        </div>
                        <div className="text-sm text-gray-500">{driver.address}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">{driver.totalTrips} perjalanan</div>
                        <div className="text-sm text-gray-500">Rp {driver.totalEarnings.toLocaleString('id-ID')}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleStatusToggle(driver.id)}
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          driver.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {driver.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(driver.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit Driver"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(driver.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Hapus Driver"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredDrivers.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Tidak ada driver yang ditemukan</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DriverList;
