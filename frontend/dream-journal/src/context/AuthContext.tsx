import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:50051';

interface User {
  id: string;
  email: string;
  username: string;
  created_at: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check for stored user data on mount
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    async function verifyToken() {
      if (token) {
        try {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          await axios.get(`${API_URL}/api/me`);
        } catch (err) {
          setUser(null);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
        }
      }
    }
    if (storedUser && token) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        verifyToken();
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post(`${API_URL}/api/login`, { email, password });
      const { user, token } = response.data;
      if (!user || !token) {
        throw new Error('Invalid response from server');
      }
      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Only navigate if login is successful
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (error: any) {
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      // Do not navigate on error
      // Optionally show a user-friendly error
      // alert('Login failed: Invalid email or password, or server unavailable.');
      throw error;
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      const response = await axios.post(`${API_URL}/api/register`, { 
        email, 
        username, 
        password 
      });
      const { user, token } = response.data;
      if (!user || !token) {
        throw new Error('Invalid response from server');
      }
      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (error: any) {
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      alert('Registration failed: Email may already be in use, or server unavailable.');
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    navigate('/login', { replace: true });
  };

  // Don't render children until we've checked for stored user
  if (isLoading) {
    return null;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
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