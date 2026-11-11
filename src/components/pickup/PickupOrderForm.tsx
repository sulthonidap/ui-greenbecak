import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LocateFixed, Loader2, MapPin, Flag, AlertCircle, Clock, Route as RouteIcon, User, Phone, StickyNote } from 'lucide-react';
import PickupMap from './PickupMap';
import PlaceSearch from './PlaceSearch';
import { pickupAPI, apiErrorMessage, PricingSettings, PickupQuote, LatLngPoint } from '../../services/api';
import { reverseGeocode, formatCoords, getCurrentPosition, formatRupiah, haversineKm } from '../../services/geo';

type PointKind = 'pickup' | 'drop';

interface PointState {
  point: LatLngPoint;
  address: string;
  resolving: boolean;
}

export const ACTIVE_PICKUP_KEY = 'gb_active_pickup';
const CUSTOMER_KEY = 'gb_customer';

const storage = {
  get: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* abaikan: mode privat / storage diblokir */
    }
  },
};

const themeColor = '#047857';

const PickupOrderForm: React.FC<{ pricing: PricingSettings }> = ({ pricing }) => {
  const navigate = useNavigate();
  const area = { center: { lat: pricing.service_center_lat, lng: pricing.service_center_lng }, radiusKm: pricing.service_radius_km };

  const [pickup, setPickup] = useState<PointState | null>(null);
  const [drop, setDrop] = useState<PointState | null>(null);
  const [target, setTarget] = useState<PointKind>('pickup');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);

  const [quote, setQuote] = useState<PickupQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState('');
  const [previewRoute, setPreviewRoute] = useState<[number, number][] | undefined>();

  const saved = (() => {
    try {
      return JSON.parse(storage.get(CUSTOMER_KEY) || '{}') as { name?: string; phone?: string };
    } catch {
      return {};
    }
  })();
  const [name, setName] = useState(saved.name || '');
  const [phone, setPhone] = useState(saved.phone || '');
  const [pickupNote, setPickupNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const geocodeAbort = useRef<Record<PointKind, AbortController | null>>({ pickup: null, drop: null });

  /** Pasang titik; kalau alamat belum ada, baca alamat dari koordinat */
  const setPoint = useCallback((kind: PointKind, point: LatLngPoint, address?: string) => {
    const setter = kind === 'pickup' ? setPickup : setDrop;
    geocodeAbort.current[kind]?.abort();
    if (address) {
      setter({ point, address, resolving: false });
      return;
    }
    setter({ point, address: formatCoords(point), resolving: true });
    const controller = new AbortController();
    geocodeAbort.current[kind] = controller;
    reverseGeocode(point, controller.signal)
      .then((addr) => setter((prev) => (prev && prev.point === point ? { ...prev, address: addr, resolving: false } : prev)))
      .catch(() => setter((prev) => (prev && prev.point === point ? { ...prev, resolving: false } : prev)));
  }, []);

  const detectLocation = useCallback(async () => {
    setGpsLoading(true);
    setGpsError('');
    try {
      const pos = await getCurrentPosition();
      setGpsAccuracy(Math.round(pos.accuracy));
      setPoint('pickup', { lat: pos.lat, lng: pos.lng });
      setTarget('drop');
    } catch (e) {
      setGpsError((e as Error).message);
    } finally {
      setGpsLoading(false);
    }
  }, [setPoint]);

  // Deteksi lokasi otomatis saat mode jemput dibuka
  useEffect(() => {
    detectLocation();
  }, [detectLocation]);

  // Hitung harga setiap titik berubah
  useEffect(() => {
    setQuote(null);
    setQuoteError('');
    setPreviewRoute(undefined);
    if (!pickup || !drop) return;
    if (haversineKm(pickup.point, drop.point) < 0.05) {
      setQuoteError('Titik jemput dan tujuan terlalu dekat.');
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setQuoteLoading(true);
      try {
        const q = await pickupAPI.quote(pickup.point, drop.point);
        if (!cancelled) setQuote(q);
      } catch (e) {
        if (cancelled) return;
        setQuoteError(apiErrorMessage(e, 'Gagal menghitung harga, coba lagi.'));
        const route = (e as { response?: { data?: { route?: { geometry?: [number, number][] } } } }).response?.data?.route;
        if (route?.geometry) setPreviewRoute(route.geometry);
      } finally {
        if (!cancelled) setQuoteLoading(false);
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [pickup?.point, drop?.point]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMapClick = (p: LatLngPoint) => {
    setPoint(target, p);
    if (target === 'pickup' && !drop) setTarget('drop');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!pickup) return setError('Tentukan lokasi jemput dulu.');
    if (!drop) return setError('Tentukan tujuan dulu.');
    if (!quote) return setError(quoteError || 'Tunggu harga selesai dihitung.');
    if (!name.trim()) return setError('Nama pemesan wajib diisi.');
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 9) return setError('Nomor WhatsApp tidak valid.');

    setSubmitting(true);
    try {
      const res = await pickupAPI.createOrder({
        pickup_lat: pickup.point.lat,
        pickup_lng: pickup.point.lng,
        drop_lat: drop.point.lat,
        drop_lng: drop.point.lng,
        pickup_address: pickup.address,
        drop_address: drop.address,
        pickup_note: pickupNote.trim(),
        customer_name: name.trim(),
        customer_phone: phone.trim(),
      });
      storage.set(CUSTOMER_KEY, JSON.stringify({ name: name.trim(), phone: phone.trim() }));
      storage.set(ACTIVE_PICKUP_KEY, res.tracking_token);
      navigate(`/pesanan/${res.tracking_token}`);
    } catch (err) {
      setError(apiErrorMessage(err, 'Gagal membuat pesanan. Silakan coba lagi.'));
    } finally {
      setSubmitting(false);
    }
  };

  const pointRow = (kind: PointKind) => {
    const state = kind === 'pickup' ? pickup : drop;
    const active = target === kind;
    const Icon = kind === 'pickup' ? MapPin : Flag;
    const color = kind === 'pickup' ? 'text-emerald-700 bg-emerald-50' : 'text-red-600 bg-red-50';
    return (
      <div className={`rounded-lg border p-3 transition-colors ${active ? 'border-emerald-600 ring-2 ring-emerald-600/20' : 'border-gray-200'}`}>
        <button type="button" onClick={() => setTarget(kind)} className="w-full flex items-start gap-3 text-left">
          <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${color}`}>
            {kind === 'pickup' ? 'A' : 'B'}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-medium text-gray-500">{kind === 'pickup' ? 'Lokasi jemput' : 'Tujuan'}</span>
            <span className={`block text-sm ${state ? 'text-gray-900' : 'text-gray-400'}`}>
              {state ? state.address : kind === 'pickup' ? 'Belum ditentukan' : 'Mau ke mana?'}
              {state?.resolving && <Loader2 size={12} className="inline ml-1 animate-spin text-gray-400" />}
            </span>
          </span>
          <Icon size={16} className="mt-1 text-gray-400 shrink-0" />
        </button>

        {active && (
          <div className="mt-3 space-y-2">
            <PlaceSearch
              placeholder={kind === 'pickup' ? 'Cari hotel / alamat jemput' : 'Cari tempat tujuan'}
              area={area}
              disabled={submitting}
              onSelect={(place) => {
                setPoint(kind, place, place.name === place.address.split(',')[0] ? place.address : `${place.name} — ${place.address}`);
                if (kind === 'pickup') setTarget('drop');
              }}
            />
            {kind === 'pickup' && (
              <button
                type="button"
                onClick={detectLocation}
                disabled={gpsLoading || submitting}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-800 disabled:opacity-60"
              >
                {gpsLoading ? <Loader2 size={15} className="animate-spin" /> : <LocateFixed size={15} />}
                {gpsLoading ? 'Mendeteksi lokasi…' : 'Pakai lokasi saya sekarang'}
              </button>
            )}
            {kind === 'pickup' && gpsError && <p className="text-xs text-amber-700">{gpsError}</p>}
            {kind === 'pickup' && !gpsError && gpsAccuracy !== null && gpsAccuracy > 100 && pickup && (
              <p className="text-xs text-amber-700">Lokasi kurang akurat (±{gpsAccuracy} m). Geser pin A ke posisi yang tepat.</p>
            )}
            <p className="text-xs text-gray-500">
              Atau ketuk peta / geser pin {kind === 'pickup' ? 'A' : 'B'} untuk menentukan titik.
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
      {error && (
        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md flex gap-2" role="alert">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <div className="space-y-2">
        {pointRow('pickup')}
        {pointRow('drop')}
      </div>

      <PickupMap
        center={pickup?.point || area.center}
        pickup={pickup?.point || null}
        drop={drop?.point || null}
        route={quote?.route.geometry || previewRoute}
        serviceArea={area}
        onMapClick={submitting ? undefined : handleMapClick}
        onPickupDrag={submitting ? undefined : (p) => setPoint('pickup', p)}
        onDropDrag={submitting ? undefined : (p) => setPoint('drop', p)}
      />

      {/* Harga */}
      {(quoteLoading || quote || quoteError) && (
        <div className="rounded-lg border border-gray-200 p-4" aria-live="polite">
          {quoteLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 size={16} className="animate-spin" /> Menghitung harga…
            </div>
          ) : quoteError ? (
            <div className="flex gap-2 text-sm text-amber-800">
              <AlertCircle size={16} className="mt-0.5 shrink-0" /> {quoteError}
            </div>
          ) : quote ? (
            <>
              <div className="flex items-end justify-between gap-3">
                <div className="space-y-1 text-sm text-gray-600">
                  <p className="flex items-center gap-1.5">
                    <RouteIcon size={14} /> {quote.route.distance_km.toLocaleString('id-ID')} km
                    {quote.route.estimated && <span className="text-xs text-gray-400">(perkiraan)</span>}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Clock size={14} /> ± {quote.route.duration_min} menit
                  </p>
                </div>
                <p className="text-2xl font-bold" style={{ color: themeColor }}>
                  {formatRupiah(quote.price)}
                </p>
              </div>
              <details className="mt-3 text-xs text-gray-500">
                <summary className="cursor-pointer select-none">Rincian harga</summary>
                <dl className="mt-2 space-y-1">
                  <div className="flex justify-between"><dt>Tarif dasar</dt><dd>{formatRupiah(quote.breakdown.base_fare)}</dd></div>
                  <div className="flex justify-between">
                    <dt>{quote.breakdown.distance_km.toLocaleString('id-ID')} km × {formatRupiah(quote.breakdown.per_km)}</dt>
                    <dd>{formatRupiah(quote.breakdown.distance_fare)}</dd>
                  </div>
                  {quote.breakdown.is_night && (
                    <div className="flex justify-between">
                      <dt>Tarif malam (+{quote.breakdown.night_percentage}%)</dt>
                      <dd>{formatRupiah(quote.breakdown.night_surcharge)}</dd>
                    </div>
                  )}
                  {quote.breakdown.min_fare_applied && <p>Berlaku tarif minimum {formatRupiah(pricing.min_fare)}.</p>}
                  <p className="text-gray-400">Total dibulatkan ke atas.</p>
                </dl>
              </details>
            </>
          ) : null}
        </div>
      )}

      {/* Data pemesan */}
      <div className="space-y-3">
        <div>
          <label htmlFor="pk-name" className="block mb-1 text-sm font-medium text-gray-700">Nama pemesan</label>
          <div className="relative">
            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              id="pk-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              autoComplete="name"
              maxLength={100}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-9 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/40 focus:border-emerald-700"
              placeholder="Nama Anda"
            />
          </div>
        </div>
        <div>
          <label htmlFor="pk-phone" className="block mb-1 text-sm font-medium text-gray-700">Nomor WhatsApp</label>
          <div className="relative">
            <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              id="pk-phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={submitting}
              autoComplete="tel"
              className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-9 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/40 focus:border-emerald-700"
              placeholder="08xxxxxxxxxx"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">Pengayuh akan menghubungi nomor ini saat menjemput.</p>
        </div>
        <div>
          <label htmlFor="pk-note" className="block mb-1 text-sm font-medium text-gray-700">
            Patokan jemput <span className="font-normal text-gray-400">(opsional)</span>
          </label>
          <div className="relative">
            <StickyNote size={16} className="absolute left-3 top-3 text-gray-400" />
            <input
              id="pk-note"
              value={pickupNote}
              onChange={(e) => setPickupNote(e.target.value)}
              disabled={submitting}
              maxLength={200}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-9 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/40 focus:border-emerald-700"
              placeholder="Contoh: lobby hotel, depan minimarket"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting || quoteLoading || !quote}
        className="w-full text-white font-medium rounded-lg text-sm px-5 py-3 transition-colors disabled:opacity-60 disabled:cursor-not-allowed hover:brightness-95"
        style={{ backgroundColor: themeColor }}
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" /> Membuat pesanan…
          </span>
        ) : quote ? (
          `Pesan Becak · ${formatRupiah(quote.price)}`
        ) : (
          'Pesan Becak'
        )}
      </button>
      <p className="text-xs text-center text-gray-500">Pembayaran tunai atau QRIS langsung ke pengayuh setelah sampai.</p>
    </form>
  );
};

export default PickupOrderForm;
