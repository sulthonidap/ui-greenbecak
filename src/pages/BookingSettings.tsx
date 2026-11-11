import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import { QRCodeCanvas } from 'qrcode.react';
import {
  Calculator, Building2, Star, Plus, Edit3, Trash2, X, QrCode, Copy, Loader2, Save, MapPin,
} from 'lucide-react';
import PlaceSearch from '../components/booking/PlaceSearch';
import {
  DEFAULT_CENTER, TILE_URL, TILE_ATTRIBUTION, placeIcon, MapClickHandler, FitBounds, InvalidateSize,
} from '../components/booking/MapParts';
import {
  bookingAdminAPI, apiErrorMessage, calculateBookingPrice, formatRupiah, VEHICLE_LABELS,
  BookingRate, BookingRateInput, Destination, Hotel,
} from '../services/bookingService';
import { showError, showSuccess } from '../utils/toast';

type Tab = 'rates' | 'hotels' | 'destinations';

// =====================================================================
// Pemilih lokasi (peta + cari) untuk hotel & destinasi
// =====================================================================

interface LocationValue {
  latitude: number | null;
  longitude: number | null;
}

const LocationPicker: React.FC<{
  value: LocationValue;
  onChange: (lat: number, lng: number, place?: { name: string; address: string }) => void;
}> = ({ value, onChange }) => {
  const has = value.latitude != null && value.longitude != null;
  const points: [number, number][] = has ? [[value.latitude as number, value.longitude as number]] : [];

  return (
    <div className="space-y-2">
      <PlaceSearch
        placeholder="Cari nama tempat untuk menaruh pin..."
        bias={has ? { lat: value.latitude as number, lng: value.longitude as number } : null}
        onSelect={p => onChange(p.lat, p.lng, { name: p.name, address: p.address })}
      />
      <div className="relative isolate h-64 rounded-lg overflow-hidden border border-gray-300">
        <MapContainer center={points[0] || DEFAULT_CENTER} zoom={15} className="h-full w-full" scrollWheelZoom>
          <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
          <InvalidateSize />
          <MapClickHandler onClick={(lat, lng) => onChange(lat, lng)} />
          {has && (
            <Marker
              position={points[0]}
              icon={placeIcon}
              draggable
              eventHandlers={{
                dragend: e => {
                  const ll = (e.target as L.Marker).getLatLng();
                  onChange(ll.lat, ll.lng);
                },
              }}
            />
          )}
          <FitBounds points={points} />
        </MapContainer>
      </div>
      <p className="text-xs text-gray-500">
        {has
          ? `Koordinat: ${(value.latitude as number).toFixed(6)}, ${(value.longitude as number).toFixed(6)} · klik peta atau geser pin untuk mengubah`
          : 'Klik peta atau cari tempat untuk menaruh pin'}
      </p>
    </div>
  );
};

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-[2000] bg-gray-900/50 overflow-y-auto">
    <div className="min-h-full flex items-start justify-center p-4 md:pt-12">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600" aria-label="Tutup">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  </div>
);

const inputCls =
  'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent';

// =====================================================================
// Tab: Tarif booking per km
// =====================================================================

const SIM_DISTANCES = [1, 2, 3, 5];

const RatesTab: React.FC = () => {
  const [rates, setRates] = useState<BookingRate[]>([]);
  const [drafts, setDrafts] = useState<Record<number, BookingRateInput>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | 'new' | null>(null);
  const [newRate, setNewRate] = useState<BookingRateInput | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await bookingAdminAPI.getRates();
      setRates(r);
      setDrafts(Object.fromEntries(r.map(({ id, ...rest }) => [id, rest])));
    } catch (err) {
      showError(apiErrorMessage(err, 'Gagal memuat tarif'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (id: number | 'new', data: BookingRateInput) => {
    setSavingId(id);
    try {
      if (id === 'new') {
        await bookingAdminAPI.createRate(data);
        setNewRate(null);
      } else {
        await bookingAdminAPI.updateRate(id, data);
      }
      showSuccess('Tarif booking disimpan');
      load();
    } catch (err) {
      showError(apiErrorMessage(err, 'Gagal menyimpan tarif'));
    } finally {
      setSavingId(null);
    }
  };

  const unusedTypes = Object.keys(VEHICLE_LABELS).filter(t => !rates.some(r => r.vehicle_type === t));

  const renderEditor = (id: number | 'new', d: BookingRateInput, set: (v: BookingRateInput) => void) => {
    const num = (key: keyof BookingRateInput) => (e: React.ChangeEvent<HTMLInputElement>) =>
      set({ ...d, [key]: e.target.value === '' ? 0 : Number(e.target.value) });

    return (
      <div className="bg-white rounded-lg shadow border border-gray-200 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            {id === 'new' ? (
              <select value={d.vehicle_type} onChange={e => set({ ...d, vehicle_type: e.target.value, label: VEHICLE_LABELS[e.target.value] })} className={inputCls}>
                {unusedTypes.map(t => (
                  <option key={t} value={t}>{VEHICLE_LABELS[t]}</option>
                ))}
              </select>
            ) : (
              <h3 className="text-lg font-semibold text-gray-900">{d.label}</h3>
            )}
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={d.is_active} onChange={e => set({ ...d, is_active: e.target.checked })} className="rounded text-green-600" />
            Aktif untuk booking
          </label>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="col-span-2 md:col-span-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">Nama tampilan</label>
            <input value={d.label} onChange={e => set({ ...d, label: e.target.value })} className={inputCls} />
          </div>
          {([
            ['base_fare', 'Tarif dasar (Rp)'],
            ['per_km', 'Harga per km (Rp)'],
            ['min_fare', 'Tarif minimum (Rp)'],
            ['max_distance_km', 'Jarak maksimal (km)'],
            ['rounding', 'Pembulatan ke (Rp)'],
          ] as [keyof BookingRateInput, string][]).map(([key, label]) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
              <input type="number" min={0} step={key === 'max_distance_km' ? 0.5 : 500} value={d[key] as number} onChange={num(key)} className={inputCls} />
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 rounded-md bg-gray-50 border border-gray-200">
          <p className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-2">
            <Calculator className="w-3.5 h-3.5" /> Simulasi harga
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
            {SIM_DISTANCES.map(km => (
              <div key={km} className="flex justify-between gap-2 px-2 py-1 bg-white rounded border border-gray-200">
                <span className="text-gray-500">{km} km</span>
                <span className="font-medium text-gray-900">{km > d.max_distance_km ? '—' : formatRupiah(calculateBookingPrice(d, km))}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Rumus: tarif dasar + jarak × harga per km, minimal tarif minimum, dibulatkan ke atas.
          </p>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          {id === 'new' && (
            <button onClick={() => setNewRate(null)} className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">
              Batal
            </button>
          )}
          <button
            onClick={() => save(id, d)}
            disabled={savingId === id || !d.label.trim() || d.max_distance_km <= 0}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
          >
            {savingId === id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Simpan
          </button>
        </div>
      </div>
    );
  };

  if (loading) return <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-green-600" /></div>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Tarif ini hanya untuk <span className="font-medium">booking</span> (pesan dari lokasi penumpang). Order langsung lewat QR becak tetap memakai paket di menu Pengaturan Tarif.
      </p>
      {rates.map(r =>
        drafts[r.id] ? (
          <React.Fragment key={r.id}>{renderEditor(r.id, drafts[r.id], v => setDrafts(prev => ({ ...prev, [r.id]: v })))}</React.Fragment>
        ) : null
      )}
      {newRate ? (
        renderEditor('new', newRate, setNewRate)
      ) : unusedTypes.length > 0 ? (
        <button
          onClick={() =>
            setNewRate({
              vehicle_type: unusedTypes[0], label: VEHICLE_LABELS[unusedTypes[0]], base_fare: 5000, per_km: 4000,
              min_fare: 10000, max_distance_km: 10, rounding: 1000, is_active: true,
            })
          }
          className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-md border border-dashed border-gray-400 text-gray-700 hover:bg-white"
        >
          <Plus className="w-4 h-4" /> Tambah tarif kendaraan lain
        </button>
      ) : null}
    </div>
  );
};

// =====================================================================
// Tab: Hotel mitra
// =====================================================================

interface HotelForm {
  name: string;
  slug: string;
  address: string;
  phone: string;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
}

const emptyHotel: HotelForm = { name: '', slug: '', address: '', phone: '', latitude: null, longitude: null, is_active: true };

const hotelBookingUrl = (slug: string) => `${window.location.origin}/booking?hotel=${encodeURIComponent(slug)}`;

const HotelsTab: React.FC = () => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<{ id: number | null; form: HotelForm } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Hotel | null>(null);
  const [qrHotel, setQrHotel] = useState<Hotel | null>(null);
  const qrRef = useRef<HTMLCanvasElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setHotels(await bookingAdminAPI.getHotels());
    } catch (err) {
      showError(apiErrorMessage(err, 'Gagal memuat hotel'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    if (!editing) return;
    const f = editing.form;
    if (!f.name.trim() || f.latitude == null || f.longitude == null) {
      showError('Nama dan lokasi hotel wajib diisi');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: f.name.trim(), slug: f.slug.trim() || undefined, address: f.address.trim(), phone: f.phone.trim(),
        latitude: f.latitude, longitude: f.longitude, is_active: f.is_active,
      };
      if (editing.id) await bookingAdminAPI.updateHotel(editing.id, payload);
      else await bookingAdminAPI.createHotel(payload);
      showSuccess('Hotel disimpan');
      setEditing(null);
      load();
    } catch (err) {
      showError(apiErrorMessage(err, 'Gagal menyimpan hotel'));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await bookingAdminAPI.deleteHotel(deleting.id);
      showSuccess('Hotel dihapus');
      setDeleting(null);
      load();
    } catch (err) {
      showError(apiErrorMessage(err, 'Gagal menghapus hotel'));
    }
  };

  const copyLink = async (slug: string) => {
    try {
      await navigator.clipboard.writeText(hotelBookingUrl(slug));
      showSuccess('Link booking hotel disalin');
    } catch {
      showError('Gagal menyalin link');
    }
  };

  // Kartu QR siap cetak (PNG) — menyesuaikan gaya kartu QR driver
  const downloadQRCard = () => {
    const qr = qrRef.current;
    if (!qr || !qrHotel) return;
    const W = 600;
    const H = 860;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#047857';
    ctx.lineWidth = 14;
    ctx.strokeRect(7, 7, W - 14, H - 14);
    ctx.fillStyle = '#047857';
    ctx.fillRect(0, 0, W, 120);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 38px Arial';
    ctx.fillText('BECAKJOGJA', W / 2, 62);
    ctx.font = '22px Arial';
    ctx.fillText('Pesan becak, kami jemput di sini', W / 2, 98);
    ctx.drawImage(qr, 90, 150, 420, 420);
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 30px Arial';
    ctx.fillText(qrHotel.name.length > 32 ? qrHotel.name.slice(0, 31) + '…' : qrHotel.name, W / 2, 630);
    ctx.fillStyle = '#374151';
    ctx.font = '22px Arial';
    ctx.fillText('1. Scan QR  2. Pilih tujuan  3. Becak datang', W / 2, 690);
    ctx.fillStyle = '#6B7280';
    ctx.font = '18px Arial';
    ctx.fillText('Bayar ke driver setelah sampai (tunai / QRIS)', W / 2, 740);
    const link = document.createElement('a');
    link.download = `QR-Booking-${qrHotel.slug}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  if (loading) return <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-green-600" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600">
          Tamu yang scan QR hotel langsung dijemput dari hotel, dan order tercatat berasal dari hotel tersebut.
        </p>
        <button
          onClick={() => setEditing({ id: null, form: { ...emptyHotel } })}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-md bg-green-600 text-white hover:bg-green-700"
        >
          <Plus className="w-4 h-4" /> Tambah Hotel
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Hotel', 'Link QR', 'Order', 'Status', 'Aksi'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {hotels.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-500">Belum ada hotel mitra.</td>
              </tr>
            )}
            {hotels.map(h => (
              <tr key={h.id} className="hover:bg-gray-50">
                <td className="px-5 py-3">
                  <p className="text-sm font-medium text-gray-900">{h.name}</p>
                  <p className="text-xs text-gray-500">{h.address || '-'}</p>
                </td>
                <td className="px-5 py-3">
                  <button onClick={() => copyLink(h.slug)} className="inline-flex items-center gap-1 text-xs text-blue-700 hover:underline" title={hotelBookingUrl(h.slug)}>
                    <Copy className="w-3.5 h-3.5" /> /booking?hotel={h.slug}
                  </button>
                </td>
                <td className="px-5 py-3 text-sm text-gray-900">{h.total_orders ?? 0}</td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${h.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    {h.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex gap-3">
                    <button onClick={() => setQrHotel(h)} className="text-purple-600 hover:text-purple-900" title="QR hotel">
                      <QrCode className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditing({ id: h.id, form: { name: h.name, slug: h.slug, address: h.address, phone: h.phone, latitude: h.latitude, longitude: h.longitude, is_active: h.is_active } })}
                      className="text-blue-600 hover:text-blue-900"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleting(h)} className="text-red-600 hover:text-red-900" title="Hapus">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal title={editing.id ? 'Edit Hotel' : 'Tambah Hotel'} onClose={() => setEditing(null)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama hotel</label>
              <input value={editing.form.name} onChange={e => setEditing({ ...editing, form: { ...editing.form, name: e.target.value } })} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi titik jemput</label>
              <LocationPicker
                value={editing.form}
                onChange={(lat, lng, place) =>
                  setEditing(prev =>
                    prev && {
                      ...prev,
                      form: {
                        ...prev.form,
                        latitude: lat,
                        longitude: lng,
                        name: prev.form.name || place?.name || '',
                        address: place?.address || prev.form.address,
                      },
                    }
                  )
                }
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                <input value={editing.form.address} onChange={e => setEditing({ ...editing, form: { ...editing.form, address: e.target.value } })} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telepon <span className="text-gray-400">(opsional)</span></label>
                <input value={editing.form.phone} onChange={e => setEditing({ ...editing, form: { ...editing.form, phone: e.target.value } })} className={inputCls} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug link <span className="text-gray-400">(opsional, otomatis dari nama)</span></label>
              <input value={editing.form.slug} onChange={e => setEditing({ ...editing, form: { ...editing.form, slug: e.target.value } })} placeholder="mis. grand-inna-malioboro" className={inputCls} />
              {editing.id && <p className="mt-1 text-xs text-amber-700">Mengubah slug membuat QR yang sudah dicetak tidak berlaku lagi.</p>}
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={editing.form.is_active} onChange={e => setEditing({ ...editing, form: { ...editing.form, is_active: e.target.checked } })} className="rounded text-green-600" />
              Aktif
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">Batal</button>
              <button onClick={submit} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} Simpan
              </button>
            </div>
          </div>
        </Modal>
      )}

      {qrHotel && (
        <Modal title={`QR Booking · ${qrHotel.name}`} onClose={() => setQrHotel(null)}>
          <div className="text-center">
            <div className="inline-block p-3 border-2 border-gray-200 rounded-lg">
              <QRCodeCanvas ref={qrRef} value={hotelBookingUrl(qrHotel.slug)} size={240} level="H" includeMargin />
            </div>
            <p className="mt-3 text-xs text-gray-500 break-all">{hotelBookingUrl(qrHotel.slug)}</p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button onClick={() => copyLink(qrHotel.slug)} className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">
                <Copy className="w-4 h-4" /> Salin link
              </button>
              <button onClick={downloadQRCard} className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-md bg-green-600 text-white hover:bg-green-700">
                <QrCode className="w-4 h-4" /> Download kartu QR
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deleting && (
        <Modal title="Hapus Hotel" onClose={() => setDeleting(null)}>
          <p className="text-sm text-gray-700">
            Hapus <span className="font-semibold">{deleting.name}</span>? QR hotel ini tidak akan berlaku lagi. Riwayat order tetap tersimpan.
          </p>
          <div className="flex justify-end gap-2 mt-5">
            <button onClick={() => setDeleting(null)} className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">Batal</button>
            <button onClick={confirmDelete} className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700">Hapus</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// =====================================================================
// Tab: Destinasi populer
// =====================================================================

interface DestForm {
  name: string;
  category: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  sort_order: number;
  is_active: boolean;
}

const emptyDest: DestForm = { name: '', category: 'wisata', address: '', latitude: null, longitude: null, sort_order: 0, is_active: true };
const CATEGORIES = ['wisata', 'belanja', 'kuliner', 'transportasi', 'hotel', 'lainnya'];

const DestinationsTab: React.FC = () => {
  const [items, setItems] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<{ id: number | null; form: DestForm } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Destination | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await bookingAdminAPI.getDestinations());
    } catch (err) {
      showError(apiErrorMessage(err, 'Gagal memuat destinasi'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    if (!editing) return;
    const f = editing.form;
    if (!f.name.trim() || f.latitude == null || f.longitude == null) {
      showError('Nama dan lokasi destinasi wajib diisi');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: f.name.trim(), category: f.category, address: f.address.trim(),
        latitude: f.latitude, longitude: f.longitude, sort_order: f.sort_order, is_active: f.is_active,
      };
      if (editing.id) await bookingAdminAPI.updateDestination(editing.id, payload);
      else await bookingAdminAPI.createDestination(payload);
      showSuccess('Destinasi disimpan');
      setEditing(null);
      load();
    } catch (err) {
      showError(apiErrorMessage(err, 'Gagal menyimpan destinasi'));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await bookingAdminAPI.deleteDestination(deleting.id);
      showSuccess('Destinasi dihapus');
      setDeleting(null);
      load();
    } catch (err) {
      showError(apiErrorMessage(err, 'Gagal menghapus destinasi'));
    }
  };

  if (loading) return <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-green-600" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600">Destinasi ini muncul paling atas saat penumpang mencari tujuan. Urutan kecil tampil lebih dulu.</p>
        <button
          onClick={() => setEditing({ id: null, form: { ...emptyDest, sort_order: items.length + 1 } })}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-md bg-green-600 text-white hover:bg-green-700"
        >
          <Plus className="w-4 h-4" /> Tambah Destinasi
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['#', 'Destinasi', 'Kategori', 'Koordinat', 'Status', 'Aksi'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-500">Belum ada destinasi.</td>
              </tr>
            )}
            {items.map(d => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 text-sm text-gray-500">{d.sort_order}</td>
                <td className="px-5 py-3">
                  <p className="text-sm font-medium text-gray-900">{d.name}</p>
                  <p className="text-xs text-gray-500">{d.address || '-'}</p>
                </td>
                <td className="px-5 py-3 text-sm text-gray-700 capitalize">{d.category || '-'}</td>
                <td className="px-5 py-3">
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${d.latitude}&mlon=${d.longitude}#map=18/${d.latitude}/${d.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-700 hover:underline"
                  >
                    <MapPin className="w-3.5 h-3.5" /> {d.latitude.toFixed(5)}, {d.longitude.toFixed(5)}
                  </a>
                </td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${d.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    {d.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex gap-3">
                    <button
                      onClick={() => setEditing({ id: d.id, form: { name: d.name, category: d.category || 'lainnya', address: d.address, latitude: d.latitude, longitude: d.longitude, sort_order: d.sort_order, is_active: d.is_active } })}
                      className="text-blue-600 hover:text-blue-900"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleting(d)} className="text-red-600 hover:text-red-900" title="Hapus">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal title={editing.id ? 'Edit Destinasi' : 'Tambah Destinasi'} onClose={() => setEditing(null)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama destinasi</label>
              <input value={editing.form.name} onChange={e => setEditing({ ...editing, form: { ...editing.form, name: e.target.value } })} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi</label>
              <LocationPicker
                value={editing.form}
                onChange={(lat, lng, place) =>
                  setEditing(prev =>
                    prev && {
                      ...prev,
                      form: {
                        ...prev.form,
                        latitude: lat,
                        longitude: lng,
                        name: prev.form.name || place?.name || '',
                        address: place?.address || prev.form.address,
                      },
                    }
                  )
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
              <input value={editing.form.address} onChange={e => setEditing({ ...editing, form: { ...editing.form, address: e.target.value } })} className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <select value={editing.form.category} onChange={e => setEditing({ ...editing, form: { ...editing.form, category: e.target.value } })} className={inputCls}>
                  {CATEGORIES.map(c => (
                    <option key={c} value={c} className="capitalize">{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Urutan</label>
                <input type="number" min={0} value={editing.form.sort_order} onChange={e => setEditing({ ...editing, form: { ...editing.form, sort_order: Number(e.target.value) || 0 } })} className={inputCls} />
              </div>
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={editing.form.is_active} onChange={e => setEditing({ ...editing, form: { ...editing.form, is_active: e.target.checked } })} className="rounded text-green-600" />
              Aktif
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">Batal</button>
              <button onClick={submit} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} Simpan
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deleting && (
        <Modal title="Hapus Destinasi" onClose={() => setDeleting(null)}>
          <p className="text-sm text-gray-700">Hapus <span className="font-semibold">{deleting.name}</span> dari daftar destinasi populer?</p>
          <div className="flex justify-end gap-2 mt-5">
            <button onClick={() => setDeleting(null)} className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">Batal</button>
            <button onClick={confirmDelete} className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700">Hapus</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// =====================================================================
// Halaman
// =====================================================================

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'rates', label: 'Tarif per km', icon: <Calculator className="w-4 h-4" /> },
  { key: 'hotels', label: 'Hotel Mitra', icon: <Building2 className="w-4 h-4" /> },
  { key: 'destinations', label: 'Destinasi Populer', icon: <Star className="w-4 h-4" /> },
];

const BookingSettings: React.FC = () => {
  const [tab, setTab] = useState<Tab>(() => {
    try {
      return (localStorage.getItem('admin:bookingTab') as Tab) || 'rates';
    } catch {
      return 'rates';
    }
  });

  const changeTab = (t: Tab) => {
    setTab(t);
    try {
      localStorage.setItem('admin:bookingTab', t);
    } catch {
      /* abaikan */
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pengaturan Booking</h1>
        <p className="text-gray-600 mt-2">Tarif per km, hotel mitra, dan destinasi populer untuk layanan booking.</p>
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => changeTab(t.key)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap ${
              tab === t.key ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'rates' && <RatesTab />}
      {tab === 'hotels' && <HotelsTab />}
      {tab === 'destinations' && <DestinationsTab />}
    </div>
  );
};

export default BookingSettings;
