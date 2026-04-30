// DriverDashboard.tsx - Updated to fix HMR issues
import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { 
  List, MapPin, User, Clock, LogOut, 
  AlertCircle, CheckCircle, X, ChevronDown, ChevronUp,
  Calendar, DollarSign, Wallet, TrendingUp, CreditCard,
  ArrowUpRight, ArrowDownRight, ArrowDownLeft, Target, Award, Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOrder, Order } from '../context/OrderContext';
import { driverAPI, authAPI } from '../services/api';

const playNotificationSound = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Fungsi untuk memainkan satu "burst" (2 kali bunyi bip keras)
    const playBurst = (startTime: number) => {
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      // Square wave jauh lebih keras dan nyaring, cocok untuk di jalan/HP
      oscillator.type = 'square';
      
      const volume = 1.0; // Volume maksimal
      
      // Bip pertama
      oscillator.frequency.setValueAtTime(800, startTime); 
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.02);
      gainNode.gain.setValueAtTime(volume, startTime + 0.15);
      gainNode.gain.linearRampToValueAtTime(0, startTime + 0.2);
      
      // Bip kedua (nada lebih tinggi)
      oscillator.frequency.setValueAtTime(1000, startTime + 0.25); 
      gainNode.gain.setValueAtTime(0, startTime + 0.25);
      gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.27);
      gainNode.gain.setValueAtTime(volume, startTime + 0.4);
      gainNode.gain.linearRampToValueAtTime(0, startTime + 0.45);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.5);
    };

    // Mainkan alarm berulang-ulang (4 kali burst) agar mirip nada dering telepon
    const now = audioCtx.currentTime;
    playBurst(now);          // Detik 0
    playBurst(now + 0.8);    // Detik 0.8
    playBurst(now + 1.6);    // Detik 1.6
    playBurst(now + 2.4);    // Detik 2.4

  } catch (e) {
    console.warn('AudioContext not supported or blocked', e);
  }
};

const playSuccessSound = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Suara "Cring" / Koin emas seperti saat mendapatkan uang
    const playCoin = (freq: number, startTime: number) => {
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      
      oscillator.frequency.setValueAtTime(freq, startTime);
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.5, startTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.5);
    };

    const now = audioCtx.currentTime;
    // Mainkan nada rendah cepat lalu nada tinggi (mirip "Ka-Ching!")
    playCoin(987.77, now);         // Nada B5
    playCoin(1318.51, now + 0.1);  // Nada E6
  } catch (e) {
    console.warn('AudioContext not supported or blocked', e);
  }
};

const DriverHome: React.FC = () => {
  const { orders, acceptOrder, completeOrder, cancelOrder } = useOrder();
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(true);
  const [driverId, setDriverId] = useState<string>('1');
  
  console.log('Auth user data:', user);
  console.log('Driver ID being used:', driverId);
  
  // New state for real API data
  const [driverOrders, setDriverOrders] = useState<any[]>([]);
  const [driverEarnings, setDriverEarnings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Helper function for currency formatting
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };
  
  // New state for accept order improvements
  const [acceptingOrderId, setAcceptingOrderId] = useState<string | null>(null);
  const [showAcceptConfirmation, setShowAcceptConfirmation] = useState<string | null>(null);
  const [completingOrderId, setCompletingOrderId] = useState<string | null>(null);
  const [showCompleteConfirmation, setShowCompleteConfirmation] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showNewOrderNotification, setShowNewOrderNotification] = useState(false);
  const [updatingOnlineStatus, setUpdatingOnlineStatus] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const notifiedOrderIds = useRef<Set<string>>(new Set());


  
  // Fetch online status only
  const fetchOnlineStatus = async () => {
    try {
      const locationResponse = await driverAPI.getOnlineStatus();
      const currentStatus = locationResponse.is_online || false;
      
      // Force online if offline
      if (!currentStatus) {
        await driverAPI.setOnlineStatus(true);
      }
      setIsOnline(true);
    } catch (error) {
      console.log('Could not fetch online status:', error);
      // Tetap anggap online meskipun gagal fetch
      setIsOnline(true);
    }
  };

  // Fetch driver data from API
  const fetchDriverData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Debug: Check token
      const token = localStorage.getItem('authToken');
      console.log('Current auth token:', token ? 'Token exists' : 'No token');
      console.log('User data:', user);
      
      console.log('Using driver ID:', driverId);
      
      // Fetch online status first
      await fetchOnlineStatus();
      
      console.log('Fetching driver orders...');
      // Fetch orders for logged-in driver
      const ordersResponse = await driverAPI.getDriverOrders();
      console.log('Orders response:', ordersResponse);
      console.log('Orders array:', ordersResponse.orders);
      console.log('First order (if exists):', ordersResponse.orders?.[0]);
      setDriverOrders(ordersResponse.orders || []);
      
      console.log('Fetching driver earnings...');
      // Fetch earnings
      const earningsResponse = await driverAPI.getDriverEarnings();
      console.log('Earnings response:', earningsResponse);
      setDriverEarnings(earningsResponse.earnings || null);
      
    } catch (error: any) {
      console.error('Failed to fetch driver data:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: error.config
      });
      setError(`Gagal memuat data driver: ${error.message || 'Silakan coba lagi.'}`);
      
      // Try fallback to direct driver ID if auth fails
      try {
        console.log('Trying fallback with driver ID...');
        const fallbackResponse = await driverAPI.getOrdersByDriverID(driverId);
        console.log('Fallback response:', fallbackResponse);
        setDriverOrders(fallbackResponse.orders || []);
        setDriverEarnings(null);
        setError(''); // Clear error if fallback works
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        
        // Final fallback to mock data for development
        const pendingOrders = orders.filter(order => order.status === 'pending');
        const myActiveOrders = orders.filter(
          order => order.status === 'accepted' && order.driverId === driverId
        );
        const completedOrders = orders.filter(
          order => order.status === 'completed' && order.driverId === driverId
        );
        
        setDriverOrders([...pendingOrders, ...myActiveOrders, ...completedOrders]);
        setDriverEarnings(null); // Set to null for fallback
      }
    } finally {
      setLoading(false);
    }
  };

  // Update driver ID when user data changes
  useEffect(() => {
    const updateDriverId = async () => {
      // First try to get from user data
      if ((user as any)?.driver_id) {
        setDriverId((user as any).driver_id.toString());
        return;
      }
      
      // If no driver_id in user data, try profile API
      if (user?.role === 'driver') {
        try {
          const profileResponse = await authAPI.getProfile();
          if (profileResponse.user?.driver_id) {
            setDriverId(profileResponse.user.driver_id.toString());
            console.log('Driver ID updated from profile:', profileResponse.user.driver_id);
            return;
          }
        } catch (error) {
          console.error('Failed to get profile:', error);
        }
      }
      
      // Fallback to user ID or hardcoded
      setDriverId(user?.id?.toString() || '1');
    };
    
    updateDriverId();
  }, [user]);

  // Load data on component mount
  useEffect(() => {
    fetchDriverData();
  }, []);

  // Auto refresh online status and orders every 10 seconds (silent poll)
  useEffect(() => {
    const silentPoll = async () => {
      try {
        await fetchOnlineStatus();
        
        // Hanya ambil order terbaru jika driver berstatus Online
        if (isOnline) {
          const ordersResponse = await driverAPI.getDriverOrders();
          if (ordersResponse.orders) {
            setDriverOrders(ordersResponse.orders);
          }
        }
      } catch (error) {
        console.error('Silent poll failed:', error);
      }
    };

    const interval = setInterval(silentPoll, 10000); // Polling setiap 10 detik

    return () => clearInterval(interval);
  }, [isOnline]);

  // Filter orders by status
  const pendingOrders = driverOrders.filter(order => order.status === 'pending');
  const myActiveOrders = driverOrders.filter(order => order.status === 'accepted');
  const completedOrders = driverOrders.filter(order => order.status === 'completed');
  
  // Pagination for history
  const historyItemsPerPage = 5;
  const historyTotalPages = Math.ceil(completedOrders.length / historyItemsPerPage);
  const paginatedHistory = completedOrders.slice(
    (historyPage - 1) * historyItemsPerPage,
    historyPage * historyItemsPerPage
  );

  // Show notification when new orders arrive
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (pendingOrders.length > 0 && isOnline) {
      setShowNewOrderNotification(true);
      // Auto hide after 5 seconds
      timer = setTimeout(() => setShowNewOrderNotification(false), 5000);

        // Find orders that haven't been notified yet
        const newOrders = pendingOrders.filter(order => !notifiedOrderIds.current.has(order.id));
        
        if (newOrders.length > 0) {
          // Play sound for new order
          playNotificationSound();

          try {
            if ('Notification' in window && window.Notification && Notification.permission === 'granted') {
              // Send notification for the first new order
              const latestOrder = newOrders[0];
              const notification = new Notification('Pesanan Baru Masuk!', {
                body: `Titik Jemput: ${latestOrder.pickup_location || 'Belum ditentukan'}`,
                icon: '/favicon.ico', // You can replace this with your app's icon URL
                vibrate: [200, 100, 200]
              });

              // Open the window if the notification is clicked
              notification.onclick = () => {
                window.focus();
                notification.close();
              };
            }
          } catch (e) {
            console.warn('Browser does not fully support Notification API', e);
          }

          // Mark these orders as notified
          newOrders.forEach(order => notifiedOrderIds.current.add(order.id));
        }
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [pendingOrders.length, isOnline]);
  
  console.log('Filtered orders:', {
    total: driverOrders.length,
    pending: pendingOrders.length,
    active: myActiveOrders.length,
    completed: completedOrders.length
  });
  
  const totalEarnings = driverEarnings?.total_earnings || completedOrders.reduce(
    (sum, order) => sum + (order.price || order.distanceOption?.price || 0), 
    0
  );
  
  const handleAcceptOrder = async (orderId: string) => {
    try {
      setAcceptingOrderId(orderId);
      setError('');
      setSuccessMessage('');
      
      console.log('Accepting order:', orderId);
      await driverAPI.acceptOrder(orderId);
      
      // Show success message
      setSuccessMessage('Pesanan berhasil diterima!');
      
      // Refresh orders after accepting
      await fetchDriverData();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (error: any) {
      console.error('Failed to accept order:', error);
      
      // More specific error messages
      if (error.response?.status === 409) {
        setError('Pesanan sudah diterima driver lain.');
      } else if (error.response?.status === 404) {
        setError('Pesanan tidak ditemukan.');
      } else if (error.code === 'ERR_NETWORK') {
        setError('Tidak dapat terhubung ke server. Silakan coba lagi.');
      } else {
        setError(error.response?.data?.message || 'Gagal menerima pesanan. Silakan coba lagi.');
      }
    } finally {
      setAcceptingOrderId(null);
      setShowAcceptConfirmation(null);
    }
  };

  const handleAcceptConfirmation = (orderId: string) => {
    setShowAcceptConfirmation(orderId);
  };

  const handleCancelAccept = () => {
    setShowAcceptConfirmation(null);
  };
  
  const handleCompleteConfirmation = (orderId: string) => {
    setShowCompleteConfirmation(orderId);
  };

  const handleCancelComplete = () => {
    setShowCompleteConfirmation(null);
  };

  const handleCompleteOrder = async (orderId: string) => {
    try {
      setCompletingOrderId(orderId);
      await driverAPI.completeOrder(orderId);
      setSuccessMessage('Pesanan berhasil diselesaikan!');
      playSuccessSound(); // Mainkan suara "cring" saat sukses
      // Refresh orders and earnings after completing
      await fetchDriverData();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      console.error('Failed to complete order:', error);
      setError('Gagal menyelesaikan pesanan. Silakan coba lagi.');
    } finally {
      setCompletingOrderId(null);
      setShowCompleteConfirmation(null);
    }
  };
  
  const handleCancelOrder = (orderId: string) => {
    cancelOrder(orderId);
  };
  
  const toggleOnlineStatus = async () => {
    try {
      setUpdatingOnlineStatus(true);
      const newStatus = !isOnline;
      const response = await driverAPI.setOnlineStatus(newStatus);
      setIsOnline(newStatus);
      setSuccessMessage(`Status berhasil diubah menjadi ${newStatus ? 'Online' : 'Offline'}`);
      
      // Request notification permission if going online (user gesture)
      if (newStatus === true) {
        try {
          if ('Notification' in window && window.Notification && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            Notification.requestPermission().catch(e => console.warn('Notification permission error', e));
          }
        } catch (e) {
          console.warn('Could not request notification permission', e);
        }
      }
      
      // Auto clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error: any) {
      console.error('Failed to update online status:', error);
      setError('Gagal mengubah status online. Silakan coba lagi.');
    } finally {
      setUpdatingOnlineStatus(false);
    }
  };
  
  // Show loading state
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

  return (
    <div className="p-6">
      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md flex items-center">
          <AlertCircle size={20} className="mr-2" />
          <span>{error}</span>
          <button 
            onClick={() => setError('')}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-md flex items-center">
          <CheckCircle size={20} className="mr-2" />
          <span>{successMessage}</span>
          <button 
            onClick={() => setSuccessMessage('')}
            className="ml-auto text-green-500 hover:text-green-700"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* New Order Notification */}
      {showNewOrderNotification && (
        <div className="mb-6 p-4 bg-blue-50 text-blue-700 rounded-md flex items-center shadow-sm border border-blue-200">
          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
          <span className="font-medium">Ada {pendingOrders.length} pesanan baru tersedia!</span>
          <button 
            onClick={() => setShowNewOrderNotification(false)}
            className="ml-auto text-blue-500 hover:text-blue-700"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-bold mb-2 sm:mb-0">Dashboard Pengayuh</h1>
        <div className="flex items-center space-x-3">
          <div className="flex items-center">
            <span className="mr-2 text-sm font-medium text-gray-700">Status:</span>
            <div
              className="px-4 py-2 rounded-md text-sm font-medium flex items-center bg-green-800 text-white cursor-default"
              title="Status Anda selalu Online"
            >
              <div className="w-2 h-2 rounded-full mr-2 bg-green-300"></div>
              Online
            </div>
          </div>
          <button
            onClick={fetchDriverData}
            disabled={loading}
            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 text-sm font-medium flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                Loading...
              </>
            ) : (
              <>
                <div className="w-4 h-4 mr-1">🔄</div>
                Refresh
              </>
            )}
          </button>
        </div>
      </div>


      
      {!isOnline && (
        <div className="mb-6 p-4 bg-yellow-50 text-yellow-700 rounded-md flex items-center">
          <AlertCircle size={20} className="mr-2" />
          <span>Anda sedang offline. Aktifkan status online untuk menerima pesanan.</span>
        </div>
      )}
      
      {isOnline && (
        <>
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Pesanan Tersedia</h2>
              <div className="flex items-center space-x-2">
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                  <span>{pendingOrders.length} pesanan menunggu</span>
                </div>
              </div>
            </div>
            {pendingOrders.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {pendingOrders.map(order => (
                  <div key={order.id} className="bg-white p-5 rounded-lg shadow-md border-l-4 border-yellow-500">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">Order #{order.order_number}</h3>
                        <p className="text-gray-500 text-sm">{new Date(order.created_at).toLocaleString('id-ID')}</p>
                      </div>
                      <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded">Menunggu</span>
                    </div>
                    <div className="mb-4 space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-gray-600 font-medium">Pelanggan</p>
                          <p className="text-gray-800">{order.customer_name || 'Pelanggan'}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 font-medium">Telepon</p>
                          <p className="text-gray-800">{order.customer_phone || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex items-center mb-1">
                          <MapPin size={14} className="text-gray-500 mr-1" />
                          <span className="text-gray-600 font-medium text-sm">Titik Jemput</span>
                        </div>
                        <p className="text-gray-800 text-sm ml-5">{order.pickup_location || 'Belum ditentukan'}</p>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex items-center mb-1">
                          <MapPin size={14} className="text-gray-500 mr-1" />
                          <span className="text-gray-600 font-medium text-sm">Tujuan</span>
                        </div>
                        <p className="text-gray-800 text-sm ml-5">{order.drop_location || 'Belum ditentukan'}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                        <div>
                          <p className="text-gray-600 font-medium text-sm">Jarak</p>
                          <p className="text-gray-800 font-semibold">{order.distance || 0} km</p>
                        </div>
                        <div>
                          <p className="text-gray-600 font-medium text-sm">Biaya</p>
                          <p className="text-green-600 font-bold">Rp {(order.price || 0).toLocaleString('id-ID')}</p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAcceptConfirmation(order.id)}
                      disabled={acceptingOrderId === order.id}
                      className="w-full bg-green-800 hover:bg-green-600 disabled:bg-green-400 text-white font-medium py-2 px-4 rounded-md flex items-center justify-center"
                    >
                      {acceptingOrderId === order.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Menerima...
                        </>
                      ) : (
                        'Terima Pesanan'
                      )}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <Clock size={48} className="mx-auto text-gray-400 mb-3" />
                <p className="text-gray-500 font-medium mb-2">Belum ada pesanan baru saat ini.</p>
                <div className="text-xs text-gray-400 space-y-1">
                  <p>• Pastikan status Anda Online</p>
                  <p>• Pesanan akan muncul secara otomatis</p>
                  <p>• Refresh halaman untuk update terbaru</p>
                </div>
              </div>
            )}
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Pesanan Aktif</h2>
            {myActiveOrders.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {myActiveOrders.map(order => (
                  <div key={order.id} className="bg-white p-5 rounded-lg shadow-md border-l-4 border-blue-500">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">Order #{order.order_number}</h3>
                        <p className="text-gray-500 text-sm">{new Date(order.created_at).toLocaleString('id-ID')}</p>
                      </div>
                      <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">Aktif</span>
                    </div>
                    <div className="mb-4">
                      <p className="text-gray-700"><span className="font-medium">Pelanggan:</span> {order.customer_name || 'Pelanggan'}</p>
                      <p className="text-gray-700"><span className="font-medium">Telepon:</span> {order.customer_phone || 'N/A'}</p>
                      <p className="text-gray-700"><span className="font-medium">Titik Jemput:</span> {order.pickup_location || 'Belum ditentukan'}</p>
                      <p className="text-gray-700"><span className="font-medium">Tujuan:</span> {order.drop_location || 'Belum ditentukan'}</p>
                      <p className="text-gray-700"><span className="font-medium">Jarak:</span> {order.distance || 0} km</p>
                      <p className="text-gray-700"><span className="font-medium">Biaya:</span> Rp {(order.price || 0).toLocaleString('id-ID')}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleCompleteConfirmation(order.id)}
                        disabled={completingOrderId === order.id}
                        className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 font-medium py-2 px-4 rounded-md flex items-center justify-center"
                      >
                        {completingOrderId === order.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-700 mr-2"></div>
                            Selesai...
                          </>
                        ) : (
                          <>
                            <CheckCircle size={16} className="mr-1" />
                            Selesai
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 font-medium py-2 px-4 rounded-md flex items-center justify-center"
                      >
                        <X size={16} className="mr-1" />
                        Batalkan
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <Clock size={48} className="mx-auto text-gray-400 mb-3" />
                <p className="text-gray-500">Anda belum memiliki pesanan aktif.</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <Calendar className="w-8 h-8 text-blue-500 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold">Perjalanan Hari Ini</h3>
                  <p className="text-3xl font-bold text-blue-600">{driverEarnings?.today_trips || 0}</p>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                Total: {driverEarnings?.completed_orders || 0} perjalanan
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <DollarSign className="w-8 h-8 text-green-800 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold">Pendapatan Hari Ini</h3>
                  <p className="text-3xl font-bold text-green-600">
                    {formatCurrency(driverEarnings?.today_earnings || 0)}
                  </p>
                </div>
              </div>
              <div className="mt-2">
                <div className="text-sm text-gray-500 mb-2">
                  Total: {formatCurrency(driverEarnings?.total_earnings || 0)}
                </div>
                <Link 
                  to="/driver/finance"
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Lihat detail keuangan →
                </Link>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Riwayat Perjalanan</h2>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dibuat
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order Number
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Jarak
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pendapatan
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedHistory.map((order) => (
                      <tr key={order.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.completed_at).toLocaleString('id-ID')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {order.order_number || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.customer_name || order.customer?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.distance || 0} km
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          Rp {(order.price || 0).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={4} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Total Pendapatan
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                        {formatCurrency(totalEarnings)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              {completedOrders.length > 0 && historyTotalPages > 1 && (
                <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6 flex items-center justify-between">
                  <div className="flex-1 flex justify-between items-center">
                    <button
                      onClick={() => setHistoryPage(prev => Math.max(prev - 1, 1))}
                      disabled={historyPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Sebelumnya
                    </button>
                    <span className="text-sm text-gray-700">
                      Halaman <span className="font-medium">{historyPage}</span> dari <span className="font-medium">{historyTotalPages}</span>
                    </span>
                    <button
                      onClick={() => setHistoryPage(prev => Math.min(prev + 1, historyTotalPages))}
                      disabled={historyPage === historyTotalPages}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Selanjutnya
                    </button>
                  </div>
                </div>
              )}
              {completedOrders.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Belum ada perjalanan yang diselesaikan
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Accept Order Confirmation Modal */}
      {showAcceptConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm mx-4 shadow-xl">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <AlertCircle size={32} className="text-blue-600" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-center text-gray-900 mb-2">Terima Pesanan</h3>
            <p className="text-center text-gray-600 mb-6">
              Anda yakin ingin menerima pesanan ini?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleCancelAccept}
                disabled={acceptingOrderId === showAcceptConfirmation}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={() => handleAcceptOrder(showAcceptConfirmation)}
                disabled={acceptingOrderId === showAcceptConfirmation}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-2.5 px-4 rounded-lg flex items-center justify-center transition-colors shadow-sm"
              >
                {acceptingOrderId === showAcceptConfirmation ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Menerima...
                  </>
                ) : (
                  'Ya, Terima'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Order Confirmation Modal */}
      {showCompleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm mx-4 shadow-xl">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle size={32} className="text-green-600" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-center text-gray-900 mb-2">Selesaikan Pesanan</h3>
            <p className="text-center text-gray-600 mb-6">
              Anda yakin telah menyelesaikan pesanan ini dan penumpang sudah sampai di tujuan?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleCancelComplete}
                disabled={completingOrderId === showCompleteConfirmation}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={() => handleCompleteOrder(showCompleteConfirmation)}
                disabled={completingOrderId === showCompleteConfirmation}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-2.5 px-4 rounded-lg flex items-center justify-center transition-colors shadow-sm"
              >
                {completingOrderId === showCompleteConfirmation ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Loading...
                  </>
                ) : (
                  'Ya, Selesai'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

const Profile: React.FC = () => {
  const [driverProfile, setDriverProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch driver profile from API
  const fetchDriverProfile = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching driver profile...');
      const profileResponse = await authAPI.getProfile();
      console.log('Profile response:', profileResponse);
      
      // Extract user data from response
      const userData = profileResponse.user;
      console.log('User data:', userData);
      
      if (userData) {
        // Fetch additional driver data (earnings, trips, etc.)
        let totalTrips = 0;
        let rating = 'N/A';
        
        try {
          const earningsResponse = await driverAPI.getDriverEarnings();
          console.log('Earnings response for profile:', earningsResponse);
          
          if (earningsResponse.earnings) {
            totalTrips = earningsResponse.earnings.total_trips || 0;
            // Calculate rating based on completed orders (mock calculation)
            const completedOrders = earningsResponse.earnings.completed_orders || 0;
            if (completedOrders > 0) {
              rating = '4.8'; // Mock rating, in real app would be calculated from reviews
            }
          }
        } catch (earningsError) {
          console.log('Could not fetch earnings data:', earningsError);
        }
        
        setDriverProfile({
          name: userData.name || 'Driver',
          email: userData.email || 'N/A',
          phone: userData.phone || 'N/A',
          driver_code: userData.driver_code || 'N/A',
          status: userData.status || 'inactive',
          join_date: userData.created_at || null,
          vehicle_type: userData.vehicle_type || 'delman',
          total_trips: userData.total_trips || totalTrips,
          rating: userData.rating ? userData.rating.toString() : rating
        });
      } else {
        throw new Error('No user data received');
      }
      
    } catch (error: any) {
      console.error('Failed to fetch driver profile:', error);
      console.error('Profile error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      setError(`Gagal memuat profil driver: ${error.message || 'Silakan coba lagi.'}`);
      
      // Fallback to mock data for development
      setDriverProfile({
        name: 'Budi Santoso',
        email: 'budi.santoso@example.com',
        phone: '+62 812-3456-7890',
        driver_code: 'BEC001',
        status: 'active',
        join_date: '2024-01-15',
        vehicle_type: 'becak_listrik',
        total_trips: 127,
        rating: 4.8
      });
    } finally {
      setLoading(false);
    }
  };

  // Load profile on component mount
  useEffect(() => {
    fetchDriverProfile();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat profil...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Profil Saya</h1>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md flex items-center">
          <AlertCircle size={20} className="mr-2" />
          <span>{error}</span>
        </div>
      )}
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6 flex items-center border-b border-gray-200">
          <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center">
            <User size={32} className="text-gray-600" />
          </div>
          <div className="ml-6">
            <h2 className="text-xl font-semibold">{driverProfile?.name || 'Driver'}</h2>
            <p className="text-gray-500">ID: {driverProfile?.driver_code || 'N/A'}</p>
          </div>
        </div>
        
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium mb-4">Informasi Pribadi</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{driverProfile?.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Nomor Telepon</p>
              <p className="font-medium">{driverProfile?.phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Tanggal Bergabung</p>
              <p className="font-medium">{driverProfile?.join_date ? new Date(driverProfile.join_date).toLocaleDateString('id-ID') : 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="inline-flex items-center">
                <span className={`w-2 h-2 rounded-full mr-2 ${driverProfile?.status === 'active' ? 'bg-green-800' : 'bg-gray-400'}`}></span>
                <span className="font-medium">{driverProfile?.status === 'active' ? 'Aktif' : 'Tidak Aktif'}</span>
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <h3 className="text-lg font-medium mb-4">GreenBecak</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Kode Becak</p>
              <p className="font-medium">{driverProfile?.driver_code || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Jenis Kendaraan</p>
              <p className="font-medium">
                {driverProfile?.vehicle_type === 'becak_listrik' ? 'Becak Listrik' :
                 driverProfile?.vehicle_type === 'becak_motor' ? 'Becak Motor' :
                 driverProfile?.vehicle_type === 'becak_manual' ? 'Becak Manual' :
                 driverProfile?.vehicle_type === 'andong' ? 'Andong' : 'Delman'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Perjalanan</p>
              <p className="font-medium">{driverProfile?.total_trips || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Rating</p>
              <p className="font-medium">{driverProfile?.rating ? `${driverProfile.rating}/5.0` : 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DriverFinance: React.FC = () => {
  const { orders } = useOrder();
  const { user } = useAuth();
  // Get driver ID from user data (driver_id) or fallback to hardcoded for testing
  const driverId = (user as any)?.driver_id?.toString() || user?.id?.toString() || '1';
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  
  // Real API data state
  const [driverEarnings, setDriverEarnings] = useState<any>(null);
  const [driverWithdrawals, setDriverWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submittingWithdrawal, setSubmittingWithdrawal] = useState(false);
  
  // Fetch driver financial data from API
  const fetchDriverFinancialData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch earnings
      const earningsResponse = await driverAPI.getDriverEarnings();
      console.log('DriverFinance - Earnings response:', earningsResponse);
      console.log('DriverFinance - Earnings response.earnings:', earningsResponse.earnings);
      console.log('DriverFinance - Earnings response.earnings?.total_earnings:', earningsResponse.earnings?.total_earnings);
      console.log('DriverFinance - Setting driverEarnings to:', earningsResponse.earnings || null);
      setDriverEarnings(earningsResponse.earnings || null);
      
      // Fetch withdrawals
      const withdrawalsResponse = await driverAPI.getDriverWithdrawals();
      setDriverWithdrawals(withdrawalsResponse.withdrawals || []);
      
    } catch (error: any) {
      console.error('Failed to fetch driver financial data:', error);
      setError('Gagal memuat data keuangan. Silakan coba lagi.');
      
      // Set empty data if API fails
      setDriverEarnings(null);
      setDriverWithdrawals([]);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchDriverFinancialData();
  }, []);

  // Debug: Log driverEarnings whenever it changes
  useEffect(() => {
    console.log('DriverFinance - driverEarnings updated:', driverEarnings);
    console.log('DriverFinance - driverEarnings.total_earnings:', driverEarnings?.total_earnings);
    console.log('DriverFinance - driverEarnings.today_earnings:', driverEarnings?.today_earnings);
    console.log('DriverFinance - driverEarnings.completed_orders:', driverEarnings?.completed_orders);
    console.log('DriverFinance - driverEarnings.today_trips:', driverEarnings?.today_trips);
    console.log('DriverFinance - driverEarnings.monthly_earnings:', driverEarnings?.monthly_earnings);
    console.log('DriverFinance - driverEarnings.monthly_trips:', driverEarnings?.monthly_trips);
  }, [driverEarnings]);

  const completedOrders = orders.filter(
    order => order.status === 'completed' && order.driverId === driverId
  );

  const totalEarnings = driverEarnings?.total_earnings || completedOrders.reduce(
    (sum, order) => sum + (order.distanceOption?.price || 0), 
    0
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };



  const handleWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!withdrawalAmount || !selectedBank || !accountNumber || !accountName) {
      setError('Semua field harus diisi!');
      return;
    }
    
    const amount = parseFloat(withdrawalAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Jumlah penarikan harus valid!');
      return;
    }
    
    try {
      setSubmittingWithdrawal(true);
      setError('');
      
      const withdrawalData = {
        amount: amount,
        bank_name: selectedBank,
        account_number: accountNumber,
        account_name: accountName,
        notes: `Penarikan ke ${selectedBank}`
      };
      
      await driverAPI.createWithdrawal(withdrawalData);
      
      // Refresh data after successful withdrawal
      await fetchDriverFinancialData();
      
      setShowWithdrawalModal(false);
      // Reset form
      setWithdrawalAmount('');
      setSelectedBank('');
      setAccountNumber('');
      setAccountName('');
      
    } catch (error: any) {
      console.error('Failed to create withdrawal:', error);
      setError('Gagal mengajukan penarikan. Silakan coba lagi.');
    } finally {
      setSubmittingWithdrawal(false);
    }
  };

  const handleTransactionClick = (transaction: any) => {
    setSelectedTransaction(transaction);
    setShowTransactionModal(true);
  };

  const banks = [
    { code: 'BCA', name: 'Bank Central Asia (BCA)' },
    { code: 'BNI', name: 'Bank Negara Indonesia (BNI)' },
    { code: 'BRI', name: 'Bank Rakyat Indonesia (BRI)' },
    { code: 'MDR', name: 'Bank Mandiri' },
    { code: 'CIMB', name: 'CIMB Niaga' },
    { code: 'DBS', name: 'DBS Indonesia' }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Keuangan Saya</h1>
        <p className="text-gray-600">Kelola pendapatan dan penarikan saldo Anda</p>
        {/* Debug info */}
        <div className="text-xs text-gray-500 mt-2">
          Loading: {loading.toString()} | Error: {error} | DriverEarnings: {driverEarnings ? 'Loaded' : 'Not loaded'}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data keuangan...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Key Metrics */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center mb-4">
            <Wallet className="w-8 h-8 text-blue-500 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-gray-500">Total Pendapatan</h3>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(driverEarnings?.total_earnings || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center mb-4">
            <TrendingUp className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-gray-500">Pendapatan Hari Ini</h3>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(driverEarnings?.today_earnings || 0)}
              </p>
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            Bulan ini: {formatCurrency(driverEarnings?.monthly_earnings || 0)}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center mb-4">
            <Target className="w-8 h-8 text-orange-500 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-gray-500">Perjalanan Hari Ini</h3>
              <p className="text-2xl font-bold text-orange-600">
                {driverEarnings?.today_trips || 0}
              </p>
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            Bulan ini: {driverEarnings?.monthly_trips || 0} • Total: {driverEarnings?.completed_orders || 0}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center mb-4">
            <Award className="w-8 h-8 text-purple-500 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-gray-500">Rata-rata per Trip</h3>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(driverEarnings?.total_earnings && driverEarnings?.completed_orders && driverEarnings.completed_orders > 0 ? 
                  driverEarnings.total_earnings / driverEarnings.completed_orders : 0)}
              </p>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Status Penarikan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            Status Penarikan
          </h3>
          <div className="space-y-4">
            {driverWithdrawals.length > 0 ? (
              <>
                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                  <div>
                    <p className="font-medium text-yellow-800">Penarikan Pending</p>
                    <p className="text-sm text-yellow-600">Menunggu approval admin</p>
                  </div>
                  <span className="text-lg font-bold text-yellow-800">
                    {formatCurrency(driverWithdrawals.filter(w => w.status === 'pending').reduce((sum, w) => sum + w.amount, 0))}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium text-green-800">Penarikan Selesai</p>
                    <p className="text-sm text-green-600">Total yang sudah ditarik</p>
                  </div>
                  <span className="text-lg font-bold text-green-800">
                    {formatCurrency(driverWithdrawals.filter(w => w.status === 'completed').reduce((sum, w) => sum + w.amount, 0))}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Belum ada data penarikan</p>
              </div>
            )}
            <div className="text-center pt-2">
              <button 
                onClick={() => setShowWithdrawalModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Ajukan Penarikan
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Ringkasan Performa</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Hari Ini</span>
              <span className="font-medium">{formatCurrency(driverEarnings?.today_earnings || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Bulan Ini</span>
              <span className="font-medium">{formatCurrency(driverEarnings?.monthly_earnings || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Semua Waktu</span>
              <span className="font-medium">{formatCurrency(driverEarnings?.total_earnings || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Transaksi Terbaru</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {driverWithdrawals.length > 0 ? (
            driverWithdrawals.map((withdrawal: any) => (
              <div 
                key={withdrawal.id} 
                className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
                onClick={() => handleTransactionClick(withdrawal)}
              >
                <div className="flex items-center">
                  <div className="mr-3">
                    <ArrowDownLeft size={16} className="text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Penarikan #{withdrawal.id}</p>
                    <p className="text-sm text-gray-500">{formatDate(new Date(withdrawal.created_at))}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-red-600">
                    -{formatCurrency(withdrawal.amount)}
                  </p>
                  <span className={`text-xs capitalize ${
                    withdrawal.status === 'pending' ? 'text-yellow-600' : 
                    withdrawal.status === 'completed' ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {withdrawal.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center text-gray-500">
              <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Belum ada transaksi penarikan</p>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Detail Modal */}
      {showTransactionModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Detail Transaksi</h3>
              <button
                onClick={() => setShowTransactionModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Jenis Transaksi</span>
                <span className="font-medium capitalize">Penarikan</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Jumlah</span>
                <span className="font-bold text-red-600">
                  -{formatCurrency(selectedTransaction.amount)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Tanggal</span>
                <span className="font-medium">{formatDate(new Date(selectedTransaction.created_at))}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status</span>
                <span className={`font-medium capitalize ${
                  selectedTransaction.status === 'pending' ? 'text-yellow-600' : 
                  selectedTransaction.status === 'completed' ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {selectedTransaction.status}
                </span>
              </div>

              {/* Detail Penarikan */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Detail Penarikan</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">ID Penarikan</span>
                    <span className="font-medium">#{selectedTransaction.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Jumlah</span>
                    <span className="font-medium">{formatCurrency(selectedTransaction.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status</span>
                    <span className={`font-medium capitalize ${
                      selectedTransaction.status === 'pending' ? 'text-yellow-600' : 
                      selectedTransaction.status === 'completed' ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {selectedTransaction.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tanggal Dibuat</span>
                    <span className="font-medium">{formatDate(new Date(selectedTransaction.created_at))}</span>
                  </div>
                  {selectedTransaction.updated_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tanggal Update</span>
                      <span className="font-medium">{formatDate(new Date(selectedTransaction.updated_at))}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <button
                onClick={() => setShowTransactionModal(false)}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Withdrawal Modal */}
      {showWithdrawalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Ajukan Penarikan Saldo</h3>
              <button
                onClick={() => setShowWithdrawalModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleWithdrawalSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jumlah Penarikan
                </label>
                <input
                  type="number"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Masukkan jumlah"
                  min="10000"
                  max={driverEarnings?.total_earnings || 0}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Saldo tersedia: {formatCurrency(driverEarnings?.total_earnings || 0)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bank
                </label>
                <select
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Pilih Bank</option>
                  {banks.map((bank) => (
                    <option key={bank.code} value={bank.code}>
                      {bank.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nomor Rekening
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Masukkan nomor rekening"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Pemilik Rekening
                </label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Masukkan nama pemilik rekening"
                  required
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowWithdrawalModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingWithdrawal}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                >
                  {submittingWithdrawal ? 'Mengajukan...' : 'Ajukan Penarikan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const DriverDashboard: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar for larger screens */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64 bg-blue-800">
          <div className="flex items-center h-16 px-4 bg-blue-900">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">GT</span>
              </div>
              <span className="ml-2 text-white text-lg font-semibold">Pengayuh Panel</span>
            </div>
          </div>
          <div className="flex flex-col flex-grow pt-5 overflow-y-auto">
            <nav className="flex-1 px-2 space-y-1">
              <Link to="/driver" className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-white bg-blue-900">
                <List className="mr-3 h-6 w-6 text-blue-300" />
                Dashboard
              </Link>
              <Link to="/driver/profile" className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-blue-100 hover:bg-blue-700 hover:text-white">
                <User className="mr-3 h-6 w-6 text-blue-300" />
                Profil
              </Link>
              <Link to="/driver/finance" className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-blue-100 hover:bg-blue-700 hover:text-white">
                <DollarSign className="mr-3 h-6 w-6 text-blue-300" />
                Keuangan
              </Link>
              <button
                onClick={handleLogout}
                className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-blue-100 hover:bg-blue-700 hover:text-white w-full text-left"
              >
                <LogOut className="mr-3 h-6 w-6 text-blue-300" />
                Keluar
              </button>
            </nav>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top navigation for mobile */}
        <div className="md:hidden">
          <div className="flex items-center justify-between bg-blue-800 border-b border-blue-700 px-4 py-2">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">GT</span>
              </div>
              <span className="ml-2 text-white text-lg font-semibold">Driver</span>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-blue-200 hover:text-white focus:outline-none"
            >
              {isMobileMenuOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </button>
          </div>
          
          {/* Mobile menu */}
          {isMobileMenuOpen && (
            <div className="bg-blue-800 pt-2 pb-3 space-y-1 sm:px-3">
              <Link 
                to="/driver" 
                className="block px-3 py-2 rounded-md text-base font-medium text-white bg-blue-900"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link 
                to="/driver/profile" 
                className="block px-3 py-2 rounded-md text-base font-medium text-blue-100 hover:bg-blue-700 hover:text-white"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Profil
              </Link>
              <Link 
                to="/driver/finance" 
                className="block px-3 py-2 rounded-md text-base font-medium text-blue-100 hover:bg-blue-700 hover:text-white"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Keuangan
              </Link>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-blue-100 hover:bg-blue-700 hover:text-white"
              >
                Keluar
              </button>
            </div>
          )}
        </div>
        
        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-gray-100">
          <Routes>
            <Route path="/" element={<DriverHome />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/finance" element={<DriverFinance />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default DriverDashboard;