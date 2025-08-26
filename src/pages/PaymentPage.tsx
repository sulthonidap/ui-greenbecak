import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Receipt, ArrowLeft, Download, Share2 } from 'lucide-react';
import { useOrder } from '../context/OrderContext';

const PaymentPage: React.FC = () => {
  const { currentOrder, submitOrder, clearCurrentOrder } = useOrder();
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'success'>('pending');
  const navigate = useNavigate();
  const location = useLocation();
  const receiptRef = useRef<HTMLDivElement>(null);
  
  // Get order ID from navigation state
  const orderId = location.state?.orderId;
  const orderNumber = location.state?.orderNumber;

  if (!currentOrder) {
    navigate('/pesan');
    return null;
  }

  const handlePayment = () => {
    setPaymentStatus('processing');
    
    setTimeout(() => {
      setPaymentStatus('success');
      // Order already created, just show success
    }, 2000);
  };

  const handleBackToHome = () => {
    clearCurrentOrder();
    navigate('/');
  };

  const handleDownloadReceipt = async () => {
    if (!receiptRef.current) return;
    
    try {
      // In a real app, you would use a library like html2canvas
      // For now, we'll just show an alert
      alert('Fitur download bukti pembayaran akan segera tersedia!');
    } catch (error) {
      console.error('Failed to download receipt:', error);
    }
  };

  const handleShareReceipt = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Bukti Pembayaran GreenBecak',
        text: `Pembayaran berhasil untuk pesanan ${orderNumber}`,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`Bukti Pembayaran GreenBecak - Order: ${orderNumber}`);
      alert('Link bukti pembayaran telah disalin ke clipboard!');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-green-800 p-6 text-white">
          <h1 className="text-2xl font-bold">Pembayaran</h1>
          <p className="text-green-50">Selesaikan pembayaran untuk pesanan Anda</p>
        </div>
        
        <div className="p-6">
          {paymentStatus !== 'success' && (
            <>
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4">Rincian Pesanan</h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                  {orderNumber && (
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-600">Nomor Pesanan</span>
                      <span className="font-medium text-green-600">{orderNumber}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Status Pesanan</span>
                    <span className="font-medium text-orange-600 bg-orange-100 px-2 py-1 rounded-full text-xs">
                      Menunggu Pembayaran
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Kode Kendaraan</span>
                    <span className="font-medium">{currentOrder.pedicabCode}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Nomor WhatsApp</span>
                    <span className="font-medium">{currentOrder.whatsappNumber}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Jenis Transportasi</span>
                    <span className="font-medium">{currentOrder.pedicabCode.startsWith('DL') ? 'Delman' : 'Becak Listrik'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Paket Perjalanan</span>
                    <span className="font-medium">{currentOrder.distanceOption.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Jarak Tempuh</span>
                    <span className="font-medium">{currentOrder.distanceOption.distance}</span>
                  </div>
                  {currentOrder.distanceOption.destination && (
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-600">Destinasi</span>
                      <span className="font-medium">{currentOrder.distanceOption.destination}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Lokasi Penjemputan</span>
                    <span className="font-medium">Malioboro Mall</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Tanggal Pesanan</span>
                    <span className="font-medium">{currentOrder.timestamp.toLocaleDateString('id-ID', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Waktu Pesanan</span>
                    <span className="font-medium">{currentOrder.timestamp.toLocaleTimeString('id-ID', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Estimasi Waktu</span>
                    <span className="font-medium">15-30 menit</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Metode Pembayaran</span>
                    <span className="font-medium">QRIS (E-Wallet)</span>
                  </div>
                  <div className="flex justify-between py-2 mt-2">
                    <span className="text-gray-800 font-semibold">Total Pembayaran</span>
                    <span className="text-green-600 font-bold text-xl">
                      Rp {currentOrder.distanceOption.price.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4">Informasi Pembayaran</h2>
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center mb-4">
                    <input
                      id="qris"
                      type="radio"
                      name="payment-method"
                      checked
                      readOnly
                      className="w-4 h-4 text-green-800 focus:ring-green-400"
                    />
                    <label htmlFor="qris" className="ml-2 block text-sm font-medium text-gray-700">
                      QRIS (OVO, GoPay, Dana, LinkAja, dll)
                    </label>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <h3 className="font-semibold text-blue-800 mb-2">Instruksi Pembayaran:</h3>
                    <ol className="text-sm text-blue-700 space-y-1">
                      <li>1. Buka aplikasi e-wallet pilihan Anda (OVO, GoPay, Dana, LinkAja, dll)</li>
                      <li>2. Pilih menu "Scan QR" atau "Pindai QR"</li>
                      <li>3. Arahkan kamera ke QR code di bawah ini</li>
                      <li>4. Masukkan jumlah pembayaran: <strong>Rp {currentOrder.distanceOption.price.toLocaleString('id-ID')}</strong></li>
                      <li>5. Periksa detail pembayaran dengan teliti</li>
                      <li>6. Konfirmasi pembayaran</li>
                      <li>7. Simpan bukti pembayaran untuk referensi</li>
                    </ol>
                    
                    <div className="mt-3 p-3 bg-white rounded border border-blue-300">
                      <p className="text-xs text-blue-600 font-medium">💡 Tips: Pastikan saldo e-wallet Anda mencukupi sebelum melakukan pembayaran</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-center p-4 bg-gray-50 rounded-lg mb-4">
                    <div className="w-48 h-48 bg-white p-4 flex items-center justify-center border border-gray-300 rounded">
                      <img 
                        src="/image/mockup-qr.png" 
                        alt="QR Code Pembayaran" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">Penting!</h3>
                        <div className="mt-1 text-sm text-yellow-700">
                          <p>• Pastikan jumlah pembayaran sesuai dengan total pesanan</p>
                          <p>• Simpan bukti pembayaran untuk konfirmasi</p>
                          <p>• Pembayaran akan diverifikasi dalam 1-2 menit</p>
                          <p>• Jangan tutup halaman ini sampai pembayaran selesai</p>
                          <p>• Jika ada masalah, hubungi customer service</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
          
          {paymentStatus === 'pending' && (
            <div className="flex gap-4">
              <button
                onClick={() => navigate('/pesan')}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg px-4 py-3 text-center transition duration-300"
              >
                Kembali
              </button>
              <button
                onClick={handlePayment}
                className="flex-1 bg-green-800 hover:bg-green-600 text-white font-medium rounded-lg px-4 py-3 text-center transition duration-300"
              >
                Bayar Sekarang
              </button>
            </div>
          )}
          
          {paymentStatus === 'processing' && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Memproses pembayaran...</p>
            </div>
          )}
          
          {paymentStatus === 'success' && (
            <div className="py-8">
              {/* Success Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Pembayaran Berhasil!</h3>
                <p className="text-gray-600">
                  Pesanan Anda telah berhasil dibuat dan pembayaran telah diterima.
                </p>
              </div>

              {/* Bukti Transfer Section */}
              <div ref={receiptRef} className="bg-white border-2 border-green-200 rounded-lg p-6 mb-6">
                <div className="text-center mb-4">
                  <h4 className="text-lg font-semibold text-green-800 mb-2">Bukti Pembayaran</h4>
                  <div className="w-12 h-1 bg-green-600 mx-auto"></div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Order Details */}
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nomor Pesanan:</span>
                      <span className="font-semibold text-green-800">{orderNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full text-xs">
                        Pembayaran Berhasil
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tanggal Pembayaran:</span>
                      <span className="font-medium">{new Date().toLocaleDateString('id-ID', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Waktu Pembayaran:</span>
                      <span className="font-medium">{new Date().toLocaleTimeString('id-ID', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Metode Pembayaran:</span>
                      <span className="font-medium">QRIS</span>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Kode Kendaraan:</span>
                      <span className="font-medium">{currentOrder.pedicabCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Paket Perjalanan:</span>
                      <span className="font-medium">{currentOrder.distanceOption.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Jarak Tempuh:</span>
                      <span className="font-medium">{currentOrder.distanceOption.distance}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Lokasi Penjemputan:</span>
                      <span className="font-medium">Malioboro Mall</span>
                    </div>
                    <div className="flex justify-between border-t pt-3">
                      <span className="text-gray-800 font-semibold">Total Pembayaran:</span>
                      <span className="text-green-600 font-bold text-lg">
                        Rp {currentOrder.distanceOption.price.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Transaction ID */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Transaction ID:</span>
                    <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                      TXN-{Date.now().toString().slice(-8)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={handleDownloadReceipt}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-300"
                    >
                      <Download size={16} />
                      Download Bukti
                    </button>
                    <button
                      onClick={handleShareReceipt}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-300"
                    >
                      <Share2 size={16} />
                      Bagikan
                    </button>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-blue-800 mb-2">Langkah Selanjutnya:</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>• Driver akan menghubungi Anda dalam 5-10 menit</p>
                  <p>• Pastikan nomor WhatsApp aktif untuk komunikasi</p>
                  <p>• Siapkan diri di lokasi penjemputan (Malioboro Mall)</p>
                  <p>• Simpan bukti pembayaran ini untuk referensi</p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-800 mb-2">Informasi Kontak:</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>• Customer Service: 0812-3456-7890</p>
                  <p>• Email: support@greenbecak.com</p>
                  <p>• Jam Operasional: 06:00 - 22:00 WIB</p>
                </div>
              </div>

              {/* Security & Guarantee */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-green-800 mb-2">Jaminan Keamanan:</h4>
                <div className="text-sm text-green-700 space-y-1">
                  <p>• Pembayaran aman dengan enkripsi SSL</p>
                  <p>• Data pribadi terlindungi</p>
                  <p>• Garansi uang kembali jika ada masalah</p>
                  <p>• Driver terverifikasi dan terpercaya</p>
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={handleBackToHome}
                  className="bg-green-800 hover:bg-green-600 text-white font-medium rounded-lg px-6 py-3 text-center transition duration-300"
                >
                  Kembali ke Beranda
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;