import * as SecureStore from "expo-secure-store";
import type { AuthSession, AuthUser } from "@/types/entrada";

const TOKEN_KEY = "blog_id_token";
const REFRESH_KEY = "blog_refresh_token";
const USER_KEY = "blog_auth_user";

export function getApiBaseUrl(): string {
  return (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
}

export async function guardarSesionSegura(session: AuthSession): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, session.token);
  await SecureStore.setItemAsync(REFRESH_KEY, session.refreshToken);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(session.usuario));
}

export async function leerSesionSegura(): Promise<AuthSession | null> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
  const userRaw = await SecureStore.getItemAsync(USER_KEY);
  if (!token || !refreshToken || !userRaw) return null;
  try {
    const usuario = JSON.parse(userRaw) as AuthUser;
    return { token, refreshToken, usuario };
  } catch {
    return null;
  }
}

export async function limpiarSesionSegura(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}

async function intentarRenovarToken(): Promise<string | null> {
  const baseUrl = getApiBaseUrl();
  const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
  if (!baseUrl || !refreshToken) return null;

  const res = await fetch(`${baseUrl}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    await limpiarSesionSegura();
    return null;
  }

  const data = (await res.json()) as { token: string; refreshToken: string };
  await SecureStore.setItemAsync(TOKEN_KEY, data.token);
  await SecureStore.setItemAsync(REFRESH_KEY, data.refreshToken);
  return data.token;
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    throw new Error("EXPO_PUBLIC_API_URL no configurada");
  }
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  const headers = new Headers(init.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const first = await fetch(`${baseUrl}${path}`, { ...init, headers });
  if (first.status !== 401) return first;

  const newToken = await intentarRenovarToken();
  if (!newToken) return first;

  headers.set("Authorization", `Bearer ${newToken}`);
  return fetch(`${baseUrl}${path}`, { ...init, headers });
}

export async function autenticarConApi(
  modo: "login" | "registro",
  email: string,
  password: string,
): Promise<AuthSession> {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    throw new Error("Configura EXPO_PUBLIC_API_URL antes de iniciar sesión.");
  }
  const res = await fetch(`${baseUrl}/api/auth/${modo}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "No se pudo autenticar");
  }
  const data = (await res.json()) as AuthSession;
  await guardarSesionSegura(data);
  return data;
}
