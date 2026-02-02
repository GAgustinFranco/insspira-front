import axios from 'axios';
import type { AxiosRequestHeaders } from 'axios';
import Cookies from 'js-cookie';

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||           // 👈 Cambiado
  process.env.NEXT_PUBLIC_BACKEND_URL ||       // 👈 Cambiado
  'http://localhost:3000'
).replace(/\/+$/, '');

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // ✅ Importante para cookies
});

// ✅ Función centralizada para obtener el token
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  // Intentar obtener token de localStorage (login local)
  const localStorageToken = 
    localStorage.getItem('auth:token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('access_token');
  
  if (localStorageToken) return localStorageToken;
  
  // Intentar obtener token de cookie (Google OAuth)
  const cookieToken = Cookies.get('auth-token') || Cookies.get('jwt');
  
  return cookieToken || null;
};

// ✅ Interceptor que funciona para JWT local Y Google OAuth
api.interceptors.request.use((config) => {
  const token = getAuthToken();

  if (token) {
    const headers: AxiosRequestHeaders = (config.headers as AxiosRequestHeaders) ?? {};
    headers.Authorization = `Bearer ${token}`;
    config.headers = headers;
    console.log('🔑 JWT Token attached:', token.substring(0, 20) + '...');
  } else {
    console.warn('⚠️ No JWT token found (localStorage or cookies)');
  }
  
  return config;
});

// ✅ Interceptor para manejar 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('❌ 401 Unauthorized');
      // Opcional: redirigir al login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth:token');
        localStorage.removeItem('auth:user');
        Cookies.remove('auth-token');
        Cookies.remove('jwt');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;