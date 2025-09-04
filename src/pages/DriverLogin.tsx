import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DriverLogin: React.FC = () => {
  const [driverId, setDriverId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Load remembered data on component mount
  useEffect(() => {
    const rememberedData = localStorage.getItem('rememberedDriver');
    if (rememberedData) {
      try {
        const { driverId: rememberedDriverId, rememberMe: rememberedRememberMe } = JSON.parse(rememberedData);
        if (rememberedRememberMe) {
          setDriverId(rememberedDriverId);
          setRememberMe(true);
        }
      } catch (error) {
        console.error('Error parsing remembered data:', error);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!driverId.trim() || !password.trim()) {
      setError('ID Driver dan password harus diisi!');
      return;
    }
    
    try {
      setError('');
      setIsLoading(true);
      
      // Simulasi delay untuk animasi loading
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await login('driver', { username: driverId, password });
      
      // Simpan ke localStorage jika remember me dicentang
      if (rememberMe) {
        localStorage.setItem('rememberedDriver', JSON.stringify({ driverId, rememberMe: true }));
      } else {
        localStorage.removeItem('rememberedDriver');
      }
      
      navigate('/driver');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Login gagal. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
            <User size={24} className="text-blue-500" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Login Driver</h2>
          <p className="mt-2 text-sm text-gray-600">
            Masuk untuk menerima pesanan becak
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="p-4 text-sm bg-red-50 text-red-500 rounded-md flex items-start">
              <AlertCircle size={16} className="mr-2 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="driverId" className="sr-only">ID Driver</label>
              <input
                id="driverId"
                name="driverId"
                type="text"
                value={driverId}
                onChange={(e) => {
                  setDriverId(e.target.value);
                  setError('');
                }}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="ID Driver"
              />
            </div>
            <div className="relative">
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className="appearance-none rounded-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Ingat saya
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                Lupa password?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Memproses...
                </>
              ) : (
                'Masuk'
              )}
            </button>
          </div>
          
          <div className="text-sm text-center text-gray-500">
            <span>Untuk demo, gunakan: </span>
            <span className="font-medium">ID: driver1, password: driver123</span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DriverLogin;