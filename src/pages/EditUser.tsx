import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, User, Mail, Phone, MapPin, Car, Shield, Eye, EyeOff, AlertCircle } from 'lucide-react';
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
  driver?: {
    vehicle_number: string;
    vehicle_type: string;
    id_card: string;
  };
}

const EditUser: React.FC = () => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    role: 'customer' as 'admin' | 'driver' | 'customer',
    vehicleType: 'becak-listrik' as 'becak-listrik' | 'delman',
    vehicleCode: '',
    licenseNumber: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    status: 'active' as 'active' | 'inactive'
  });

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await adminAPI.getUser(userId);
        const userData = response.user;
        
        // Normalize the data
        const normalizedUser = {
          ...userData,
          vehicleType: userData.driver?.vehicle_type === 'andong' ? 'delman' : 
                      userData.driver?.vehicle_type === 'becak_listrik' ? 'becak-listrik' : 
                      userData.driver?.vehicle_type === 'becak_motor' ? 'becak-listrik' : 
                      userData.driver?.vehicle_type === 'becak_manual' ? 'becak-listrik' : undefined,
          vehicleCode: userData.driver?.vehicle_number,
          licenseNumber: userData.driver?.id_card,
        };
        
        setUser(normalizedUser);
        setFormData({
          name: normalizedUser.name || '',
          email: normalizedUser.email || '',
          phone: normalizedUser.phone || '',
          username: normalizedUser.username || '',
          password: normalizedUser.password || '',
          role: normalizedUser.role || 'customer',
          vehicleType: normalizedUser.vehicleType || 'becak-listrik',
          vehicleCode: normalizedUser.vehicleCode || '',
          licenseNumber: normalizedUser.licenseNumber || '',
          address: normalizedUser.address || '',
          emergencyContact: normalizedUser.emergencyContact || '',
          emergencyPhone: normalizedUser.emergencyPhone || '',
          status: normalizedUser.status || 'active'
        });
        
      } catch (error: any) {
        console.error('Failed to fetch user:', error);
        
        if (error.response?.status === 401) {
          setError('Anda harus login sebagai admin untuk mengakses data user');
        } else if (error.response?.status === 403) {
          setError('Anda tidak memiliki akses ke halaman ini');
        } else if (error.code === 'ERR_NETWORK') {
          setError('Tidak dapat terhubung ke server. Pastikan backend sudah running di port 8080');
        } else {
          setError(error.response?.data?.message || 'Gagal mengambil data user');
        }
        
        // Fallback to mock data for development
        if (import.meta.env.DEV) {
          console.log('Using mock data as fallback...');
          const mockUser: User = {
            id: userId,
            name: 'Budi Santoso',
            email: 'budi.santoso@email.com',
            phone: '08123456789',
            username: 'budi.santoso',
            password: 'password123',
            role: 'driver',
            vehicleType: 'becak-listrik',
            vehicleCode: 'BL001',
            licenseNumber: '1234567890',
            address: 'Jl. Malioboro No. 123, Yogyakarta',
            emergencyContact: 'Siti Santoso',
            emergencyPhone: '08123456788',
            status: 'active'
          };
          
          setUser(mockUser);
          setFormData({
            name: mockUser.name,
            email: mockUser.email,
            phone: mockUser.phone,
            username: mockUser.username,
            password: mockUser.password,
            role: mockUser.role,
            vehicleType: mockUser.vehicleType || 'becak-listrik',
            vehicleCode: mockUser.vehicleCode || '',
            licenseNumber: mockUser.licenseNumber || '',
            address: mockUser.address,
            emergencyContact: mockUser.emergencyContact || '',
            emergencyPhone: mockUser.emergencyPhone || '',
            status: mockUser.status
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) return;
    
    try {
      setSaving(true);
      setError(null);
      
      // Prepare data for API
      const updateData: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        username: formData.username,
        role: formData.role,
        address: formData.address,
        emergency_contact: formData.emergencyContact,
        emergency_phone: formData.emergencyPhone,
        status: formData.status
      };
      
      // Only include password if it's changed
      if (formData.password && formData.password !== user?.password) {
        updateData.password = formData.password;
      }
      
      // Add driver-specific data if role is driver
      if (formData.role === 'driver') {
        updateData.driver = {
          vehicle_type: formData.vehicleType === 'delman' ? 'andong' : 'becak_listrik',
          vehicle_number: formData.vehicleCode,
          id_card: formData.licenseNumber
        };
      }
      
      await adminAPI.updateUser(userId, updateData);
      
      // Show success message and navigate back
      showSuccess('User berhasil diperbarui!');
      navigate('/admin/users');
      
    } catch (error: any) {
      console.error('Failed to update user:', error);
      
      if (error.response?.status === 401) {
        setError('Anda harus login sebagai admin untuk mengubah data user');
      } else if (error.response?.status === 403) {
        setError('Anda tidak memiliki akses untuk mengubah data user');
      } else if (error.code === 'ERR_NETWORK') {
        setError('Tidak dapat terhubung ke server. Pastikan backend sudah running');
      } else {
        setError(error.response?.data?.message || 'Gagal memperbarui user');
      }
    } finally {
      setSaving(false);
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

  if (error && !user) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">
                Error: {error}
              </p>
              <button
                onClick={() => navigate('/admin/users')}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                Kembali ke User Management
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/users')}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali ke User Management
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Edit User</h1>
        <p className="text-gray-600 mt-2">Perbarui informasi user</p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Informasi Dasar
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nomor Telepon *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password {user?.password ? '(Kosongkan jika tidak ingin mengubah)' : '*'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required={!user?.password}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role *
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="customer">Customer</option>
                  <option value="driver">Driver</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Alamat
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alamat Lengkap *
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Emergency Contact */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Phone className="w-5 h-5 mr-2" />
              Kontak Darurat
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Kontak Darurat
                </label>
                <input
                  type="text"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nomor Telepon Darurat
                </label>
                <input
                  type="tel"
                  name="emergencyPhone"
                  value={formData.emergencyPhone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Driver Information */}
          {formData.role === 'driver' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Car className="w-5 h-5 mr-2" />
                Informasi Kendaraan
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jenis Kendaraan *
                  </label>
                  <select
                    name="vehicleType"
                    value={formData.vehicleType}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="becak-listrik">Becak Listrik</option>
                    <option value="delman">Delman</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nomor Kendaraan *
                  </label>
                  <input
                    type="text"
                    name="vehicleCode"
                    value={formData.vehicleCode}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nomor KTP *
                  </label>
                  <input
                    type="text"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Status */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Status
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status User *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="active">Aktif</option>
                <option value="inactive">Tidak Aktif</option>
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/admin/users')}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Simpan Perubahan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUser;
