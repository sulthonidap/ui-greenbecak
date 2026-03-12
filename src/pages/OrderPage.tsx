import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useOrder, DistanceOption } from '../context/OrderContext';
import { tariffsAPI, ordersAPI } from '../services/api';
import { MapPin, CheckCircle, Phone } from 'lucide-react';

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
  const [searchParams] = useSearchParams();
  const [tariffs, setTariffs] = useState<TariffOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [pedicabCode, setPedicabCode] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [selectedOption, setSelectedOption] = useState<TariffOption | null>(null);
  const [codeFromQR, setCodeFromQR] = useState(false);
  const navigate = useNavigate();

  // Read code parameter from URL and auto-fill pedicab code
  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl) {
      setPedicabCode(codeFromUrl);
      setCodeFromQR(true);
      // Clear the indicator after 5 seconds
      setTimeout(() => setCodeFromQR(false), 5000);
    }
  }, [searchParams]);

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

      // Use fallback data from context
      const fallbackTariffs = distanceOptions.map(option => ({
        id: option.id,
        name: option.name,
        distance: option.distance,
        price: option.price,
        destination: option.destination,
        minDistance: 0,
        maxDistance: 0,
        isActive: true,
      }));

      console.log('Using fallback tariffs from context:', fallbackTariffs);
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
      setError('Kode Becak harus diisi!');
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
      notes: `Transport: Becak`
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
      } else if (error.message && error.message !== 'Failed to fetch') {
        // Handle error message from API response
        setError(error.message);
      } else {
        setError(error.response?.data?.error || error.response?.data?.message || 'Gagal membuat pesanan. Silakan coba lagi.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const themeColor = '#047857';

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 text-white" style={{ backgroundColor: themeColor }}>
            <h1 className="text-2xl font-bold">Pesan Becak</h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Memuat data tarif...</p>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: themeColor }}></div>
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
        <div className="p-6 text-white relative" style={{ backgroundColor: themeColor }}>
          <h1 className="text-2xl font-bold">Pesan Becak</h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Isi formulir di bawah untuk memesan perjalanan Anda</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-md">
              {error}
            </div>
          )}



          <div className="mb-6">
            <label htmlFor="pedicabCode" className="block mb-2 text-sm font-medium text-gray-700">
              Kode Becak
            </label>
            {codeFromQR && (
              <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 animate-fade-in">
                <CheckCircle size={16} className="text-green-600" />
                <p className="text-sm text-green-700">
                  Kode becak telah terisi otomatis dari QR code
                </p>
              </div>
            )}
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
                  setCodeFromQR(false);
                }}
                disabled={submitting}
                className={`bg-gray-50 border text-gray-900 text-sm rounded-lg block w-full pl-10 p-2.5 focus:outline-none transition-colors ${codeFromQR ? 'border-green-300' : 'border-gray-300'
                  }`}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = themeColor;
                  e.currentTarget.style.boxShadow = `0 0 0 2px ${themeColor}40`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = codeFromQR ? '#86efac' : '';
                  e.currentTarget.style.boxShadow = '';
                }}
                placeholder="Masukkan kode becak (contoh: DL-123)"
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Kode becak terdapat pada bagian depan becak atau bisa ditanyakan kepada pengemudi
            </p>
          </div>

          <div className="mb-6">
            <label htmlFor="whatsappNumber" className="block mb-2 text-sm font-medium text-gray-700">
              Nomor Gojek mu
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
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full pl-10 p-2.5 focus:outline-none"
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = themeColor;
                  e.currentTarget.style.boxShadow = `0 0 0 2px ${themeColor}40`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '';
                  e.currentTarget.style.boxShadow = '';
                }}
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
                    className={`border rounded-lg p-4 transition-all ${submitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                      } ${selectedOption?.id === option.id
                        ? 'ring-2'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    style={selectedOption?.id === option.id ? {
                      borderColor: themeColor,
                      backgroundColor: 'rgba(4, 120, 87, 0.1)',
                      boxShadow: `0 0 0 2px ${themeColor}40`
                    } : {}}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">{option.name}</h4>
                      {selectedOption?.id === option.id && (
                        <CheckCircle size={18} style={{ color: themeColor }} />
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
            className="w-full text-white font-medium rounded-lg text-sm px-5 py-3 text-center transition duration-300"
            style={{
              backgroundColor: submitting ? `${themeColor}80` : themeColor,
              cursor: submitting ? 'not-allowed' : 'pointer'
            }}
            onMouseEnter={(e) => {
              if (!submitting) e.currentTarget.style.backgroundColor = '#065f46';
            }}
            onMouseLeave={(e) => {
              if (!submitting) e.currentTarget.style.backgroundColor = themeColor;
            }}
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