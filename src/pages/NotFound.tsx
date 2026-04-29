import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Home } from 'lucide-react';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50 px-4 py-16">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-6 animate-bounce-slow">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center shadow-lg">
            <AlertCircle className="h-12 w-12 text-red-600" />
          </div>
        </div>
        <h1 className="text-7xl font-bold text-gray-900 mb-4 tracking-tighter">404</h1>
        <h2 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-4">Halaman Tidak Ditemukan</h2>
        <p className="text-gray-600 mb-8 leading-relaxed">
          Maaf, halaman yang Anda tuju mungkin salah ketik, tidak tersedia, atau telah dipindahkan.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-green-600 hover:bg-green-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-1"
          >
            <Home className="w-5 h-5 mr-2" />
            Ke Beranda
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center px-6 py-3 border-2 border-gray-200 text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-all shadow-sm hover:shadow-md transform hover:-translate-y-1"
          >
            Kembali
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
