"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { SessionPayload } from "@/lib/auth/session";

type AuthContextValue = {
  user: SessionPayload | null;
  setUser: (user: SessionPayload | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser?: SessionPayload | null;
}) {
  const [user, setUser] = useState<SessionPayload | null>(initialUser ?? null);
  const value = useMemo(() => ({ user, setUser }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
