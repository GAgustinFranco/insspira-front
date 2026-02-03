"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { LoginFormValues } from "@/validators/LoginSchema";
import type { RegisterFormValues } from "@/validators/RegisterSchema";
import {
  AuthUser,
  LoginUser,
  RegisterUser,
  getMe,
  logoutGoogle
} from "@/services/authservice";
import { API_BASE } from "@/services/authservice";

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
}

export interface AuthContextValue extends AuthState {
  isAuthenticated: boolean;
  isAdmin: boolean;
  isHydrated: boolean;
  isChecking: boolean;
  login: (values: LoginFormValues) => Promise<AuthUser | null>;
  register: (values: RegisterFormValues) => Promise<boolean>;
  logout: () => void;
  setAuth: (user: AuthUser | null, token: string | null) => void;
  authFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

const USER_KEY = "auth:user";
const TOKEN_KEY = "auth:token";

function readStorage(): AuthState {
  if (typeof window === "undefined") return { user: null, token: null };
  try {
    const userRaw = localStorage.getItem(USER_KEY);
    const token = localStorage.getItem(TOKEN_KEY);
    return { user: userRaw ? (JSON.parse(userRaw) as AuthUser) : null, token: token ?? null };
  } catch {
    return { user: null, token: null };
  }
}

function writeStorage(next: AuthState) {
  try {
    if (next.user) localStorage.setItem(USER_KEY, JSON.stringify(next.user));
    else localStorage.removeItem(USER_KEY);
    if (next.token) localStorage.setItem(TOKEN_KEY, next.token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(() => readStorage());
  const [isHydrated, setIsHydrated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const setAuth = useCallback((user: AuthUser | null, token: string | null) => {
    setState({ user, token });
    writeStorage({ user, token });
  }, []);

  // Listener de storage multi-tab
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === USER_KEY || e.key === TOKEN_KEY) {
        setState(readStorage());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Bootstrap - se ejecuta UNA SOLA VEZ al montar
  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      setIsChecking(true);

      try {
        // 1. Si ya tenemos user y token en localStorage, úsalos directamente
        const stored = readStorage();
        if (stored.user && stored.token) {
          console.log("✅ Auth: Restored from localStorage");
          if (!cancelled) {
            setState(stored);
            setIsChecking(false);
            setIsHydrated(true);
          }
          return;
        }

        // 2. Si no hay localStorage, intenta con cookie (Google OAuth)
        console.log("🔍 Auth: Trying getMe() for cookie-based auth...");
        const me = await getMe();
        if (!cancelled && me) {
          console.log("✅ Auth: Got user from getMe()");
          setAuth(me, stored.token);
        } else {
          console.log("⚠️ Auth: No session found");
        }
      } catch (err) {
        console.error("Auth bootstrap error:", err);
      } finally {
        if (!cancelled) {
          setIsChecking(false);
          setIsHydrated(true);
        }
      }
    };

    bootstrap();

    return () => { cancelled = true; };
  }, []); // 👈 Array vacío: solo se ejecuta UNA VEZ

  const login = useCallback(
    async (values: LoginFormValues): Promise<AuthUser | null> => {
      const res = await LoginUser(values);
      if (!res) return null;
      // Guarda en state Y localStorage
      setAuth(res.user ?? null, res.token ?? null);
      console.log("✅ Auth: Login successful, user saved");
      return res.user ?? null;
    },
    [setAuth]
  );

  const register = useCallback(
    async (values: RegisterFormValues) => {
      const res = await RegisterUser(values);
      if (!res) return false;
      setAuth(res.user ?? null, res.token ?? null);
      console.log("✅ Auth: Register successful, user saved");
      return Boolean(res.user || res.token);
    },
    [setAuth]
  );

  const logout = useCallback(async () => {
    // Limpiar estado local primero
    setAuth(null, null);
    localStorage.removeItem("auth:user");
    localStorage.removeItem("auth:token");

    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      await logoutGoogle();
    } catch (err) {
      console.warn("Logout error:", err);
    }
  }, [setAuth]);

  const authFetch = useCallback(
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const headers = new Headers(init?.headers ?? {});
      // Leer token de localStorage directamente para tener siempre el último
      const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
      if (token && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return fetch(input, {
        ...init,
        headers,
        credentials: "include",
      });
    },
    []
  );

  const value: AuthContextValue = useMemo(
    () => ({
      ...state,
      isAuthenticated: Boolean(state.user),
      isAdmin: state.user?.role === "admin",
      isHydrated,
      isChecking,
      login,
      register,
      logout,
      setAuth,
      authFetch,
    }),
    [state, isHydrated, isChecking, login, register, logout, setAuth, authFetch]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}