import React, { useEffect, useRef, useState } from 'react';
import { Search, Loader2, X } from 'lucide-react';
import { searchPlaces, PlaceResult } from '../../services/geo';
import type { LatLngPoint } from '../../services/api';

interface PlaceSearchProps {
  placeholder: string;
  area: { center: LatLngPoint; radiusKm: number };
  onSelect: (place: PlaceResult) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

const PlaceSearch: React.FC<PlaceSearchProps> = ({ placeholder, area, onSelect, disabled, autoFocus }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const { lat, lng } = area.center;
  const radiusKm = area.radiusKm;

  // Cari setelah berhenti mengetik (debounce, sesuai batas Nominatim)
  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) {
      setResults([]);
      setLoading(false);
      setError('');
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const items = await searchPlaces(q, { center: { lat, lng }, radiusKm }, controller.signal);
        setResults(items);
        setOpen(true);
        if (items.length === 0) setError('Tempat tidak ditemukan. Coba kata lain atau pilih di peta.');
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setError('Pencarian gagal, coba lagi.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 700);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, lat, lng, radiusKm]);

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={wrapRef}>
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="search"
          value={query}
          autoFocus={autoFocus}
          disabled={disabled}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-9 pr-9 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/40 focus:border-emerald-700"
        />
        {loading ? (
          <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
        ) : query ? (
          <button
            type="button"
            aria-label="Hapus pencarian"
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        ) : null}
      </div>

      {open && (results.length > 0 || error) && (
        <ul className="absolute z-[1000] mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-auto">
          {results.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(r);
                  setQuery('');
                  setResults([]);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2.5 hover:bg-emerald-50 border-b border-gray-100 last:border-0"
              >
                <p className="text-sm font-medium text-gray-900">{r.name}</p>
                <p className="text-xs text-gray-500 line-clamp-1">{r.address}</p>
              </button>
            </li>
          ))}
          {error && results.length === 0 && <li className="px-3 py-2.5 text-sm text-gray-500">{error}</li>}
        </ul>
      )}
      <p className="sr-only" aria-live="polite">
        {loading ? 'Mencari…' : error}
      </p>
    </div>
  );
};

export default PlaceSearch;
