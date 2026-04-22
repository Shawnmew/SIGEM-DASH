// src/lib/api.ts
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://172.16.20.3:8001/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: false,
});

// Interceptor para adicionar token em TODAS as requisições
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        console.log('Token encontrado:', token ? 'Sim' : 'Não');
        
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('Token adicionado ao header:', config.headers.Authorization);
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor para tratar erros 401
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            console.error('Erro 401 - Token inválido ou expirado');
            localStorage.removeItem('token');
            delete api.defaults.headers.common['Authorization'];
            
            // Redirecionar para login apenas se não estiver já na página de login
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;