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
        
        console.log('Restoring auth - Token exists:', !!token, 'UserType:', storedUserType);
        
        if (token && storedUserType) {
          // Verify token with backend
          try {
            const profileResponse = await authAPI.getProfile();
            
            // Restore state
            setIsAuthenticated(true);
            setUserType(storedUserType);
            setUser(profileResponse.user);
            console.log('Auth restored successfully');
          } catch (profileError) {
            console.error('Profile fetch failed:', profileError);
            // Token is invalid, clear it
            localStorage.removeItem('authToken');
            localStorage.removeItem('userType');
            setIsAuthenticated(false);
            setUserType(null);
            setUser(null);
          }
        } else {
          console.log('No token or userType found, user not authenticated');
          setIsAuthenticated(false);
          setUserType(null);
          setUser(null);
        }
      } catch (error) {
        console.error('Failed to restore auth:', error);
        // Clear any invalid data
        localStorage.removeItem('authToken');
        localStorage.removeItem('userType');
        setIsAuthenticated(false);
        setUserType(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreAuth();
  }, []);

  const login = async (type: UserType, credentials: { username: string; password: string }) => {
    try {
      const response = await authAPI.login(credentials);
      
      console.log('Login response:', response);
      
      // Store token securely
      if (response.token) {
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('userType', type);
        
        // Verify token was stored
        const storedToken = localStorage.getItem('authToken');
        console.log('Token stored successfully:', !!storedToken);
        
        // Update state
        setIsAuthenticated(true);
        setUserType(type);
        setUser(response.user);
      } else {
        throw new Error('No token received from server');
      }
      
    } catch (error) {
      console.error('Login failed:', error);
      // Clear any partial data
      localStorage.removeItem('authToken');
      localStorage.removeItem('userType');
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