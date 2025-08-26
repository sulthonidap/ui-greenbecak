import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, UserCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, userType, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <div className="w-10 h-10 bg-green-800 rounded-full flex items-center justify-center">
                <span className="text-white text-xl font-bold">GT</span>
              </div>
              <span className="ml-2 text-xl font-semibold text-gray-900">GreenTrans</span>
            </Link>
          </div>
          
          <div className="hidden sm:flex sm:items-center sm:space-x-4">
            <Link to="/" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-green-800">
              Beranda
            </Link>
            <Link to="/pesan" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-green-800">
              Pesan
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link 
                  to={userType === 'admin' ? '/admin' : '/driver'} 
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-green-800"
                >
                  Dashboard
                </Link>
                <button 
                  onClick={handleLogout}
                  className="px-3 py-2 rounded-md text-sm font-medium text-white bg-green-800 hover:bg-green-600"
                >
                  Keluar
                </button>
              </>
            ) : (
              <div className="flex space-x-2">
                <Link to="/login-driver" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-green-800">
                  Login Driver
                </Link>
                <Link to="/login-admin" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-green-800">
                  Login Admin
                </Link>
              </div>
            )}
          </div>
          
          <div className="flex items-center sm:hidden">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-700 hover:text-green-800 focus:outline-none"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link 
              to="/" 
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-green-800"
              onClick={() => setIsMenuOpen(false)}
            >
              Beranda
            </Link>
            <Link 
              to="/pesan" 
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-green-800"
              onClick={() => setIsMenuOpen(false)}
            >
              Pesan
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link 
                  to={userType === 'admin' ? '/admin' : '/driver'} 
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-green-800"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <button 
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white bg-green-800 hover:bg-green-600"
                >
                  Keluar
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login-driver" 
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-green-800"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login Driver
                </Link>
                <Link 
                  to="/login-admin" 
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-green-800"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login Admin
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;