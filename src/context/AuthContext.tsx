import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api.ts';

/**
 * AuthContext for managing user state globally
 */
interface User {
  _id: string;
  name: string;
  email: string;
  token: string;
  profileImage?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userData: User) => void;
  logout: () => void;
  updateProfile: (data: { name?: string; profileImage?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          if (parsed.token) {
            // Verify token with backend
            const response = await api.get('/auth/profile');
            setUser({ ...response.data, token: parsed.token });
          }
        } catch (error) {
          console.log('Session is no longer active; cleaning up local store.');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    fetchProfile();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const updateProfile = async (data: { name?: string; profileImage?: string }) => {
    try {
      const response = await api.put('/auth/profile', data);
      const updatedUser = { ...user, ...response.data, token: user?.token };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateProfile }}>
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
