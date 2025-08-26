import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Search,
  Edit3,
  Trash2,
  CheckCircle,
  XCircle,
  MapPin,
  ToggleLeft,
  ToggleRight,
  Users,
  Filter,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icon path for Leaflet in Vite
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface StandLocation {
  id: string;
  code: string;
  name: string;
  type?: 'becak-listrik' | 'delman';
  latitude: number;
  longitude: number;
  radiusMeters?: number;
  address?: string;
  capacity?: number;
  isActive: boolean;
  queueEnabled?: boolean;
  currentDrivers?: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const mockStands: StandLocation[] = [
  {
    id: 'POS-MLB-01',
    code: 'POS-MLB-01',
    name: 'Pos Malioboro Utara',
    type: 'becak-listrik',
    latitude: -7.7901,
    longitude: 110.3657,
    radiusMeters: 80,
    address: 'Jl. Malioboro, Kota Yogyakarta',
    capacity: 15,
    isActive: true,
    queueEnabled: true,
    currentDrivers: ['D001', 'D002', 'D004'],
    notes: 'Lokasi ramai saat sore-malam.',
    createdAt: new Date('2024-11-01'),
    updatedAt: new Date('2024-12-18'),
  },
  {
    id: 'POS-ALN-01',
    code: 'POS-ALN-01',
    name: 'Pos Alun-alun Kidul',
    type: 'delman',
    latitude: -7.8132,
    longitude: 110.3647,
    radiusMeters: 100,
    address: 'Alun-alun Kidul, Kota Yogyakarta',
    capacity: 10,
    isActive: true,
    queueEnabled: false,
    currentDrivers: ['D003'],
    notes: 'Event malam minggu padat.',
    createdAt: new Date('2024-10-12'),
    updatedAt: new Date('2024-12-10'),
  },
  {
    id: 'POS-TUG-01',
    code: 'POS-TUG-01',
    name: 'Pos Tugu Jogja',
    type: 'becak-listrik',
    latitude: -7.7829,
    longitude: 110.3671,
    radiusMeters: 70,
    address: 'Tugu Jogja, Kota Yogyakarta',
    capacity: 12,
    isActive: false,
    queueEnabled: true,
    currentDrivers: [],
    notes: 'Saat ini dinonaktifkan karena renovasi area.',
    createdAt: new Date('2024-09-05'),
    updatedAt: new Date('2024-11-28'),
  },
];

const emptyForm: Omit<StandLocation, 'id' | 'createdAt' | 'updatedAt'> = {
  code: '',
  name: '',
  type: 'becak-listrik',
  latitude: -7.7956,
  longitude: 110.3695,
  radiusMeters: 50,
  address: '',
  capacity: 10,
  isActive: true,
  queueEnabled: true,
  currentDrivers: [],
  notes: '',
};

const ClickToSetMarker: React.FC<{ onClick: (lat: number, lng: number) => void }>
  = ({ onClick }) => {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const StandManagement: React.FC = () => {
  const navigate = useNavigate();

  const [stands, setStands] = useState<StandLocation[]>(mockStands);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'becak-listrik' | 'delman'>('all');
  const [activeTab, setActiveTab] = useState<'list' | 'map'>('list');

  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Omit<StandLocation, 'id' | 'createdAt' | 'updatedAt'>>(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return stands.filter((s) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        (s.address || '').toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'all' || (statusFilter === 'active' ? s.isActive : !s.isActive);

      const matchesType = typeFilter === 'all' || s.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [stands, search, statusFilter, typeFilter]);

  const stats = useMemo(() => {
    const active = stands.filter((s) => s.isActive).length;
    const total = stands.length;
    const totalCapacity = stands.reduce((sum, s) => sum + (s.capacity || 0), 0);
    const totalOccupancy = stands.reduce((sum, s) => sum + (s.currentDrivers?.length || 0), 0);
    return { active, total, totalCapacity, totalOccupancy };
  }, [stands]);

  const openCreate = () => {
    setForm(emptyForm);
    setIsEditing(false);
    setEditId(null);
    setShowForm(true);
  };

  const openEdit = (stand: StandLocation) => {
    const { id, createdAt, updatedAt, ...rest } = stand;
    setForm(rest);
    setIsEditing(true);
    setEditId(id);
    setShowForm(true);
  };

  const submitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.name) {
      alert('Kode dan Nama wajib diisi');
      return;
    }

    if (isEditing && editId) {
      setStands((prev) =>
        prev.map((s) =>
          s.id === editId ? { ...s, ...form, id: editId, updatedAt: new Date() } : s
        )
      );
    } else {
      const newStand: StandLocation = {
        ...form,
        id: form.code,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setStands((prev) => [newStand, ...prev]);
    }
    setShowForm(false);
  };

  const removeStand = (id: string) => {
    if (!confirm('Hapus pos ini?')) return;
    setStands((prev) => prev.filter((s) => s.id !== id));
  };

  const toggleActive = (id: string) => {
    setStands((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isActive: !s.isActive, updatedAt: new Date() } : s))
    );
  };

  const toggleQueue = (id: string) => {
    setStands((prev) =>
      prev.map((s) => (s.id === id ? { ...s, queueEnabled: !s.queueEnabled, updatedAt: new Date() } : s))
    );
  };

  const center: [number, number] = [
    stands[0]?.latitude ?? -7.7956,
    stands[0]?.longitude ?? 110.3695,
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali ke Dashboard
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Stand Management</h1>
        <p className="text-gray-600 mt-2">Kelola tempat mangkal/pos untuk becak</p>
      </div>

      {/* Tabs */}
      <div className="mb-4 border-b border-gray-200">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          <button
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'list' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('list')}
          >
            Daftar
          </button>
          <button
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'map' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('map')}
          >
            Peta
          </button>
        </nav>
      </div>

      {activeTab === 'list' ? (
        <>
          {/* Toolbar */}
          <div className="bg-white rounded-lg shadow border border-gray-200 mb-4">
            <div className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:flex-initial">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari nama/kode/alamat..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">Semua Status</option>
                  <option value="active">Aktif</option>
                  <option value="inactive">Nonaktif</option>
                </select>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">Semua Tipe</option>
                  <option value="becak-listrik">Becak Listrik</option>
                  <option value="delman">Delman</option>
                </select>
              </div>
              <button
                onClick={openCreate}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Pos
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pos</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lokasi</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kapasitas</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Antrian</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filtered.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{s.name}</div>
                        <div className="text-xs text-gray-500">{s.code} • {s.type}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <MapPin className="w-4 h-4 mr-1" />
                          {s.address || `${s.latitude.toFixed(4)}, ${s.longitude.toFixed(4)}`}
                        </div>
                        <div className="text-xs text-gray-500">radius {s.radiusMeters || 0} m</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {s.currentDrivers?.length || 0} / {s.capacity || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleQueue(s.id)}
                          className="inline-flex items-center text-sm"
                          title="Toggle antrian"
                        >
                          {s.queueEnabled ? (
                            <><ToggleRight className="w-4 h-4 text-green-600 mr-1" /> Aktif</>
                          ) : (
                            <><ToggleLeft className="w-4 h-4 text-gray-400 mr-1" /> Mati</>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          s.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {s.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openEdit(s)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleActive(s.id)}
                            className="text-amber-600 hover:text-amber-800"
                            title={s.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                          >
                            {s.isActive ? (
                              <XCircle className="w-4 h-4" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => removeStand(s.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="h-[480px] rounded-lg overflow-hidden">
            <MapContainer center={center} zoom={14} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {filtered.map((s) => (
                <Marker key={s.id} position={[s.latitude, s.longitude]}>
                  <Popup>
                    <div className="text-sm">
                      <div className="font-semibold">{s.name}</div>
                      <div className="text-gray-600 text-xs mb-2">{s.code} • {s.type}</div>
                      <div className="text-xs">Kapasitas: {s.currentDrivers?.length || 0} / {s.capacity || 0}</div>
                      <div className="text-xs">Status: {s.isActive ? 'Aktif' : 'Nonaktif'}</div>
                    </div>
                  </Popup>
                </Marker>
              ))}
              {filtered.map((s) => (
                s.radiusMeters ? (
                  <Circle
                    key={`${s.id}-radius`}
                    center={[s.latitude, s.longitude]}
                    radius={s.radiusMeters}
                    pathOptions={{ color: s.isActive ? '#16a34a' : '#9ca3af', opacity: 0.5 }}
                  />
                ) : null
              ))}
              {showForm && (
                <ClickToSetMarker
                  onClick={(lat, lng) => setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }))}
                />
              )}
            </MapContainer>
          </div>
          <div className="flex justify-between items-center p-4 border-t">
            <div className="text-sm text-gray-600">
              Klik peta untuk mengisi koordinat saat form tambah/edit terbuka.
            </div>
            <button
              onClick={openCreate}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Pos
            </button>
          </div>
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow max-w-2xl w-full m-4">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {isEditing ? 'Edit Pos' : 'Tambah Pos'}
              </h3>
            </div>
            <form onSubmit={submitForm} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kode *</label>
                  <input
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    required
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="POS-XXXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Pos *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Contoh: Pos Malioboro Utara"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="becak-listrik">Becak Listrik</option>
                    <option value="delman">Delman</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kapasitas</label>
                  <input
                    type="number"
                    value={form.capacity ?? 0}
                    onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    min={0}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                  <input
                    type="number"
                    value={form.latitude}
                    onChange={(e) => setForm({ ...form, latitude: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    step="0.0001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                  <input
                    type="number"
                    value={form.longitude}
                    onChange={(e) => setForm({ ...form, longitude: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    step="0.0001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Radius (meter)</label>
                  <input
                    type="number"
                    value={form.radiusMeters ?? 0}
                    onChange={(e) => setForm({ ...form, radiusMeters: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    min={0}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                  <input
                    value={form.address || ''}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Alamat (opsional)"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="queueEnabled"
                    type="checkbox"
                    checked={!!form.queueEnabled}
                    onChange={(e) => setForm({ ...form, queueEnabled: e.target.checked })}
                    className="h-4 w-4 text-green-600 border-gray-300 rounded"
                  />
                  <label htmlFor="queueEnabled" className="text-sm text-gray-700">Aktifkan antrian</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="isActive"
                    type="checkbox"
                    checked={!!form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="h-4 w-4 text-green-600 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700">Pos aktif</label>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
                  <textarea
                    value={form.notes || ''}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="mt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  {isEditing ? 'Simpan Perubahan' : 'Tambah Pos'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StandManagement;
