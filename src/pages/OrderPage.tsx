import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrder, DistanceOption } from '../context/OrderContext';
import { tariffsAPI, ordersAPI } from '../services/api';
import { MapPin, CheckCircle, Phone, CarFront, Bike, ArrowLeft } from 'lucide-react';

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

const OrderPage: React.FC = () => {
  const { distanceOptions, setOrder } = useOrder();
  const [tariffs, setTariffs] = useState<TariffOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [pedicabCode, setPedicabCode] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [selectedOption, setSelectedOption] = useState<TariffOption | null>(null);
  const [selectedTransport, setSelectedTransport] = useState<'becak' | 'delman' | null>(null);
  const navigate = useNavigate();

  // Fetch active tariffs from backend (public endpoint - no login required)
  const fetchTariffs = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching tariffs from backend (public endpoint)...');
      const response = await tariffsAPI.getTariffsPublic();
      console.log('Tariffs response:', response);
      
      const normalized = (response.tariffs || []).map((t: any) => ({
        id: t.id?.toString() || '1', // Ensure valid numeric ID
        name: t.name,
        distance: `${t.min_distance} - ${t.max_distance} km`,
        price: t.price,
        destination: t.destinations || '',
        minDistance: t.min_distance,
        maxDistance: t.max_distance,
        isActive: t.is_active,
      }));
      console.log('Normalized tariffs:', normalized);
      setTariffs(normalized);
      
    } catch (error: any) {
      console.error('Failed to fetch tariffs:', error);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      // Fallback to distanceOptions from context with better data
      const fallbackTariffs = [
        {
          id: '1',
          name: 'Dekat',
          distance: '0 - 3 km',
          price: 10000,
          destination: 'Benteng Vredeburg, Bank Indonesia',
          minDistance: 0,
          maxDistance: 3,
          isActive: true,
        },
        {
          id: '2',
          name: 'Sedang',
          distance: '3 - 7 km',
          price: 20000,
          destination: 'Taman Sari, Alun-Alun Selatan',
          minDistance: 3,
          maxDistance: 7,
          isActive: true,
        },
        {
          id: '3',
          name: 'Jauh',
          distance: '7 - 15 km',
          price: 30000,
          destination: 'Tugu Jogja, Stasiun Lempuyangan',
          minDistance: 7,
          maxDistance: 15,
          isActive: true,
        }
      ];
      
      console.log('Using fallback tariffs:', fallbackTariffs);
      setTariffs(fallbackTariffs);
    } finally {
      setLoading(false);
    }
  };
  
  // Load tariffs on component mount
  useEffect(() => {
    fetchTariffs();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pedicabCode.trim()) {
      setError(`${selectedTransport === 'becak' ? 'Kode Becak' : 'Kode Delman'} harus diisi!`);
      return;
    }
    
    if (!whatsappNumber.trim()) {
      setError('Nomor WhatsApp harus diisi!');
      return;
    }
    
    if (!selectedOption) {
      setError('Silahkan pilih jarak perjalanan!');
      return;
    }
    
    // Validate tariff ID
    const tariffId = parseInt(selectedOption.id);
    if (isNaN(tariffId) || tariffId <= 0) {
      setError('ID tarif tidak valid. Silakan pilih jarak perjalanan lagi.');
      return;
    }
    
    // Prepare order data for API
    const orderData = {
      becak_code: pedicabCode,
      customer_phone: whatsappNumber,
      customer_name: `Customer ${whatsappNumber}`,
      tariff_id: tariffId,
      notes: `Transport: ${selectedTransport === 'delman' ? 'Delman' : 'Becak Listrik'}`
    };
    
    try {
      setSubmitting(true);
      setError('');
      
      console.log('Sending order data:', orderData);
      
      // Create order via API
      const response = await ordersAPI.createOrder(orderData);
      
      // Set order in context for payment page
      const distanceOption: DistanceOption = {
        id: selectedOption.id,
        name: selectedOption.name,
        distance: selectedOption.distance,
        price: selectedOption.price,
        destination: selectedOption.destination,
      };
      
      setOrder(pedicabCode, distanceOption, whatsappNumber);
      
      // Navigate to payment page with order ID
      navigate('/pembayaran', { 
        state: { 
          orderId: response.order?.id || response.id,
          orderNumber: response.order?.order_number || response.order_number 
        } 
      });
      
    } catch (error: any) {
      console.error('Failed to create order:', error);
      console.error('Request data:', orderData);
      
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Data pesanan tidak valid. Silakan cek kembali informasi yang dimasukkan.';
        setError(errorMessage);
      } else if (error.response?.status === 409) {
        setError('Kode kendaraan tidak ditemukan atau tidak tersedia.');
      } else if (error.code === 'ERR_NETWORK') {
        setError('Tidak dapat terhubung ke server. Silakan coba lagi.');
      } else {
        setError(error.response?.data?.message || 'Gagal membuat pesanan. Silakan coba lagi.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!selectedTransport) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-green-800 p-6 text-white">
            <h1 className="text-2xl font-bold">Pilih Transportasi</h1>
            <p className="text-green-50">Pilih jenis transportasi yang ingin Anda pesan</p>
          </div>
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={() => setSelectedTransport('becak')}
                className="flex flex-col items-center p-6 border rounded-lg hover:bg-green-50 hover:border-green-800 transition-all"
              >
                <Bike size={48} className="text-green-800 mb-2" />
                <span className="font-medium">Becak Listrik</span>
              </button>
              <button
                onClick={() => setSelectedTransport('delman')}
                className="flex flex-col items-center p-6 border rounded-lg hover:bg-blue-50 hover:border-blue-800 transition-all"
              >
                <CarFront size={48} className="text-blue-800 mb-2" />
                <span className="font-medium">Delman</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isDelman = selectedTransport === 'delman';
  const themeColor = isDelman ? 'blue' : 'green';

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className={`bg-${themeColor}-800 p-6 text-white`}>
            <h1 className="text-2xl font-bold">Pesan {isDelman ? 'Delman' : 'GreenBecak'}</h1>
            <p className="text-${themeColor}-50">Memuat data tarif...</p>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Memuat data tarif...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className={`bg-${themeColor}-800 p-6 text-white relative`}>
          <button
            onClick={() => setSelectedTransport(null)}
            className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center text-white hover:text-gray-200 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            <span>Kembali</span>
          </button>
          <h1 className="text-2xl font-bold">Pesan {isDelman ? 'Delman' : 'GreenBecak'}</h1>
          <p className="text-${themeColor}-50">Isi formulir di bawah untuk memesan perjalanan Anda</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-md">
              {error}
            </div>
          )}
          

          
          <div className="mb-6">
            <label htmlFor="pedicabCode" className="block mb-2 text-sm font-medium text-gray-700">
              Kode {isDelman ? 'Delman' : 'Becak'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <MapPin size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                id="pedicabCode"
                value={pedicabCode}
                onChange={(e) => {
                  setPedicabCode(e.target.value);
                  setError('');
                }}
                disabled={submitting}
                className={`bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-${themeColor}-800 focus:border-${themeColor}-800 block w-full pl-10 p-2.5 ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                placeholder={`Masukkan kode ${isDelman ? 'delman' : 'becak'} (contoh: ${isDelman ? 'DL' : 'GT'}-123)`}
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Kode {isDelman ? 'delman' : 'becak'} terdapat pada bagian depan {isDelman ? 'delman' : 'becak'} atau bisa ditanyakan kepada pengemudi
            </p>
          </div>
          
          <div className="mb-6">
            <label htmlFor="whatsappNumber" className="block mb-2 text-sm font-medium text-gray-700">
              Nomor WhatsApp
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Phone size={18} className="text-gray-400" />
              </div>
              <input
                type="tel"
                id="whatsappNumber"
                value={whatsappNumber}
                onChange={(e) => {
                  setWhatsappNumber(e.target.value);
                  setError('');
                }}
                disabled={submitting}
                className={`bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-${themeColor}-800 focus:border-${themeColor}-800 block w-full pl-10 p-2.5 ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                placeholder="Masukkan nomor WhatsApp (contoh: 08123456789)"
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Nomor WhatsApp akan digunakan untuk konfirmasi pesanan dan komunikasi dengan pengemudi
            </p>
          </div>
          
          <div className="mb-6">
            <h3 className="block mb-3 text-sm font-medium text-gray-700">
              Pilih Jarak Perjalanan
            </h3>
            {tariffs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Tidak ada tarif yang tersedia saat ini</p>
              </div>
            ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {tariffs.map((option) => (
                <div 
                  key={option.id}
                  onClick={() => {
                    if (!submitting) {
                      setSelectedOption(option);
                      setError('');
                    }
                  }}
                  className={`border rounded-lg p-4 transition-all ${
                    submitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  } ${
                    selectedOption?.id === option.id 
                      ? `border-${themeColor}-800 bg-${themeColor}-50 ring-2 ring-${themeColor}-800`
                      : 'border-gray-200 hover:border-green-200 hover:bg-green-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">{option.name}</h4>
                    {selectedOption?.id === option.id && (
                      <CheckCircle size={18} className={`text-${themeColor}-800`} />
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mb-2">{option.distance}</p>
                  <p className="text-lg font-semibold text-gray-900">
                    Rp {option.price.toLocaleString('id-ID')}
                  </p>
                  {option.destination && (
                    <p className="text-sm text-gray-500 mb-2">* {option.destination}</p>
                  )}
                  
                </div>
              ))}
            </div>
            )}
          </div>
          
          <button
            type="submit"
            disabled={submitting}
            className={`w-full bg-${themeColor}-800 hover:bg-${themeColor}-600 text-white font-medium rounded-lg text-sm px-5 py-3 text-center transition duration-300 ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {submitting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Membuat Pesanan...
              </div>
            ) : (
              'Lanjutkan ke Pembayaran'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OrderPage;