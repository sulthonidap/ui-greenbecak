import axios, { AxiosError } from 'axios';
import api from './api';

// Sama seperti api.ts: pakai proxy Vite saat dev, VITE_API_URL saat build
const API_BASE_URL = import.meta.env.DEV
  ? '/api'
  : (import.meta.env.VITE_API_URL || 'https://api.becakjogja.id/api');

// Endpoint publik booking — tanpa kredensial
const publicApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  withCredentials: false,
});

// ===================== Tipe =====================

export interface LatLng {
  lat: number;
  lng: number;
}

export interface PlacePoint extends LatLng {
  name: string;
  address?: string;
}

export interface Place {
  name: string;
  address: string;
  lat: number;
  lng: number;
  type: 'destination' | 'place' | 'pin';
  category?: string;
}

export interface BookingRate {
  id: number;
  vehicle_type: string;
  label: string;
  base_fare: number;
  per_km: number;
  min_fare: number;
  max_distance_km: number;
  rounding: number;
  is_active: boolean;
}

export interface Destination {
  id: number;
  name: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
  sort_order: number;
  is_active: boolean;
}

export interface Hotel {
  id: number;
  name: string;
  slug: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  is_active: boolean;
  total_orders?: number;
}

export interface ServiceArea {
  min_lat: number;
  min_lng: number;
  max_lat: number;
  max_lng: number;
}

export interface BookingConfig {
  rates: BookingRate[];
  destinations: Destination[];
  service_area: ServiceArea;
  expiry_minutes: number;
  hotel?: Hotel;
}

export interface BookingQuote {
  vehicle_type: string;
  label: string;
  distance_km: number;
  duration_min: number;
  distance_source: 'route' | 'estimate';
  price: number;
  base_fare: number;
  per_km: number;
  min_fare: number;
  nearby_drivers: number;
  /** Jalur sepanjang jalan [[lat, lng], ...]; tidak ada kalau jarak hanya perkiraan */
  route?: [number, number][];
}

export type BookingStatus = 'pending' | 'accepted' | 'picked_up' | 'completed' | 'cancelled';

export interface BookingView {
  order_number: string;
  status: BookingStatus;
  status_label: string;
  pickup: { name: string; lat: number | null; lng: number | null };
  drop: { name: string; lat: number | null; lng: number | null };
  distance_km: number;
  distance_source: string;
  price: number;
  vehicle_type: string;
  customer_name: string;
  payment_status: string;
  created_at: string;
  expires_at: string | null;
  accepted_at: string | null;
  picked_up_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string;
  can_cancel: boolean;
  /** Hanya ada kalau diminta dengan withRoute */
  route?: [number, number][];
  driver?: {
    name: string;
    phone: string;
    vehicle_number: string;
    vehicle_type: string;
    rating: number;
    location?: { lat: number; lng: number; last_seen: string };
    distance_to_pickup_km?: number;
    eta_min?: number;
  };
}

export interface CreateBookingPayload {
  pickup: PlacePoint;
  drop: PlacePoint;
  vehicle_type?: string;
  customer_name: string;
  customer_phone: string;
  notes?: string;
  source?: string;
  source_ref?: string;
  hotel_slug?: string;
  customer_lat?: number;
  customer_lng?: number;
  expected_price?: number;
}

/** Ambil pesan error dari respons API */
export const apiErrorMessage = (err: unknown, fallback = 'Terjadi kesalahan, silakan coba lagi'): string => {
  const e = err as AxiosError<{ error?: string; message?: string }>;
  if (e?.response?.data?.error) return e.response.data.error;
  if (e?.response?.data?.message) return e.response.data.message;
  if (e?.code === 'ERR_NETWORK' || e?.code === 'ECONNABORTED') return 'Tidak dapat terhubung ke server. Periksa koneksi internet.';
  return fallback;
};

// ===================== Publik =====================

export const bookingAPI = {
  getConfig: async (hotelSlug?: string): Promise<BookingConfig> => {
    const res = await publicApi.get('/booking/config', { params: hotelSlug ? { hotel: hotelSlug } : {} });
    return res.data;
  },

  getQuote: async (pickup: LatLng, drop: LatLng, vehicleType?: string): Promise<BookingQuote> => {
    const res = await publicApi.post('/booking/quote', { pickup, drop, vehicle_type: vehicleType });
    return res.data.quote;
  },

  create: async (payload: CreateBookingPayload): Promise<{ tracking_token: string; booking: BookingView }> => {
    const res = await publicApi.post('/booking', payload);
    return res.data;
  },

  getStatus: async (token: string, withRoute = false): Promise<BookingView> => {
    const res = await publicApi.get(`/booking/status/${encodeURIComponent(token)}`, {
      params: withRoute ? { route: 1 } : {},
    });
    return res.data.booking;
  },

  cancel: async (token: string, reason?: string): Promise<BookingView> => {
    const res = await publicApi.post(`/booking/status/${encodeURIComponent(token)}/cancel`, { reason });
    return res.data.booking;
  },
};

export const geoAPI = {
  search: async (q: string, bias?: LatLng | null): Promise<{ results: Place[]; warning?: string }> => {
    const params: Record<string, string | number> = { q };
    if (bias) {
      params.lat = bias.lat;
      params.lng = bias.lng;
    }
    const res = await publicApi.get('/geo/search', { params });
    return res.data;
  },

  reverse: async (lat: number, lng: number): Promise<{ place: Place; in_service_area: boolean }> => {
    const res = await publicApi.get('/geo/reverse', { params: { lat, lng } });
    return res.data;
  },
};

// ===================== Admin =====================

export interface HotelInput {
  name: string;
  slug?: string;
  address?: string;
  latitude: number;
  longitude: number;
  phone?: string;
  is_active?: boolean;
}

export interface DestinationInput {
  name: string;
  category?: string;
  address?: string;
  latitude: number;
  longitude: number;
  sort_order?: number;
  is_active?: boolean;
}

export type BookingRateInput = Omit<BookingRate, 'id'>;

export const bookingAdminAPI = {
  getHotels: async (): Promise<Hotel[]> => (await api.get('/admin/hotels/')).data.hotels || [],
  createHotel: async (data: HotelInput) => (await api.post('/admin/hotels/', data)).data,
  updateHotel: async (id: number, data: HotelInput) => (await api.put(`/admin/hotels/${id}`, data)).data,
  deleteHotel: async (id: number) => (await api.delete(`/admin/hotels/${id}`)).data,

  getDestinations: async (): Promise<Destination[]> => (await api.get('/admin/destinations/')).data.destinations || [],
  createDestination: async (data: DestinationInput) => (await api.post('/admin/destinations/', data)).data,
  updateDestination: async (id: number, data: DestinationInput) => (await api.put(`/admin/destinations/${id}`, data)).data,
  deleteDestination: async (id: number) => (await api.delete(`/admin/destinations/${id}`)).data,

  getRates: async (): Promise<BookingRate[]> => (await api.get('/admin/booking-rates/')).data.rates || [],
  createRate: async (data: BookingRateInput) => (await api.post('/admin/booking-rates/', data)).data,
  updateRate: async (id: number, data: BookingRateInput) => (await api.put(`/admin/booking-rates/${id}`, data)).data,
};

// ===================== Util =====================

export const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

/** Harga per km — sama dengan rumus di backend, untuk simulasi di admin */
export const calculateBookingPrice = (rate: Pick<BookingRate, 'base_fare' | 'per_km' | 'min_fare' | 'rounding'>, km: number) => {
  let raw = rate.base_fare + km * rate.per_km;
  if (raw < rate.min_fare) raw = rate.min_fare;
  if (rate.rounding > 0) raw = Math.ceil(raw / rate.rounding) * rate.rounding;
  return raw;
};

export const VEHICLE_LABELS: Record<string, string> = {
  becak_listrik: 'Becak Listrik',
  becak_manual: 'Becak Kayuh',
  becak_motor: 'Becak Motor',
  andong: 'Andong',
};

/** Nomor WA (08xx) → format wa.me (628xx) */
export const toWaNumber = (phone: string) => {
  const d = phone.replace(/\D/g, '');
  if (d.startsWith('0')) return '62' + d.slice(1);
  return d;
};

const LAST_BOOKING_KEY = 'booking:last';

export const lastBookingStore = {
  get: (): string | null => {
    try {
      return localStorage.getItem(LAST_BOOKING_KEY);
    } catch {
      return null;
    }
  },
  set: (token: string) => {
    try {
      localStorage.setItem(LAST_BOOKING_KEY, token);
    } catch {
      /* abaikan */
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(LAST_BOOKING_KEY);
    } catch {
      /* abaikan */
    }
  },
};
