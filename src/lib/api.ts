// src/lib/api.ts
import axios from 'axios';
import type { AxiosRequestHeaders } from 'axios';

const API_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3000'
).replace(/\/+$/, '');

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// ✅ Interceptor que funciona para JWT local Y Google OAuth
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    // Intentar obtener token de localStorage (login local)
    const token =
      localStorage.getItem('auth:token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('access_token');

    if (token) {
      const headers: AxiosRequestHeaders = (config.headers as AxiosRequestHeaders) ?? {};
      headers.Authorization = `Bearer ${token}`;
      config.headers = headers;
      console.log('🔑 JWT Token attached:', token.substring(0, 20) + '...');
    } else {
      console.warn('⚠️ No JWT token in localStorage, relying on cookie');
    }
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
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;