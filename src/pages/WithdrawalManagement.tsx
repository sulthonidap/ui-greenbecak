import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, Users, Car, Calendar, BarChart3, Download, Filter, Eye, CheckCircle, XCircle, Clock, AlertCircle, CreditCard, Banknote, Receipt, Search, MoreHorizontal, Check, X, AlertTriangle, TrendingUp, TrendingDown, RefreshCcw } from 'lucide-react';
import { adminAPI } from '../services/api';
import { showSuccess, showError } from '../utils/toast';

interface WithdrawalRequest {
  id: string;
  driverId: string;
  driverName: string;
  amount: number;
  requestDate: Date;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  approvedDate?: Date;
  rejectedDate?: Date;
  approvedBy?: string;
  rejectedBy?: string;
  reason?: string;
  bankAccount: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  driverBalance: number;
  totalEarnings: number;
  previousWithdrawals: number;
}

const mockWithdrawalRequests: WithdrawalRequest[] = [
  {
    id: 'W001',
    driverId: 'D001',
    driverName: 'Budi Santoso',
    amount: 500000,
    requestDate: new Date('2024-12-19T10:30:00'),
    status: 'pending',
    bankAccount: {
      bankName: 'Bank BCA',
      accountNumber: '1234567890',
      accountName: 'Budi Santoso'
    },
    driverBalance: 2450000,
    totalEarnings: 3120000,
    previousWithdrawals: 1200000
  },
  {
    id: 'W002',
    driverId: 'D002',
    driverName: 'Siti Rahma',
    amount: 300000,
    requestDate: new Date('2024-12-18T14:20:00'),
    status: 'approved',
    approvedDate: new Date('2024-12-19T09:15:00'),
    approvedBy: 'Admin GreenBecak',
    bankAccount: {
      bankName: 'OVO',
      accountNumber: '081234567890',
      accountName: 'Siti Rahma'
    },
    driverBalance: 1890000,
    totalEarnings: 3340000,
    previousWithdrawals: 1500000
  },
  {
    id: 'W003',
    driverId: 'D003',
    driverName: 'Ahmad Reza',
    amount: 750000,
    requestDate: new Date('2024-12-17T16:45:00'),
    status: 'rejected',
    rejectedDate: new Date('2024-12-18T11:30:00'),
    rejectedBy: 'Admin GreenBecak',
    reason: 'Saldo tidak mencukupi',
    bankAccount: {
      bankName: 'Bank Mandiri',
      accountNumber: '0987654321',
      accountName: 'Ahmad Reza'
    },
    driverBalance: 3200000,
    totalEarnings: 2860000,
    previousWithdrawals: 800000
  },
  {
    id: 'W004',
    driverId: 'D004',
    driverName: 'Dewi Lestari',
    amount: 400000,
    requestDate: new Date('2024-12-19T08:15:00'),
    status: 'pending',
    bankAccount: {
      bankName: 'DANA',
      accountNumber: '081234567891',
      accountName: 'Dewi Lestari'
    },
    driverBalance: 1800000,
    totalEarnings: 2680000,
    previousWithdrawals: 900000
  },
  {
    id: 'W005',
    driverId: 'D005',
    driverName: 'Joko Widodo',
    amount: 250000,
    requestDate: new Date('2024-12-16T12:00:00'),
    status: 'approved',
    approvedDate: new Date('2024-12-17T10:45:00'),
    approvedBy: 'Admin GreenBecak',
    bankAccount: {
      bankName: 'Bank BRI',
      accountNumber: '1122334455',
      accountName: 'Joko Widodo'
    },
    driverBalance: 950000,
    totalEarnings: 1960000,
    previousWithdrawals: 1000000
  }
];

const WithdrawalManagement: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | 'complete' | null>(null);
  const [confirmRequest, setConfirmRequest] = useState<WithdrawalRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);

  // Fetch withdrawal data from API
  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching withdrawal data...');
      const response = await adminAPI.getWithdrawals();
      console.log('Withdrawal response:', response);

      // Transform API response to match interface
      const transformedData: WithdrawalRequest[] = (response.withdrawals || []).map((w: any) => ({
        id: w.id?.toString() || `withdrawal-${Date.now()}`,
        driverId: w.driver_id?.toString() || 'N/A',
        driverName: w.driver?.name || w.driver_name || 'Unknown Driver',
        amount: w.amount || 0,
        requestDate: w.created_at ? new Date(w.created_at) : new Date(),
        status: w.status || 'pending',
        approvedDate: w.approved_at ? new Date(w.approved_at) : undefined,
        rejectedDate: w.rejected_at ? new Date(w.rejected_at) : undefined,
        approvedBy: w.approved_by || 'Admin GreenBecak',
        rejectedBy: w.rejected_by || 'Admin GreenBecak',
        reason: w.notes || w.reason,
        bankAccount: {
          bankName: w.bank_name || 'N/A',
          accountNumber: w.account_number || 'N/A',
          accountName: w.account_name || 'N/A'
        },
        driverBalance: w.driver?.available_balance || w.driver?.total_earnings || 0,
        totalEarnings: w.driver?.total_earnings || 0,
        previousWithdrawals: w.driver?.completed_withdrawals || 0
      }));

      setRequests(transformedData);

    } catch (error: any) {
      console.error('Failed to fetch withdrawal data:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });

      // Provide specific error messages
      if (error.response?.status === 401) {
        setError('Anda harus login sebagai admin untuk mengakses data withdrawal');
      } else if (error.response?.status === 403) {
        setError('Anda tidak memiliki akses ke data withdrawal');
      } else if (error.code === 'ERR_NETWORK') {
        setError('Tidak dapat terhubung ke server. Pastikan backend sudah running di port 8080');
      } else if (error.response?.status === 500) {
        setError('Terjadi kesalahan internal server. Silakan coba lagi nanti.');
      } else {
        setError(error.response?.data?.message || 'Gagal memuat data withdrawal. Silakan coba lagi.');
      }

      // Fallback to mock data for development
      if (import.meta.env.DEV) {
        console.log('Using mock data as fallback...');
        setRequests(mockWithdrawalRequests);
      }
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchWithdrawals();
  }, []);

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-amber-100 text-amber-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus;
    const matchesSearch = request.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRequests = filteredRequests.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchTerm]);

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    completed: requests.filter(r => r.status === 'completed').length,
    totalAmount: requests.reduce((sum, r) => sum + r.amount, 0),
    pendingAmount: requests.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.amount, 0)
  };

  const handleApprove = async (requestId: string) => {
    try {
      await adminAPI.updateWithdrawal(requestId, {
        status: 'approved',
        approved_by: 'Admin GreenBecak'
      });

      // Update local state
      setRequests(prev => prev.map(req =>
        req.id === requestId
          ? { ...req, status: 'approved' as const, approvedDate: new Date(), approvedBy: 'Admin GreenBecak' }
          : req
      ));

      showSuccess('Withdrawal berhasil disetujui! Saldo driver telah terpotong.');
    } catch (error: any) {
      console.error('Failed to approve withdrawal:', error);
      if (error.response?.status === 401) {
        showError('Anda harus login sebagai admin untuk menyetujui withdrawal');
      } else if (error.response?.status === 403) {
        showError('Anda tidak memiliki akses untuk menyetujui withdrawal');
      } else if (error.code === 'ERR_NETWORK') {
        showError('Tidak dapat terhubung ke server. Pastikan backend sudah running');
      } else {
        showError(error.response?.data?.message || 'Gagal menyetujui withdrawal');
      }
    }
  };

  const handleReject = async (requestId: string, reason: string) => {
    try {
      await adminAPI.updateWithdrawal(requestId, {
        status: 'rejected',
        rejected_by: 'Admin GreenBecak',
        notes: reason
      });

      // Update local state
      setRequests(prev => prev.map(req =>
        req.id === requestId
          ? { ...req, status: 'rejected' as const, rejectedDate: new Date(), rejectedBy: 'Admin GreenBecak', reason }
          : req
      ));

      showSuccess('Withdrawal berhasil ditolak!');
    } catch (error: any) {
      console.error('Failed to reject withdrawal:', error);
      if (error.response?.status === 401) {
        showError('Anda harus login sebagai admin untuk menolak withdrawal');
      } else if (error.response?.status === 403) {
        showError('Anda tidak memiliki akses untuk menolak withdrawal');
      } else if (error.code === 'ERR_NETWORK') {
        showError('Tidak dapat terhubung ke server. Pastikan backend sudah running');
      } else {
        showError(error.response?.data?.message || 'Gagal menolak withdrawal');
      }
    }
  };

  const handleMarkAsCompleted = async (requestId: string) => {
    try {
      await adminAPI.updateWithdrawal(requestId, {
        status: 'completed'
      });

      // Update local state
      setRequests(prev => prev.map(req =>
        req.id === requestId
          ? { ...req, status: 'completed' as const }
          : req
      ));

      showSuccess('Withdrawal berhasil ditandai sebagai selesai! Transfer dana telah dikonfirmasi.');
    } catch (error: any) {
      console.error('Failed to mark withdrawal as completed:', error);
      if (error.response?.status === 401) {
        showError('Anda harus login sebagai admin untuk mengubah status withdrawal');
      } else if (error.response?.status === 403) {
        showError('Anda tidak memiliki akses untuk mengubah status withdrawal');
      } else if (error.code === 'ERR_NETWORK') {
        showError('Tidak dapat terhubung ke server. Pastikan backend sudah running');
      } else {
        showError(error.response?.data?.message || 'Gagal mengubah status withdrawal');
      }
    }
  };

  const openDetailModal = (request: WithdrawalRequest) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  const openConfirmModal = (action: 'approve' | 'reject' | 'complete', request: WithdrawalRequest) => {
    setConfirmAction(action);
    setConfirmRequest(request);
    setRejectReason('');
    setShowConfirmModal(true);
  };

  const closeConfirmModal = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
    setConfirmRequest(null);
    setRejectReason('');
  };

  const handleConfirmAction = async () => {
    if (!confirmRequest || !confirmAction) return;

    try {
      if (confirmAction === 'approve') {
        await handleApprove(confirmRequest.id);
      } else if (confirmAction === 'reject') {
        await handleReject(confirmRequest.id, rejectReason || 'Ditolak oleh admin');
      } else if (confirmAction === 'complete') {
        await handleMarkAsCompleted(confirmRequest.id);
      }
      closeConfirmModal();
    } catch (error) {
      // Error handling is already done in the individual functions
      console.error('Error in confirm action:', error);
    }
  };

  return (
    <div className={embedded ? '' : 'p-6'}>
      {!embedded && (
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin/finance')}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Financial Management
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Penarikan</h1>
          <p className="text-gray-600 mt-2">Kelola permintaan penarikan saldo driver</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="mb-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Memuat data withdrawal...</p>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="mb-6">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">
                  Error: {error}
                </p>
                <button
                  onClick={fetchWithdrawals}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                >
                  Coba lagi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Receipt className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Permintaan</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
          <div className="mt-2 text-sm text-amber-600">
            {formatCurrency(stats.pendingAmount)} total
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Disetujui</p>
              <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ditolak</p>
              <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Selesai</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari driver atau ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Disetujui</option>
              <option value="rejected">Ditolak</option>
              <option value="completed">Selesai</option>
            </select>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={fetchWithdrawals}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Loading...
                </>
              ) : (
                <>
                  <div className="w-4 h-4 mr-2"><RefreshCcw className="w-4 h-4 mr-2" /></div>
                  Refresh
                </>
              )}
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Laporan
            </button>
          </div>
        </div>
      </div>

      {/* Withdrawal Requests Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Driver
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jumlah
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal Request
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
                         <tbody className="bg-white divide-y divide-gray-200">
               {currentRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{request.driverName}</div>
                        <div className="text-sm text-gray-500">ID: {request.driverId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{formatCurrency(request.amount)}</div>
                    <div className="text-sm text-gray-500">Saldo: {formatCurrency(request.driverBalance)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{request.bankAccount.bankName}</div>
                    <div className="text-sm text-gray-500">{request.bankAccount.accountNumber}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(request.requestDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(request.status)}
                      <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(request.status)}`}>
                        {request.status === 'approved' ? 'Disetujui' :
                          request.status === 'pending' ? 'Pending' :
                            request.status === 'completed' ? 'Selesai' : 'Ditolak'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openDetailModal(request)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {request.status === 'pending' && (
                        <>
                          <button
                            onClick={() => openConfirmModal('approve', request)}
                            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                            title="Approve"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            SETUJU
                          </button>
                          <button
                            onClick={() => openConfirmModal('reject', request)}
                            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                            title="Reject"
                          >
                            <X className="w-4 h-4 mr-1" />
                            TOLAK
                          </button>
                        </>
                      )}
                      {request.status === 'approved' && (
                        <button
                          onClick={() => openConfirmModal('complete', request)}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                          title="Mark as Completed"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          SELESAI
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                             ))}
             </tbody>
           </table>
           
           {/* Empty state */}
           {currentRequests.length === 0 && (
             <div className="text-center py-12">
               <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Receipt className="w-8 h-8 text-gray-400" />
               </div>
               <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada data withdrawal</h3>
               <p className="text-gray-500">
                 {filteredRequests.length === 0 
                   ? 'Belum ada permintaan withdrawal yang ditemukan.'
                   : 'Tidak ada data yang sesuai dengan filter yang dipilih.'
                 }
               </p>
             </div>
           )}
         </div>

         {/* Pagination */}
         {totalPages > 1 && (
           <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
             <div className="flex-1 flex justify-between sm:hidden">
               <button
                 onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                 disabled={currentPage === 1}
                 className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 Sebelumnya
               </button>
               <button
                 onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                 disabled={currentPage === totalPages}
                 className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 Selanjutnya
               </button>
             </div>
             <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
               <div>
                 <p className="text-sm text-gray-700">
                   Menampilkan{' '}
                   <span className="font-medium">{startIndex + 1}</span>
                   {' '}sampai{' '}
                   <span className="font-medium">{Math.min(endIndex, filteredRequests.length)}</span>
                   {' '}dari{' '}
                   <span className="font-medium">{filteredRequests.length}</span>
                   {' '}hasil
                 </p>
               </div>
               <div>
                 <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                   <button
                     onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                     disabled={currentPage === 1}
                     className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     <span className="sr-only">Sebelumnya</span>
                     <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                       <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                     </svg>
                   </button>
                   
                   {/* Page numbers */}
                   {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                     <button
                       key={page}
                       onClick={() => setCurrentPage(page)}
                       className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                         currentPage === page
                           ? 'z-10 bg-green-50 border-green-500 text-green-600'
                           : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                       }`}
                     >
                       {page}
                     </button>
                   ))}
                   
                   <button
                     onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                     disabled={currentPage === totalPages}
                     className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     <span className="sr-only">Selanjutnya</span>
                     <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                       <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                     </svg>
                   </button>
                 </nav>
               </div>
             </div>
           </div>
         )}
       </div>

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Detail Penarikan</h3>
                <p className="text-sm text-gray-500 mt-1">ID: {selectedRequest.id}</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center">
                  {getStatusIcon(selectedRequest.status)}
                  <span className={`ml-2 px-3 py-1 text-sm font-medium rounded-full ${getStatusBadge(selectedRequest.status)}`}>
                    {selectedRequest.status === 'approved' ? 'Disetujui' :
                      selectedRequest.status === 'pending' ? 'Pending' :
                      selectedRequest.status === 'completed' ? 'Selesai' : 'Ditolak'}
                  </span>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Informasi Driver</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Nama:</span> {selectedRequest.driverName}</div>
                    <div><span className="font-medium">ID Driver:</span> {selectedRequest.driverId}</div>
                    <div><span className="font-medium">Saldo Saat Ini:</span> {formatCurrency(selectedRequest.driverBalance)}</div>
                    <div><span className="font-medium">Total Pendapatan:</span> {formatCurrency(selectedRequest.totalEarnings)}</div>
                    <div><span className="font-medium">Penarikan Sebelumnya:</span> {formatCurrency(selectedRequest.previousWithdrawals)}</div>
                    <div><span className="font-medium">Persentase Penarikan:</span> {((selectedRequest.amount / selectedRequest.totalEarnings) * 100).toFixed(1)}%</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Informasi Penarikan</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">ID Withdrawal:</span> {selectedRequest.id}</div>
                    <div><span className="font-medium">Jumlah:</span> {formatCurrency(selectedRequest.amount)}</div>
                    <div><span className="font-medium">Tanggal Request:</span> {formatDate(selectedRequest.requestDate)}</div>
                    <div><span className="font-medium">Status:</span>
                      <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(selectedRequest.status)}`}>
                        {selectedRequest.status === 'approved' ? 'Disetujui' :
                          selectedRequest.status === 'pending' ? 'Pending' :
                          selectedRequest.status === 'completed' ? 'Selesai' : 'Ditolak'}
                      </span>
                    </div>
                    {selectedRequest.approvedDate && (
                      <div><span className="font-medium">Tanggal Disetujui:</span> {formatDate(selectedRequest.approvedDate)}</div>
                    )}
                    {selectedRequest.approvedBy && (
                      <div><span className="font-medium">Disetujui Oleh:</span> {selectedRequest.approvedBy}</div>
                    )}
                    {selectedRequest.rejectedDate && (
                      <div><span className="font-medium">Tanggal Ditolak:</span> {formatDate(selectedRequest.rejectedDate)}</div>
                    )}
                    {selectedRequest.rejectedBy && (
                      <div><span className="font-medium">Ditolak Oleh:</span> {selectedRequest.rejectedBy}</div>
                    )}
                    {selectedRequest.status === 'completed' && (
                      <div><span className="font-medium">Status Transfer:</span> <span className="text-blue-600">Transfer dana telah selesai</span></div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Informasi Bank</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Bank/E-Wallet:</span> {selectedRequest.bankAccount.bankName}</div>
                  <div><span className="font-medium">Nomor Rekening/ID:</span> {selectedRequest.bankAccount.accountNumber}</div>
                  <div><span className="font-medium">Nama Pemilik:</span> {selectedRequest.bankAccount.accountName}</div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Ringkasan Keuangan</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Total Pendapatan:</span> {formatCurrency(selectedRequest.totalEarnings)}</div>
                  <div><span className="font-medium">Penarikan Sebelumnya:</span> {formatCurrency(selectedRequest.previousWithdrawals)}</div>
                  <div><span className="font-medium">Saldo Setelah Penarikan:</span> {formatCurrency(selectedRequest.driverBalance - selectedRequest.amount)}</div>
                </div>
              </div>

                             {selectedRequest.status === 'rejected' && selectedRequest.reason && (
                 <div>
                   <h4 className="font-medium text-gray-900 mb-2">Alasan Penolakan</h4>
                   <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
                     <div className="flex items-start">
                       <XCircle className="w-4 h-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                       <div>
                         <p className="font-medium mb-1">Alasan:</p>
                         <p>{selectedRequest.reason}</p>
                       </div>
                     </div>
                   </div>
                 </div>
               )}

               {selectedRequest.status === 'completed' && (
                 <div>
                   <h4 className="font-medium text-gray-900 mb-2">Status Penyelesaian</h4>
                   <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-md border border-blue-200">
                     <div className="flex items-start">
                       <CheckCircle className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                       <div>
                         <p className="font-medium mb-1">Transfer Dana Selesai</p>
                         <p>Dana telah berhasil ditransfer ke rekening driver. Proses withdrawal telah selesai.</p>
                       </div>
                     </div>
                   </div>
                 </div>
               )}
            </div>

            {selectedRequest.status === 'pending' && (
              <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => openConfirmModal('reject', selectedRequest)}
                  className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 transition-colors"
                >
                  Tolak
                </button>
                <button
                  onClick={() => openConfirmModal('approve', selectedRequest)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Setujui
                </button>
              </div>
            )}
            {selectedRequest.status === 'approved' && (
              <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => openConfirmModal('complete', selectedRequest)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Tandai Selesai
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && confirmRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {confirmAction === 'approve' && 'Konfirmasi Persetujuan'}
                {confirmAction === 'reject' && 'Konfirmasi Penolakan'}
                {confirmAction === 'complete' && 'Konfirmasi Penyelesaian'}
              </h3>
              <button
                onClick={closeConfirmModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="text-sm text-gray-600 mb-2">
                  <strong>Driver:</strong> {confirmRequest.driverName}
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  <strong>Jumlah:</strong> {formatCurrency(confirmRequest.amount)}
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Bank:</strong> {confirmRequest.bankAccount.bankName} - {confirmRequest.bankAccount.accountNumber}
                </div>
              </div>

              {confirmAction === 'approve' && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                    <div className="text-sm text-green-800">
                      <strong>Konfirmasi Persetujuan</strong>
                      <p className="mt-1">Dengan menyetujui withdrawal ini, saldo driver akan terpotong sebesar {formatCurrency(confirmRequest.amount)}.</p>
                    </div>
                  </div>
                </div>
              )}

              {confirmAction === 'reject' && (
                <div className="space-y-3">
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex items-center">
                      <XCircle className="w-5 h-5 text-red-400 mr-2" />
                      <div className="text-sm text-red-800">
                        <strong>Konfirmasi Penolakan</strong>
                        <p className="mt-1">Dengan menolak withdrawal ini, driver akan menerima notifikasi penolakan.</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Alasan Penolakan (Opsional)
                    </label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Masukkan alasan penolakan..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {confirmAction === 'complete' && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-blue-400 mr-2" />
                    <div className="text-sm text-blue-800">
                      <strong>Konfirmasi Penyelesaian</strong>
                      <p className="mt-1">Dengan menandai sebagai selesai, Anda mengkonfirmasi bahwa transfer dana telah dilakukan ke rekening driver.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t">
              <button
                onClick={closeConfirmModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmAction}
                className={`px-4 py-2 text-white rounded-md transition-colors ${
                  confirmAction === 'approve' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : confirmAction === 'reject'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {confirmAction === 'approve' && 'Setujui'}
                {confirmAction === 'reject' && 'Tolak'}
                {confirmAction === 'complete' && 'Tandai Selesai'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WithdrawalManagement;
