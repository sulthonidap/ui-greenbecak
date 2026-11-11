import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Loader2, Phone, MessageCircle, CheckCircle2, Circle, XCircle, MapPin, Flag, RefreshCw, AlertCircle } from 'lucide-react';
import PickupMap from '../components/pickup/PickupMap';
import { ACTIVE_PICKUP_KEY } from '../components/pickup/PickupOrderForm';
import { pickupAPI, apiErrorMessage, PickupTracking } from '../services/api';
import { formatRupiah } from '../services/geo';

const themeColor = '#047857';
const POLL_MS = 8000;

const clearActiveIfMatches = (token: string) => {
  try {
    if (localStorage.getItem(ACTIVE_PICKUP_KEY) === token) localStorage.removeItem(ACTIVE_PICKUP_KEY);
  } catch {
    /* abaikan */
  }
};

const toWhatsApp = (phone: string) => {
  const d = phone.replace(/\D/g, '');
  return d.startsWith('0') ? `62${d.slice(1)}` : d;
};

const steps: { key: PickupTracking['status'] | 'otw'; label: string }[] = [
  { key: 'pending', label: 'Mencari pengayuh' },
  { key: 'accepted', label: 'Pengayuh menuju lokasi jemput' },
  { key: 'completed', label: 'Perjalanan selesai' },
];

const TrackOrderPage: React.FC = () => {
  const { token = '' } = useParams();
  const [order, setOrder] = useState<PickupTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const load = useCallback(async () => {
    try {
      const o = await pickupAPI.track(token);
      setOrder(o);
      setError('');
      if (o.status === 'completed' || o.status === 'cancelled') clearActiveIfMatches(token);
    } catch (e) {
      const status = (e as { response?: { status?: number } }).response?.status;
      if (status === 404) clearActiveIfMatches(token);
      setError(status === 404 ? 'Pesanan tidak ditemukan.' : apiErrorMessage(e, 'Gagal memuat status pesanan.'));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  // Perbarui status berkala selama pesanan masih berjalan
  const active = order?.status === 'pending' || order?.status === 'accepted';
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [active, load]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await pickupAPI.cancel(token);
      await load();
    } catch (e) {
      setError(apiErrorMessage(e, 'Gagal membatalkan pesanan.'));
      await load();
    } finally {
      setCancelling(false);
      setConfirmCancel(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 flex justify-center text-gray-500">
        <Loader2 className="animate-spin mr-2" /> Memuat pesanan…
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-700 mb-4">{error || 'Pesanan tidak ditemukan.'}</p>
        <Link to="/pesan?mode=jemput" className="text-emerald-700 font-medium">Buat pesanan baru</Link>
      </div>
    );
  }

  const pickup = order.pickup_lat != null && order.pickup_lng != null ? { lat: order.pickup_lat, lng: order.pickup_lng } : null;
  const drop = order.drop_lat != null && order.drop_lng != null ? { lat: order.drop_lat, lng: order.drop_lng } : null;
  const driverPos = order.driver?.lat != null && order.driver?.lng != null ? { lat: order.driver.lat, lng: order.driver.lng } : null;
  const stepIndex = order.status === 'pending' ? 0 : order.status === 'accepted' ? 1 : order.status === 'completed' ? 2 : -1;

  const headline =
    order.status === 'pending'
      ? 'Mencari pengayuh terdekat…'
      : order.status === 'accepted'
        ? 'Pengayuh sedang menuju Anda'
        : order.status === 'completed'
          ? 'Perjalanan selesai. Terima kasih!'
          : 'Pesanan dibatalkan';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-5 sm:p-6 text-white" style={{ backgroundColor: order.status === 'cancelled' ? '#6b7280' : themeColor }}>
          <p className="text-xs opacity-80">{order.order_number}</p>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            {order.status === 'pending' && <Loader2 size={20} className="animate-spin" />}
            {headline}
          </h1>
        </div>

        <div className="p-4 sm:p-6 space-y-5">
          {error && (
            <div className="p-3 bg-amber-50 text-amber-800 text-sm rounded-md flex gap-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0" /> {error}
            </div>
          )}

          {order.status !== 'cancelled' && (
            <ol className="space-y-2" aria-label="Status pesanan">
              {steps.map((s, i) => {
                const done = i < stepIndex || order.status === 'completed';
                const current = i === stepIndex && order.status !== 'completed';
                return (
                  <li key={s.key} className={`flex items-center gap-2 text-sm ${done || current ? 'text-gray-900' : 'text-gray-400'}`}>
                    {done ? (
                      <CheckCircle2 size={18} className="text-emerald-600" />
                    ) : current ? (
                      <Loader2 size={18} className="text-emerald-600 animate-spin" />
                    ) : (
                      <Circle size={18} />
                    )}
                    <span className={current ? 'font-medium' : ''}>{s.label}</span>
                  </li>
                );
              })}
            </ol>
          )}

          {order.driver && order.status !== 'cancelled' && (
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Pengayuh</p>
              <p className="font-semibold text-gray-900">
                {order.driver.name} <span className="font-normal text-gray-500">· {order.driver.driver_code}</span>
              </p>
              {order.status === 'accepted' && order.driver.phone && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <a
                    href={`https://wa.me/${toWhatsApp(order.driver.phone)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium text-white"
                    style={{ backgroundColor: themeColor }}
                  >
                    <MessageCircle size={16} /> WhatsApp
                  </a>
                  <a
                    href={`tel:${order.driver.phone}`}
                    className="flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium border border-gray-300 text-gray-700"
                  >
                    <Phone size={16} /> Telepon
                  </a>
                </div>
              )}
            </div>
          )}

          {(pickup || drop) && (
            <PickupMap
              center={pickup || drop!}
              pickup={pickup}
              drop={drop}
              driver={order.status === 'accepted' ? driverPos : null}
              className="h-64 sm:h-72"
            />
          )}

          <div className="space-y-3 text-sm">
            <div className="flex gap-3">
              <MapPin size={16} className="text-emerald-700 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Jemput</p>
                <p className="text-gray-900">{order.pickup_location}</p>
                {order.pickup_note && <p className="text-gray-500">Patokan: {order.pickup_note}</p>}
              </div>
            </div>
            <div className="flex gap-3">
              <Flag size={16} className="text-red-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Tujuan</p>
                <p className="text-gray-900">{order.drop_location}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
            <div className="text-sm text-gray-600">
              <p>{order.distance_km.toLocaleString('id-ID')} km · ± {order.duration_min} menit</p>
              <p className="text-xs text-gray-500">Bayar tunai / QRIS ke pengayuh</p>
            </div>
            <p className="text-xl font-bold" style={{ color: themeColor }}>{formatRupiah(order.price)}</p>
          </div>

          {order.status === 'pending' && (
            <div className="space-y-2">
              {!confirmCancel ? (
                <button
                  type="button"
                  onClick={() => setConfirmCancel(true)}
                  className="w-full py-2.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                >
                  Batalkan pesanan
                </button>
              ) : (
                <div className="rounded-lg border border-red-200 p-3">
                  <p className="text-sm text-gray-700 mb-3">Yakin batalkan pesanan ini?</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmCancel(false)}
                      disabled={cancelling}
                      className="py-2 text-sm rounded-lg border border-gray-300 text-gray-700"
                    >
                      Tidak
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="py-2 text-sm rounded-lg bg-red-600 text-white flex items-center justify-center gap-1.5 disabled:opacity-60"
                    >
                      {cancelling ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />} Ya, batalkan
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {active ? (
            <button type="button" onClick={load} className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-500">
              <RefreshCw size={12} /> Status diperbarui otomatis
            </button>
          ) : (
            <Link
              to="/pesan?mode=jemput"
              className="block w-full text-center py-3 rounded-lg text-sm font-medium text-white"
              style={{ backgroundColor: themeColor }}
            >
              Pesan lagi
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackOrderPage;
