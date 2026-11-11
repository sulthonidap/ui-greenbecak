import L from 'leaflet';

const pin = (color: string, label: string) =>
  L.divIcon({
    className: '',
    iconSize: [32, 40],
    iconAnchor: [16, 38],
    html: `<div style="position:relative;width:32px;height:40px">
      <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0C7.2 0 0 7 0 15.7 0 27.5 16 40 16 40s16-12.5 16-24.3C32 7 24.8 0 16 0z" fill="${color}" stroke="#fff" stroke-width="2"/>
      </svg>
      <span style="position:absolute;top:7px;left:0;width:32px;text-align:center;color:#fff;font:700 13px/18px system-ui,sans-serif">${label}</span>
    </div>`,
  });

export const pickupIcon = pin('#047857', 'A');
export const dropIcon = pin('#dc2626', 'B');

export const driverIcon = L.divIcon({
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  html: `<div style="width:36px;height:36px;border-radius:50%;background:#1d4ed8;border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;font-size:18px">🛺</div>`,
});
