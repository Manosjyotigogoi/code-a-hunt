import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [eduData, setEduData] = useState(null);
  const [loading, setLoading] = useState(true); // check token on mount

  // On mount — restore session from saved token
  useEffect(() => {
    const token = localStorage.getItem('stai_token');
    if (!token) { setLoading(false); return; }
    api.get('/auth/me')
      .then(({ data }) => {
        setUser(data.user);
        return api.get('/profile/edu');
      })
      .then(({ data }) => { if (data.eduData) setEduData(data.eduData); })
      .catch(() => { localStorage.removeItem('stai_token'); })
      .finally(() => setLoading(false));
  }, []);

  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('stai_token', data.token);
    setUser(data.user);
    return data.user;
  };

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('stai_token', data.token);
    setUser(data.user);
    // Load edu data if it exists
    try {
      const edu = await api.get('/profile/edu');
      if (edu.data.eduData) setEduData(edu.data.eduData);
    } catch { /* no edu data yet */ }
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('stai_token');
    setUser(null);
    setEduData(null);
  };

  const saveEduData = async (formData) => {
    const { data } = await api.post('/profile/edu', formData);
    setEduData(data.eduData);
    // Update user's hasCompletedDataCollection flag
    setUser(u => u ? { ...u, hasCompletedDataCollection: true } : u);
    return data.eduData;
  };

  return (
    <AuthContext.Provider value={{ user, eduData, loading, login, logout, register, saveEduData, setEduData }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
