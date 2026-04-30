import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, ArrowLeft, Save, X } from 'lucide-react';

interface DriverFormData {
  name: string;
  email: string;
  phone: string;
  vehicleType: 'becak-listrik' | 'delman';
  vehicleCode: string;
  licenseNumber: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
}

const CreateDriver: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<DriverFormData>({
    name: '',
    email: '',
    phone: '',
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
    setIsSubmitting(true);
    
    try {
      // Simulasi API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        vehicleType: 'becak-listrik',
        vehicleCode: '',
        licenseNumber: '',
        address: '',
        emergencyContact: '',
        emergencyPhone: ''
      });
      
             // Redirect ke driver list dengan pesan sukses
       navigate('/admin/drivers', { state: { message: 'Driver berhasil ditambahkan!' } });
    } catch (error) {
      console.error('Error creating driver:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/drivers');
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/drivers')}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali ke Daftar Driver
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Tambah Driver Baru</h1>
        <p className="text-gray-600 mt-2">Isi informasi lengkap driver baru untuk sistem GreenBecak</p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <UserPlus className="w-6 h-6 text-green-600 mr-3" />
            <h2 className="text-lg font-semibold text-gray-900">Informasi Driver</h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informasi Pribadi */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4">Informasi Pribadi</h3>
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

              
            </div>
          </div>

          {/* Informasi Kendaraan */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4">Informasi Kendaraan</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
          </div>

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
              {isSubmitting ? 'Menyimpan...' : 'Simpan Driver'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDriver;
