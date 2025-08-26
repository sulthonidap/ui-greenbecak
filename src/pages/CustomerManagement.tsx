import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useOrder } from '../context/OrderContext';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Users, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar,
  Star,
  Eye,
  MoreHorizontal,
  DollarSign,
  Route,
  MessageSquare,
  PhoneCall
} from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  phone: string;
  firstOrder: string;
  lastOrder: string;
  totalOrders: number;
  totalSpent: number;
  averageRating: number;
  status: 'active' | 'inactive';
  favoriteDriver?: string;
  orderHistory: OrderHistory[];
}

interface OrderHistory {
  id: string;
  date: string;
  vehicleCode: string;
  driver: string;
  tripType: string;
  distance: string;
  amount: number;
  paymentMethod: string;
  status: 'completed' | 'cancelled' | 'ongoing' | 'pending' | 'accepted';
  rating?: number;
  review?: string;
}

const CustomerManagement: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { orders } = useOrder();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    if (location.state?.message) {
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);
    }
  }, [location.state?.message]);

  // Generate customers from orders
  useEffect(() => {
    const customerMap = new Map<string, Customer>();
    
    orders.forEach((order) => {
      const phone = order.whatsappNumber || 'Unknown';
      const existingCustomer = customerMap.get(phone);
      
      // Generate customer name from phone (for demo purposes)
      const customerName = `Customer ${phone.slice(-4)}`;
      
      // Map vehicle code to driver name
      const driverMap: { [key: string]: string } = {
        '1231': 'Ahmad Supriadi',
        '1232': 'Budi Santoso', 
        '1233': 'Citra Dewi',
        '1234': 'Dedi Kurniawan',
        '1235': 'Eko Prasetyo',
        '1236': 'Fitri Handayani'
      };
      
      const driver = driverMap[order.pedicabCode] || 'Driver Tidak Diketahui';
      
      const orderHistory: OrderHistory = {
        id: order.id,
        date: order.timestamp.toLocaleDateString('id-ID'),
        vehicleCode: order.pedicabCode,
        driver: driver,
        tripType: order.distanceOption.name,
        distance: order.distanceOption.distance,
        amount: order.distanceOption.price,
        paymentMethod: 'QRIS',
        status: order.status,
        rating: order.status === 'completed' ? Math.floor(Math.random() * 2) + 4 : undefined,
        review: order.status === 'completed' ? 'Pelayanan sangat baik' : undefined
      };

      if (existingCustomer) {
        // Update existing customer
        existingCustomer.totalOrders += 1;
        existingCustomer.totalSpent += order.distanceOption.price;
        existingCustomer.lastOrder = order.timestamp.toLocaleDateString('id-ID');
        existingCustomer.orderHistory.push(orderHistory);
        
        // Update average rating
        const completedOrders = existingCustomer.orderHistory.filter(o => o.status === 'completed');
        if (completedOrders.length > 0) {
          const totalRating = completedOrders.reduce((sum, o) => sum + (o.rating || 0), 0);
          existingCustomer.averageRating = totalRating / completedOrders.length;
        }
      } else {
        // Create new customer
        const newCustomer: Customer = {
          id: phone,
          name: customerName,
          phone: phone,
          firstOrder: order.timestamp.toLocaleDateString('id-ID'),
          lastOrder: order.timestamp.toLocaleDateString('id-ID'),
          totalOrders: 1,
          totalSpent: order.distanceOption.price,
          averageRating: order.status === 'completed' ? 4.5 : 0,
          status: 'active',
          orderHistory: [orderHistory]
        };
        customerMap.set(phone, newCustomer);
      }
    });

    // Convert map to array and add some mock data for demonstration
    const customersFromOrders = Array.from(customerMap.values());
    
    // Add some mock customers for demonstration (since orders might be empty)
    const mockCustomers: Customer[] = [
      {
        id: '1',
        name: 'Customer 5678',
        phone: '+62 812-1234-5678',
        firstOrder: '2024-12-15',
        lastOrder: '2024-12-20',
        totalOrders: 3,
        totalSpent: 45000,
        averageRating: 4.8,
        status: 'active',
        favoriteDriver: 'Ahmad Supriadi',
        orderHistory: [
          {
            id: 'O001',
            date: '2024-12-20',
            vehicleCode: '1231',
            driver: 'Ahmad Supriadi',
            tripType: 'Dekat',
            distance: '< 3 km',
            amount: 15000,
            paymentMethod: 'QRIS',
            status: 'completed',
            rating: 5,
            review: 'Driver sangat ramah dan aman'
          },
          {
            id: 'O002',
            date: '2024-12-18',
            vehicleCode: '1233',
            driver: 'Citra Dewi',
            tripType: 'Sedang',
            distance: '3-7 km',
            amount: 18000,
            paymentMethod: 'QRIS',
            status: 'completed',
            rating: 4,
            review: 'Perjalanan nyaman'
          },
          {
            id: 'O003',
            date: '2024-12-15',
            vehicleCode: '1232',
            driver: 'Budi Santoso',
            tripType: 'Jauh',
            distance: '> 7 km',
            amount: 12000,
            paymentMethod: 'QRIS',
            status: 'completed',
            rating: 5,
            review: 'Sangat puas dengan pelayanan'
          }
        ]
      },
      {
        id: '2',
        name: 'Customer 6789',
        phone: '+62 812-2345-6789',
        firstOrder: '2024-12-10',
        lastOrder: '2024-12-19',
        totalOrders: 2,
        totalSpent: 35000,
        averageRating: 4.9,
        status: 'active',
        favoriteDriver: 'Citra Dewi',
        orderHistory: [
          {
            id: 'O004',
            date: '2024-12-19',
            vehicleCode: '1233',
            driver: 'Citra Dewi',
            tripType: 'Dekat',
            distance: '< 3 km',
            amount: 16000,
            paymentMethod: 'QRIS',
            status: 'completed',
            rating: 5,
            review: 'Driver tepat waktu'
          },
          {
            id: 'O005',
            date: '2024-12-10',
            vehicleCode: '1235',
            driver: 'Eko Prasetyo',
            tripType: 'Sedang',
            distance: '3-7 km',
            amount: 19000,
            paymentMethod: 'QRIS',
            status: 'completed',
            rating: 4,
            review: 'Pelayanan sangat baik'
          }
        ]
      },
      {
        id: '3',
        name: 'Customer 7890',
        phone: '+62 812-3456-7890',
        firstOrder: '2024-12-12',
        lastOrder: '2024-12-17',
        totalOrders: 1,
        totalSpent: 22000,
        averageRating: 4.6,
        status: 'active',
        favoriteDriver: 'Budi Santoso',
        orderHistory: [
          {
            id: 'O006',
            date: '2024-12-17',
            vehicleCode: '1232',
            driver: 'Budi Santoso',
            tripType: 'Jauh',
            distance: '> 7 km',
            amount: 22000,
            paymentMethod: 'QRIS',
            status: 'completed',
            rating: 4,
            review: 'Perjalanan lancar'
          }
        ]
      }
    ];

    // Combine real customers from orders with mock data
    const allCustomers = [...customersFromOrders, ...mockCustomers];
    setCustomers(allCustomers);
  }, [orders]);

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.status === 'active').length;
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const averageRating = customers.length > 0 
    ? customers.reduce((sum, c) => sum + c.averageRating, 0) / customers.length 
    : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', text: 'Aktif' },
      inactive: { color: 'bg-gray-100 text-gray-800', text: 'Tidak Aktif' }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const handleViewDetail = (customerId: string) => {
    navigate(`/admin/customer-detail/${customerId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {location.state?.message}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Customer Management</h1>
              <p className="text-gray-600">Daftar customer yang pernah melakukan order</p>
            </div>
          </div>
        </div>

        {/* Statistics */}
        

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter & Pencarian</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Cari customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Semua Status</option>
                <option value="active">Aktif</option>
                <option value="inactive">Tidak Aktif</option>
              </select>
              
              <button className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Filter className="w-4 h-4" />
                <span>Filter</span>
              </button>
            </div>
          </div>
        </div>

        {/* Customer List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Daftar Customer</h2>
            <p className="text-gray-600">Total {filteredCustomers.length} customer ditemukan</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kontak
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status & Order History
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Spent
                  </th>
                  
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-green-600">
                              {customer.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                          <div className="text-sm text-gray-500">{customer.phone}</div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{customer.phone}</div>
                          <div className="text-sm text-gray-500">WhatsApp</div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(customer.status)}
                            <span className="text-xs text-gray-500">First: {formatDate(customer.firstOrder)}</span>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            Last: {formatDate(customer.lastOrder)}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">{customer.totalOrders}</div>
                        <div className="text-xs text-gray-500">order</div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">{formatCurrency(customer.totalSpent)}</div>
                        <div className="text-xs text-gray-500">total belanja</div>
                      </div>
                    </td>
                    
                    
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button 
                          className="text-blue-600 hover:text-blue-900"
                          onClick={() => handleViewDetail(customer.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-900">
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        <button className="text-blue-600 hover:text-blue-900">
                          <PhoneCall className="w-4 h-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-900">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredCustomers.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500">Tidak ada customer ditemukan</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerManagement;
