"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiFetch, getStaffToken, setStaffToken } from "@/lib/api";
import type { StaffUser } from "@/lib/types";

type AuthContextValue = {
  user: StaffUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  hasPermission: (key: keyof StaffUser["permissions"]) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<StaffUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = getStaffToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await apiFetch<{ user: StaffUser }>("/auth/staff/me");
      setUser(data.user);
    } catch {
      setStaffToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiFetch<{ token: string; user: StaffUser }>(
      "/auth/staff/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }
    );
    setStaffToken(data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch("/auth/staff/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    setStaffToken(null);
    setUser(null);
  }, []);

  const hasPermission = useCallback(
    (key: keyof StaffUser["permissions"]) => {
      if (!user) return false;
      if (user.role === "super_admin") return true;
      return Boolean(user.permissions?.[key]);
    },
    [user]
  );

  const value = useMemo(
    () => ({ user, loading, login, logout, refresh, hasPermission }),
    [user, loading, login, logout, refresh, hasPermission]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
