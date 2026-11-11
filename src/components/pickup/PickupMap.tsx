import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { LatLngPoint } from '../../services/api';
import { pickupIcon, dropIcon, driverIcon } from './mapIcons';

interface PickupMapProps {
  center: LatLngPoint;
  pickup: LatLngPoint | null;
  drop: LatLngPoint | null;
  driver?: LatLngPoint | null;
  route?: [number, number][];
  serviceArea?: { center: LatLngPoint; radiusKm: number };
  onMapClick?: (p: LatLngPoint) => void;
  onPickupDrag?: (p: LatLngPoint) => void;
  onDropDrag?: (p: LatLngPoint) => void;
  className?: string;
}

const ClickHandler: React.FC<{ onClick?: (p: LatLngPoint) => void }> = ({ onClick }) => {
  useMapEvents({
    click: (e) => onClick?.({ lat: e.latlng.lat, lng: e.latlng.lng }),
  });
  return null;
};

/** Sesuaikan zoom supaya semua titik terlihat setiap kali titiknya berubah */
const FitBounds: React.FC<{ points: LatLngPoint[] }> = ({ points }) => {
  const map = useMap();
  const key = points.map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join('|');
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], Math.max(map.getZoom(), 16), { animate: true });
      return;
    }
    map.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number])), {
      padding: [40, 40],
      maxZoom: 17,
      animate: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map]);
  return null;
};

const dragHandler = (cb?: (p: LatLngPoint) => void) => ({
  dragend: (e: L.LeafletEvent) => {
    const ll = (e.target as L.Marker).getLatLng();
    cb?.({ lat: ll.lat, lng: ll.lng });
  },
});

const PickupMap: React.FC<PickupMapProps> = ({
  center,
  pickup,
  drop,
  driver,
  route,
  serviceArea,
  onMapClick,
  onPickupDrag,
  onDropDrag,
  className = 'h-72 sm:h-80',
}) => {
  const fitPoints = useMemo(
    () => [pickup, drop, driver].filter((p): p is LatLngPoint => !!p),
    [pickup, drop, driver],
  );
  const pickupEvents = useMemo(() => dragHandler(onPickupDrag), [onPickupDrag]);
  const dropEvents = useMemo(() => dragHandler(onDropDrag), [onDropDrag]);

  return (
    <div className={`relative rounded-lg overflow-hidden border border-gray-200 z-0 ${className}`}>
      <MapContainer center={[center.lat, center.lng]} zoom={14} className="h-full w-full" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {serviceArea && serviceArea.radiusKm > 0 && (
          <Circle
            center={[serviceArea.center.lat, serviceArea.center.lng]}
            radius={serviceArea.radiusKm * 1000}
            pathOptions={{ color: '#047857', weight: 1, fillOpacity: 0.03, dashArray: '6 6' }}
          />
        )}
        {route && route.length > 1 && (
          <Polyline positions={route} pathOptions={{ color: '#047857', weight: 5, opacity: 0.8 }} />
        )}
        {pickup && (
          <Marker
            position={[pickup.lat, pickup.lng]}
            icon={pickupIcon}
            draggable={!!onPickupDrag}
            eventHandlers={pickupEvents}
          />
        )}
        {drop && (
          <Marker position={[drop.lat, drop.lng]} icon={dropIcon} draggable={!!onDropDrag} eventHandlers={dropEvents} />
        )}
        {driver && <Marker position={[driver.lat, driver.lng]} icon={driverIcon} />}
        <ClickHandler onClick={onMapClick} />
        <FitBounds points={fitPoints} />
      </MapContainer>
    </div>
  );
};

export default PickupMap;
