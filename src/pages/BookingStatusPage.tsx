import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import {
  Loader2, Search, Bike, Navigation, CheckCircle2, XCircle, Phone, MessageCircle, MapPin, Flag, AlertCircle, Copy,
} from 'lucide-react';
import {
  DEFAULT_CENTER, TILE_URL, TILE_ATTRIBUTION, pickupIcon, dropIcon, driverIcon, FitBounds,
} from '../components/booking/MapParts';
import {
  bookingAPI, apiErrorMessage, formatRupiah, lastBookingStore, toWaNumber, VEHICLE_LABELS, BookingView,
} from '../services/bookingService';

const themeColor = '#047857';
const POLL_MS = 5000;

const STEPS: { key: BookingView['status']; label: string }[] = [
  { key: 'pending', label: 'Mencari becak' },
  { key: 'accepted', label: 'Driver menuju' },
  { key: 'picked_up', label: 'Dalam perjalanan' },
  { key: 'completed', label: 'Selesai' },
];

const useCountdown = (until: string | null) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!until) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [until]);
  if (!until) return null;
  const ms = new Date(until).getTime() - now;
  if (ms <= 0) return '0:00';
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const formatTime = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }).format(new Date(iso)) : '';

const BookingStatusPage: React.FC = () => {
  const { token = '' } = useParams();
  const [booking, setBooking] = useState<BookingView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [copied, setCopied] = useState(false);

  const isActive = booking ? ['pending', 'accepted', 'picked_up'].includes(booking.status) : true;

  const load = useCallback(async () => {
    try {
      const b = await bookingAPI.getStatus(token);
      setBooking(b);
      setError(null);
      if (b.status === 'completed' || b.status === 'cancelled') {
        if (lastBookingStore.get() === token) lastBookingStore.clear();
      }
    } catch (err: any) {
      if (err?.response?.status === 404) setNotFound(true);
      else setError(apiErrorMessage(err, 'Gagal memuat status'));
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  // Polling selama booking masih berjalan; jeda saat tab tidak terlihat
  useEffect(() => {
    if (!isActive || notFound) return;
    const tick = () => {
      if (document.visibilityState === 'visible') load();
    };
    const t = setInterval(tick, POLL_MS);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [isActive, notFound, load]);

  const countdown = useCountdown(booking?.status === 'pending' ? booking.expires_at : null);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const b = await bookingAPI.cancel(token);
      setBooking(b);
      lastBookingStore.clear();
      setConfirmCancel(false);
    } catch (err) {
      setError(apiErrorMessage(err, 'Gagal membatalkan booking'));
      setConfirmCancel(false);
      load();
    } finally {
      setCancelling(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* abaikan */
    }
  };

  const mapPoints = useMemo(() => {
    const pts: [number, number][] = [];
    if (!booking) return pts;
    if (booking.pickup.lat != null && booking.pickup.lng != null) pts.push([booking.pickup.lat, booking.pickup.lng]);
    if (booking.drop.lat != null && booking.drop.lng != null) pts.push([booking.drop.lat, booking.drop.lng]);
    if (booking.driver?.location) pts.push([booking.driver.location.lat, booking.driver.location.lng]);
    return pts;
  }, [booking]);

  if (notFound) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-10 h-10 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-700 mb-4">Booking tidak ditemukan. Pastikan link yang kamu buka sudah benar.</p>
        <Link to="/booking" className="inline-block px-4 py-2 rounded-lg text-white" style={{ backgroundColor: themeColor }}>
          Buat booking baru
        </Link>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: themeColor }} />
        {error && <p className="text-sm text-red-700">{error}</p>}
      </div>
    );
  }

  const stepIndex = STEPS.findIndex(s => s.key === booking.status);
  const driver = booking.driver;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-6 md:py-10">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-xs text-gray-500">{booking.order_number}</p>
            <h1 className="text-2xl font-bold text-gray-900">{booking.status_label}</h1>
          </div>
          <button
            onClick={copyLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border border-gray-300 bg-white hover:bg-gray-50"
          >
            <Copy className="w-3.5 h-3.5" /> {copied ? 'Tersalin' : 'Salin link'}
          </button>
        </div>

        {/* Progres */}
        {booking.status !== 'cancelled' && (
          <ol className="grid grid-cols-4 gap-1 mb-5" aria-label="Progres booking">
            {STEPS.map((s, i) => (
              <li key={s.key} className="flex flex-col gap-1.5">
                <span className={`h-1.5 rounded-full ${i <= stepIndex ? 'bg-green-600' : 'bg-gray-200'}`} />
                <span className={`text-[11px] sm:text-xs ${i <= stepIndex ? 'text-green-800 font-medium' : 'text-gray-400'}`}>{s.label}</span>
              </li>
            ))}
          </ol>
        )}

        {error && (
          <div className="mb-4 flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
          </div>
        )}

        <div className="grid md:grid-cols-5 gap-5">
          <div className="md:col-span-3">
            <div className="relative isolate h-64 md:h-[460px] rounded-xl overflow-hidden shadow border border-gray-200 bg-gray-100">
              <MapContainer center={mapPoints[0] || DEFAULT_CENTER} zoom={15} zoomSnap={0.5} className="h-full w-full" scrollWheelZoom>
                <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
                {booking.pickup.lat != null && booking.pickup.lng != null && (
                  <Marker position={[booking.pickup.lat, booking.pickup.lng]} icon={pickupIcon} />
                )}
                {booking.drop.lat != null && booking.drop.lng != null && (
                  <Marker position={[booking.drop.lat, booking.drop.lng]} icon={dropIcon} />
                )}
                {driver?.location && <Marker position={[driver.location.lat, driver.location.lng]} icon={driverIcon} />}
                <FitBounds points={mapPoints} />
              </MapContainer>
            </div>
          </div>

          <div className="md:col-span-2 space-y-4">
            {/* Kartu status */}
            {booking.status === 'pending' && (
              <div className="bg-white rounded-xl shadow border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-green-50">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-200 opacity-60" />
                    <Search className="relative w-5 h-5 text-green-700" />
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900">Mencari becak terdekat…</p>
                    {countdown && <p className="text-sm text-gray-500">Batas menunggu {countdown}</p>}
                  </div>
                </div>
                <p className="mt-3 text-xs text-gray-500">Halaman ini diperbarui otomatis. Biarkan tetap terbuka.</p>
              </div>
            )}

            {driver && booking.status !== 'cancelled' && (
              <div className="bg-white rounded-xl shadow border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-xl">🛺</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{driver.name}</p>
                    <p className="text-sm text-gray-500">
                      {driver.vehicle_number || '-'} · {VEHICLE_LABELS[driver.vehicle_type] || driver.vehicle_type}
                    </p>
                  </div>
                </div>
                {booking.status === 'accepted' && (
                  <p className="mt-3 flex items-center gap-1.5 text-sm text-green-800">
                    <Navigation className="w-4 h-4" />
                    {driver.eta_min != null
                      ? `Tiba ±${driver.eta_min} menit (${driver.distance_to_pickup_km?.toLocaleString('id-ID')} km)`
                      : 'Driver sedang menuju lokasi jemput'}
                  </p>
                )}
                {booking.status === 'picked_up' && (
                  <p className="mt-3 flex items-center gap-1.5 text-sm text-green-800">
                    <Bike className="w-4 h-4" /> Dalam perjalanan ke tujuan
                  </p>
                )}
                {booking.status !== 'completed' && driver.phone && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <a
                      href={`tel:${driver.phone}`}
                      className="inline-flex items-center justify-center gap-1.5 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <Phone className="w-4 h-4" /> Telepon
                    </a>
                    <a
                      href={`https://wa.me/${toWaNumber(driver.phone)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium text-white"
                      style={{ backgroundColor: '#16A34A' }}
                    >
                      <MessageCircle className="w-4 h-4" /> WhatsApp
                    </a>
                  </div>
                )}
              </div>
            )}

            {booking.status === 'completed' && (
              <div className="bg-green-50 rounded-xl border border-green-200 p-4">
                <p className="flex items-center gap-2 font-semibold text-green-900">
                  <CheckCircle2 className="w-5 h-5" /> Perjalanan selesai {formatTime(booking.completed_at)}
                </p>
                <p className="mt-1 text-sm text-green-900">
                  Silakan bayar <span className="font-bold">{formatRupiah(booking.price)}</span> ke driver (tunai / QRIS). Terima kasih!
                </p>
              </div>
            )}

            {booking.status === 'cancelled' && (
              <div className="bg-red-50 rounded-xl border border-red-200 p-4">
                <p className="flex items-center gap-2 font-semibold text-red-900">
                  <XCircle className="w-5 h-5" /> Booking dibatalkan
                </p>
                {booking.cancel_reason && <p className="mt-1 text-sm text-red-800">{booking.cancel_reason}</p>}
              </div>
            )}

            {/* Rincian */}
            <div className="bg-white rounded-xl shadow border border-gray-200 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-green-700 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-500">Jemput</p>
                  <p className="text-sm font-medium text-gray-900">{booking.pickup.name}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Flag className="w-5 h-5 text-red-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-500">Tujuan</p>
                  <p className="text-sm font-medium text-gray-900">{booking.drop.name}</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-sm text-gray-600">{booking.distance_km.toLocaleString('id-ID')} km</span>
                <span className="text-lg font-bold text-gray-900">{formatRupiah(booking.price)}</span>
              </div>
            </div>

            {booking.can_cancel &&
              (confirmCancel ? (
                <div className="bg-white rounded-xl border border-red-200 p-4">
                  <p className="text-sm text-gray-800 mb-3">Yakin ingin membatalkan booking ini?</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setConfirmCancel(false)}
                      disabled={cancelling}
                      className="py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Tidak
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="py-2 rounded-lg bg-red-600 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      {cancelling ? 'Membatalkan…' : 'Ya, batalkan'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmCancel(true)}
                  className="w-full py-2.5 rounded-lg border border-red-300 text-sm font-medium text-red-700 bg-white hover:bg-red-50"
                >
                  Batalkan booking
                </button>
              ))}

            {!isActive && (
              <Link
                to="/booking"
                className="block w-full py-3 rounded-xl text-center text-white font-semibold"
                style={{ backgroundColor: themeColor }}
              >
                Pesan lagi
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingStatusPage;
