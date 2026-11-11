// Pencarian tempat & alamat memakai Nominatim (OpenStreetMap).
// Kebijakan Nominatim: maksimal ±1 request/detik, jadi pencarian di-debounce oleh pemanggil.

import type { LatLngPoint } from './api';

const NOMINATIM_URL = (import.meta.env.VITE_NOMINATIM_URL || 'https://nominatim.openstreetmap.org').replace(/\/$/, '');

export interface PlaceResult extends LatLngPoint {
  id: string;
  name: string;
  address: string;
}

interface NominatimItem {
  place_id: number;
  lat: string;
  lon: string;
  name?: string;
  display_name: string;
}

/** Ringkas display_name Nominatim: buang kode pos, provinsi & negara supaya pendek di HP */
const shortenAddress = (displayName: string): string => {
  const drop = /^(indonesia|daerah istimewa yogyakarta|jawa tengah|\d{5})$/i;
  return displayName
    .split(',')
    .map((p) => p.trim())
    .filter((p) => p && !drop.test(p))
    .slice(0, 4)
    .join(', ');
};

const toPlace = (item: NominatimItem): PlaceResult => {
  const address = shortenAddress(item.display_name);
  return {
    id: String(item.place_id),
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
    name: item.name || address.split(',')[0],
    address,
  };
};

/** Bounding box ±radius km di sekitar titik pusat, untuk membatasi hasil pencarian */
const viewbox = (center: LatLngPoint, radiusKm: number): string => {
  const dLat = radiusKm / 111;
  const dLng = radiusKm / (111 * Math.cos((center.lat * Math.PI) / 180));
  return [center.lng - dLng, center.lat + dLat, center.lng + dLng, center.lat - dLat].join(',');
};

export const searchPlaces = async (
  query: string,
  area: { center: LatLngPoint; radiusKm: number },
  signal?: AbortSignal,
): Promise<PlaceResult[]> => {
  const params = new URLSearchParams({
    format: 'jsonv2',
    q: query,
    countrycodes: 'id',
    limit: '6',
    'accept-language': 'id',
    viewbox: viewbox(area.center, area.radiusKm > 0 ? area.radiusKm : 30),
    bounded: '1',
  });
  const res = await fetch(`${NOMINATIM_URL}/search?${params}`, { signal });
  if (!res.ok) throw new Error('Pencarian lokasi gagal');
  const data: NominatimItem[] = await res.json();
  return data.map(toPlace);
};

export const reverseGeocode = async (point: LatLngPoint, signal?: AbortSignal): Promise<string> => {
  const params = new URLSearchParams({
    format: 'jsonv2',
    lat: String(point.lat),
    lon: String(point.lng),
    zoom: '18',
    'accept-language': 'id',
  });
  const res = await fetch(`${NOMINATIM_URL}/reverse?${params}`, { signal });
  if (!res.ok) throw new Error('Gagal membaca alamat');
  const data: NominatimItem & { error?: string } = await res.json();
  if (data.error || !data.display_name) throw new Error('Alamat tidak ditemukan');
  return shortenAddress(data.display_name);
};

/** Fallback kalau alamat tidak bisa dibaca */
export const formatCoords = (p: LatLngPoint): string => `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`;

/** Jarak garis lurus (km) */
export const haversineKm = (a: LatLngPoint, b: LatLngPoint): number => {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
};

export const getCurrentPosition = (): Promise<LatLngPoint & { accuracy: number }> =>
  new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Browser tidak mendukung deteksi lokasi'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      (err) => {
        const msg =
          err.code === err.PERMISSION_DENIED
            ? 'Izin lokasi ditolak. Aktifkan izin lokasi di browser, atau pilih lokasi lewat pencarian/peta.'
            : err.code === err.TIMEOUT
              ? 'Deteksi lokasi terlalu lama. Coba lagi atau pilih lewat peta.'
              : 'Lokasi tidak dapat dideteksi. Pilih lewat pencarian atau peta.';
        reject(new Error(msg));
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    );
  });

export const formatRupiah = (n: number): string => `Rp ${Math.round(n).toLocaleString('id-ID')}`;
