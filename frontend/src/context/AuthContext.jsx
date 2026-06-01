import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = 로딩 중, null = 비로그인

  useEffect(() => {
    api.get('/auth/me/').then(r => setUser(r.data)).catch(() => setUser(null));
  }, []);

  const login = async (username, password) => {
    const r = await api.post('/auth/login/', { username, password });
    setUser(r.data);
    return r.data;
  };

  const logout = async () => {
    await api.post('/auth/logout/');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
