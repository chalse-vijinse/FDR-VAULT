import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('fdrvault_user') || localStorage.getItem('securefdr_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('fdrvault_token') || localStorage.getItem('securefdr_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyUserSession() {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success && res.data.user) {
            setUser(res.data.user);
            localStorage.setItem('fdrvault_user', JSON.stringify(res.data.user));
            localStorage.setItem('securefdr_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.warn('[AuthContext] Session invalid, clearing state.');
          logout();
        }
      }
      setLoading(false);
    }
    verifyUserSession();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('fdrvault_token', res.data.token);
      localStorage.setItem('fdrvault_user', JSON.stringify(res.data.user));
      localStorage.setItem('securefdr_token', res.data.token);
      localStorage.setItem('securefdr_user', JSON.stringify(res.data.user));
      return { success: true };
    }
    return { success: false, message: res.data.message };
  };

  const switchDemoUser = async (email) => {
    try {
      const res = await api.post('/auth/switch-demo-user', { email });
      if (res.data.success) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('fdrvault_token', res.data.token);
        localStorage.setItem('fdrvault_user', JSON.stringify(res.data.user));
        localStorage.setItem('securefdr_token', res.data.token);
        localStorage.setItem('securefdr_user', JSON.stringify(res.data.user));
        return { success: true, user: res.data.user };
      }
      return { success: false, message: res.data.message };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post('/auth/logout');
      }
    } catch (err) {
      // ignore
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('fdrvault_token');
      localStorage.removeItem('fdrvault_user');
      localStorage.removeItem('securefdr_token');
      localStorage.removeItem('securefdr_user');
    }
  };

  const hasRole = (...roles) => {
    return user && roles.includes(user.role);
  };

  const value = {
    user,
    token,
    role: user?.role,
    isAuthenticated: !!user && !!token,
    loading,
    login,
    logout,
    switchDemoUser,
    hasRole
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
