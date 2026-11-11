import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Car, Clock, CheckCircle, XCircle, AlertCircle, Phone, User, DollarSign, Star, CalendarDays, Download, FileSpreadsheet } from 'lucide-react';
import { adminAPI, tariffsAPI } from '../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Semua tanggal dihitung dalam zona waktu WIB, bukan UTC,
// supaya order jam 00:00-06:59 tidak terhitung ke hari sebelumnya.
const WIB_TZ = 'Asia/Jakarta';

const wibDateKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: WIB_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Mengembalikan tanggal dalam format YYYY-MM-DD menurut WIB. */
const toWibDateKey = (date: Date) => wibDateKeyFormatter.format(date);

const shiftDateKey = (key: string, days: number) => {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

const formatDateKey = (key: string) =>
  new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${key}T00:00:00Z`));

type DatePreset = 'today' | '7days' | 'month' | 'all' | 'custom';

const getPresetRange = (preset: Exclude<DatePreset, 'custom'>): { from: string; to: string } => {
  const today = toWibDateKey(new Date());
  switch (preset) {
    case 'today': return { from: today, to: today };
    case '7days': return { from: shiftDateKey(today, -6), to: today };
    case 'month': return { from: `${today.slice(0, 8)}01`, to: today };
    case 'all': return { from: '', to: '' };
  }
};

/** Nomor halaman yang ditampilkan, misal: 1 … 4 5 6 … 129 */
const getPageNumbers = (current: number, total: number): (number | 'ellipsis')[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | 'ellipsis')[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push('ellipsis');
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push('ellipsis');
  pages.push(total);
  return pages;
};

const csvEscape = (value: string | number) => {
  const s = String(value ?? '');
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  destination: string;
  driverName: string;
  driverPhone: string;
  vehicleType: 'becak-listrik' | 'delman';
  vehicleCode: string;
  distance: string;
  price: number;
  status: 'pending' | 'accepted' | 'ongoing' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed';
  orderDate: Date;
  orderDateKey: string; // YYYY-MM-DD (WIB)
  pickupTime?: Date;
  completionTime?: Date;
  rating?: number;
  review?: string;
  estimatedTime: string;
  actualTime?: string;
  notes?: string;
  becakCode?: string;
  tariffId?: number;
  tariffName?: string;
}


const OrderManagement: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'ongoing' | 'completed' | 'cancelled'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'pending' | 'paid' | 'failed'>('all');
  const [vehicleFilter, setVehicleFilter] = useState<'all' | 'becak-listrik' | 'delman'>('all');
  const [tariffFilter, setTariffFilter] = useState<string>('all');
  const [tariffs, setTariffs] = useState<any[]>([]);
  const [datePreset, setDatePreset] = useState<DatePreset>('today');
  const [dateFrom, setDateFrom] = useState<string>(() => getPresetRange('today').from);
  const [dateTo, setDateTo] = useState<string>(() => getPresetRange('today').to);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const applyPreset = (preset: DatePreset) => {
    setDatePreset(preset);
    if (preset !== 'custom') {
      const range = getPresetRange(preset);
      setDateFrom(range.from);
      setDateTo(range.to);
    }
  };

  // Fetch orders from backend
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await adminAPI.getAdminOrders();

      const normalized = (response.orders || []).map((o: any) => {
        const orderDate = o.created_at ? new Date(o.created_at) : new Date();
        return {
        id: o.id?.toString() || `order-${Date.now()}`,
        orderNumber: o.order_number || `GB-${Date.now()}`,
        customerName: o.customer_name || o.customer?.name || 'Unknown Customer',
        customerPhone: o.customer_phone || o.customer?.phone || 'N/A',
        customerAddress: o.pickup_location || 'N/A',
        destination: o.drop_location || o.tariff?.destinations || 'N/A',
        tariffName: o.tariff?.name || 'N/A',
        driverName: o.driver?.name || 'Unknown Driver',
        driverPhone: o.driver?.phone || 'N/A',
        vehicleType: o.driver?.vehicle_type === 'andong' ? 'delman' :
          o.driver?.vehicle_type === 'becak_listrik' ? 'becak-listrik' :
            o.driver?.vehicle_type === 'becak_motor' ? 'becak-listrik' :
              o.driver?.vehicle_type === 'becak_manual' ? 'becak-listrik' : 'becak-listrik',
        vehicleCode: o.becak_code || o.driver?.vehicle_number || o.driver?.driver_code || 'N/A',
        distance: o.distance ? `${o.distance} km` : 'N/A',
        price: o.price || 0,
        status: o.status || 'pending',
        paymentStatus: o.payment_status || 'pending',
        orderDate,
        orderDateKey: toWibDateKey(orderDate),
        pickupTime: o.accepted_at ? new Date(o.accepted_at) : undefined,
        completionTime: o.completed_at ? new Date(o.completed_at) : undefined,
        rating: o.rating,
        review: o.notes,
        estimatedTime: o.eta ? `${o.eta} menit` : 'N/A',
        actualTime: o.completed_at && o.accepted_at ?
          `${Math.round((new Date(o.completed_at).getTime() - new Date(o.accepted_at).getTime()) / 60000)} menit` : undefined,
        };
      });
      setOrders(normalized);

    } catch (error: any) {
      console.error('Failed to fetch orders:', error);

      if (error.response?.status === 401) {
        setError('Anda harus login sebagai admin untuk mengakses data order');
      } else if (error.response?.status === 403) {
        setError('Anda tidak memiliki akses ke halaman ini');
      } else if (error.response?.status === 404) {
        setError('Endpoint admin orders belum tersedia di backend');
      } else if (error.code === 'ERR_NETWORK') {
        setError('Tidak dapat terhubung ke server. Pastikan backend sudah running dan dapat diakses.');
      } else {
        setError(error.response?.data?.message || 'Gagal mengambil data order');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTariffs = async () => {
    try {
      const response = await tariffsAPI.getTariffs();
      setTariffs(response.tariffs || []);
    } catch (error) {
      console.error('Failed to fetch tariffs:', error);
    }
  };

  // Load orders on component mount
  useEffect(() => {
    fetchOrders();
    fetchTariffs();
  }, []);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerPhone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || order.paymentStatus === paymentFilter;
    const matchesVehicle = vehicleFilter === 'all' || order.vehicleType === vehicleFilter;
    const matchesTariff = tariffFilter === 'all' || order.tariffName === tariffFilter;
    
    // Filter by date range (WIB)
    const matchesDate = (!dateFrom || order.orderDateKey >= dateFrom) &&
      (!dateTo || order.orderDateKey <= dateTo);

    return matchesSearch && matchesStatus && matchesPayment && matchesVehicle && matchesTariff && matchesDate;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, paymentFilter, vehicleFilter, tariffFilter, dateFrom, dateTo, itemsPerPage]);

  const periodLabel = !dateFrom && !dateTo
    ? 'Semua tanggal'
    : dateFrom === dateTo
      ? formatDateKey(dateFrom)
      : `${dateFrom ? formatDateKey(dateFrom) : 'Awal'} s/d ${dateTo ? formatDateKey(dateTo) : 'Sekarang'}`;

  const exportFileSuffix = !dateFrom && !dateTo
    ? 'semua'
    : dateFrom === dateTo ? dateFrom : `${dateFrom || 'awal'}_sd_${dateTo || 'sekarang'}`;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-4 h-4" />, text: 'Pending' };
      case 'accepted': return { color: 'bg-blue-100 text-blue-800', icon: <AlertCircle className="w-4 h-4" />, text: 'Diterima' };
      case 'ongoing': return { color: 'bg-purple-100 text-purple-800', icon: <Car className="w-4 h-4" />, text: 'Sedang Berjalan' };
      case 'completed': return { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-4 h-4" />, text: 'Selesai' };
      case 'cancelled': return { color: 'bg-red-100 text-red-800', icon: <XCircle className="w-4 h-4" />, text: 'Dibatalkan' };
      default: return { color: 'bg-gray-100 text-gray-800', icon: <Clock className="w-4 h-4" />, text: status };
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'pending': return { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' };
      case 'paid': return { color: 'bg-green-100 text-green-800', text: 'Lunas' };
      case 'failed': return { color: 'bg-red-100 text-red-800', text: 'Gagal' };
      default: return { color: 'bg-gray-100 text-gray-800', text: status };
    }
  };


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
      minute: '2-digit',
      timeZone: WIB_TZ,
    }).format(date);
  };

  const filteredTotal = filteredOrders.reduce((sum, o) => sum + o.price, 0);
  const filteredPaidTotal = filteredOrders.filter(o => o.paymentStatus === 'paid').reduce((sum, o) => sum + o.price, 0);

  const exportToPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });

    doc.setFontSize(16);
    doc.text('Rekapitulasi Order GreenBecak', 14, 18);

    doc.setFontSize(10);
    doc.text(`Periode: ${periodLabel}`, 14, 26);
    doc.text(`Tanggal Cetak: ${formatDate(new Date())} WIB`, 14, 32);
    doc.text(
      `Jumlah Order: ${filteredOrders.length}   |   Total Nilai: ${formatCurrency(filteredTotal)}   |   Lunas: ${formatCurrency(filteredPaidTotal)}`,
      14, 38
    );

    const tableColumn = ['No', 'No Order', 'Waktu Order (WIB)', 'Customer', 'No HP', 'Driver', 'Kode Becak', 'Tarif/Jarak', 'Status', 'Pembayaran', 'Total (Rp)'];
    const tableRows = filteredOrders.map((order, i) => [
      i + 1,
      order.orderNumber,
      formatDate(order.orderDate),
      order.customerName,
      order.customerPhone,
      order.driverName,
      order.vehicleCode,
      order.tariffName && order.tariffName !== 'N/A' ? order.tariffName : order.distance,
      getStatusBadge(order.status).text,
      getPaymentBadge(order.paymentStatus).text,
      order.price.toLocaleString('id-ID'),
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      foot: [['', '', '', '', '', '', '', '', '', 'TOTAL', filteredTotal.toLocaleString('id-ID')]],
      startY: 44,
      theme: 'grid',
      styles: { fontSize: 7 },
      headStyles: { fillColor: [21, 128, 61] }, // bg-green-700
      footStyles: { fillColor: [240, 253, 244], textColor: [20, 83, 45], fontStyle: 'bold' },
      columnStyles: { 0: { halign: 'right' }, 10: { halign: 'right' } },
    });

    doc.save(`Rekap_Order_GreenBecak_${exportFileSuffix}.pdf`);
  };

  // CSV dengan pemisah ";" + BOM UTF-8 supaya langsung rapi saat dibuka di Excel (locale Indonesia)
  const exportToExcel = () => {
    const header = ['No', 'No Order', 'Tanggal (WIB)', 'Jam (WIB)', 'Customer', 'No HP', 'Driver', 'No HP Driver', 'Kode Becak', 'Tarif', 'Jarak (km)', 'Tujuan', 'Status', 'Pembayaran', 'Harga (Rp)', 'Waktu Diterima', 'Waktu Selesai'];
    const timeFormatter = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: WIB_TZ });
    // Bungkus nomor HP sebagai teks agar angka 0 di depan tidak hilang di Excel
    const asText = (v: string) => (v && v !== 'N/A' ? `="${v}"` : '');

    const rows = filteredOrders.map((order, i) => [
      i + 1,
      order.orderNumber,
      order.orderDateKey,
      timeFormatter.format(order.orderDate),
      order.customerName,
      asText(order.customerPhone),
      order.driverName,
      asText(order.driverPhone),
      order.vehicleCode,
      order.tariffName && order.tariffName !== 'N/A' ? order.tariffName : '',
      order.distance.replace(' km', '').replace('N/A', ''),
      order.destination !== 'N/A' ? order.destination : '',
      getStatusBadge(order.status).text,
      getPaymentBadge(order.paymentStatus).text,
      order.price,
      order.pickupTime ? formatDate(order.pickupTime) : '',
      order.completionTime ? formatDate(order.completionTime) : '',
    ]);

    const csv = [header, ...rows]
      .map(row => row.map(cell => (typeof cell === 'string' && cell.startsWith('="') ? cell : csvEscape(cell))).join(';'))
      .join('\r\n');

    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Rekap_Order_GreenBecak_${exportFileSuffix}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    ongoing: orders.filter(o => o.status === 'ongoing').length,
    completed: orders.filter(o => o.status === 'completed').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    totalRevenue: orders.filter(o => o.paymentStatus === 'paid').reduce((sum, o) => sum + o.price, 0)
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat data order...</p>
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
                onClick={fetchOrders}
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
        <p className="text-gray-600 mt-2">Kelola semua order GreenBecak</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <div className="flex items-center">
            <Car className="w-6 h-6 text-blue-600 mr-2" />
            <div>
              <p className="text-sm text-blue-600">Total Order</p>
              <p className="text-xl font-bold text-blue-700">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
          <div className="flex items-center">
            <Clock className="w-6 h-6 text-yellow-600 mr-2" />
            <div>
              <p className="text-sm text-yellow-600">Pending</p>
              <p className="text-xl font-bold text-yellow-700">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
          <div className="flex items-center">
            <Car className="w-6 h-6 text-purple-600 mr-2" />
            <div>
              <p className="text-sm text-purple-600">Ongoing</p>
              <p className="text-xl font-bold text-purple-700">{stats.ongoing}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
          <div className="flex items-center">
            <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
            <div>
              <p className="text-sm text-green-600">Completed</p>
              <p className="text-xl font-bold text-green-700">{stats.completed}</p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 p-4 rounded-lg border border-red-100">
          <div className="flex items-center">
            <XCircle className="w-6 h-6 text-red-600 mr-2" />
            <div>
              <p className="text-sm text-red-600">Cancelled</p>
              <p className="text-xl font-bold text-red-700">{stats.cancelled}</p>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
          <div className="flex items-center">
            <DollarSign className="w-6 h-6 text-amber-600 mr-2" />
            <div>
              <p className="text-sm text-amber-600">Revenue</p>
              <p className="text-xl font-bold text-amber-700">{formatCurrency(stats.totalRevenue)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center">
              <Car className="w-6 h-6 text-green-600 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">Daftar Order</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={exportToExcel}
                disabled={filteredOrders.length === 0}
                className="flex items-center px-4 py-2 bg-white text-green-700 border border-green-600 rounded-md hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={`Download ${filteredOrders.length} order (${periodLabel}) sebagai Excel`}
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Download Excel
              </button>
              <button
                onClick={exportToPDF}
                disabled={filteredOrders.length === 0}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={`Download ${filteredOrders.length} order (${periodLabel}) sebagai PDF`}
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Filter dan Search */}
          <div className="mb-6 space-y-4">
            {/* Filter tanggal */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-3">
              <div className="flex items-center text-sm font-medium text-gray-700">
                <CalendarDays className="w-4 h-4 mr-2 text-gray-500" />
                Periode:
              </div>
              <div className="flex flex-wrap gap-2">
                {([
                  ['today', 'Hari ini'],
                  ['7days', '7 hari terakhir'],
                  ['month', 'Bulan ini'],
                  ['all', 'Semua'],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => applyPreset(value)}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                      datePreset === value
                        ? 'bg-green-600 border-green-600 text-white'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateFrom}
                  max={dateTo || undefined}
                  onChange={(e) => { setDatePreset('custom'); setDateFrom(e.target.value); }}
                  aria-label="Dari tanggal"
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <span className="text-sm text-gray-500">s/d</span>
                <input
                  type="date"
                  value={dateTo}
                  min={dateFrom || undefined}
                  onChange={(e) => { setDatePreset('custom'); setDateTo(e.target.value); }}
                  aria-label="Sampai tanggal"
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div className="text-sm text-gray-500 lg:ml-auto">
                <span className="font-medium text-gray-900">{filteredOrders.length}</span> order · {formatCurrency(filteredTotal)}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
              <div className="md:col-span-2 lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Cari nomor order, nama customer, atau driver..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">Semua Status</option>
                  <option value="pending">Pending</option>
                  <option value="accepted">Diterima</option>
                  <option value="ongoing">Sedang Berjalan</option>
                  <option value="completed">Selesai</option>
                  <option value="cancelled">Dibatalkan</option>
                </select>
              </div>
              <div>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">Semua Payment</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Lunas</option>
                  <option value="failed">Gagal</option>
                </select>
              </div>
              <div>
                <select
                  value={vehicleFilter}
                  onChange={(e) => setVehicleFilter(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">Semua Kendaraan</option>
                  <option value="becak-listrik">Becak Listrik</option>
                  <option value="delman">Delman</option>
                </select>
              </div>
              <div>
                <select
                  value={tariffFilter}
                  onChange={(e) => setTariffFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">Semua Tarif</option>
                  {tariffs.map((t) => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setPaymentFilter('all');
                    setVehicleFilter('all');
                    setTariffFilter('all');
                    applyPreset('all');
                  }}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Reset Filter
                </button>
              </div>
            </div>
          </div>

          {/* Tabel Order */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Info
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer & Driver
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trip Details
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status & Payment
                  </th>

                  
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                        <div className="text-sm text-gray-500">{formatDate(order.orderDate)}</div>
                        {order.pickupTime && (
                          <div className="text-xs text-gray-400">
                            Pickup: {formatDate(order.pickupTime)}
                          </div>
                        )}
                        {order.completionTime && (
                          <div className="text-xs text-gray-400">
                            Selesai: {formatDate(order.completionTime)}
                          </div>
                        )}
                        
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-2">
                        <div>
                          <div className="flex items-center text-sm text-gray-900">
                            <User className="w-4 h-4 mr-1" />
                            {order.customerName}
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Phone className="w-4 h-4 mr-1" />
                            {order.customerPhone}
                          </div>

                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{order.driverName} - {order.vehicleCode}</div>
                
                          
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">{order.distance}</div>
                        <div className="text-sm text-gray-500">{order.destination}</div>
                        <div className="text-sm font-medium text-gray-900">{formatCurrency(order.price)}</div>
                        {order.tariffName && order.tariffName !== 'N/A' && (
                          <div className="text-xs text-blue-600 mt-1 font-medium">{order.tariffName}</div>
                        )}
                        {order.notes && (
                          <div className="text-xs text-gray-400 mt-1">{order.notes}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-2">
                        <div className="flex items-center">
                          {getStatusBadge(order.status).icon}
                          <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(order.status).color}`}>
                            {getStatusBadge(order.status).text}
                          </span>
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPaymentBadge(order.paymentStatus).color}`}>
                          {getPaymentBadge(order.paymentStatus).text}
                        </span>
                        {order.rating && (
                          <div className="flex items-center text-xs text-gray-600 mt-1">
                            <Star className="w-3 h-3 text-yellow-500 mr-1" />
                            {order.rating}/5
                          </div>
                        )}
                      </div>
                    </td>

                    
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {currentOrders.length === 0 && (
            <div className="text-center py-8">
              <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {filteredOrders.length === 0 ? 'Tidak ada order yang ditemukan' : 'Tidak ada data untuk halaman ini'}
              </p>
            </div>
          )}

          {/* Pagination */}
          {filteredOrders.length > 0 && (
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
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between sm:gap-4">
                <div className="flex items-center gap-4">
                  <p className="text-sm text-gray-700 whitespace-nowrap">
                    Menampilkan{' '}
                    <span className="font-medium">{startIndex + 1}</span>
                    {' '}–{' '}
                    <span className="font-medium">{Math.min(endIndex, filteredOrders.length)}</span>
                    {' '}dari{' '}
                    <span className="font-medium">{filteredOrders.length}</span>
                    {' '}order
                  </p>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    aria-label="Jumlah baris per halaman"
                    className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {[10, 25, 50, 100].map(n => (
                      <option key={n} value={n}>{n} / halaman</option>
                    ))}
                  </select>
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
                    {getPageNumbers(currentPage, totalPages).map((page, idx) => page === 'ellipsis' ? (
                      <span
                        key={`ellipsis-${idx}`}
                        className="relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm text-gray-400"
                      >
                        …
                      </span>
                    ) : (
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
      </div>
    </div>
  );
};

export default OrderManagement;
