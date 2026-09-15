import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api, AUTH_TOKEN_KEY, AUTH_USER_KEY } from "../services/api";
import type { AuthUser, LoginResponse } from "../types/auth";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const cached = localStorage.getItem(AUTH_USER_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    setUser(null);
    setToken(null);
  }, []);

  // Validação de token inicial
  useEffect(() => {
    let isMounted = true;

    const validateSession = async () => {
      const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!storedToken) {
        if (isMounted) {
          setUser(null);
          setToken(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const profile = await api.getMe();
        if (isMounted) {
          setUser(profile);
          setToken(storedToken);
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(profile));
        }
      } catch (err) {
        console.warn("[Auth] Sessão anterior inválida ou expirada.");
        if (isMounted) {
          logout();
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    validateSession();

    // Listener para deslogar suavemente em caso de 401 interceptado
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener("odonto_unauthorized", handleUnauthorized);
    return () => {
      isMounted = false;
      window.removeEventListener("odonto_unauthorized", handleUnauthorized);
    };
  }, [logout]);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res: LoginResponse = await api.login(email, pass);
      localStorage.setItem(AUTH_TOKEN_KEY, res.token);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token && user),
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser utilizado dentro de um AuthProvider");
  }
  return context;
}

