"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  apiFetch,
  getCustomerToken,
  getStoredUser,
  setCustomerToken,
  setStoredUser,
} from "@/lib/api";

export type CustomerUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  addresses: Array<{ _id?: string; label: string; line: string; isDefault: boolean }>;
};

type AuthContextValue = {
  user: CustomerUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = getCustomerToken();
    if (!token) {
      setUser(getStoredUser<CustomerUser>());
      setLoading(false);
      return;
    }
    try {
      const data = await apiFetch<{ user: CustomerUser }>("/auth/customer/me");
      setUser(data.user);
      setStoredUser(data.user);
    } catch {
      setCustomerToken(null);
      setStoredUser(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiFetch<{ token: string; user: CustomerUser }>(
      "/auth/customer/login",
      { method: "POST", body: JSON.stringify({ email, password }) }
    );
    setCustomerToken(data.token);
    setStoredUser(data.user);
    setUser(data.user);
  }, []);

  const register = useCallback(
    async (payload: {
      name: string;
      email: string;
      password: string;
      phone?: string;
    }) => {
      const data = await apiFetch<{ token: string; user: CustomerUser }>(
        "/auth/customer/register",
        { method: "POST", body: JSON.stringify(payload) }
      );
      setCustomerToken(data.token);
      setStoredUser(data.user);
      setUser(data.user);
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await apiFetch("/auth/customer/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    setCustomerToken(null);
    setStoredUser(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refresh }),
    [user, loading, login, register, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
