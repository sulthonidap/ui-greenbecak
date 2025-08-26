import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { authAPI } from '../services/api';

type UserType = 'admin' | 'driver' | null;

interface User {
  id: string;
  username: string;
  email: string;
  role: UserType;
  name?: string;
  phone?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  userType: UserType;
  user: User | null;
  login: (userType: UserType, credentials: { username: string; password: string }) => Promise<void>;
  logout: () => void;
  getProfile: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userType, setUserType] = useState<UserType>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Auto-restore authentication on mount
  useEffect(() => {
    const restoreAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const storedUserType = localStorage.getItem('userType') as UserType;
        
        if (token && storedUserType) {
          // Verify token with backend
          const profileResponse = await authAPI.getProfile();
          
          // Restore state
          setIsAuthenticated(true);
          setUserType(storedUserType);
          setUser(profileResponse.user);
        }
      } catch (error) {
        console.error('Failed to restore auth:', error);
        // Clear invalid token
        localStorage.removeItem('authToken');
        localStorage.removeItem('userType');
      } finally {
        setLoading(false);
      }
    };

    restoreAuth();
  }, []);

  const login = async (type: UserType, credentials: { username: string; password: string }) => {
    try {
      const response = await authAPI.login(credentials);
      
      // Store token
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('userType', type);
      
      // Update state
      setIsAuthenticated(true);
      setUserType(type);
      setUser(response.user);
      
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('userType');
    
    // Reset state
    setIsAuthenticated(false);
    setUserType(null);
    setUser(null);
  };

  const getProfile = async () => {
    try {
      const profileResponse = await authAPI.getProfile();
      setUser(profileResponse.user);
    } catch (error) {
      console.error('Failed to get profile:', error);
      // If profile fetch fails, user might be logged out
      logout();
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userType, user, login, logout, getProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};