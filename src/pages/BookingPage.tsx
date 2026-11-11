import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import {
  MapPin, Flag, Crosshair, Hand, Loader2, Building2, Star, Clock, Route, AlertCircle, ChevronRight, Pencil,
} from 'lucide-react';
import PlaceSearch from '../components/booking/PlaceSearch';
import {
  DEFAULT_CENTER, TILE_URL, TILE_ATTRIBUTION, pickupIcon, dropIcon, MapClickHandler, FitBounds, RouteLine,
} from '../components/booking/MapParts';
import {
  bookingAPI, geoAPI, apiErrorMessage, formatRupiah, lastBookingStore,
  BookingConfig, BookingQuote, BookingView, LatLng, Place, PlacePoint,
} from '../services/bookingService';

type Field = 'pickup' | 'drop';

const themeColor = '#047857';

const getCurrentPosition = (): Promise<LatLng> =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('unsupported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => reject(err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });

const isValidPhone = (p: string) => /^(\+?62|0)8\d{7,12}$/.test(p.replace(/[\s-]/g, ''));

const BookingPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hotelSlug = searchParams.get('hotel') || '';
  const srcParam = searchParams.get('src') || '';
  const refParam = searchParams.get('ref') || '';

  const [config, setConfig] = useState<BookingConfig | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  const [pickup, setPickup] = useState<PlacePoint | null>(null);
  const [drop, setDrop] = useState<PlacePoint | null>(null);
  const [editing, setEditing] = useState<Field | null>(null);
  const [pinMode, setPinMode] = useState<Field | null>(null);
  const [locating, setLocating] = useState(false);
  const [customerPos, setCustomerPos] = useState<LatLng | null>(null);

  const [vehicleType, setVehicleType] = useState('');
  const [quote, setQuote] = useState<BookingQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [activeBooking, setActiveBooking] = useState<{ token: string; booking: BookingView } | null>(null);
  const quoteRequestId = useRef(0);

  const hotel = config?.hotel;

  // ---------- Muat konfigurasi ----------
  const loadConfig = useCallback(async () => {
    setConfigError(null);
    try {
      const cfg = await bookingAPI.getConfig(hotelSlug || undefined);
      setConfig(cfg);
      if (cfg.rates.length > 0) setVehicleType(prev => prev || cfg.rates[0].vehicle_type);
      if (cfg.hotel) {
        setPickup({ lat: cfg.hotel.latitude, lng: cfg.hotel.longitude, name: cfg.hotel.name, address: cfg.hotel.address });
      }
    } catch (err) {
      setConfigError(apiErrorMessage(err, 'Gagal memuat halaman booking'));
    }
  }, [hotelSlug]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // ---------- Booking aktif sebelumnya ----------
  useEffect(() => {
    const token = lastBookingStore.get();
    if (!token) return;
    bookingAPI
      .getStatus(token)
      .then(b => {
        if (b.status === 'pending' || b.status === 'accepted' || b.status === 'picked_up') {
          setActiveBooking({ token, booking: b });
        }
      })
      .catch(() => lastBookingStore.clear());
  }, []);

  // ---------- Set titik + nama dari pin ----------
  const setPoint = useCallback((field: Field, point: PlacePoint | null) => {
    (field === 'pickup' ? setPickup : setDrop)(point);
  }, []);

  const setPointFromCoords = useCallback(
    async (field: Field, lat: number, lng: number) => {
      setPoint(field, { lat, lng, name: 'Memuat alamat...' });
      try {
        const { place, in_service_area } = await geoAPI.reverse(lat, lng);
        setPoint(field, { lat, lng, name: place.name, address: place.address });
        if (!in_service_area) setQuoteError('Titik ini berada di luar area layanan');
      } catch {
        setPoint(field, { lat, lng, name: `Titik ${lat.toFixed(5)}, ${lng.toFixed(5)}` });
      }
    },
    [setPoint]
  );

  const useMyLocation = useCallback(
    async (field: Field, silent = false) => {
      setLocating(true);
      try {
        const pos = await getCurrentPosition();
        setCustomerPos(pos);
        await setPointFromCoords(field, pos.lat, pos.lng);
        setEditing(null);
      } catch {
        if (!silent) setQuoteError('Tidak bisa mengambil lokasi. Izinkan akses lokasi atau pilih lewat peta.');
      } finally {
        setLocating(false);
      }
    },
    [setPointFromCoords]
  );

  // Tanpa hotel: coba isi titik jemput dari GPS saat pertama kali dibuka
  const triedAutoLocate = useRef(false);
  useEffect(() => {
    if (!config || hotel || triedAutoLocate.current) return;
    triedAutoLocate.current = true;
    useMyLocation('pickup', true);
  }, [config, hotel, useMyLocation]);

  const selectPlace = (field: Field, p: Place) => {
    setPoint(field, { lat: p.lat, lng: p.lng, name: p.name, address: p.address });
    setEditing(null);
    setPinMode(null);
  };

  // ---------- Hitung harga ----------
  useEffect(() => {
    if (!pickup || !drop || pickup.name === 'Memuat alamat...' || drop.name === 'Memuat alamat...') {
      setQuote(null);
      return;
    }
    const id = ++quoteRequestId.current;
    setQuoteLoading(true);
    setQuoteError(null);
    const timer = setTimeout(async () => {
      try {
        const q = await bookingAPI.getQuote(pickup, drop, vehicleType || undefined);
        if (id === quoteRequestId.current) setQuote(q);
      } catch (err) {
        if (id === quoteRequestId.current) {
          setQuote(null);
          setQuoteError(apiErrorMessage(err, 'Gagal menghitung harga'));
        }
      } finally {
        if (id === quoteRequestId.current) setQuoteLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [pickup, drop, vehicleType]);

  // ---------- Kirim ----------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!pickup || !drop) return setSubmitError('Pilih titik jemput dan tujuan terlebih dahulu');
    if (!quote) return setSubmitError(quoteError || 'Tunggu harga selesai dihitung');
    if (!name.trim()) return setSubmitError('Nama wajib diisi');
    if (!isValidPhone(phone)) return setSubmitError('Nomor WhatsApp tidak valid (contoh: 0812xxxxxxx)');

    setSubmitting(true);
    try {
      const res = await bookingAPI.create({
        pickup: { lat: pickup.lat, lng: pickup.lng, name: pickup.name, address: pickup.address },
        drop: { lat: drop.lat, lng: drop.lng, name: drop.name, address: drop.address },
        vehicle_type: quote.vehicle_type,
        customer_name: name.trim(),
        customer_phone: phone.trim(),
        notes: notes.trim() || undefined,
        source: srcParam || undefined,
        source_ref: refParam || undefined,
        hotel_slug: hotel ? hotel.slug : undefined,
        customer_lat: customerPos?.lat,
        customer_lng: customerPos?.lng,
        expected_price: quote.price,
      });
      lastBookingStore.set(res.tracking_token);
      navigate(`/booking/status/${res.tracking_token}`);
    } catch (err: any) {
      const newQuote = err?.response?.data?.quote as BookingQuote | undefined;
      if (err?.response?.status === 409 && newQuote) {
        setQuote(newQuote);
        setSubmitError(`Harga diperbarui menjadi ${formatRupiah(newQuote.price)}. Tekan Pesan lagi untuk melanjutkan.`);
      } else {
        setSubmitError(apiErrorMessage(err, 'Gagal membuat booking'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const mapPoints = useMemo(() => {
    const pts: [number, number][] = [];
    if (pickup) pts.push([pickup.lat, pickup.lng]);
    if (drop) pts.push([drop.lat, drop.lng]);
    // Rute bisa melengkung keluar dari kotak jemput–tujuan, ikutkan agar terlihat utuh
    if (pickup && drop && quote?.route && !quoteLoading) pts.push(...quote.route);
    return pts;
  }, [pickup, drop, quote, quoteLoading]);

  // ---------- Render ----------
  if (configError) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <p className="text-gray-700 mb-4">{configError}</p>
        <button onClick={loadConfig} className="px-4 py-2 rounded-lg text-white" style={{ backgroundColor: themeColor }}>
          Coba lagi
        </button>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: themeColor }} />
      </div>
    );
  }

  if (config.rates.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-gray-700 mb-4">Layanan booking belum tersedia saat ini.</p>
        <Link to="/pesan" className="text-green-700 underline">Pesan langsung di becak</Link>
      </div>
    );
  }

  const renderField = (field: Field) => {
    const point = field === 'pickup' ? pickup : drop;
    const isPickup = field === 'pickup';
    const Icon = isPickup ? MapPin : Flag;
    const lockedToHotel = isPickup && !!hotel && point?.name === hotel.name;

    return (
      <div className="relative">
        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
          {isPickup ? 'Titik jemput' : 'Tujuan'}
        </label>

        {editing === field ? (
          <div className="space-y-2">
            <PlaceSearch
              autoFocus
              bias={pickup || customerPos}
              placeholder={isPickup ? 'Cari lokasi jemput...' : 'Mau ke mana? Cari tempat...'}
              onSelect={p => selectPlace(field, p)}
              onCancel={() => setEditing(null)}
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => useMyLocation(field)}
                disabled={locating}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                {locating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Crosshair className="w-3.5 h-3.5" />}
                Lokasi saya
              </button>
              <button
                type="button"
                onClick={() => {
                  setPinMode(field);
                  setEditing(null);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border border-gray-300 bg-white hover:bg-gray-50"
              >
                <Hand className="w-3.5 h-3.5" />
                Pilih di peta
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(field)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors ${
              pinMode === field ? 'border-green-600 ring-2 ring-green-600/30 bg-green-50' : 'border-gray-300 bg-white hover:bg-gray-50'
            }`}
          >
            <Icon className={`w-5 h-5 flex-shrink-0 ${isPickup ? 'text-green-700' : 'text-red-600'}`} />
            <span className="min-w-0 flex-1">
              {pinMode === field ? (
                <span className="block text-sm text-green-800 font-medium">Ketuk peta untuk memilih titik…</span>
              ) : point ? (
                <>
                  <span className="block text-sm font-medium text-gray-900 truncate">
                    {lockedToHotel && <Building2 className="inline w-3.5 h-3.5 mr-1 -mt-0.5 text-green-700" />}
                    {point.name}
                  </span>
                  {point.address && <span className="block text-xs text-gray-500 truncate">{point.address}</span>}
                </>
              ) : (
                <span className="block text-sm text-gray-400">{isPickup ? 'Pilih lokasi jemput' : 'Mau ke mana?'}</span>
              )}
            </span>
            <Pencil className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-10">
        <div className="mb-5">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Booking Becak</h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">
            Pilih titik jemput dan tujuan, becak terdekat akan datang menjemputmu.
          </p>
        </div>

        {hotel && (
          <div className="mb-4 flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
            <Building2 className="w-5 h-5 text-green-700 flex-shrink-0" />
            <p className="text-sm text-green-900">
              Dijemput dari <span className="font-semibold">{hotel.name}</span>
            </p>
          </div>
        )}

        {activeBooking && (
          <Link
            to={`/booking/status/${activeBooking.token}`}
            className="mb-4 flex items-center justify-between gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200 hover:bg-amber-100"
          >
            <span className="text-sm text-amber-900">
              Kamu punya booking aktif: <span className="font-semibold">{activeBooking.booking.status_label}</span>
            </span>
            <ChevronRight className="w-4 h-4 text-amber-700" />
          </Link>
        )}

        <div className="grid md:grid-cols-5 gap-5">
          {/* Peta */}
          <div className="md:col-span-3 md:order-1">
            <div className="relative isolate h-72 md:h-[560px] rounded-xl overflow-hidden shadow border border-gray-200 bg-gray-100">
              <MapContainer center={DEFAULT_CENTER} zoom={14} zoomSnap={0.5} className="h-full w-full" scrollWheelZoom>
                <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
                <MapClickHandler
                  enabled={!!pinMode}
                  onClick={(lat, lng) => {
                    if (!pinMode) return;
                    setPointFromCoords(pinMode, lat, lng);
                    setPinMode(null);
                  }}
                />
                {pickup && (
                  <Marker
                    position={[pickup.lat, pickup.lng]}
                    icon={pickupIcon}
                    draggable
                    eventHandlers={{
                      dragend: e => {
                        const ll = (e.target as L.Marker).getLatLng();
                        setPointFromCoords('pickup', ll.lat, ll.lng);
                      },
                    }}
                  />
                )}
                {drop && (
                  <Marker
                    position={[drop.lat, drop.lng]}
                    icon={dropIcon}
                    draggable
                    eventHandlers={{
                      dragend: e => {
                        const ll = (e.target as L.Marker).getLatLng();
                        setPointFromCoords('drop', ll.lat, ll.lng);
                      },
                    }}
                  />
                )}
                {pickup && drop && (
                  <RouteLine
                    route={!quoteLoading ? quote?.route : null}
                    from={[pickup.lat, pickup.lng]}
                    to={[drop.lat, drop.lng]}
                    color={themeColor}
                  />
                )}
                <FitBounds points={mapPoints} />
              </MapContainer>

              {pinMode && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[500] flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900/90 text-white text-sm shadow-lg">
                  <Hand className="w-4 h-4" />
                  Ketuk peta untuk {pinMode === 'pickup' ? 'titik jemput' : 'tujuan'}
                  <button type="button" onClick={() => setPinMode(null)} className="ml-1 underline text-white/80">
                    Batal
                  </button>
                </div>
              )}
            </div>
            <p className="mt-2 text-xs text-gray-500">Pin bisa digeser untuk menyesuaikan titik.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="md:col-span-2 md:order-2 space-y-4">
            <div className="bg-white rounded-xl shadow border border-gray-200 p-4 space-y-4">
              {renderField('pickup')}
              {renderField('drop')}

              {!drop && editing !== 'drop' && config.destinations.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Tujuan populer</p>
                  <div className="flex flex-wrap gap-2">
                    {config.destinations.slice(0, 8).map(d => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => selectPlace('drop', { name: d.name, address: d.address, lat: d.latitude, lng: d.longitude, type: 'destination' })}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-green-800"
                      >
                        <Star className="w-3 h-3 text-amber-500" fill="currentColor" />
                        {d.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {config.rates.length > 1 && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Kendaraan</label>
                  <div className="grid grid-cols-2 gap-2">
                    {config.rates.map(r => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setVehicleType(r.vehicle_type)}
                        className={`px-3 py-2 rounded-lg border text-left ${
                          vehicleType === r.vehicle_type ? 'border-green-600 bg-green-50 ring-1 ring-green-600' : 'border-gray-300 bg-white hover:bg-gray-50'
                        }`}
                      >
                        <span className="block text-sm font-medium text-gray-900">{r.label}</span>
                        <span className="block text-xs text-gray-500">{formatRupiah(r.per_km)}/km</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Harga */}
            {(quoteLoading || quote || quoteError) && (
              <div className="bg-white rounded-xl shadow border border-gray-200 p-4">
                {quoteLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" /> Menghitung harga…
                  </div>
                ) : quoteError ? (
                  <div className="flex items-start gap-2 text-sm text-red-700">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {quoteError}
                  </div>
                ) : quote ? (
                  <div>
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <p className="text-xs text-gray-500">{quote.label}</p>
                        <p className="text-2xl font-bold text-gray-900">{formatRupiah(quote.price)}</p>
                      </div>
                      <div className="text-right text-sm text-gray-600 space-y-0.5">
                        <p className="flex items-center justify-end gap-1">
                          <Route className="w-4 h-4" /> {quote.distance_km.toLocaleString('id-ID')} km
                        </p>
                        <p className="flex items-center justify-end gap-1">
                          <Clock className="w-4 h-4" /> ±{quote.duration_min} menit
                        </p>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      {formatRupiah(quote.base_fare)} + {formatRupiah(quote.per_km)}/km · minimal {formatRupiah(quote.min_fare)}
                      {quote.distance_source === 'estimate' && ' · jarak perkiraan'}
                    </p>
                    {quote.nearby_drivers > 0 && (
                      <p className="mt-1 text-xs text-green-700">{quote.nearby_drivers} becak online di sekitar titik jemput</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">Bayar langsung ke driver setelah sampai (tunai / QRIS).</p>
                  </div>
                ) : null}
              </div>
            )}

            {/* Data penumpang */}
            <div className="bg-white rounded-xl shadow border border-gray-200 p-4 space-y-3">
              <div>
                <label htmlFor="bk-name" className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
                <input
                  id="bk-name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  maxLength={100}
                  autoComplete="name"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                  placeholder="Nama kamu"
                />
              </div>
              <div>
                <label htmlFor="bk-phone" className="block text-sm font-medium text-gray-700 mb-1">Nomor WhatsApp</label>
                <input
                  id="bk-phone"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  inputMode="tel"
                  autoComplete="tel"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                  placeholder="0812xxxxxxxx"
                />
                <p className="mt-1 text-xs text-gray-500">Driver akan menghubungi nomor ini saat menjemput.</p>
              </div>
              <div>
                <label htmlFor="bk-notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Catatan untuk driver <span className="text-gray-400 font-normal">(opsional)</span>
                </label>
                <input
                  id="bk-notes"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  maxLength={300}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                  placeholder="Mis. tunggu di lobby, 2 orang"
                />
              </div>
            </div>

            {submitError && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {submitError}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || quoteLoading || !quote}
              className="w-full py-3.5 rounded-xl text-white font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              style={{ backgroundColor: themeColor }}
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Memesan…</span>
              ) : quote ? (
                `Pesan Becak · ${formatRupiah(quote.price)}`
              ) : (
                'Pesan Becak'
              )}
            </button>

            <p className="text-center text-xs text-gray-500">
              Sudah di dekat becak?{' '}
              <Link to="/pesan" className="text-green-700 font-medium underline">Pesan langsung lewat QR</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
