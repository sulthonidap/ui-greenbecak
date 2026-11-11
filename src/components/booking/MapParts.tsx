import React, { useEffect } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Pusat default: Malioboro
export const DEFAULT_CENTER: [number, number] = [-7.7926, 110.3658];

export const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

const pinIcon = (color: string, label: string) =>
  L.divIcon({
    className: '',
    html: `<div style="position:relative;width:32px;height:42px">
      <svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 2px 2px rgba(0,0,0,.35))">
        <path d="M16 0C7.2 0 0 7.2 0 16c0 12 16 26 16 26s16-14 16-26C32 7.2 24.8 0 16 0z" fill="${color}"/>
        <circle cx="16" cy="16" r="10" fill="#fff"/>
      </svg>
      <span style="position:absolute;top:7px;left:0;width:32px;text-align:center;font:700 12px/18px system-ui,sans-serif;color:${color}">${label}</span>
    </div>`,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -38],
  });

export const pickupIcon = pinIcon('#047857', 'A');
export const dropIcon = pinIcon('#DC2626', 'B');
export const placeIcon = pinIcon('#2563EB', '•');

export const driverIcon = L.divIcon({
  className: '',
  html: `<div style="width:36px;height:36px;border-radius:50%;background:#F59E0B;border:3px solid #fff;
    box-shadow:0 2px 6px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;font-size:18px">🛺</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

/** Klik di peta → callback koordinat */
export const MapClickHandler: React.FC<{ onClick: (lat: number, lng: number) => void; enabled?: boolean }> = ({
  onClick,
  enabled = true,
}) => {
  useMapEvents({
    click(e) {
      if (enabled) onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

/** Sesuaikan zoom agar semua titik terlihat */
export const FitBounds: React.FC<{ points: [number, number][]; maxZoom?: number }> = ({ points, maxZoom = 16 }) => {
  const map = useMap();
  const key = points.map(p => p.join(',')).join('|');
  useEffect(() => {
    if (points.length === 0) return;
    // Pastikan ukuran container sudah final sebelum menghitung zoom
    const t = setTimeout(() => {
      map.invalidateSize();
      if (points.length === 1) {
        map.setView(points[0], Math.max(map.getZoom(), 15), { animate: true });
        return;
      }
      map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom, animate: true });
    }, 100);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return null;
};

/** Leaflet perlu invalidateSize kalau container berubah ukuran (mis. di dalam modal) */
export const InvalidateSize: React.FC = () => {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 150);
    return () => clearTimeout(t);
  }, [map]);
  return null;
};
