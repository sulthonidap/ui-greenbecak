import React, { useEffect, useRef, useState } from 'react';
import { Search, Star, MapPin, Loader2, X } from 'lucide-react';
import { geoAPI, LatLng, Place } from '../../services/bookingService';

interface PlaceSearchProps {
  placeholder?: string;
  bias?: LatLng | null;
  onSelect: (place: Place) => void;
  autoFocus?: boolean;
  onCancel?: () => void;
}

/** Kolom pencarian tempat: destinasi populer (admin) + OpenStreetMap */
const PlaceSearch: React.FC<PlaceSearchProps> = ({ placeholder = 'Cari tempat atau alamat...', bias, onSelect, autoFocus, onCancel }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearched(false);
      setWarning(null);
      return;
    }
    const id = ++requestId.current;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await geoAPI.search(q, bias);
        if (id !== requestId.current) return; // abaikan hasil lama
        setResults(res.results || []);
        setWarning(res.warning || null);
      } catch {
        if (id !== requestId.current) return;
        setResults([]);
        setWarning('Pencarian sedang bermasalah, silakan pilih lewat peta');
      } finally {
        if (id === requestId.current) {
          setLoading(false);
          setSearched(true);
        }
      }
    }, 400);
    return () => clearTimeout(timer);
    // bias sengaja tidak jadi dependency agar tidak mencari ulang setiap posisi berubah
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          autoFocus={autoFocus}
          onChange={e => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-9 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
        />
        {loading ? (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
        ) : (query || onCancel) ? (
          <button
            type="button"
            onClick={() => (query ? setQuery('') : onCancel?.())}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
            aria-label="Hapus pencarian"
          >
            <X className="w-4 h-4" />
          </button>
        ) : null}
      </div>

      {(results.length > 0 || (searched && !loading) || warning) && query.trim().length >= 2 && (
        <div className="absolute z-[1000] mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 overflow-y-auto">
          {results.map((p, i) => (
            <button
              key={`${p.name}-${p.lat}-${p.lng}-${i}`}
              type="button"
              onClick={() => {
                onSelect(p);
                setQuery('');
                setResults([]);
              }}
              className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-green-50 border-b border-gray-100 last:border-0"
            >
              {p.type === 'destination' ? (
                <Star className="w-4 h-4 mt-0.5 text-amber-500 flex-shrink-0" fill="currentColor" />
              ) : (
                <MapPin className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
              )}
              <span className="min-w-0">
                <span className="block text-sm font-medium text-gray-900 truncate">{p.name}</span>
                {p.address && <span className="block text-xs text-gray-500 truncate">{p.address}</span>}
              </span>
            </button>
          ))}
          {searched && !loading && results.length === 0 && (
            <p className="px-3 py-3 text-sm text-gray-500">Tidak ditemukan. Coba kata lain atau pilih lewat peta.</p>
          )}
          {warning && <p className="px-3 py-2 text-xs text-amber-700 bg-amber-50">{warning}</p>}
        </div>
      )}
    </div>
  );
};

export default PlaceSearch;
