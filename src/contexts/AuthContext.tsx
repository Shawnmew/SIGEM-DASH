import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import api from "@/lib/api";

// shape is open since backend defines the fields; adjust as needed
export interface UserData {
  id: number;
  nome: string;
  sobrenome: string;
  email: string;
  [key: string]: any;
}

interface AuthContextType {
  user: UserData | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  register: (payload: Record<string, any>) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  // stubs
  signIn: async () => {},
  register: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // when the provider mounts we attempt to restore session from localStorage
  useEffect(() => {
    const token = localStorage.getItem('sigem_token');
    if (token) {
      api
        .get('/auth/me')
        .then((res) => {
          setUser(res.data.data.user);
        })
        .catch(() => {
          // invalid token, clear it
          localStorage.removeItem('sigem_token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user: u } = res.data.data;
    localStorage.setItem('sigem_token', token);
    setUser(u);
  };

  const register = async (payload: Record<string, any>) => {
    const res = await api.post('/auth/register', payload);
    const { token, user: u } = res.data.data;
    localStorage.setItem('sigem_token', token);
    setUser(u);
  };

  const signOut = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore network errors
    }
    localStorage.removeItem('sigem_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, register, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
