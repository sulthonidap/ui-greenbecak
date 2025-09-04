import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserPlus, ArrowLeft, Edit3, Trash2, Plus, Users, MapPin, Phone, Car, X, CheckSquare, Shield, Eye, EyeOff, Key } from 'lucide-react';
import { adminAPI } from '../services/api';
import { showSuccess, showError } from '../utils/toast';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  username: string;
  password: string;
  role: 'admin' | 'driver' | 'customer';
  vehicleType?: 'becak-listrik' | 'delman';
  vehicleCode?: string;
  licenseNumber?: string;
  address: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  status: 'active' | 'inactive';
  totalTrips?: number;
  totalEarnings?: number;
  lastLogin?: Date;
  joinDate?: Date;
  created_at?: Date;
  driver?: {
    vehicle_number: string;
    vehicle_type: string;
    id_card: string;
    total_trips: number;
    total_earnings: number;
  };
}

const UserManagement: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'driver' | 'customer'>('all');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showPassword, setShowPassword] = useState<{[key: string]: boolean}>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'delete' | 'resetPassword' | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  // Helper untuk format tanggal yang aman terhadap undefined/string
  const formatDate = (date: any) => {
    if (!date) return '-';
    const d = date instanceof Date ? date : new Date(date);
    return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('id-ID');
  };
  
  // Fetch users from backend
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await adminAPI.getUsers();
      console.log('Raw users data:', response.users);
      
             const normalized = (response.users || []).map((u: any) => ({
         ...u,
         // Map status from is_active boolean to status string
         status: u.is_active ? 'active' : 'inactive',
         // Map driver data to user fields
         vehicleType: u.driver?.vehicle_type === 'andong' ? 'delman' : 
                     u.driver?.vehicle_type === 'becak_listrik' ? 'becak-listrik' : 
                     u.driver?.vehicle_type === 'becak_motor' ? 'becak-listrik' : 
                     u.driver?.vehicle_type === 'becak_manual' ? 'becak-listrik' : undefined,
         vehicleCode: u.driver?.vehicle_number,
         licenseNumber: u.driver?.id_card,
         totalTrips: u.driver?.total_trips,
         totalEarnings: u.driver?.total_earnings,
         joinDate: u?.created_at ? new Date(u.created_at) : undefined,
         lastLogin: u?.lastLogin ? new Date(u.lastLogin) : undefined,
       }));
      
      console.log('Normalized users data:', normalized);
      setUsers(normalized);
      
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
      
      // If it's an authentication error, show specific message
      if (error.response?.status === 401) {
        setError('Anda harus login sebagai admin untuk mengakses data user');
      } else if (error.response?.status === 403) {
        setError('Anda tidak memiliki akses ke halaman ini');
      } else if (error.response?.status === 404) {
        setError('Endpoint admin users belum tersedia di backend');
      } else if (error.code === 'ERR_NETWORK') {
        setError('Tidak dapat terhubung ke server. Pastikan backend sudah running di port 8080');
      } else {
        setError(error.response?.data?.message || 'Gagal mengambil data user');
      }
    } finally {
      setLoading(false);
    }
  };

  // Load users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

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

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, roleFilter]);

  const handleEdit = (userId: string) => {
    // Navigate to edit user page
    navigate(`/admin/edit-user/${userId}`);
  };

  const openConfirmModal = (action: 'delete' | 'resetPassword', userId: string) => {
    setConfirmAction(action);
    setSelectedUserId(userId);
    setShowConfirmModal(true);
  };

  const closeConfirmModal = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
    setSelectedUserId(null);
  };

  const handleConfirmAction = async () => {
    if (!selectedUserId || !confirmAction) return;

    try {
      if (confirmAction === 'delete') {
        await adminAPI.deleteUser(selectedUserId);
        setUsers(prev => prev.filter(user => user.id !== selectedUserId));
        showSuccess('User berhasil dihapus!');
      } else if (confirmAction === 'resetPassword') {
        const response = await adminAPI.resetUserPassword(selectedUserId);
        showSuccess(`Password berhasil direset! Password baru: ${response.newPassword || 'password123'}`);
      }
    } catch (error: any) {
      console.error('Failed to perform action:', error);
      
      if (error.response?.status === 401) {
        showError('Anda harus login sebagai admin untuk melakukan aksi ini');
      } else if (error.response?.status === 403) {
        showError('Anda tidak memiliki akses untuk melakukan aksi ini');
      } else if (error.code === 'ERR_NETWORK') {
        showError('Tidak dapat terhubung ke server. Pastikan backend sudah running');
      } else {
        showError(error.response?.data?.message || 'Gagal melakukan aksi');
      }
    } finally {
      closeConfirmModal();
    }
  };

  const handleDelete = (userId: string) => {
    openConfirmModal('delete', userId);
  };

  const handleStatusToggle = async (userId: string) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;
      
      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      const newIsActive = newStatus === 'active';
      
      await adminAPI.updateUser(userId, { is_active: newIsActive });
      
      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, status: newStatus }
          : user
      ));
      
    } catch (error: any) {
      console.error('Failed to update user status:', error);
      
      if (error.response?.status === 401) {
        showError('Anda harus login sebagai admin untuk mengubah status user');
      } else if (error.response?.status === 403) {
        showError('Anda tidak memiliki akses untuk mengubah status user');
      } else if (error.code === 'ERR_NETWORK') {
        showError('Tidak dapat terhubung ke server. Pastikan backend sudah running');
      } else {
        showError(error.response?.data?.message || 'Gagal mengubah status user');
      }
    }
  };

  const handleResetPassword = (userId: string) => {
    openConfirmModal('resetPassword', userId);
  };

  const togglePasswordVisibility = (userId: string) => {
    setShowPassword(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const activeUsers = users.filter(user => user.status === 'active');
  const drivers = users.filter(user => user.role === 'driver');
  const admins = users.filter(user => user.role === 'admin');
  const totalEarnings = drivers.reduce((sum, driver) => sum + (driver.totalEarnings || 0), 0);
  const totalTrips = drivers.reduce((sum, driver) => sum + (driver.totalTrips || 0), 0);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'driver': return 'bg-blue-100 text-blue-800';
      case 'customer': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'driver': return 'Driver';
      case 'customer': return 'Customer';
      default: return role;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat data user...</p>
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
                onClick={fetchUsers}
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
                {location.state?.message || 'Operasi berhasil!'}
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
        
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-2">Kelola semua user sistem GreenBecak</p>
      </div>

      {/* Statistik */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-blue-600">Total User</p>
              <p className="text-2xl font-bold text-blue-700">{users.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-green-600">User Aktif</p>
              <p className="text-2xl font-bold text-green-700">{activeUsers.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
          <div className="flex items-center">
            <Car className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-purple-600">Total Driver</p>
              <p className="text-2xl font-bold text-purple-700">{drivers.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
          <div className="flex items-center">
            <Shield className="w-8 h-8 text-amber-600 mr-3" />
            <div>
              <p className="text-sm text-amber-600">Total Admin</p>
              <p className="text-2xl font-bold text-amber-700">{admins.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center">
              <Users className="w-6 h-6 text-green-600 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">Daftar User</h2>
            </div>
            <button
              onClick={() => navigate('/admin/create-user')}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah User
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Filter dan Search */}
          <div className="mb-6 flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Cari user berdasarkan nama, username, email, atau nomor telepon..."
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
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as 'all' | 'admin' | 'driver' | 'customer')}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">Semua Role</option>
                <option value="admin">Admin</option>
                <option value="driver">Driver</option>
                <option value="customer">Customer</option>
              </select>
            </div>
          </div>

          {/* Tabel User */}
          <div className="overflow-x-auto">
            <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-700">
                Menampilkan {startIndex + 1} - {Math.min(endIndex, filteredUsers.length)} dari {filteredUsers.length} user
              </p>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Login Info
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role & Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kontak
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kendaraan
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                          <Users className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          <div className="text-xs text-gray-400">Bergabung: {formatDate(user.created_at)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">@{user.username}</div>
                        <div className="flex items-center text-sm text-gray-500">
                          <span className="mr-2">
                            {showPassword[user.id] ? user.password : '••••••••'}
                          </span>
                          <button
                            onClick={() => togglePasswordVisibility(user.id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {showPassword[user.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                        </div>
                        {user.lastLogin && (
                          <div className="text-xs text-gray-400">
                            Login terakhir: {user.lastLogin.toLocaleString('id-ID')}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                          {getRoleDisplayName(user.role)}
                        </span>
                        <button
                          onClick={() => handleStatusToggle(user.id)}
                          className={`block px-3 py-1 text-xs font-semibold rounded-full ${
                            user.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {user.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="flex items-center text-sm text-gray-900">
                          <Phone className="w-4 h-4 mr-1" />
                          {user.phone}
                        </div>
                        <div className="text-sm text-gray-500">{user.address}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        {user.role === 'driver' ? (
                          <>
                            <div className="text-sm text-gray-900">{user.vehicleCode}</div>
                            <div className="text-sm text-gray-500 capitalize">{user.vehicleType?.replace('-', ' ')}</div>
                          </>
                        ) : (
                          <div className="text-sm text-gray-500">-</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(user.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit User"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleResetPassword(user.id)}
                          className="text-orange-600 hover:text-orange-900"
                          title="Reset Password"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Hapus User"
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

          {currentUsers.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {filteredUsers.length === 0 ? 'Tidak ada user yang ditemukan' : 'Tidak ada data untuk halaman ini'}
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sebelumnya
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Selanjutnya
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Menampilkan{' '}
                    <span className="font-medium">{startIndex + 1}</span>
                    {' '}sampai{' '}
                    <span className="font-medium">{Math.min(endIndex, filteredUsers.length)}</span>
                    {' '}dari{' '}
                    <span className="font-medium">{filteredUsers.length}</span>
                    {' '}hasil
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Sebelumnya</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {/* Page numbers */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === page
                            ? 'z-10 bg-green-50 border-green-500 text-green-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Selanjutnya</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
                     )}
         </div>
       </div>

       {/* Confirmation Modal */}
       {showConfirmModal && (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
           <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
             <div className="mt-3 text-center">
               <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                 <X className="h-6 w-6 text-red-600" />
               </div>
               <h3 className="text-lg font-medium text-gray-900 mb-4">
                 {confirmAction === 'delete' ? 'Konfirmasi Hapus User' : 'Konfirmasi Reset Password'}
               </h3>
               <div className="mt-2 px-7 py-3">
                 <p className="text-sm text-gray-500">
                   {confirmAction === 'delete' 
                     ? 'Apakah Anda yakin ingin menghapus user ini? Tindakan ini tidak dapat dibatalkan.'
                     : 'Apakah Anda yakin ingin mereset password user ini? Password akan diubah menjadi "password123".'
                   }
                 </p>
               </div>
               <div className="flex justify-center space-x-4 mt-6">
                 <button
                   onClick={closeConfirmModal}
                   className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                 >
                   Batal
                 </button>
                 <button
                   onClick={handleConfirmAction}
                   className={`px-4 py-2 text-white rounded-md transition-colors ${
                     confirmAction === 'delete' 
                       ? 'bg-red-600 hover:bg-red-700' 
                       : 'bg-orange-600 hover:bg-orange-700'
                   }`}
                 >
                   {confirmAction === 'delete' ? 'Hapus' : 'Reset Password'}
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 };

export default UserManagement;
