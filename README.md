# GreenBecak - Transportasi Ramah Lingkungan

GreenBecak adalah aplikasi web modern untuk layanan transportasi ramah lingkungan yang menggabungkan transportasi tradisional Indonesia (becak dan delman) dengan teknologi modern untuk menciptakan solusi transportasi yang berkelanjutan.

## 🌱 Tentang Aplikasi

GreenBecak (BecakJogja) adalah platform transportasi yang menawarkan:
- **Becak Listrik** - Transportasi tradisional yang dimodernisasi dengan tenaga listrik
- **Delman** - Transportasi tradisional dengan kuda

Aplikasi ini dirancang untuk memberikan solusi transportasi yang efisien, nyaman, dan ramah lingkungan untuk kebutuhan perjalanan di area perkotaan.

## 🚀 Fitur Utama

### 👥 Multi-User System
- **Pelanggan** - Memesan transportasi dengan mudah
- **Driver** - Mengelola pesanan dan status online/offline
- **Admin** - Mengelola sistem dan memantau operasional

### 📱 Halaman Utama
- **Landing Page** - Informasi layanan dan keunggulan
- **Halaman Pemesanan** - Form pemesanan transportasi
- **Halaman Pembayaran** - Proses pembayaran yang aman

### 🎛️ Dashboard
- **Admin Dashboard** - Panel manajemen lengkap
- **Driver Dashboard** - Panel untuk driver mengelola pesanan

## 🛠️ Teknologi yang Digunakan

### Frontend
- **React 18** - Library JavaScript untuk UI
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool yang cepat
- **Tailwind CSS** - Framework CSS utility-first
- **React Router DOM** - Client-side routing
- **Lucide React** - Icon library

### State Management
- **React Context** - State management untuk autentikasi dan pesanan

## 📦 Instalasi dan Setup

### Prerequisites
- Node.js (versi 16 atau lebih baru)
- npm atau yarn

### Langkah Instalasi

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd greenbecak
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Jalankan aplikasi dalam mode development**
   ```bash
   npm run dev
   ```

4. **Build untuk production**
   ```bash
   npm run build
   ```

5. **Preview build production**
   ```bash
   npm run preview
   ```

## 🎯 Cara Penggunaan

### Untuk Pelanggan
1. Buka halaman utama aplikasi
2. Klik "Pesan Sekarang" atau navigasi ke halaman pemesanan
3. Pilih jenis transportasi (Becak Listrik atau Delman)
4. Isi formulir pemesanan:
   - Kode becak/delman
   - Pilihan jarak perjalanan
   - Nomor WhatsApp
5. Lanjutkan ke halaman pembayaran

### Untuk Driver
1. Login melalui halaman driver login
2. Akses dashboard driver
3. Kelola pesanan yang masuk
4. Update status online/offline

### Untuk Admin
1. Login melalui halaman admin login
2. Akses dashboard admin
3. Pantau:
   - Status driver
   - Pesanan aktif dan selesai
   - Statistik pendapatan
   - Pengaturan sistem

## 📁 Struktur Proyek

```
greenbecak/
├── src/
│   ├── components/          # Komponen React yang dapat digunakan kembali
│   │   ├── Footer.tsx
│   │   ├── Navbar.tsx
│   │   └── ProtectedRoute.tsx
│   ├── context/            # React Context untuk state management
│   │   ├── AuthContext.tsx
│   │   └── OrderContext.tsx
│   ├── pages/              # Halaman-halaman aplikasi
│   │   ├── LandingPage.tsx
│   │   ├── OrderPage.tsx
│   │   ├── PaymentPage.tsx
│   │   ├── AdminLogin.tsx
│   │   ├── DriverLogin.tsx
│   │   ├── AdminDashboard.tsx
│   │   └── DriverDashboard.tsx
│   ├── App.tsx             # Komponen utama aplikasi
│   └── main.tsx            # Entry point aplikasi
├── public/                 # Asset statis
├── package.json            # Dependencies dan scripts
└── README.md              # Dokumentasi
```

## 🔧 Scripts yang Tersedia

- `npm run dev` - Menjalankan development server
- `npm run build` - Build aplikasi untuk production
- `npm run preview` - Preview build production
- `npm run lint` - Menjalankan ESLint

## 🌟 Keunggulan

- **Ramah Lingkungan** - Menggunakan transportasi tradisional yang sustainable
- **User-Friendly** - Interface yang intuitif dan mudah digunakan
- **Real-time** - Update status driver dan pesanan secara real-time
- **Responsive** - Dapat diakses dari berbagai perangkat
- **Modern Tech Stack** - Menggunakan teknologi terbaru untuk performa optimal

## 🤝 Kontribusi

Untuk berkontribusi pada proyek ini:
1. Fork repository
2. Buat branch fitur baru
3. Commit perubahan
4. Push ke branch
5. Buat Pull Request

## 📄 Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE).

## 📞 Kontak

Untuk pertanyaan atau dukungan, silakan hubungi tim pengembang GreenBecak.

---

**GreenBecak** - Transportasi Masa Depan yang Ramah Lingkungan 🌱