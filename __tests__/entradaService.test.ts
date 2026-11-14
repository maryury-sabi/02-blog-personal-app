import * as apiClient from "@/api/client";
import type { DbClient } from "@/db/database";
import {
  alternarDestacada,
  eliminarEntrada,
  eliminarEtiqueta,
  guardarEntrada,
  obtenerEntrada,
  obtenerEntradas,
  obtenerEtiquetas,
  sincronizarPendientes,
} from "@/services/entradaService";

interface FakeState {
  entradas: Map<number, { id: number; titulo: string; contenido: string; deleted: number }>;
  etiquetas: Map<string, { id: number; nombre: string }>;
  relaciones: { entrada_id: number; etiqueta_id: number }[];
  nextEntradaId: number;
  nextEtiquetaId: number;
}

function handleEtiquetaSql(state: FakeState, sql: string, params: unknown[]) {
  if (sql.startsWith("INSERT OR IGNORE INTO etiqueta")) {
    const nombre = String(params[0]);
    if (!state.etiquetas.has(nombre)) {
      state.etiquetas.set(nombre, { id: state.nextEtiquetaId++, nombre });
    }
  } else if (sql.startsWith("INSERT OR IGNORE INTO entrada_etiqueta")) {
    const eid = Number(params[0]);
    const tid = Number(params[1]);
    if (!state.relaciones.some((r) => r.entrada_id === eid && r.etiqueta_id === tid)) {
      state.relaciones.push({ entrada_id: eid, etiqueta_id: tid });
    }
  } else if (sql.startsWith("DELETE FROM entrada_etiqueta WHERE etiqueta_id")) {
    state.relaciones = state.relaciones.filter((r) => r.etiqueta_id !== Number(params[0]));
  } else if (sql.startsWith("DELETE FROM etiqueta WHERE id")) {
    for (const [k, v] of state.etiquetas.entries()) {
      if (v.id === Number(params[0])) state.etiquetas.delete(k);
    }
  }
}

function handleRunSql(state: FakeState, sql: string, params: unknown[]) {
  if (sql.startsWith("INSERT INTO entrada")) {
    const id = state.nextEntradaId++;
    state.entradas.set(id, {
      id,
      titulo: String(params[1]),
      contenido: String(params[2]),
      deleted: 0,
    });
    return { lastInsertRowId: id, changes: 1 };
  }
  if (sql.startsWith("DELETE FROM entrada_etiqueta WHERE entrada_id")) {
    state.relaciones = state.relaciones.filter((r) => r.entrada_id !== Number(params[0]));
    return { lastInsertRowId: 0, changes: 1 };
  }
  handleEtiquetaSql(state, sql, params);
  return { lastInsertRowId: 0, changes: 1 };
}

function makeEntradaRow(row: { id: number; titulo: string; contenido: string; deleted: number }) {
  return {
    ...row,
    remote_id: `uuid-${row.id}`,
    foto_uri: null,
    foto_url: null,
    borrador: 0,
    destacada: 0,
    lugar: null,
    altitud_m: null,
    creado_en: "2026-11-14T00:00:00.000Z",
    actualizado_en: "2026-11-14T00:00:00.000Z",
    updated_at: "2026-11-14T00:00:00.000Z",
    pending: 1,
  };
}

function createFakeDb() {
  const state: FakeState = {
    entradas: new Map(),
    etiquetas: new Map(),
    relaciones: [],
    nextEntradaId: 1,
    nextEtiquetaId: 1,
  };

  const db = {
    runAsync: jest.fn(async (sql: string, params: unknown[] = []) =>
      handleRunSql(state, sql, params),
    ),
    getFirstAsync: jest.fn(async (sql: string, params: unknown[] = []) => {
      if (sql.includes("FROM etiqueta WHERE nombre")) {
        return state.etiquetas.get(String(params[0])) ?? null;
      }
      if (sql.includes("FROM entrada WHERE id")) {
        const row = state.entradas.get(Number(params[0]));
        return row ? makeEntradaRow(row) : null;
      }
      return null;
    }),
    getAllAsync: jest.fn(async (sql: string, params: unknown[] = []) => {
      if (
        sql.includes("FROM entrada WHERE pending = 1") ||
        sql.includes("FROM entrada WHERE deleted = 0")
      ) {
        return Array.from(state.entradas.values()).map(makeEntradaRow);
      }
      if (sql.includes("FROM etiqueta t")) {
        return Array.from(state.etiquetas.values()).map((t) => ({ ...t, total: 1 }));
      }
      const eid = Number(params[0]);
      const tagIds = state.relaciones.filter((r) => r.entrada_id === eid).map((r) => r.etiqueta_id);
      return Array.from(state.etiquetas.values())
        .filter((t) => tagIds.includes(t.id))
        .map((t) => ({ nombre: t.nombre }));
    }),
  };

  return { db: db as unknown as DbClient, state };
}

describe("Servicio de entradas (etiquetas, CRUD y sincronización)", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("asociar etiquetas duplicadas no crea filas repetidas", async () => {
    const { db, state } = createFakeDb();
    const saved = await guardarEntrada(db, {
      titulo: "Día de estudio",
      contenido: "Probando que las etiquetas duplicadas no generen filas repetidas.",
      etiquetas: ["Movil", "movil", "MOVIL", "notas"],
      borrador: false,
      destacada: false,
      lugar: null,
      altitud_m: null,
      foto_uri: null,
      foto_url: null,
    });
    expect(saved.etiquetas).toEqual(["movil", "notas"]);
    expect(state.etiquetas.size).toBe(2);
    expect(state.relaciones).toHaveLength(2);
  });

  it("eliminar una etiqueta no borra las entradas, solo quita la relación", async () => {
    const { db, state } = createFakeDb();
    await guardarEntrada(db, {
      titulo: "Entrada persistente",
      contenido: "Esta entrada debe sobrevivir cuando se borre la etiqueta.",
      etiquetas: ["temporal"],
      borrador: false,
      destacada: false,
      lugar: null,
      altitud_m: null,
      foto_uri: null,
      foto_url: null,
    });
    const tag = state.etiquetas.get("temporal");
    expect(tag).toBeDefined();
    await eliminarEtiqueta(db, tag!.id);
    expect(state.etiquetas.size).toBe(0);
    expect(state.relaciones).toHaveLength(0);
    expect(state.entradas.size).toBe(1);
  });

  it("guardarEntrada rechaza entradas inválidas y soporta lectura/destacada/eliminación", async () => {
    const { db } = createFakeDb();
    await expect(
      guardarEntrada(db, {
        titulo: "x",
        contenido: "corto",
        etiquetas: [],
        borrador: false,
        destacada: false,
        lugar: null,
        altitud_m: null,
        foto_uri: null,
        foto_url: null,
      }),
    ).rejects.toThrow();

    const created = await guardarEntrada(db, {
      titulo: "Entrada válida",
      contenido: "Contenido válido con suficiente longitud.",
      etiquetas: ["diario"],
      borrador: false,
      destacada: false,
      lugar: null,
      altitud_m: null,
      foto_uri: null,
      foto_url: null,
    });
    expect(await obtenerEntrada(db, created.id)).not.toBeNull();
    expect(await obtenerEntradas(db)).toHaveLength(1);
    expect(await obtenerEtiquetas(db)).toHaveLength(1);
    await alternarDestacada(db, created.id, true);
    await eliminarEntrada(db, created.id);
  });

  it("sincronizarPendientes retorna 0 si no hay sesión y sincroniza cuando hay sesión", async () => {
    const { db } = createFakeDb();
    jest.spyOn(apiClient, "getApiBaseUrl").mockReturnValue("https://api.test");
    jest.spyOn(apiClient, "leerSesionSegura").mockResolvedValueOnce(null);
    expect(await sincronizarPendientes(db)).toEqual({ enviadas: 0, recibidas: 0 });

    await guardarEntrada(db, {
      titulo: "Nota por sincronizar",
      contenido: "Contenido listo para enviarse a la API.",
      etiquetas: ["sync"],
      borrador: false,
      destacada: false,
      lugar: null,
      altitud_m: null,
      foto_uri: null,
      foto_url: null,
    });

    jest.spyOn(apiClient, "leerSesionSegura").mockResolvedValueOnce({
      token: "t",
      refreshToken: "r",
      usuario: { id: "u1", email: "u@test.com" },
    });
    jest
      .spyOn(apiClient, "apiFetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ updated_at: "2026-11-14T12:00:00.000Z" }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            items: [
              {
                id: "remote-2",
                titulo: "Desde servidor",
                contenido: "Entrada descargada desde la nube.",
                etiquetas: ["nube"],
                borrador: false,
                destacada: false,
                lugar: null,
                altitud_m: null,
                foto_url: null,
                updated_at: "2026-11-14T12:00:00.000Z",
                deleted_at: null,
              },
            ],
            servidor_ahora: "2026-11-14T12:00:01.000Z",
          }),
          { status: 200 },
        ),
      );

    const syncRes = await sincronizarPendientes(db);
    expect(syncRes).toEqual({ enviadas: 1, recibidas: 1 });
  });
});
