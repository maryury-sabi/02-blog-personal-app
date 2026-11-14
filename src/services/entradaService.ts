import { apiFetch, getApiBaseUrl, leerSesionSegura } from "@/api/client";
import type { DbClient } from "@/db/database";
import {
  eliminarEntradaLocal,
  eliminarEtiquetaLocal,
  guardarEntradaLocal,
  guardarPreferencia,
  listarEntradas,
  listarEtiquetasConConteo,
  listarPendientesSync,
  marcarDestacadaLocal,
  marcarSincronizada,
  obtenerEntradaPorId,
  obtenerPreferencia,
} from "@/repositories/entradaRepository";
import type { Entrada, EntradaInput, EtiquetaResumen } from "@/types/entrada";
import { normalizarEtiquetas, validarEntrada } from "@/utils/entradaUtils";

export async function obtenerEntradas(db: DbClient, busqueda = ""): Promise<Entrada[]> {
  return listarEntradas(db, busqueda);
}

export async function obtenerEntrada(db: DbClient, id: number): Promise<Entrada | null> {
  return obtenerEntradaPorId(db, id);
}

export async function guardarEntrada(db: DbClient, input: EntradaInput): Promise<Entrada> {
  const etiquetasLimpias = normalizarEtiquetas(input.etiquetas);
  const validacion = validarEntrada(input.titulo, input.contenido, etiquetasLimpias);
  if (!validacion.valido) {
    const primerError = Object.values(validacion.errores)[0] ?? "Entrada inválida";
    throw new Error(primerError);
  }
  return guardarEntradaLocal(db, { ...input, etiquetas: etiquetasLimpias });
}

export async function alternarDestacada(
  db: DbClient,
  id: number,
  destacada: boolean,
): Promise<void> {
  await marcarDestacadaLocal(db, id, destacada);
}

export async function eliminarEntrada(db: DbClient, id: number): Promise<void> {
  await eliminarEntradaLocal(db, id);
}

export async function obtenerEtiquetas(db: DbClient): Promise<EtiquetaResumen[]> {
  return listarEtiquetasConConteo(db);
}

export async function eliminarEtiqueta(db: DbClient, etiquetaId: number): Promise<void> {
  await eliminarEtiquetaLocal(db, etiquetaId);
}

export async function sincronizarPendientes(
  db: DbClient,
): Promise<{ enviadas: number; recibidas: number }> {
  const baseUrl = getApiBaseUrl();
  const session = await leerSesionSegura();
  if (!baseUrl || !session) {
    return { enviadas: 0, recibidas: 0 };
  }

  const enviadas = await enviarCambiosLocales(db);
  const recibidas = await descargarCambiosRemotos(db);
  return { enviadas, recibidas };
}

async function enviarCambiosLocales(db: DbClient): Promise<number> {
  const pendientes = await listarPendientesSync(db);
  let enviadas = 0;

  for (const item of pendientes) {
    if (item.deleted) {
      const res = await apiFetch(`/api/entrada/${item.remote_id}`, { method: "DELETE" });
      if (res.ok || res.status === 404) {
        await marcarSincronizada(db, item.id, new Date().toISOString());
        enviadas += 1;
      }
      continue;
    }

    const res = await apiFetch(`/api/entrada/${item.remote_id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titulo: item.titulo,
        contenido: item.contenido,
        etiquetas: item.etiquetas,
        borrador: item.borrador,
        destacada: item.destacada,
        lugar: item.lugar,
        altitud_m: item.altitud_m,
        foto_url: item.foto_url,
      }),
    });

    if (res.ok) {
      const saved = (await res.json()) as { updated_at: string };
      await marcarSincronizada(db, item.id, saved.updated_at);
      enviadas += 1;
    }
  }

  return enviadas;
}

interface RemoteEntradaDto {
  id: string;
  titulo: string;
  contenido: string;
  etiquetas: string[];
  borrador: boolean;
  destacada: boolean;
  lugar: string | null;
  altitud_m: number | null;
  foto_url: string | null;
  updated_at: string;
  deleted_at: string | null;
}

async function descargarCambiosRemotos(db: DbClient): Promise<number> {
  const lastSync = await obtenerPreferencia(db, "last_sync");
  const query = lastSync ? `?since=${encodeURIComponent(lastSync)}` : "";
  const res = await apiFetch(`/api/entrada${query}`);
  if (!res.ok) return 0;

  const data = (await res.json()) as { items: RemoteEntradaDto[]; servidor_ahora: string };
  let recibidas = 0;

  for (const remote of data.items) {
    if (remote.deleted_at) continue;
    await guardarEntradaLocal(db, {
      remote_id: remote.id,
      titulo: remote.titulo,
      contenido: remote.contenido,
      etiquetas: remote.etiquetas,
      borrador: remote.borrador,
      destacada: remote.destacada,
      lugar: remote.lugar,
      altitud_m: remote.altitud_m,
      foto_uri: null,
      foto_url: remote.foto_url,
    });
    recibidas += 1;
  }

  await guardarPreferencia(db, "last_sync", data.servidor_ahora);
  return recibidas;
}
