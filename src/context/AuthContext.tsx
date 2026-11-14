import React, { createContext, useContext, useEffect, useState } from "react";
import { autenticarConApi, leerSesionSegura, limpiarSesionSegura } from "@/api/client";
import type { AuthSession, AuthUser } from "@/types/entrada";

interface AuthContextValue {
  usuario: AuthUser | null;
  cargando: boolean;
  iniciarSesion: (email: string, password: string) => Promise<void>;
  registrar: (email: string, password: string) => Promise<void>;
  cerrarSesion: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    leerSesionSegura()
      .then((saved) => setSession(saved))
      .finally(() => setCargando(false));
  }, []);

  async function iniciarSesion(email: string, password: string): Promise<void> {
    const next = await autenticarConApi("login", email, password);
    setSession(next);
  }

  async function registrar(email: string, password: string): Promise<void> {
    const next = await autenticarConApi("registro", email, password);
    setSession(next);
  }

  async function cerrarSesion(): Promise<void> {
    await limpiarSesionSegura();
    setSession(null);
  }

  return (
    <AuthContext.Provider
      value={{
        usuario: session?.usuario ?? null,
        cargando,
        iniciarSesion,
        registrar,
        cerrarSesion,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return ctx;
}
