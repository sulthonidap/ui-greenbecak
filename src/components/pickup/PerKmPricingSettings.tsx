import React, { useEffect, useState } from 'react';
import { Navigation, Save, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import PickupMap from './PickupMap';
import { pricingAdminAPI, apiErrorMessage, PricingSettings } from '../../services/api';
import { formatRupiah } from '../../services/geo';

/** Sama dengan rumus di backend (pricing.Calculate), hanya untuk simulasi di layar */
const simulate = (s: PricingSettings, km: number, night: boolean) => {
  let subtotal = s.base_fare + km * s.per_km;
  if (night && s.night_surcharge_percent > 0) subtotal *= 1 + s.night_surcharge_percent / 100;
  const total = Math.max(subtotal, s.min_fare);
  return s.round_to > 0 ? Math.ceil(total / s.round_to - 1e-9) * s.round_to : Math.ceil(total);
};

type NumField = Exclude<{ [K in keyof PricingSettings]: PricingSettings[K] extends number ? K : never }[keyof PricingSettings], undefined | 'id'>;

const NumberInput: React.FC<{
  label: string;
  field: NumField;
  value: PricingSettings;
  onChange: (field: NumField, v: number) => void;
  prefix?: string;
  suffix?: string;
  step?: string;
  hint?: string;
}> = ({ label, field, value, onChange, prefix, suffix, step = '1', hint }) => (
  <label className="block">
    <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>
    <div className="flex rounded-md border border-gray-300 focus-within:ring-2 focus-within:ring-green-500 overflow-hidden">
      {prefix && <span className="px-3 py-2 bg-gray-50 text-gray-500 text-sm border-r border-gray-300">{prefix}</span>}
      <input
        type="number"
        inputMode="decimal"
        min="0"
        step={step}
        value={Number.isFinite(value[field]) ? value[field] : ''}
        onChange={(e) => onChange(field, e.target.value === '' ? NaN : parseFloat(e.target.value))}
        className="w-full px-3 py-2 text-sm focus:outline-none"
      />
      {suffix && <span className="px-3 py-2 bg-gray-50 text-gray-500 text-sm border-l border-gray-300">{suffix}</span>}
    </div>
    {hint && <span className="block mt-1 text-xs text-gray-500">{hint}</span>}
  </label>
);

const PerKmPricingSettings: React.FC = () => {
  const [settings, setSettings] = useState<PricingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [simKm, setSimKm] = useState(3);

  useEffect(() => {
    pricingAdminAPI
      .get()
      .then(setSettings)
      .catch((e) => setError(apiErrorMessage(e, 'Gagal memuat pengaturan tarif per km.')))
      .finally(() => setLoading(false));
  }, []);

  const update = <K extends keyof PricingSettings>(field: K, v: PricingSettings[K]) => {
    setSettings((s) => (s ? { ...s, [field]: v } : s));
    setSaved(false);
  };
  const updateNum = (field: NumField, v: number) => update(field, v);

  const handleSave = async () => {
    if (!settings) return;
    const nums: NumField[] = ['base_fare', 'per_km', 'min_fare', 'max_distance_km', 'round_to', 'night_surcharge_percent', 'service_center_lat', 'service_center_lng', 'service_radius_km'];
    if (nums.some((f) => !Number.isFinite(settings[f]))) {
      setError('Semua kolom angka wajib diisi (isi 0 kalau tidak dipakai).');
      return;
    }
    setSaving(true);
    setError('');
    try {
      setSettings(await pricingAdminAPI.update(settings));
      setSaved(true);
    } catch (e) {
      setError(apiErrorMessage(e, 'Gagal menyimpan pengaturan.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6 flex items-center gap-2 text-gray-500 text-sm">
        <Loader2 size={16} className="animate-spin" /> Memuat tarif per km…
      </div>
    );
  }
  if (!settings) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6 text-sm text-red-600">{error || 'Pengaturan tarif per km tidak tersedia.'}</div>
    );
  }

  const center = { lat: settings.service_center_lat, lng: settings.service_center_lng };
  const centerValid = Number.isFinite(center.lat) && Number.isFinite(center.lng);
  const allValid = ['base_fare', 'per_km', 'min_fare', 'round_to', 'night_surcharge_percent'].every((f) =>
    Number.isFinite(settings[f as NumField]),
  );
  const simKmSafe = Number.isFinite(simKm) ? simKm : 0;

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center">
          <Navigation className="w-6 h-6 text-green-600 mr-3" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Tarif Per KM (Mode Jemput)</h2>
            <p className="text-sm text-gray-500">Customer pesan dari lokasinya, pengayuh menjemput. Harga dihitung dari jarak rute.</p>
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <span className="text-sm text-gray-700">{settings.enabled ? 'Aktif' : 'Nonaktif'}</span>
          <input
            type="checkbox"
            className="sr-only peer"
            checked={settings.enabled}
            onChange={(e) => update('enabled', e.target.checked)}
          />
          <span className="relative w-11 h-6 bg-gray-300 rounded-full transition-colors peer-checked:bg-green-600 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5" />
        </label>
      </div>

      <div className="p-6 space-y-6">
        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md flex gap-2">
            <AlertCircle size={16} className="mt-0.5 shrink-0" /> {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <NumberInput label="Tarif dasar" field="base_fare" value={settings} onChange={updateNum} prefix="Rp" step="500" hint="Biaya awal setiap perjalanan" />
          <NumberInput label="Tarif per km" field="per_km" value={settings} onChange={updateNum} prefix="Rp" step="500" />
          <NumberInput label="Tarif minimum" field="min_fare" value={settings} onChange={updateNum} prefix="Rp" step="500" />
          <NumberInput label="Jarak maksimal" field="max_distance_km" value={settings} onChange={updateNum} suffix="km" step="0.5" hint="Pesanan lebih jauh dari ini ditolak" />
          <NumberInput label="Pembulatan ke atas" field="round_to" value={settings} onChange={updateNum} prefix="Rp" step="500" hint="Mis. 1000 → Rp17.800 jadi Rp18.000. Isi 0 untuk tanpa pembulatan" />
        </div>

        <div className="border-t border-gray-100 pt-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Tarif malam</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <NumberInput label="Tambahan" field="night_surcharge_percent" value={settings} onChange={updateNum} suffix="%" hint="Isi 0 untuk nonaktif" />
            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-1">Mulai (WIB)</span>
              <input type="time" value={settings.night_start} onChange={(e) => update('night_start', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-1">Selesai (WIB)</span>
              <input type="time" value={settings.night_end} onChange={(e) => update('night_end', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" />
            </label>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Area layanan</h3>
          <p className="text-xs text-gray-500 mb-3">Lokasi jemput dan tujuan harus di dalam lingkaran ini. Ketuk peta untuk memindahkan titik pusat.</p>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="space-y-4">
              <NumberInput label="Radius" field="service_radius_km" value={settings} onChange={updateNum} suffix="km" step="0.5" hint="Isi 0 untuk tanpa batas area" />
              <NumberInput label="Latitude pusat" field="service_center_lat" value={settings} onChange={updateNum} step="0.0001" />
              <NumberInput label="Longitude pusat" field="service_center_lng" value={settings} onChange={updateNum} step="0.0001" />
            </div>
            <div className="lg:col-span-2">
              {centerValid && (
                <PickupMap
                  center={center}
                  pickup={center}
                  drop={null}
                  serviceArea={{ center, radiusKm: Number.isFinite(settings.service_radius_km) ? settings.service_radius_km : 0 }}
                  onMapClick={(p) => {
                    update('service_center_lat', Math.round(p.lat * 1e6) / 1e6);
                    update('service_center_lng', Math.round(p.lng * 1e6) / 1e6);
                  }}
                  className="h-64"
                />
              )}
            </div>
          </div>
        </div>

        {allValid && (
          <div className="rounded-lg bg-green-50 border border-green-100 p-4">
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700">
              <span>Simulasi: perjalanan</span>
              <input
                type="number"
                min="0"
                step="0.1"
                value={Number.isFinite(simKm) ? simKm : ''}
                onChange={(e) => setSimKm(parseFloat(e.target.value))}
                className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm"
                aria-label="Jarak simulasi (km)"
              />
              <span>km →</span>
              <strong className="text-green-800">{formatRupiah(simulate(settings, simKmSafe, false))}</strong>
              {settings.night_surcharge_percent > 0 && (
                <span className="text-gray-500">(malam {formatRupiah(simulate(settings, simKmSafe, true))})</span>
              )}
              {simKmSafe > settings.max_distance_km && <span className="text-red-600">melebihi jarak maksimal</span>}
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          {saved && (
            <span className="flex items-center gap-1 text-sm text-green-700">
              <CheckCircle2 size={16} /> Tersimpan
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Simpan tarif per km
          </button>
        </div>
      </div>
    </div>
  );
};

export default PerKmPricingSettings;
