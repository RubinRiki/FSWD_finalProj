import React, { createContext, useState, useMemo, useCallback } from 'react';
import {
  login as loginApi,
  register as registerApi,
  logout as logoutApi,
} from '../services/authApi';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // hydrate from storage on first render
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));

  const login = useCallback(async (email, password) => {
    const { token, user } = await loginApi(email, password);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setToken(token);
    setUser(user);
    return user;
  }, []);

  const register = useCallback(async (payload) => {
    const { token, user } = await registerApi(payload);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setToken(token);
    setUser(user);
    return user;
  }, []);

  const logout = useCallback(async () => {
    try { await logoutApi(); } catch (_) {}
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    window.location.replace('/login');
  }, []);

  const value = useMemo(() => ({
    user,
    token,
    isAuthenticated: !!token,
    login,
    register,
    logout,
  }), [user, token, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
