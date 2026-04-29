import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, CreditCard, CheckCircle, Star, ChevronRight, Leaf, Shield, Users, Download, Sparkles, Zap, Heart, Award, User } from 'lucide-react';

const LandingPage: React.FC = () => {
  const themeColor = '#047857';
  const themeColorLight = 'rgba(4, 120, 87, 0.1)';
  const themeColorDark = '#065f46';
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observerRef.current?.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    const elements = document.querySelectorAll('[data-animate]');
    elements.forEach((el) => observerRef.current?.observe(el));

    return () => {
      if (observerRef.current) {
        elements.forEach((el) => observerRef.current?.unobserve(el));
      }
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden" style={{ backgroundColor: themeColor }}>
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 rounded-full opacity-15 animate-pulse" style={{ backgroundColor: '#6ee7b7', filter: 'blur(100px)' }}></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-15 animate-pulse" style={{ backgroundColor: '#34d399', filter: 'blur(100px)', animationDelay: '1s' }}></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-24 lg:py-32 relative z-10">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="text-center md:text-left animate-fade-in-up order-2 md:order-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium text-white mb-4 sm:mb-6 animate-fade-in" style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(10px)' }}>
                <Sparkles size={14} className="sm:w-4 sm:h-4 animate-spin-slow" />
                <span className="hidden sm:inline">Transportasi Tradisional Modern</span>
                <span className="sm:hidden">Transportasi Modern</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-tight animate-slide-in-left">
                <span className="text-white">Becak</span>
                <span className="text-yellow-300 ml-1 sm:ml-2 animate-bounce-slow">Jogja</span>
              </h1>
              
              <p className="text-lg sm:text-xl md:text-2xl mb-3 sm:mb-4 text-white/90 font-light animate-fade-in-up animation-delay-200">
                Jelajahi Jogja dengan cara yang autentik
              </p>
              <p className="text-sm sm:text-base md:text-lg mb-6 sm:mb-8 text-white/80 max-w-xl mx-auto md:mx-0 animate-fade-in-up animation-delay-400">
                Nikmati perjalanan yang nyaman, aman, dan ramah lingkungan dengan layanan BecakJogja. 
                Solusi transportasi tradisional dengan teknologi modern.
              </p>
              
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center md:justify-start animate-fade-in-up animation-delay-600">
                <Link 
                  to="/pesan" 
                  className="group inline-flex items-center justify-center bg-white font-semibold px-6 py-3 sm:px-8 sm:py-4 rounded-xl shadow-2xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-3xl hover:scale-105 text-sm sm:text-base"
                  style={{ color: themeColor }}
                >
                  Pesan Sekarang
                  <ChevronRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link 
                  to="/login" 
                  className="inline-flex items-center justify-center bg-yellow-400 text-gray-900 font-semibold px-6 py-3 sm:px-8 sm:py-4 rounded-xl shadow-2xl hover:bg-yellow-300 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 text-sm sm:text-base"
                >
                  <User className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Login
                </Link>
              </div>
            </div>
            
            <div className="relative animate-fade-in-right order-1 md:order-2">
              <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-500 animate-float">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                <img 
                  src="image/hero.jpg" 
                  alt="BecakJogja" 
                  className="w-full h-[300px] sm:h-[400px] md:h-[500px] object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 h-24 sm:h-32 bg-gradient-to-t from-black/50 to-transparent"></div>
              </div>
              {/* Decorative elements - hidden on mobile */}
              <div className="hidden sm:block absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-30 animate-pulse" style={{ backgroundColor: themeColor, filter: 'blur(20px)' }}></div>
              <div className="hidden sm:block absolute -bottom-6 -left-6 w-32 h-32 rounded-full opacity-20 animate-pulse" style={{ backgroundColor: '#6ee7b7', filter: 'blur(30px)', animationDelay: '1.5s' }}></div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-16 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {[
              { number: '500+', label: 'Pengemudi Terdaftar' },
              { number: '10K+', label: 'Perjalanan Selesai' },
              { number: '4.8', label: 'Rating Pengguna' },
              { number: '24/7', label: 'Layanan Tersedia' }
            ].map((stat, idx) => (
              <div 
                key={idx} 
                className="text-center animate-fade-in-up"
                data-animate
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold mb-1 sm:mb-2 animate-count-up" style={{ color: themeColor }}>{stat.number}</div>
                <div className="text-xs sm:text-sm md:text-base text-gray-600 px-2">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium mb-3 sm:mb-4 animate-fade-in" style={{ backgroundColor: themeColorLight, color: themeColor }}>
              <Award size={14} className="sm:w-4 sm:h-4 animate-spin-slow" />
              <span>Keunggulan Kami</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 text-gray-900 animate-fade-in-up px-4">Mengapa Pilih BecakJogja?</h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto animate-fade-in-up animation-delay-200 px-4">
              Solusi transportasi yang menggabungkan tradisi dan teknologi untuk pengalaman terbaik
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                icon: <Zap size={32} />,
                title: 'Efisien & Cepat',
                description: 'Hindari kemacetan dan nikmati perjalanan yang lebih cepat di area perkotaan yang padat.'
              },
              {
                icon: <Leaf size={32} />,
                title: 'Ramah Lingkungan',
                description: 'Tanpa emisi karbon, membantu mengurangi polusi udara dan menciptakan kota yang lebih sehat.'
              },
              {
                icon: <CreditCard size={32} />,
                title: 'Harga Terjangkau',
                description: 'Nikmati perjalanan dengan tarif transparan dan lebih ekonomis dibandingkan transportasi lainnya.'
              },
              {
                icon: <Shield size={32} />,
                title: 'Aman & Nyaman',
                description: 'Pengemudi terlatih dan becak yang terawat untuk kenyamanan dan keamanan perjalanan Anda.'
              },
              {
                icon: <Users size={32} />,
                title: 'Komunitas Lokal',
                description: 'Mendukung ekonomi lokal dan memberdayakan pengemudi becak dengan teknologi modern.'
              },
              {
                icon: <Heart size={32} />,
                title: 'Pengalaman Autentik',
                description: 'Rasakan keindahan Jogja dengan cara yang tradisional namun tetap modern dan nyaman.'
              }
            ].map((feature, idx) => (
              <div 
                key={idx}
                className="group p-6 sm:p-8 bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-transparent transition-all duration-300 hover:-translate-y-2 animate-fade-in-up"
                data-animate
                style={{ animationDelay: `${idx * 100}ms` }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = themeColor;
                  e.currentTarget.style.boxShadow = `0 20px 25px -5px ${themeColor}20`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '';
                  e.currentTarget.style.boxShadow = '';
                }}
              >
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl mb-4 sm:mb-6 transition-transform group-hover:scale-110 group-hover:rotate-6" style={{ backgroundColor: themeColorLight, color: themeColor }}>
                  <div className="scale-75 sm:scale-100">{feature.icon}</div>
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-gray-900">{feature.title}</h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Order Section */}
      <section id="cara-order" className="py-16 sm:py-20 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium mb-3 sm:mb-4 animate-fade-in" style={{ backgroundColor: themeColorLight, color: themeColor }}>
              <Clock size={14} className="sm:w-4 sm:h-4 animate-pulse" />
              <span>Mudah & Cepat</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 text-gray-900 animate-fade-in-up px-4">Cara Memesan</h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto animate-fade-in-up animation-delay-200 px-4">
              Hanya 4 langkah sederhana untuk memesan perjalanan BecakJogja Anda
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 relative">
            {/* Connection Line */}
            <div className="hidden md:block absolute top-20 sm:top-24 left-0 right-0 h-0.5 animate-draw-line" style={{ backgroundColor: themeColorLight }}></div>
            
            {[
              {
                step: '1',
                icon: <MapPin size={32} />,
                title: 'Masukkan Kode',
                description: 'Masukkan kode becak yang tersedia di lokasi Anda'
              },
              {
                step: '2',
                icon: <Clock size={32} />,
                title: 'Pilih Jarak',
                description: 'Tentukan jarak perjalanan Anda: dekat, sedang, atau jauh'
              },
              {
                step: '3',
                icon: <CreditCard size={32} />,
                title: 'Bayar',
                description: 'Lakukan pembayaran dengan mudah melalui QR code'
              },
              {
                step: '4',
                icon: <CheckCircle size={32} />,
                title: 'Nikmati Perjalanan',
                description: 'Pesanan Anda dikirim ke pengemudi dan siap berangkat!'
              }
            ].map((item, idx) => (
              <div 
                key={idx} 
                className="relative animate-fade-in-up"
                data-animate
                style={{ animationDelay: `${idx * 200}ms` }}
              >
                <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 text-center border-2 border-transparent hover:border-opacity-100"
                  style={{ 
                    borderColor: 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = themeColor;
                    e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'transparent';
                    e.currentTarget.style.transform = '';
                  }}
                >
                  <div className="absolute -top-5 sm:-top-6 left-1/2 transform -translate-x-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-lg animate-bounce-slow" style={{ backgroundColor: themeColor }}>
                    {item.step}
                  </div>
                  <div className="mt-4 sm:mt-6 mb-4 sm:mb-6 flex justify-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl flex items-center justify-center transition-transform hover:rotate-12" style={{ backgroundColor: themeColorLight, color: themeColor }}>
                      <div className="scale-75 sm:scale-100">{item.icon}</div>
                    </div>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-gray-900">{item.title}</h3>
                  <p className="text-sm sm:text-base text-gray-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12 sm:mt-16 animate-fade-in-up animation-delay-800">
            <Link 
              to="/pesan" 
              className="inline-flex items-center text-white font-semibold px-8 py-4 sm:px-10 sm:py-5 rounded-xl shadow-2xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-3xl hover:scale-105 text-base sm:text-lg animate-pulse-slow"
              style={{ backgroundColor: themeColor }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = themeColorDark}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = themeColor}
            >
              Pesan Sekarang
              <ChevronRight className="ml-2 h-5 w-5 sm:h-6 sm:w-6 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium mb-3 sm:mb-4 animate-fade-in" style={{ backgroundColor: themeColorLight, color: themeColor }}>
              <Star size={14} className="sm:w-4 sm:h-4" fill="currentColor" />
              <span>Testimoni</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 text-gray-900 animate-fade-in-up px-4">Apa Kata Pelanggan Kami</h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto animate-fade-in-up animation-delay-200 px-4">
              Pengalaman nyata dari pengguna layanan BecakJogja
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                initials: 'BS',
                name: 'Budi Santoso',
                rating: 5,
                text: 'Sangat memudahkan perjalanan saya ke pasar setiap pagi. Hemat waktu dan nyaman. Saya suka karena ramah lingkungan.'
              },
              {
                initials: 'SR',
                name: 'Siti Rahma',
                rating: 5,
                text: 'Aplikasinya sangat mudah digunakan. Saya suka bagaimana saya bisa melihat harga dengan jelas sebelum memesan. Pengemudinya juga ramah.'
              },
              {
                initials: 'AR',
                name: 'Ahmad Reza',
                rating: 5,
                text: 'Sebagai turis, saya merasa ini adalah cara terbaik untuk menjelajahi kota. Pengalaman yang unik dan ramah lingkungan.'
              }
            ].map((testimonial, idx) => (
              <div 
                key={idx}
                className="p-6 sm:p-8 bg-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 animate-fade-in-up"
                data-animate
                style={{ animationDelay: `${idx * 150}ms` }}
              >
                <div className="flex items-center mb-4 sm:mb-6">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center font-bold text-base sm:text-xl text-white shadow-lg animate-pulse-slow" style={{ backgroundColor: themeColor }}>
                    {testimonial.initials}
                  </div>
                  <div className="ml-3 sm:ml-4 flex-1">
                    <h4 className="text-base sm:text-lg font-bold text-gray-900">{testimonial.name}</h4>
                    <div className="flex text-yellow-400 mt-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} size={14} className="sm:w-4 sm:h-4 animate-bounce-slow" fill="currentColor" style={{ animationDelay: `${i * 100}ms` }} />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-sm sm:text-base text-gray-600 italic leading-relaxed">
                  "{testimonial.text}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 sm:py-20 md:py-24 text-white relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColorDark} 100%)` }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 sm:w-96 sm:h-96 rounded-full animate-pulse" style={{ backgroundColor: '#6ee7b7', filter: 'blur(100px)', opacity: 0.15 }}></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 sm:w-96 sm:h-96 rounded-full animate-pulse" style={{ backgroundColor: '#34d399', filter: 'blur(100px)', animationDelay: '1s', opacity: 0.15 }}></div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 animate-fade-in-up px-4">Siap Untuk Mencoba BecakJogja?</h2>
          <p className="text-base sm:text-lg md:text-xl mb-8 sm:mb-10 text-white/90 max-w-2xl mx-auto animate-fade-in-up animation-delay-200 px-4">
            Bergabunglah dengan ribuan orang yang telah beralih ke transportasi ramah lingkungan. 
            Pesan perjalanan pertama Anda sekarang!
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center animate-fade-in-up animation-delay-400">
            <Link 
              to="/pesan" 
              className="group inline-flex items-center justify-center bg-white font-semibold px-8 py-4 sm:px-10 sm:py-5 rounded-xl shadow-2xl hover:bg-gray-50 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-3xl hover:scale-105 text-base sm:text-lg"
              style={{ color: themeColor }}
            >
              Pesan Sekarang
              <ChevronRight className="ml-2 h-5 w-5 sm:h-6 sm:w-6 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              to="/login"
              className="inline-flex items-center justify-center bg-yellow-400 text-gray-900 font-semibold px-8 py-4 sm:px-10 sm:py-5 rounded-xl shadow-2xl hover:bg-yellow-300 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 text-base sm:text-lg"
            >
              <User className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
              Login
            </Link>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes spinSlow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes bounceSlow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes pulseSlow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

        @keyframes drawLine {
          from {
            width: 0;
          }
          to {
            width: 100%;
          }
        }

        .animate-fade-in {
          animation: fadeIn 1s ease-out;
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
          opacity: 0;
        }

        .animate-slide-in-left {
          animation: fadeInLeft 1s ease-out;
        }

        .animate-fade-in-right {
          animation: fadeInRight 1s ease-out;
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-spin-slow {
          animation: spinSlow 3s linear infinite;
        }

        .animate-bounce-slow {
          animation: bounceSlow 2s ease-in-out infinite;
        }

        .animate-pulse-slow {
          animation: pulseSlow 2s ease-in-out infinite;
        }

        .animate-draw-line {
          animation: drawLine 2s ease-out;
        }

        .animation-delay-200 {
          animation-delay: 200ms;
        }

        .animation-delay-400 {
          animation-delay: 400ms;
        }

        .animation-delay-600 {
          animation-delay: 600ms;
        }

        .animation-delay-800 {
          animation-delay: 800ms;
        }

        [data-animate] {
          opacity: 0;
        }

        [data-animate].visible {
          opacity: 1;
          animation: fadeInUp 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
