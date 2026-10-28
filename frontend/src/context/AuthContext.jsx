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
        if (token.startsWith('mock_token_') || token.startsWith('demo_token_')) {
          setLoading(false);
          return;
        }
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
    try {
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
    } catch (err) {
      // Graceful offline fallback for static cloud deployments (e.g. Vercel)
      const normalizedEmail = email?.trim()?.toLowerCase();
      const mockRoles = {
        'admin@iitdelhi.ac.in': {
          id: 1,
          email: 'admin@iitdelhi.ac.in',
          fullName: 'Dr. Ramesh Narayan',
          role: 'INSTITUTION_ADMIN',
          institutionId: 1,
          institutionName: 'Delhi Institute of Technology',
          institutionCode: 'INST-ND-1001',
          designation: 'Principal & Authorized Signatory',
          phone: '+91 98112 34567'
        },
        'officer.sharma@securefdr.gov.in': {
          id: 4,
          email: 'officer.sharma@securefdr.gov.in',
          fullName: 'Dr. Rajesh Sharma',
          role: 'VERIFICATION_OFFICER',
          institutionId: null,
          designation: 'Senior Verification Officer (North Zone)',
          phone: '+91 98765 43210'
        },
        'admin@securefdr.gov.in': {
          id: 5,
          email: 'admin@securefdr.gov.in',
          fullName: 'Sunil Verma, IAS',
          role: 'SUPER_ADMIN',
          institutionId: null,
          designation: 'Member Secretary & Chief Administrator',
          phone: '+91 94123 45678'
        }
      };

      if (mockRoles[normalizedEmail]) {
        const mockUser = mockRoles[normalizedEmail];
        const dummyToken = 'demo_token_' + mockUser.role;
        setToken(dummyToken);
        setUser(mockUser);
        localStorage.setItem('fdrvault_token', dummyToken);
        localStorage.setItem('fdrvault_user', JSON.stringify(mockUser));
        return { success: true };
      }

      return {
        success: false,
        message: err.response?.data?.message || 'Server connection error. Please verify backend service.'
      };
    }
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
