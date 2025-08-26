import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, ArrowLeft, Save, X, Eye, EyeOff } from 'lucide-react';
import { adminAPI } from '../services/api';
import { showSuccess, showError, showWarning } from '../utils/toast';

interface UserFormData {
  name: string;
  email: string;
  phone: string;
  username: string;
  password: string;
  confirmPassword: string;
  role: 'admin' | 'driver' | 'customer';
  vehicleType?: 'becak-listrik' | 'delman';
  vehicleCode?: string;
  licenseNumber?: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
}

const CreateUser: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    confirmPassword: '',
    role: 'driver',
    vehicleType: 'becak-listrik',
    vehicleCode: '',
    licenseNumber: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi password
    if (formData.password !== formData.confirmPassword) {
      showError('Password dan konfirmasi password tidak cocok!');
      return;
    }

    if (formData.password.length < 6) {
      showError('Password minimal 6 karakter!');
      return;
    }

    // Validasi field wajib untuk driver
    if (formData.role === 'driver') {
      if (!formData.vehicleCode) {
        showError('Kode Kendaraan wajib diisi untuk Driver');
        return;
      }
      if (!formData.licenseNumber) {
        showError('Nomor SIM wajib diisi untuk Driver');
        return;
      }
    }

    setIsSubmitting(true);
    
    try {
      // Payload sesuai dokumentasi Swagger /admin/users terbaru
      const payload: any = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        role: formData.role,
      };

      // Tambahkan field driver jika role = 'driver'
      if (formData.role === 'driver') {
        payload.driver_code = formData.vehicleCode;
        payload.id_card = formData.emergencyContact; // Gunakan emergency contact sebagai id_card sementara
        payload.license_number = formData.licenseNumber;
        payload.vehicle_number = formData.vehicleCode;
      }

      await adminAPI.createUser(payload);
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        username: '',
        password: '',
        confirmPassword: '',
        role: 'driver',
        vehicleType: 'becak-listrik',
        vehicleCode: '',
        licenseNumber: '',
        address: '',
        emergencyContact: '',
        emergencyPhone: ''
      });
      
      // Show success message and redirect
      showSuccess('User berhasil ditambahkan!');
      navigate('/admin/users');
    } catch (error: any) {
      console.error('Error creating user:', error);
      if (error.response?.status === 401) {
        showError('Anda harus login sebagai admin untuk menambah user');
      } else if (error.response?.status === 403) {
        showError('Anda tidak memiliki akses untuk menambah user');
      } else if (error.response?.status === 409) {
        showError('Username atau email sudah ada. Gunakan username/email yang berbeda.');
      } else if (error.code === 'ERR_NETWORK') {
        showError('Tidak dapat terhubung ke server. Pastikan backend berjalan');
      } else {
        showError(error.response?.data?.error || error.response?.data?.message || 'Gagal menambahkan user');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/users');
  };

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
        <h1 className="text-2xl font-bold text-gray-900">Tambah User Baru</h1>
        <p className="text-gray-600 mt-2">Isi informasi lengkap user baru untuk sistem GreenBecak</p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <UserPlus className="w-6 h-6 text-green-600 mr-3" />
            <h2 className="text-lg font-semibold text-gray-900">Informasi User</h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informasi Dasar */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4">Informasi Dasar</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                   Nama Lengkap *
                 </label>
                 <input
                   type="text"
                   id="name"
                   name="name"
                   value={formData.name}
                   onChange={handleInputChange}
                   required
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                   placeholder="Masukkan nama lengkap"
                 />
               </div>

               <div>
                 <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                   Email *
                 </label>
                 <input
                   type="email"
                   id="email"
                   name="email"
                   value={formData.email}
                   onChange={handleInputChange}
                   required
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                   placeholder="user@email.com"
                 />
               </div>

               <div>
                 <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                   Nomor Telepon *
                 </label>
                 <input
                   type="tel"
                   id="phone"
                   name="phone"
                   value={formData.phone}
                   onChange={handleInputChange}
                   required
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                   placeholder="08123456789"
                 />
               </div>

               <div>
                 <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                   Role *
                 </label>
                 <select
                   id="role"
                   name="role"
                   value={formData.role}
                   onChange={handleInputChange}
                   required
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                 >
                   <option value="driver">Driver</option>
                   <option value="admin">Admin</option>
                   <option value="customer">Customer</option>
                 </select>
               </div>
             </div>
          </div>

          {/* Login Information */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4">Informasi Login</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="username"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    minLength={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent pr-10"
                    placeholder="Minimal 6 karakter"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                             </div>

               <div>
                 <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                   Konfirmasi Password *
                 </label>
                 <div className="relative">
                   <input
                     type={showConfirmPassword ? "text" : "password"}
                     id="confirmPassword"
                     name="confirmPassword"
                     value={formData.confirmPassword}
                     onChange={handleInputChange}
                     required
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent pr-10"
                     placeholder="Ulangi password"
                   />
                   <button
                     type="button"
                     onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                     className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                   >
                     {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                   </button>
                 </div>
               </div>
             </div>
           </div>

           {/* Informasi Kendaraan (hanya untuk driver) */}
           {formData.role === 'driver' && (
             <div>
               <h3 className="text-md font-medium text-gray-900 mb-4">Informasi Kendaraan</h3>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div>
                   <label htmlFor="vehicleType" className="block text-sm font-medium text-gray-700 mb-2">
                     Jenis Kendaraan *
                   </label>
                   <select
                     id="vehicleType"
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
                   <label htmlFor="vehicleCode" className="block text-sm font-medium text-gray-700 mb-2">
                     Kode Kendaraan *
                   </label>
                   <input
                     type="text"
                     id="vehicleCode"
                     name="vehicleCode"
                     value={formData.vehicleCode}
                     onChange={handleInputChange}
                     required
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                     placeholder="BL001 atau DL001"
                   />
                 </div>

                 <div>
                   <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700 mb-2">
                     Nomor SIM *
                   </label>
                   <input
                     type="text"
                     id="licenseNumber"
                     name="licenseNumber"
                     value={formData.licenseNumber}
                     onChange={handleInputChange}
                     required
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                     placeholder="1234567890"
                   />
                 </div>
               </div>
             </div>
           )}

           {/* Alamat */}
           <div>
             <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
               Alamat Lengkap *
             </label>
             <textarea
               id="address"
               name="address"
               value={formData.address}
               onChange={handleInputChange}
               required
               rows={3}
               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
               placeholder="Masukkan alamat lengkap"
             />
           </div>

           {/* Kontak Darurat */}
           <div>
             <h3 className="text-md font-medium text-gray-900 mb-4">Kontak Darurat</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <label htmlFor="emergencyContact" className="block text-sm font-medium text-gray-700 mb-2">
                   Nama Kontak Darurat *
                 </label>
                 <input
                   type="text"
                   id="emergencyContact"
                   name="emergencyContact"
                   value={formData.emergencyContact}
                   onChange={handleInputChange}
                   required
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                   placeholder="Nama keluarga atau teman"
                 />
               </div>

               <div>
                 <label htmlFor="emergencyPhone" className="block text-sm font-medium text-gray-700 mb-2">
                   Nomor Telepon Darurat *
                 </label>
                 <input
                   type="tel"
                   id="emergencyPhone"
                   name="emergencyPhone"
                   value={formData.emergencyPhone}
                   onChange={handleInputChange}
                   required
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                   placeholder="08123456789"
                 />
               </div>
             </div>
           </div>

           {/* Tombol Aksi */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <X className="w-4 h-4 mr-2" />
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Menyimpan...' : 'Simpan User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUser;
