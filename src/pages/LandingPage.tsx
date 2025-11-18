import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, CreditCard, CheckCircle, Star, ChevronRight, Leaf, Shield, Users, Download } from 'lucide-react';

const LandingPage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="text-white overflow-hidden relative" style={{ backgroundColor: '#264A7C' }}>
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <pattern id="grid" width="8" height="32" patternUnits="userSpaceOnUse">
              <path d="M 8 0 L 0 0 0 8" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative z-10">
          <div className="md:flex md:items-center md:justify-between">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <div className="inline-block px-3 py-1 rounded-full text-sm font-medium text-white mb-4 animate-pulse" style={{ backgroundColor: 'rgba(38, 74, 124, 0.5)' }}>
                Transportasi Masa Depan
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                Andong<span className="text-yellow-300">Jogja</span>
              </h1>
              <p className="text-xl md:text-2xl mb-6" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                Transportasi ramah lingkungan untuk mobilitas perkotaan yang lebih baik
              </p>
              <p className="mb-8 max-w-lg" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                Nikmati perjalanan yang nyaman, aman, dan tanpa polusi dengan layanan AndongJogja kami. 
                Solusi transportasi modern dengan sentuhan tradisional.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link 
                  to="/pesan" 
                  className="inline-flex items-center bg-white font-semibold px-6 py-3 rounded-lg shadow-lg transition duration-300 transform hover:-translate-y-1 hover:bg-gray-50"
                  style={{ color: '#264A7C' }}
                >
                  Pesan Sekarang
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Link>
                <a 
                  href="https://drive.usercontent.google.com/download?id=1ChlUvSQ0AXeJPKvoS5Dk3JyOb42JS3FQ&export=download&authuser=0&confirm=t&uuid=e5488790-41b5-46ce-af19-53f0d94cb1ac&at=AN8xHopDYUbwJyJS6eGCjRKZiK18:1757302923429" 
                  className="inline-flex items-center bg-yellow-500 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:bg-yellow-400 transition duration-300 transform hover:-translate-y-1"
                >
                  <Download className="mr-2 h-5 w-5" />
                  Download Aplikasi
                </a>
                {/* <a 
                  href="#cara-order" 
                  className="inline-flex items-center bg-transparent border-2 border-white text-white font-semibold px-6 py-3 rounded-lg hover:bg-white hover:bg-opacity-10 transition duration-300"
                >
                  Pelajari Lebih Lanjut
                </a> */}
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <div className="relative w-full max-w-md h-64 md:h-96 rounded-lg overflow-hidden shadow-2xl transform md:rotate-1 hover:rotate-0 transition-transform duration-500">
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ color: '#264A7C' }}>
                  <path d="M0,0 L100,0 L100,100 L0,100 Z" fill="currentColor" />
                </svg>
                <svg className="absolute w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
                  <g transform="translate(400, 300)">
                    <path d="M120,-157.6C152.7,-141.5,174.3,-102.6,184.4,-62.4C194.4,-22.2,192.9,19.2,178.4,56.8C164,94.3,136.5,128,102.8,141.8C69.2,155.6,29.4,149.5,-5.4,156.9C-40.2,164.2,-70.1,185,-104.3,178.5C-138.6,172,-177.1,138.3,-191.4,97.8C-205.7,57.2,-195.7,9.8,-185.9,-36.1C-176.1,-81.9,-166.5,-126.3,-139.7,-145.7C-112.8,-165.1,-68.9,-159.6,-28.2,-177.5C12.4,-195.4,87.2,-173.7,120,-157.6Z" fill="#264A7C" />
                  </g>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <img src="image/hero.jpg" alt="AndongJogja" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block px-3 py-1 rounded-full text-sm font-medium mb-4" style={{ backgroundColor: 'rgba(38, 74, 124, 0.1)', color: '#264A7C' }}>
              Keunggulan Kami
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Mengapa Memilih AndongJogja?</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Kami menawarkan solusi transportasi yang efisien, nyaman dan ramah lingkungan untuk kebutuhan perjalanan Anda.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 border border-gray-200 rounded-xl text-center hover:shadow-xl transition duration-300 hover:-translate-y-1" style={{ '--hover-border-color': '#264A7C' } as React.CSSProperties} onMouseEnter={(e) => e.currentTarget.style.borderColor = '#264A7C'} onMouseLeave={(e) => e.currentTarget.style.borderColor = ''}>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6" style={{ backgroundColor: 'rgba(38, 74, 124, 0.1)', color: '#264A7C' }}>
                <Clock size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-3">Efisien & Cepat</h3>
              <p className="text-gray-600">
                Hindari kemacetan dan nikmati perjalanan yang lebih cepat di area perkotaan yang padat.
              </p>
            </div>
            
            <div className="p-8 border border-gray-200 rounded-xl text-center hover:shadow-xl transition duration-300 hover:-translate-y-1" style={{ '--hover-border-color': '#264A7C' } as React.CSSProperties} onMouseEnter={(e) => e.currentTarget.style.borderColor = '#264A7C'} onMouseLeave={(e) => e.currentTarget.style.borderColor = ''}>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6" style={{ backgroundColor: 'rgba(38, 74, 124, 0.1)', color: '#264A7C' }}>
                <Leaf size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-3">Ramah Lingkungan</h3>
              <p className="text-gray-600">
                Tanpa emisi karbon, membantu mengurangi polusi udara dan menciptakan kota yang lebih sehat.
              </p>
            </div>
            
            <div className="p-8 border border-gray-200 rounded-xl text-center hover:shadow-xl transition duration-300 hover:-translate-y-1" style={{ '--hover-border-color': '#264A7C' } as React.CSSProperties} onMouseEnter={(e) => e.currentTarget.style.borderColor = '#264A7C'} onMouseLeave={(e) => e.currentTarget.style.borderColor = ''}>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6" style={{ backgroundColor: 'rgba(38, 74, 124, 0.1)', color: '#264A7C' }}>
                <CreditCard size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-3">Harga Terjangkau</h3>
              <p className="text-gray-600">
                Nikmati perjalanan dengan tarif transparan dan lebih ekonomis dibandingkan transportasi lainnya.
              </p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mt-8">
            <div className="p-8 border border-gray-200 rounded-xl text-center hover:shadow-xl transition duration-300 hover:-translate-y-1" style={{ '--hover-border-color': '#264A7C' } as React.CSSProperties} onMouseEnter={(e) => e.currentTarget.style.borderColor = '#264A7C'} onMouseLeave={(e) => e.currentTarget.style.borderColor = ''}>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6" style={{ backgroundColor: 'rgba(38, 74, 124, 0.1)', color: '#264A7C' }}>
                <Shield size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-3">Aman & Nyaman</h3>
              <p className="text-gray-600">
                Pengemudi terlatih dan andong yang terawat untuk kenyamanan dan keamanan perjalanan Anda.
              </p>
            </div>
            
            <div className="p-8 border border-gray-200 rounded-xl text-center hover:shadow-xl transition duration-300 hover:-translate-y-1" style={{ '--hover-border-color': '#264A7C' } as React.CSSProperties} onMouseEnter={(e) => e.currentTarget.style.borderColor = '#264A7C'} onMouseLeave={(e) => e.currentTarget.style.borderColor = ''}>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6" style={{ backgroundColor: 'rgba(38, 74, 124, 0.1)', color: '#264A7C' }}>
                <Users size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-3">Komunitas Lokal</h3>
              <p className="text-gray-600">
                Mendukung ekonomi lokal dan memberdayakan pengemudi andong dengan teknologi modern.
              </p>
            </div>
            
            <div className="p-8 border border-gray-200 rounded-xl text-center hover:shadow-xl transition duration-300 hover:-translate-y-1" style={{ '--hover-border-color': '#264A7C' } as React.CSSProperties} onMouseEnter={(e) => e.currentTarget.style.borderColor = '#264A7C'} onMouseLeave={(e) => e.currentTarget.style.borderColor = ''}>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6" style={{ backgroundColor: 'rgba(38, 74, 124, 0.1)', color: '#264A7C' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v8"></path><path d="m4.93 10.93 1.41 1.41"></path><path d="M2 18h2"></path><path d="M20 18h2"></path><path d="m19.07 10.93-1.41 1.41"></path><path d="M22 22H2"></path><path d="m8 22 4-10 4 10"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Fleksibel</h3>
              <p className="text-gray-600">
                Tersedia kapan saja dan di mana saja Anda membutuhkannya, dengan pemesanan yang mudah.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How to Order Section */}
      <section id="cara-order" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block px-3 py-1 rounded-full text-sm font-medium mb-4" style={{ backgroundColor: 'rgba(38, 74, 124, 0.1)', color: '#264A7C' }}>
              Mudah & Cepat
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Cara Order</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Memesan AndongJogja sangat mudah! Ikuti langkah sederhana di bawah ini.
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            <div className="p-8 bg-white rounded-xl text-center shadow-md relative group hover:shadow-xl transition duration-300">
              <div className="absolute -top-5 -left-5 w-12 h-12 text-white rounded-full flex items-center justify-center font-bold text-xl transition-colors duration-300" style={{ backgroundColor: '#264A7C' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e3a5f'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#264A7C'}>
                1
              </div>
              <div className="mb-6 h-16 flex items-center justify-center">
                <MapPin size={40} style={{ color: '#264A7C' }} />
              </div>
              <h3 className="text-xl font-semibold mb-3">Pilih Moda Transportasi</h3>
              <p className="text-gray-600">
                Masukkan kode andong yang tersedia di lokasi Anda.
              </p>
            </div>
            
            <div className="p-8 bg-white rounded-xl text-center shadow-md relative group hover:shadow-xl transition duration-300">
              <div className="absolute -top-5 -left-5 w-12 h-12 text-white rounded-full flex items-center justify-center font-bold text-xl transition-colors duration-300" style={{ backgroundColor: '#264A7C' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e3a5f'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#264A7C'}>
                2
              </div>
              <div className="mb-6 h-16 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#264A7C' }}>
                  <path d="M12 2v8"></path><path d="m4.93 10.93 1.41 1.41"></path><path d="M2 18h2"></path><path d="M20 18h2"></path><path d="m19.07 10.93-1.41 1.41"></path><path d="M22 22H2"></path><path d="m8 22 4-10 4 10"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Pilih Jarak</h3>
              <p className="text-gray-600">
                Tentukan jarak perjalanan Anda: dekat, sedang, atau jauh.
              </p>
            </div>
            
            <div className="p-8 bg-white rounded-xl text-center shadow-md relative group hover:shadow-xl transition duration-300">
              <div className="absolute -top-5 -left-5 w-12 h-12 text-white rounded-full flex items-center justify-center font-bold text-xl transition-colors duration-300" style={{ backgroundColor: '#264A7C' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e3a5f'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#264A7C'}>
                3
              </div>
              <div className="mb-6 h-16 flex items-center justify-center">
                <CreditCard size={40} style={{ color: '#264A7C' }} />
              </div>
              <h3 className="text-xl font-semibold mb-3">Bayar</h3>
              <p className="text-gray-600">
                Lakukan pembayaran dengan mudah melalui QR code yang tersedia.
              </p>
            </div>
            
            <div className="p-8 bg-white rounded-xl text-center shadow-md relative group hover:shadow-xl transition duration-300">
              <div className="absolute -top-5 -left-5 w-12 h-12 text-white rounded-full flex items-center justify-center font-bold text-xl transition-colors duration-300" style={{ backgroundColor: '#264A7C' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e3a5f'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#264A7C'}>
                4
              </div>
              <div className="mb-6 h-16 flex items-center justify-center">
                <CheckCircle size={40} style={{ color: '#264A7C' }} />
              </div>
              <h3 className="text-xl font-semibold mb-3">Nikmati Perjalanan</h3>
              <p className="text-gray-600">
                Pesanan Anda dikirim ke pengemudi dan siap untuk berangkat!
              </p>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <Link 
              to="/pesan" 
              className="inline-flex items-center text-white font-semibold px-8 py-4 rounded-lg shadow-lg transition duration-300 transform hover:-translate-y-1"
              style={{ backgroundColor: '#264A7C' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e3a5f'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#264A7C'}
            >
              Pesan Sekarang
              <ChevronRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block px-3 py-1 rounded-full text-sm font-medium mb-4" style={{ backgroundColor: 'rgba(38, 74, 124, 0.1)', color: '#264A7C' }}>
              Testimoni
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Apa Kata Pelanggan Kami</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Pengalaman nyata dari pengguna layanan AndongJogja.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 bg-gray-50 rounded-xl shadow-md hover:shadow-xl transition duration-300">
              <div className="flex items-center mb-6">
                <div className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl" style={{ backgroundColor: 'rgba(38, 74, 124, 0.1)', color: '#264A7C' }}>BS</div>
                <div className="ml-4">
                  <h4 className="text-lg font-semibold">Budi Santoso</h4>
                  <div className="flex text-yellow-400">
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                  </div>
                </div>
              </div>
              <p className="text-gray-600 italic">
                "Sangat memudahkan perjalanan saya ke pasar setiap pagi. Hemat waktu dan nyaman. Saya suka karena ramah lingkungan."
              </p>
            </div>
            
            <div className="p-8 bg-gray-50 rounded-xl shadow-md hover:shadow-xl transition duration-300">
              <div className="flex items-center mb-6">
                <div className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl" style={{ backgroundColor: 'rgba(38, 74, 124, 0.1)', color: '#264A7C' }}>SR</div>
                <div className="ml-4">
                  <h4 className="text-lg font-semibold">Siti Rahma</h4>
                  <div className="flex text-yellow-400">
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                  </div>
                </div>
              </div>
              <p className="text-gray-600 italic">
                "Aplikasinya sangat mudah digunakan. Saya suka bagaimana saya bisa melihat harga dengan jelas sebelum memesan. Pengemudinya juga ramah."
              </p>
            </div>
            
            <div className="p-8 bg-gray-50 rounded-xl shadow-md hover:shadow-xl transition duration-300">
              <div className="flex items-center mb-6">
                <div className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl" style={{ backgroundColor: 'rgba(38, 74, 124, 0.1)', color: '#264A7C' }}>AR</div>
                <div className="ml-4">
                  <h4 className="text-lg font-semibold">Ahmad Reza</h4>
                  <div className="flex text-yellow-400">
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                  </div>
                </div>
              </div>
              <p className="text-gray-600 italic">
                "Sebagai turis, saya merasa ini adalah cara terbaik untuk menjelajahi kota. Pengalaman yang unik dan ramah lingkungan."
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 text-white" style={{ background: 'linear-gradient(to bottom right, #264A7C, #1e3a5f)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Siap Untuk Mencoba AndongJogja?</h2>
          <p className="text-xl mb-10 max-w-3xl mx-auto" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            Bergabunglah dengan ribuan orang yang telah beralih ke transportasi ramah lingkungan. Pesan perjalanan pertama Anda sekarang!
          </p>
          <Link 
            to="/pesan" 
            className="inline-flex items-center bg-white font-semibold px-8 py-4 rounded-lg shadow-lg hover:bg-gray-50 transition duration-300 transform hover:-translate-y-1 text-lg"
            style={{ color: '#264A7C' }}
          >
            Pesan Sekarang
            <ChevronRight className="ml-2 h-6 w-6" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;