import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Save, ArrowLeft, Plus, Trash2, Edit3 } from 'lucide-react';
import { tariffsAPI } from '../services/api';
import { useOrder } from '../context/OrderContext';

interface TariffFormData {
  name: string;
  minDistance: number;
  maxDistance: number;
  price: number;
  destinations: string;
}

interface TariffOption {
  id: string;
  name: string;
  distance: string;
  price: number;
  destination: string;
  minDistance: number;
  maxDistance: number;
  isActive: boolean;
}

const TariffSettings: React.FC = () => {
  const navigate = useNavigate();
  const { distanceOptions, updateTariff, addTariff, deleteTariff } = useOrder();
  const [tariffs, setTariffs] = useState<TariffOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState<TariffFormData>({
    name: '',
    minDistance: 0,
    maxDistance: 0,
    price: 0,
    destinations: ''
  });

  // Auto hide success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Fetch tariffs from backend
  const fetchTariffs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch tariffs based on filter
      const params: any = {};
      if (statusFilter === 'active') {
        params.is_active = true;
      } else if (statusFilter === 'inactive') {
        params.is_active = false;
      }
      
      const response = await tariffsAPI.getTariffs(params);
      const normalized = (response.tariffs || []).map((t: any) => ({
        id: t.id?.toString() || `tariff-${Date.now()}`,
        name: t.name,
        distance: `${t.min_distance} - ${t.max_distance} km`,
        price: t.price,
        destination: t.destinations || '',
        minDistance: t.min_distance,
        maxDistance: t.max_distance,
        isActive: t.is_active,
      }));
      setTariffs(normalized);
      
    } catch (error: any) {
      console.error('Failed to fetch tariffs:', error);
      
      if (error.response?.status === 401) {
        setError('Anda harus login sebagai admin untuk mengakses data tarif');
      } else if (error.response?.status === 403) {
        setError('Anda tidak memiliki akses ke halaman ini');
      } else if (error.code === 'ERR_NETWORK') {
        setError('Tidak dapat terhubung ke server. Pastikan backend sudah running di port 8080');
      } else {
        setError(error.response?.data?.message || 'Gagal mengambil data tarif');
      }
      
      // Fallback to distanceOptions from context
      setTariffs(distanceOptions.map(option => ({
        ...option,
        minDistance: 0,
        maxDistance: 0,
        isActive: true,
      })));
    } finally {
      setLoading(false);
    }
  };
  
  // Load tariffs on component mount
  useEffect(() => {
    fetchTariffs();
  }, [statusFilter]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'minDistance' || name === 'maxDistance' ? parseInt(value) || 0 : value
    }));
  };

  const handleEdit = (tariff: TariffOption) => {
    setIsEditing(tariff.id);
    setFormData({
      name: tariff.name,
      minDistance: tariff.minDistance || 0,
      maxDistance: tariff.maxDistance || 0,
      price: tariff.price,
      destinations: tariff.destination
    });
  };

  const handleAdd = () => {
    setIsAdding(true);
    setFormData({
      name: '',
      minDistance: 0,
      maxDistance: 0,
      price: 0,
      destinations: ''
    });
  };

  const handleCancel = () => {
    setIsEditing(null);
    setIsAdding(false);
    setFormData({
      name: '',
      minDistance: 0,
      maxDistance: 0,
      price: 0,
      destinations: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Payload sesuai backend
      const payload = {
        name: formData.name,
        min_distance: formData.minDistance,
        max_distance: formData.maxDistance,
        price: formData.price,
        destinations: formData.destinations,
        is_active: true,
      };
      
      if (isEditing) {
        // Update existing tariff via API
        await tariffsAPI.updateTariff(isEditing, payload);
        
        // Update local state
        setTariffs(prev => prev.map(tariff => 
          tariff.id === isEditing 
            ? { 
                ...tariff, 
                name: formData.name,
                distance: `${formData.minDistance} - ${formData.maxDistance} km`,
                price: formData.price,
                destination: formData.destinations,
                minDistance: formData.minDistance,
                maxDistance: formData.maxDistance,
              }
            : tariff
        ));
        
        // Update context
        updateTariff(isEditing, { 
          id: isEditing,
          name: formData.name,
          distance: `${formData.minDistance} - ${formData.maxDistance} km`,
          price: formData.price,
          destination: formData.destinations,
        });
        
        setSuccessMessage('Tarif berhasil diperbarui!');
      } else {
        // Add new tariff via API
        const response = await tariffsAPI.createTariff(payload);
        
        const newTariff: TariffOption = {
          id: response.tariff?.id?.toString() || `tariff-${Date.now()}`,
          name: formData.name,
          distance: `${formData.minDistance} - ${formData.maxDistance} km`,
          price: formData.price,
          destination: formData.destinations,
          minDistance: formData.minDistance,
          maxDistance: formData.maxDistance,
          isActive: true,
        };
        
        // Update local state
        setTariffs(prev => [...prev, newTariff]);
        
        // Update context
        addTariff(newTariff);
        
        setSuccessMessage('Tarif berhasil ditambahkan!');
      }
      
      // Reset form
      setFormData({
        name: '',
        minDistance: 0,
        maxDistance: 0,
        price: 0,
        destinations: ''
      });
      
      setIsEditing(null);
      setIsAdding(false);
      
    } catch (error: any) {
      console.error('Error updating tariff:', error);
      if (error.response?.status === 401) {
        alert('Anda harus login sebagai admin untuk mengubah tarif');
      } else if (error.response?.status === 403) {
        alert('Anda tidak memiliki akses untuk mengubah tarif');
      } else if (error.code === 'ERR_NETWORK') {
        alert('Tidak dapat terhubung ke server. Pastikan backend sudah running');
      } else {
        alert(error.response?.data?.message || 'Gagal menyimpan tarif');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (tariffId: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus tarif ini?')) {
      try {
        // Delete tariff via API
        await tariffsAPI.deleteTariff(tariffId);
        
        // Update local state
        setTariffs(prev => prev.filter(tariff => tariff.id !== tariffId));
        
        // Update context
        deleteTariff(tariffId);
        
        setSuccessMessage('Tarif berhasil dihapus!');
      } catch (error: any) {
        console.error('Error deleting tariff:', error);
        if (error.response?.status === 401) {
          alert('Anda harus login sebagai admin untuk menghapus tarif');
        } else if (error.response?.status === 403) {
          alert('Anda tidak memiliki akses untuk menghapus tarif');
        } else if (error.code === 'ERR_NETWORK') {
          alert('Tidak dapat terhubung ke server. Pastikan backend sudah running');
        } else {
          alert(error.response?.data?.message || 'Gagal menghapus tarif');
        }
      }
    }
  };

  const handleToggleStatus = async (tariffId: string) => {
    try {
      // Get current tariff to know its status
      const currentTariff = tariffs.find(t => t.id === tariffId);
      if (!currentTariff) return;
      
      // Send the opposite status
      await tariffsAPI.toggleTariffStatus(tariffId, !currentTariff.isActive);
      
      // Update local state
      setTariffs(prev => prev.map(tariff => 
        tariff.id === tariffId 
          ? { ...tariff, isActive: !tariff.isActive }
          : tariff
      ));
      
      setSuccessMessage('Status tarif berhasil diubah!');
    } catch (error: any) {
      console.error('Error toggling tariff status:', error);
      if (error.response?.status === 401) {
        alert('Anda harus login sebagai admin untuk mengubah status tarif');
      } else if (error.response?.status === 403) {
        alert('Anda tidak memiliki akses untuk mengubah status tarif');
      } else if (error.code === 'ERR_NETWORK') {
        alert('Tidak dapat terhubung ke server. Pastikan backend sudah running');
      } else {
        alert(error.response?.data?.message || 'Gagal mengubah status tarif');
      }
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat data tarif...</p>
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
              <div className="w-5 h-5 text-red-400">⚠️</div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">
                Error: {error}
              </p>
              <button
                onClick={fetchTariffs}
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
      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <div className="w-5 h-5 text-green-400">✅</div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                {successMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        
        <h1 className="text-2xl font-bold text-gray-900">Pengaturan Tarif</h1>
        <p className="text-gray-600 mt-2">Kelola tarif untuk berbagai jarak perjalanan GreenBecak</p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <DollarSign className="w-6 h-6 text-green-600 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">Daftar Tarif</h2>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">Semua Status</option>
                <option value="active">Aktif</option>
                <option value="inactive">Tidak Aktif</option>
              </select>
              <button
                onClick={handleAdd}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Tarif
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Form untuk menambah/edit tarif */}
          {(isAdding || isEditing) && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {isEditing ? 'Edit Tarif' : 'Tambah Tarif Baru'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Nama Tarif *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Contoh: Dekat, Sedang, Jauh"
                    />
                  </div>

                  <div>
                    <label htmlFor="minDistance" className="block text-sm font-medium text-gray-700 mb-2">
                      Jarak Minimum (km) *
                    </label>
                    <input
                      type="number"
                      id="minDistance"
                      name="minDistance"
                      value={formData.minDistance}
                      onChange={handleInputChange}
                      required
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Contoh: 0"
                    />
                  </div>

                  <div>
                    <label htmlFor="maxDistance" className="block text-sm font-medium text-gray-700 mb-2">
                      Jarak Maksimum (km) *
                    </label>
                    <input
                      type="number"
                      id="maxDistance"
                      name="maxDistance"
                      value={formData.maxDistance}
                      onChange={handleInputChange}
                      required
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Contoh: 3"
                    />
                  </div>

                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                      Harga (Rp) *
                    </label>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Contoh: 10000"
                    />
                  </div>

                  <div>
                    <label htmlFor="destinations" className="block text-sm font-medium text-gray-700 mb-2">
                      Destinasi
                    </label>
                    <input
                      type="text"
                      id="destinations"
                      name="destinations"
                      value={formData.destinations}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Contoh: Malioboro, Tugu"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSubmitting ? 'Menyimpan...' : (isEditing ? 'Update Tarif' : 'Simpan Tarif')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tabel tarif */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama Tarif
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jarak
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Harga
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Destinasi
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
                {tariffs.map((tariff) => (
                  <tr key={tariff.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {tariff.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tariff.distance}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Rp {tariff.price.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tariff.destination}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        tariff.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {tariff.isActive ? 'Aktif' : 'Tidak Aktif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleToggleStatus(tariff.id)}
                          className={`${
                            tariff.isActive 
                              ? 'text-red-600 hover:text-red-900' 
                              : 'text-green-600 hover:text-green-900'
                          }`}
                          title={tariff.isActive ? 'Nonaktifkan Tarif' : 'Aktifkan Tarif'}
                        >
                          {tariff.isActive ? '🔴' : '🟢'}
                        </button>
                        <button
                          onClick={() => handleEdit(tariff)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit Tarif"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(tariff.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Hapus Tarif"
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

          {tariffs.length === 0 && (
            <div className="text-center py-8">
              <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Tidak ada tarif yang ditemukan</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TariffSettings;
