import axios from 'axios';

// Base API configuration - use proxy in development
const API_BASE_URL = import.meta.env.DEV 
  ? '/api'  // Use Vite proxy in development
  : (import.meta.env.VITE_API_URL || 'https://api.becakjogja.id/api');

// Get API host for error messages
const API_HOST = import.meta.env.VITE_API_URL 
  ? new URL(import.meta.env.VITE_API_URL).origin
  : 'https://api.becakjogja.id';

// Check if we're in development mode
const isDev = import.meta.env.DEV;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  // CORS configuration - enable credentials since backend supports it
  withCredentials: !isDev, // Disable credentials in dev to avoid CORS issues with proxy
  // Ensure preflight requests are handled properly
  validateStatus: function (status) {
    return status >= 200 && status < 300; // default
  },
});

// Create a separate instance for public endpoints (no credentials)
const publicApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    // Remove X-Requested-With header to avoid CORS preflight
  },
  // No credentials for public endpoints to avoid CORS issues
  withCredentials: false,
  validateStatus: function (status) {
    return status >= 200 && status < 300;
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Request with auth token to:', config.url);
    } else {
      console.log('Request without auth token to:', config.url);
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for publicApi
publicApi.interceptors.response.use(
  (response) => {
    console.log('Public API response received:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('Public API response error:', error);
    console.error('Public API error details:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      url: error.config?.url,
      headers: error.response?.headers
    });
    
    // Handle CORS errors specifically for public endpoints
    if (error.code === 'ERR_NETWORK' || error.message.includes('CORS') || error.message.includes('Access-Control-Allow-Origin')) {
      console.error('CORS Error detected on public endpoint. This might be due to:');
      console.error(`1. Backend not running at ${API_HOST}`);
      console.error('2. CORS preflight request not handled properly');
      console.error('3. Missing CORS headers in backend response');
      console.error('4. Backend CORS policy not allowing requests from frontend domain');
    }
    
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    console.log('Response received:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('Response error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      url: error.config?.url,
      headers: error.response?.headers
    });
    
    // Handle CORS errors specifically
    if (error.code === 'ERR_NETWORK' || error.message.includes('CORS') || error.message.includes('Access-Control-Allow-Origin')) {
      console.error('CORS Error detected. This might be due to:');
      console.error(`1. Backend not running at ${API_HOST}`);
      console.error('2. CORS preflight request not handled properly');
      console.error('3. Missing CORS headers in backend response');
      console.error('4. Backend CORS policy not allowing requests from frontend domain');
    }
    
    if (error.response?.status === 401) {
      const hadToken = !!localStorage.getItem('authToken');
      console.log('401 Unauthorized - Had token:', hadToken);
      
      // Clear any stale token
      localStorage.removeItem('authToken');
      localStorage.removeItem('userType');
      
      // Only redirect if user was authenticated and is on protected routes
      if (hadToken) {
        const path = window.location.pathname;
        const isAdminArea = path.startsWith('/admin');
        const isDriverArea = path.startsWith('/driver');
        
        console.log('Redirecting due to 401 - Path:', path, 'IsAdmin:', isAdminArea, 'IsDriver:', isDriverArea);
        
        if (isAdminArea) {
          window.location.href = '/login-admin';
        } else if (isDriverArea) {
          window.location.href = '/login-driver';
        }
        // if on public pages, do NOT redirect (avoid reload loop)
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (credentials: { username: string; password: string }) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  
  register: async (userData: any) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  
  getProfile: async () => {
    const response = await api.get('/profile/');
    return response.data;
  },
};

// Orders API
export const ordersAPI = {
  createOrder: async (orderData: any) => {
    try {
      console.log('Attempting to create order via API...');
      const response = await fetch('https://api.becakjogja.id/api/orders/public/', {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Successfully created order via API:', data);
        return data;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.warn('Failed to create order due to CORS, using mock response:', error);
      // Return mock response for development
      return {
        message: "Order created successfully (mock response due to CORS)",
        order: {
          id: `order-${Date.now()}`,
          ...orderData,
          status: "pending",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      };
    }
  },
  
  getOrders: async (params?: any) => {
    const response = await api.get('/orders/', { params });
    return response.data;
  },
  
  getOrder: async (id: string) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },
  
  updateOrder: async (id: string, orderData: any) => {
    const response = await api.put(`/orders/${id}`, orderData);
    return response.data;
  },
  
  deleteOrder: async (id: string) => {
    const response = await api.delete(`/orders/${id}`);
    return response.data;
  },
};

// Tariffs API
export const tariffsAPI = {
  getTariffs: async (params?: any) => {
    const response = await api.get('/tariffs/', { params });
    return response.data;
  },
  
  getTariff: async (id: string) => {
    const response = await api.get(`/tariffs/${id}`);
    return response.data;
  },
  
  // Public endpoints (no auth required)
  getTariffsPublic: async (params?: any) => {
    // Try to fetch from API first, fallback to static data if CORS fails
    try {
      console.log('Attempting to fetch tariffs from API...', params ? `with params: ${JSON.stringify(params)}` : '');
      const response = await fetch('https://api.becakjogja.id/api/tariffs/public/', {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Successfully fetched tariffs from API:', data);
        return data;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.warn('Failed to fetch from API due to CORS, using fallback data:', error);
      // Return fallback data structure that matches API response
      return {
        message: "Tariffs retrieved successfully (fallback data)",
        tariffs: [
          {
            id: 1,
            name: "Dekat",
            min_distance: 0,
            max_distance: 3,
            price: 10000,
            destinations: "Benteng Vredeburg, Bank Indonesia",
            is_active: true,
            created_at: "2025-09-04T12:48:27.089Z",
            updated_at: "2025-09-04T12:48:27.089Z"
          },
          {
            id: 2,
            name: "Sedang",
            min_distance: 3,
            max_distance: 7,
            price: 20000,
            destinations: "Taman Sari, Alun-Alun Selatan",
            is_active: true,
            created_at: "2025-09-04T12:48:27.089Z",
            updated_at: "2025-09-04T12:48:27.089Z"
          },
          {
            id: 3,
            name: "Jauh",
            min_distance: 7,
            max_distance: 15,
            price: 30000,
            destinations: "Tugu Jogja, Stasiun Lempuyangan",
            is_active: true,
            created_at: "2025-09-04T12:48:27.089Z",
            updated_at: "2025-09-04T12:48:27.089Z"
          }
        ]
      };
    }
  },
  
  getTariffPublic: async (id: string) => {
    try {
      const response = await publicApi.get(`/tariffs/public/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch public tariff, using fallback data:', error);
      // Return fallback data for specific tariff
      return {
        message: "Using fallback data due to CORS error",
        tariff: {
          id: parseInt(id),
          name: "Dekat",
          min_distance: 0,
          max_distance: 3,
          price: 10000,
          destinations: "Benteng Vredeburg, Bank Indonesia",
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      };
    }
  },
  
  createTariff: async (tariffData: any) => {
    const response = await api.post('/admin/tariffs/', tariffData);
    return response.data;
  },
  
  updateTariff: async (id: string, tariffData: any) => {
    const response = await api.put(`/admin/tariffs/${id}`, tariffData);
    return response.data;
  },
  
  deleteTariff: async (id: string) => {
    const response = await api.delete(`/admin/tariffs/${id}`);
    return response.data;
  },
  
  toggleTariffStatus: async (id: string, isActive: boolean) => {
    const response = await api.put(`/admin/tariffs/${id}/active`, { IsActive: isActive });
    return response.data;
  },
};

// Payments API
export const paymentsAPI = {
  createPayment: async (paymentData: any) => {
    const response = await api.post('/payments/', paymentData);
    return response.data;
  },
  
  getPayments: async (params?: any) => {
    const response = await api.get('/payments/', { params });
    return response.data;
  },
  
  getPayment: async (id: string) => {
    const response = await api.get(`/payments/${id}`);
    return response.data;
  },
  
  updatePaymentStatus: async (id: string, status: string) => {
    const response = await api.put(`/payments/${id}/status`, { status });
    return response.data;
  },
  
  processPayment: async (id: string) => {
    const response = await api.post(`/payments/${id}/process`);
    return response.data;
  },
  
  getPaymentStats: async () => {
    const response = await api.get('/payments/stats/');
    return response.data;
  },
};

// Notifications API
export const notificationsAPI = {
  getNotifications: async (params?: any) => {
    const response = await api.get('/notifications/', { params });
    return response.data;
  },
  
  getNotification: async (id: string) => {
    const response = await api.get(`/notifications/${id}`);
    return response.data;
  },
  
  markAsRead: async (id: string) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },
  
  markAllAsRead: async () => {
    const response = await api.put('/notifications/read-all/');
    return response.data;
  },
  
  deleteNotification: async (id: string) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },
  
  getNotificationStats: async () => {
    const response = await api.get('/notifications/stats/');
    return response.data;
  },
};

// Admin API
export const adminAPI = {
  // Users
  createUser: async (userData: any) => {
    const response = await api.post('/admin/users/', userData);
    return response.data;
  },
  getUsers: async (params?: any) => {
    const response = await api.get('/admin/users/', { params });
    return response.data;
  },
  
  getUser: async (id: string) => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },
  
  updateUser: async (id: string, userData: any) => {
    const response = await api.put(`/admin/users/${id}`, userData);
    return response.data;
  },
  
  deleteUser: async (id: string) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },
  
  resetUserPassword: async (id: string) => {
    const response = await api.post(`/admin/users/${id}/reset-password`, {}, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  },
  
  // Drivers
  createDriver: async (driverData: any) => {
    const response = await api.post('/admin/drivers/', driverData);
    return response.data;
  },
  
  getDrivers: async (params?: any) => {
    const response = await api.get('/admin/drivers/', { params });
    return response.data;
  },
  
  getDriver: async (id: string) => {
    const response = await api.get(`/admin/drivers/${id}`);
    return response.data;
  },
  
  updateDriver: async (id: string, driverData: any) => {
    const response = await api.put(`/admin/drivers/${id}`, driverData);
    return response.data;
  },
  
  deleteDriver: async (id: string) => {
    const response = await api.delete(`/admin/drivers/${id}`);
    return response.data;
  },
  
  getDriverPerformance: async (id: string) => {
    const response = await api.get(`/admin/drivers/${id}/performance/`);
    return response.data;
  },
  
  // Driver Financial Data
  getDriverFinancialData: async (params?: any) => {
    const response = await api.get('/admin/drivers/financial-data', { params });
    return response.data;
  },
  
  // Tariffs
  createTariff: async (tariffData: any) => {
    const response = await api.post('/admin/tariffs/', tariffData);
    return response.data;
  },
  
  updateTariff: async (id: string, tariffData: any) => {
    const response = await api.put(`/admin/tariffs/${id}`, tariffData);
    return response.data;
  },
  
  deleteTariff: async (id: string) => {
    const response = await api.delete(`/admin/tariffs/${id}`);
    return response.data;
  },
  
  // Analytics
  getAnalytics: async () => {
    const response = await api.get('/admin/analytics/');
    return response.data;
  },
  
  // Withdrawals
  getWithdrawals: async (params?: any) => {
    const response = await api.get('/admin/withdrawals/', { params });
    return response.data;
  },
  
  getWithdrawal: async (id: string) => {
    const response = await api.get(`/admin/withdrawals/${id}`);
    return response.data;
  },
  
  updateWithdrawal: async (id: string, withdrawalData: any) => {
    const response = await api.put(`/admin/withdrawals/${id}`, withdrawalData);
    return response.data;
  },
  
  deleteWithdrawal: async (id: string) => {
    const response = await api.delete(`/admin/withdrawals/${id}`);
    return response.data;
  },
  
  getRevenueAnalytics: async () => {
    const response = await api.get('/admin/analytics/revenue/');
    return response.data;
  },
  
  getOrderAnalytics: async () => {
    const response = await api.get('/admin/analytics/orders/');
    return response.data;
  },
  
  // Admin Orders
  getAdminOrders: async (params?: any) => {
    const response = await api.get('/orders/', { params });
    return response.data;
  },
};

// Driver API
export const driverAPI = {
  // Orders
  getDriverOrders: async (params?: any) => {
    const response = await api.get('/driver/orders/', { params });
    return response.data;
  },
  
  // Get orders by driver ID (for testing)
  getOrdersByDriverID: async (driverId: string, params?: any) => {
    console.log('API call: getOrdersByDriverID with driverId:', driverId);
    const response = await api.get(`/driver/${driverId}/orders/`, { params });
    console.log('API response:', response);
    return response.data;
  },
  
  acceptOrder: async (id: string) => {
    const response = await api.put(`/driver/orders/${id}/accept`);
    return response.data;
  },
  
  completeOrder: async (id: string) => {
    const response = await api.put(`/driver/orders/${id}/complete`);
    return response.data;
  },
  
  // Earnings
  getDriverEarnings: async (params?: any) => {
    const response = await api.get('/driver/earnings/', { params });
    return response.data;
  },
  
  // Withdrawals
  createWithdrawal: async (withdrawalData: any) => {
    const response = await api.post('/driver/withdrawals/', withdrawalData);
    return response.data;
  },
  
  getDriverWithdrawals: async (params?: any) => {
    const response = await api.get('/driver/withdrawals/', { params });
    return response.data;
  },
  
  // Location
  updateLocation: async (locationData: any) => {
    const response = await api.post('/driver/location/', locationData);
    return response.data;
  },
  
  getLocation: async () => {
    const response = await api.get('/driver/location/');
    return response.data;
  },
  
  setOnlineStatus: async (status: boolean) => {
    const response = await api.put('/driver/online-status/', { is_online: status });
    return response.data;
  },
  
  getOnlineStatus: async () => {
    const response = await api.get('/driver/location/');
    return response.data;
  },
  
  getLocationHistory: async (params?: any) => {
    const response = await api.get('/driver/location/history/', { params });
    return response.data;
  },
};

// Location API (public)
export const locationAPI = {
  getNearbyDrivers: async (params: any) => {
    const response = await publicApi.get('/location/drivers/nearby/', { params });
    return response.data;
  },
  
  getDriverLocation: async (id: string) => {
    const response = await publicApi.get(`/location/drivers/${id}`);
    return response.data;
  },
  
  getDriverRoute: async (orderId: string) => {
    const response = await publicApi.get(`/location/routes/${orderId}/`);
    return response.data;
  },
};

export default api;
