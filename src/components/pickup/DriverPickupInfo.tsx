import React from 'react';
import { Navigation, MessageCircle, StickyNote } from 'lucide-react';

interface DriverPickupOrder {
  order_type?: string;
  pickup_lat?: number | null;
  pickup_lng?: number | null;
  drop_lat?: number | null;
  drop_lng?: number | null;
  pickup_note?: string;
  customer_phone?: string;
  duration_min?: number;
}

const mapsLink = (lat: number, lng: number) =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;

const toWhatsApp = (phone: string) => {
  const d = phone.replace(/\D/g, '');
  return d.startsWith('0') ? `62${d.slice(1)}` : d;
};

/** Info tambahan di kartu order dashboard pengayuh untuk order mode jemput */
const DriverPickupInfo: React.FC<{ order: DriverPickupOrder; active?: boolean }> = ({ order, active }) => {
  if (order.order_type !== 'jemput') return null;
  const hasPickup = order.pickup_lat != null && order.pickup_lng != null;
  const hasDrop = order.drop_lat != null && order.drop_lng != null;

  return (
    <div className="mb-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded">Jemput</span>
        {!!order.duration_min && <span className="text-xs text-gray-500">± {order.duration_min} menit perjalanan</span>}
      </div>
      {order.pickup_note && (
        <p className="flex items-start gap-1.5 text-sm text-gray-700">
          <StickyNote size={14} className="mt-0.5 text-gray-500 shrink-0" />
          <span><span className="font-medium">Patokan:</span> {order.pickup_note}</span>
        </p>
      )}
      {!active && <p className="text-xs text-gray-500">Nomor pelanggan tampil setelah pesanan diterima.</p>}
      <div className="flex flex-wrap gap-2">
        {hasPickup && (
          <a
            href={mapsLink(order.pickup_lat!, order.pickup_lng!)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-md border border-emerald-200 text-emerald-800 hover:bg-emerald-50"
          >
            <Navigation size={13} /> Rute ke titik jemput
          </a>
        )}
        {active && hasDrop && (
          <a
            href={mapsLink(order.drop_lat!, order.drop_lng!)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-md border border-red-200 text-red-700 hover:bg-red-50"
          >
            <Navigation size={13} /> Rute ke tujuan
          </a>
        )}
        {active && order.customer_phone && (
          <a
            href={`https://wa.me/${toWhatsApp(order.customer_phone)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-md bg-green-600 text-white hover:bg-green-700"
          >
            <MessageCircle size={13} /> WA pelanggan
          </a>
        )}
      </div>
    </div>
  );
};

export default DriverPickupInfo;
