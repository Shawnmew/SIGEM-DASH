// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface User {
    id: number;
    nome: string;
    sobrenome?: string;
    email: string;
    tipo: string;
    status: string;
    user_type: 'admin' | 'entidade';
    foto_perfil_url?: string | null;
}

export interface SavedProfile {
    token: string;
    user: User;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<boolean>;
    signOut: () => Promise<void>;
    isAdmin: boolean;
    isEntidade: boolean;
    isAuthenticated: boolean;
    savedProfiles: SavedProfile[];
    switchProfile: (email: string) => Promise<boolean>;
    removeProfile: (email: string) => void;
    addProfile: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [savedProfiles, setSavedProfiles] = useState<SavedProfile[]>([]);

    const isAdmin = user?.user_type === 'admin' && user?.tipo === 'admin';
    const isEntidade = user?.user_type === 'entidade';
    const isAuthenticated = !!user;

    const loadUser = async () => {
        const token = localStorage.getItem('token');
        console.log('loadUser - Token existe?', !!token);
        
        if (!token) {
            console.log('loadUser - Sem token, finalizando');
            setLoading(false);
            return;
        }

        try {
            console.log('loadUser - Buscando usuário...');
            const response = await api.get('/auth/me');
            console.log('loadUser - Resposta:', response.data);
            
            if (response.data.success) {
                const userData = response.data.data;
                console.log('loadUser - Usuário carregado:', userData);
                
                if (userData.user_type !== 'admin' && userData.user_type !== 'entidade') {
                    console.log('loadUser - Usuário sem permissão');
                    localStorage.removeItem('token');
                    setUser(null);
                } else {
                    setUser(userData);
                }
            } else {
                console.log('loadUser - Resposta sem sucesso');
                localStorage.removeItem('token');
            }
        } catch (error: any) {
            console.error('loadUser - Erro:', error.response?.status, error.response?.data);
            localStorage.removeItem('token');
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const loadSavedProfiles = () => {
        try {
            const profilesStr = localStorage.getItem('saved_profiles');
            if (profilesStr) {
                setSavedProfiles(JSON.parse(profilesStr));
            }
        } catch (e) {
            console.error("Erro ao carregar perfis salvos", e);
        }
    };

    const saveProfileToStorage = (token: string, userData: User) => {
        try {
            const profilesStr = localStorage.getItem('saved_profiles');
            let profiles: SavedProfile[] = profilesStr ? JSON.parse(profilesStr) : [];
            
            // Remove if already exists to update
            profiles = profiles.filter(p => p.user.email !== userData.email);
            
            profiles.push({ token, user: userData });
            localStorage.setItem('saved_profiles', JSON.stringify(profiles));
            setSavedProfiles(profiles);
        } catch (e) {
            console.error("Erro ao salvar perfil", e);
        }
    };

    useEffect(() => {
        loadSavedProfiles();
        loadUser();
    }, []);

    const signIn = async (email: string, password: string): Promise<boolean> => {
        try {
            console.log('signIn - Tentando login:', email);
            const response = await api.post('/auth/login', { email, password });
            console.log('signIn - Resposta:', response.data);
            
            if (response.data.success) {
                const { token, user: userData, user_type } = response.data.data;
                
                console.log('signIn - Token recebido:', token);
                console.log('signIn - User type:', user_type);
                
                if (user_type !== 'admin' && user_type !== 'entidade') {
                    toast.error('Acesso negado. Apenas administradores e entidades promotoras podem acessar o sistema.');
                    return false;
                }
                
                localStorage.setItem('token', token);
                
                const finalUser = {
                    ...userData,
                    user_type: user_type
                };
                
                setUser(finalUser);
                saveProfileToStorage(token, finalUser);
                
                toast.success(`Bem-vindo, ${userData.nome}!`);
                return true;
            } else {
                toast.error(response.data.message || 'Credenciais inválidas');
                return false;
            }
        } catch (error: any) {
            console.error('signIn - Erro:', error.response?.status, error.response?.data);
            const message = error.response?.data?.message || error.message || 'Erro ao fazer login';
            toast.error(message);
            throw error; // Re-throw to allow component-level error handling
        }
    };

    const signOut = async () => {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                await api.post('/auth/logout');
            }
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('saved_profiles');
            setUser(null);
            setSavedProfiles([]);
            toast.success('Logout realizado com sucesso');
        }
    };

    const switchProfile = async (email: string): Promise<boolean> => {
        const profile = savedProfiles.find(p => p.user.email === email);
        if (profile) {
            localStorage.setItem('token', profile.token);
            setUser(profile.user);
            api.defaults.headers.common['Authorization'] = `Bearer ${profile.token}`;
            window.location.href = '/';
            return true;
        }
        return false;
    };

    const removeProfile = (email: string) => {
        const newProfiles = savedProfiles.filter(p => p.user.email !== email);
        localStorage.setItem('saved_profiles', JSON.stringify(newProfiles));
        setSavedProfiles(newProfiles);
    };

    const addProfile = () => {
        localStorage.removeItem('token');
        setUser(null);
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ 
            user, loading, signIn, signOut, isAdmin, isEntidade, isAuthenticated, 
            savedProfiles, switchProfile, removeProfile, addProfile 
        }}>
            {children}
        </AuthContext.Provider>
    );
};