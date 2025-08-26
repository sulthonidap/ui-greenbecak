import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { ordersAPI, driverAPI } from '../services/api';

export interface DistanceOption {
  id: string;
  name: string;
  distance: string;
  price: number;
  destination: string;
}

export interface Order {
  id: string;
  pedicabCode: string;
  distanceOption: DistanceOption;
  timestamp: Date;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  driverId?: string;
  whatsappNumber?: string;
  customerName?: string;
  pickupLocation?: string;
  destination?: string;
  totalAmount?: number;
}

interface OrderContextType {
  currentOrder: Order | null;
  orders: Order[];
  distanceOptions: DistanceOption[];
  loading: boolean;
  error: string | null;
  setOrder: (pedicabCode: string, distanceOption: DistanceOption, whatsappNumber: string) => void;
  submitOrder: () => Promise<void>;
  acceptOrder: (orderId: string, driverId: string) => Promise<void>;
  completeOrder: (orderId: string) => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;
  clearCurrentOrder: () => void;
  fetchOrders: () => Promise<void>;
  fetchDriverOrders: () => Promise<void>;
  updateTariff: (tariffId: string, updatedTariff: DistanceOption) => void;
  addTariff: (newTariff: DistanceOption) => void;
  deleteTariff: (tariffId: string) => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

const initialDistanceOptions: DistanceOption[] = [
  { id: 'dekat', name: 'Dekat', distance: '< 3 km', price: 10000, destination: 'Benteng vredeburg, Bank Indonesia' },
  { id: 'sedang', name: 'Sedang', distance: '3-7 km', price: 20000, destination: 'Taman Sari, Alun-Alun Selatan' },
  { id: 'jauh', name: 'Jauh', distance: '> 7 km', price: 30000, destination: 'Tugu Jogja, Stasiun Lempuyangan' }
];

export const OrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [distanceOptions, setDistanceOptions] = useState<DistanceOption[]>(initialDistanceOptions);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setOrder = (pedicabCode: string, distanceOption: DistanceOption, whatsappNumber: string) => {
    setCurrentOrder({
      id: `order-${Date.now()}`,
      pedicabCode,
      distanceOption,
      whatsappNumber,
      timestamp: new Date(),
      status: 'pending'
    });
  };

  const submitOrder = async () => {
    if (!currentOrder) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const orderData = {
        pedicabCode: currentOrder.pedicabCode,
        distanceOption: currentOrder.distanceOption,
        whatsappNumber: currentOrder.whatsappNumber,
        customerName: `Customer ${currentOrder.whatsappNumber}`,
        pickupLocation: 'Malioboro Mall',
        destination: currentOrder.distanceOption.destination,
        totalAmount: currentOrder.distanceOption.price
      };
      
      const response = await ordersAPI.createOrder(orderData);
      
      // Add to local orders array
      setOrders(prev => [...prev, { ...currentOrder, id: response.id }]);
      setCurrentOrder(null);
      
    } catch (error: any) {
      setError(error.response?.data?.message || 'Gagal membuat pesanan');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const acceptOrder = async (orderId: string, driverId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await driverAPI.acceptOrder(orderId);
      
      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status: 'accepted' as const, driverId }
          : order
      ));
      
    } catch (error: any) {
      setError(error.response?.data?.message || 'Gagal menerima pesanan');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const completeOrder = async (orderId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await driverAPI.completeOrder(orderId);
      
      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status: 'completed' as const }
          : order
      ));
      
    } catch (error: any) {
      setError(error.response?.data?.message || 'Gagal menyelesaikan pesanan');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await ordersAPI.updateOrder(orderId, { status: 'cancelled' });
      
      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status: 'cancelled' as const }
          : order
      ));
      
    } catch (error: any) {
      setError(error.response?.data?.message || 'Gagal membatalkan pesanan');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const clearCurrentOrder = () => {
    setCurrentOrder(null);
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await ordersAPI.getOrders();
      setOrders(response.orders || []);
      
    } catch (error: any) {
      setError(error.response?.data?.message || 'Gagal mengambil data pesanan');
    } finally {
      setLoading(false);
    }
  };

  const fetchDriverOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await driverAPI.getDriverOrders();
      setOrders(response.orders || []);
      
    } catch (error: any) {
      setError(error.response?.data?.message || 'Gagal mengambil data pesanan driver');
    } finally {
      setLoading(false);
    }
  };

  const updateTariff = (tariffId: string, updatedTariff: DistanceOption) => {
    setDistanceOptions(prev => prev.map(tariff => 
      tariff.id === tariffId ? updatedTariff : tariff
    ));
  };

  const addTariff = (newTariff: DistanceOption) => {
    setDistanceOptions(prev => [...prev, newTariff]);
  };

  const deleteTariff = (tariffId: string) => {
    setDistanceOptions(prev => prev.filter(tariff => tariff.id !== tariffId));
  };

  // Load orders on mount
  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <OrderContext.Provider value={{ 
      currentOrder, 
      orders, 
      distanceOptions, 
      loading, 
      error,
      setOrder, 
      submitOrder, 
      acceptOrder, 
      completeOrder, 
      cancelOrder, 
      clearCurrentOrder,
      fetchOrders,
      fetchDriverOrders,
      updateTariff, 
      addTariff, 
      deleteTariff 
    }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};