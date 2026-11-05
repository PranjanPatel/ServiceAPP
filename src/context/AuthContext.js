import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const saved = await SecureStore.getItemAsync('user');
        if (saved) setUser(JSON.parse(saved));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveSession = async ({ token, user }) => {
    await SecureStore.setItemAsync('token', token);
    await SecureStore.setItemAsync('user', JSON.stringify(user));
    setUser(user);
  };

  const login = async (email, password) => {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.user.role === 'admin') {
      throw new Error('Admin accounts cannot log in to the mobile app. Use the admin panel.');
    }
    await saveSession(data);
  };

  const register = async (payload) => {
    const data = await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    await saveSession(data);
  };
  
  const logout = async () => {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
    setUser(null);
  };

  const updateUser = async (newUser) => {
    await SecureStore.setItemAsync('user', JSON.stringify(newUser));
    setUser(newUser);
  };
  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);