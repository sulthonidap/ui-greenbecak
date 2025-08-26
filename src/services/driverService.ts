import { driverAPI, authAPI } from './api';

export interface DriverOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  pickup_location: string;
  drop_location: string;
  distance: number;
  price: number;
  status: string;
  created_at: string;
  completed_at?: string;
}

export interface DriverEarnings {
  totalEarnings: number;
  currentBalance: number;
  thisMonthEarnings: number;
  lastMonthEarnings: number;
  pendingWithdrawals: number;
  completedWithdrawals: number;
  totalTrips: number;
  averagePerTrip: number;
  rating: number;
  monthlyEarnings: Array<{
    month: string;
    earnings: number;
  }>;
}

export interface DriverWithdrawal {
  id: string;
  amount: number;
  bank_name: string;
  account_number: string;
  account_name: string;
  status: string;
  created_at: string;
  notes?: string;
}

export interface DriverProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  driver_code: string;
  status: string;
  join_date: string;
  vehicle_type: string;
  total_trips: number;
  rating: number;
}

export class DriverService {
  // Orders
  static async getDriverOrders(): Promise<{ orders: DriverOrder[] }> {
    try {
      const response = await driverAPI.getDriverOrders();
      return response;
    } catch (error) {
      console.error('Failed to fetch driver orders:', error);
      throw error;
    }
  }

  static async acceptOrder(orderId: string): Promise<any> {
    try {
      const response = await driverAPI.acceptOrder(orderId);
      return response;
    } catch (error) {
      console.error('Failed to accept order:', error);
      throw error;
    }
  }

  static async completeOrder(orderId: string): Promise<any> {
    try {
      const response = await driverAPI.completeOrder(orderId);
      return response;
    } catch (error) {
      console.error('Failed to complete order:', error);
      throw error;
    }
  }

  // Earnings
  static async getDriverEarnings(): Promise<DriverEarnings> {
    try {
      const response = await driverAPI.getDriverEarnings();
      return response;
    } catch (error) {
      console.error('Failed to fetch driver earnings:', error);
      throw error;
    }
  }

  // Withdrawals
  static async createWithdrawal(withdrawalData: {
    amount: number;
    bank_name: string;
    account_number: string;
    account_name: string;
    notes?: string;
  }): Promise<any> {
    try {
      const response = await driverAPI.createWithdrawal(withdrawalData);
      return response;
    } catch (error) {
      console.error('Failed to create withdrawal:', error);
      throw error;
    }
  }

  static async getDriverWithdrawals(): Promise<{ withdrawals: DriverWithdrawal[] }> {
    try {
      const response = await driverAPI.getDriverWithdrawals();
      return response;
    } catch (error) {
      console.error('Failed to fetch driver withdrawals:', error);
      throw error;
    }
  }

  // Location
  static async updateLocation(locationData: {
    latitude: number;
    longitude: number;
    timestamp: string;
  }): Promise<any> {
    try {
      const response = await driverAPI.updateLocation(locationData);
      return response;
    } catch (error) {
      console.error('Failed to update location:', error);
      throw error;
    }
  }

  static async getLocation(): Promise<any> {
    try {
      const response = await driverAPI.getLocation();
      return response;
    } catch (error) {
      console.error('Failed to get location:', error);
      throw error;
    }
  }

  static async setOnlineStatus(status: boolean): Promise<any> {
    try {
      const response = await driverAPI.setOnlineStatus(status);
      return response;
    } catch (error) {
      console.error('Failed to set online status:', error);
      throw error;
    }
  }

  // Profile
  static async getDriverProfile(): Promise<DriverProfile> {
    try {
      const response = await authAPI.getProfile();
      return response;
    } catch (error) {
      console.error('Failed to fetch driver profile:', error);
      throw error;
    }
  }

  // Mock data for development fallback
  static getMockDriverEarnings(): DriverEarnings {
    return {
      totalEarnings: 8500000,
      currentBalance: 1250000,
      thisMonthEarnings: 1250000,
      lastMonthEarnings: 1100000,
      pendingWithdrawals: 500000,
      completedWithdrawals: 3000000,
      totalTrips: 127,
      averagePerTrip: 67000,
      rating: 4.8,
      monthlyEarnings: [
        { month: 'Jan', earnings: 1250000 },
        { month: 'Dec', earnings: 1100000 },
        { month: 'Nov', earnings: 980000 },
        { month: 'Oct', earnings: 1200000 },
        { month: 'Sep', earnings: 950000 },
        { month: 'Aug', earnings: 1050000 }
      ]
    };
  }

  static getMockDriverProfile(): DriverProfile {
    return {
      id: '1',
      name: 'Budi Santoso',
      email: 'budi.santoso@example.com',
      phone: '+62 812-3456-7890',
      driver_code: 'BEC001',
      status: 'active',
      join_date: '2024-01-15',
      vehicle_type: 'becak_listrik',
      total_trips: 127,
      rating: 4.8
    };
  }

  static getMockDriverOrders(): DriverOrder[] {
    return [
      {
        id: '1',
        order_number: 'ORD-001',
        customer_name: 'Customer 1',
        customer_phone: '08123456789',
        pickup_location: 'Malioboro Mall',
        drop_location: 'Tugu Jogja',
        distance: 3.2,
        price: 32000,
        status: 'pending',
        created_at: '2024-01-20T10:30:00Z'
      },
      {
        id: '2',
        order_number: 'ORD-002',
        customer_name: 'Customer 2',
        customer_phone: '08123456790',
        pickup_location: 'Alun-Alun Selatan',
        drop_location: 'Taman Sari',
        distance: 4.5,
        price: 45000,
        status: 'accepted',
        created_at: '2024-01-20T11:15:00Z'
      }
    ];
  }
}
