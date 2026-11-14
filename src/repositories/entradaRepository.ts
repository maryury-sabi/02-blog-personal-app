import type { DbClient } from "@/db/database";
import type { Entrada, EntradaInput, EtiquetaResumen } from "@/types/entrada";
import { generarUuidV4, normalizarEtiquetas } from "@/utils/entradaUtils";

interface EntradaRow {
  id: number;
  remote_id: string;
  titulo: string;
  contenido: string;
  foto_uri: string | null;
  foto_url: string | null;
  borrador: number;
  destacada: number;
  lugar: string | null;
  altitud_m: number | null;
  creado_en: string;
  actualizado_en: string;
  updated_at: string;
  deleted: number;
  pending: number;
}

function mapRow(row: EntradaRow, etiquetas: string[]): Entrada {
  return {
    id: row.id,
    remote_id: row.remote_id,
    titulo: row.titulo,
    contenido: row.contenido,
    foto_uri: row.foto_uri,
    foto_url: row.foto_url,
    borrador: row.borrador === 1,
    destacada: row.destacada === 1,
    lugar: row.lugar,
    altitud_m: row.altitud_m,
    etiquetas,
    creado_en: row.creado_en,
    actualizado_en: row.actualizado_en,
    updated_at: row.updated_at,
    deleted: row.deleted === 1,
    pending: row.pending === 1,
  };
}

async function obtenerEtiquetasDeEntrada(db: DbClient, entradaId: number): Promise<string[]> {
  const rows = await db.getAllAsync<{ nombre: string }>(
    `SELECT e.nombre FROM etiqueta e
     INNER JOIN entrada_etiqueta ee ON ee.etiqueta_id = e.id
     WHERE ee.entrada_id = ? ORDER BY e.nombre ASC`,
    [entradaId],
  );
  return rows.map((r) => r.nombre);
}

async function sincronizarEtiquetas(
  db: DbClient,
  entradaId: number,
  etiquetasRaw: string[],
): Promise<void> {
  const tags = normalizarEtiquetas(etiquetasRaw);
  await db.runAsync("DELETE FROM entrada_etiqueta WHERE entrada_id = ?", [entradaId]);
  for (const nombre of tags) {
    await db.runAsync("INSERT OR IGNORE INTO etiqueta (nombre) VALUES (?)", [nombre]);
    const tagRow = await db.getFirstAsync<{ id: number }>(
      "SELECT id FROM etiqueta WHERE nombre = ?",
      [nombre],
    );
    if (tagRow) {
      await db.runAsync(
        "INSERT OR IGNORE INTO entrada_etiqueta (entrada_id, etiqueta_id) VALUES (?, ?)",
        [entradaId, tagRow.id],
      );
    }
  }
}

export async function listarEntradas(db: DbClient, busqueda = ""): Promise<Entrada[]> {
  const q = busqueda.trim().toLowerCase();
  const rows = q
    ? await db.getAllAsync<EntradaRow>(
        `SELECT DISTINCT e.* FROM entrada e
         LEFT JOIN entrada_etiqueta ee ON ee.entrada_id = e.id
         LEFT JOIN etiqueta t ON t.id = ee.etiqueta_id
         WHERE e.deleted = 0 AND (
           LOWER(e.titulo) LIKE ? OR LOWER(e.contenido) LIKE ? OR LOWER(t.nombre) LIKE ?
         )
         ORDER BY e.creado_en DESC, e.id DESC`,
        [`%${q}%`, `%${q}%`, `%${q}%`],
      )
    : await db.getAllAsync<EntradaRow>(
        "SELECT * FROM entrada WHERE deleted = 0 ORDER BY creado_en DESC, id DESC",
      );

  const result: Entrada[] = [];
  for (const row of rows) {
    const tags = await obtenerEtiquetasDeEntrada(db, row.id);
    result.push(mapRow(row, tags));
  }
  return result;
}

export async function obtenerEntradaPorId(db: DbClient, id: number): Promise<Entrada | null> {
  const row = await db.getFirstAsync<EntradaRow>(
    "SELECT * FROM entrada WHERE id = ? AND deleted = 0",
    [id],
  );
  if (!row) return null;
  const tags = await obtenerEtiquetasDeEntrada(db, row.id);
  return mapRow(row, tags);
}

async function actualizarEntradaRow(
  db: DbClient,
  id: number,
  input: EntradaInput,
  now: string,
): Promise<number> {
  await db.runAsync(
    `UPDATE entrada SET titulo = ?, contenido = ?, foto_uri = ?, foto_url = ?,
     borrador = ?, destacada = ?, lugar = ?, altitud_m = ?,
     actualizado_en = ?, updated_at = ?, pending = 1 WHERE id = ?`,
    [
      input.titulo.trim(),
      input.contenido.trim(),
      input.foto_uri,
      input.foto_url,
      input.borrador ? 1 : 0,
      input.destacada ? 1 : 0,
      input.lugar,
      input.altitud_m,
      now,
      now,
      id,
    ],
  );
  return id;
}

async function insertarEntradaRow(db: DbClient, input: EntradaInput, now: string): Promise<number> {
  const remoteId = input.remote_id ?? generarUuidV4();
  const res = await db.runAsync(
    `INSERT INTO entrada (remote_id, titulo, contenido, foto_uri, foto_url, borrador,
     destacada, lugar, altitud_m, creado_en, actualizado_en, updated_at, deleted, pending)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1)`,
    [
      remoteId,
      input.titulo.trim(),
      input.contenido.trim(),
      input.foto_uri,
      input.foto_url,
      input.borrador ? 1 : 0,
      input.destacada ? 1 : 0,
      input.lugar,
      input.altitud_m,
      now,
      now,
      now,
    ],
  );
  return res.lastInsertRowId;
}

export async function guardarEntradaLocal(db: DbClient, input: EntradaInput): Promise<Entrada> {
  const now = new Date().toISOString();
  const entradaId = input.id
    ? await actualizarEntradaRow(db, input.id, input, now)
    : await insertarEntradaRow(db, input, now);
  await sincronizarEtiquetas(db, entradaId, input.etiquetas);
  const saved = await obtenerEntradaPorId(db, entradaId);
  if (!saved) throw new Error("No se pudo recuperar la entrada guardada");
  return saved;
}

export async function marcarDestacadaLocal(
  db: DbClient,
  id: number,
  destacada: boolean,
): Promise<void> {
  const now = new Date().toISOString();
  await db.runAsync(
    "UPDATE entrada SET destacada = ?, actualizado_en = ?, updated_at = ?, pending = 1 WHERE id = ?",
    [destacada ? 1 : 0, now, now, id],
  );
}

export async function eliminarEntradaLocal(db: DbClient, id: number): Promise<void> {
  const now = new Date().toISOString();
  await db.runAsync("UPDATE entrada SET deleted = 1, updated_at = ?, pending = 1 WHERE id = ?", [
    now,
    id,
  ]);
}

export async function listarEtiquetasConConteo(db: DbClient): Promise<EtiquetaResumen[]> {
  return db.getAllAsync<EtiquetaResumen>(
    `SELECT t.id, t.nombre, COUNT(e.id) AS total
     FROM etiqueta t
     LEFT JOIN entrada_etiqueta ee ON ee.etiqueta_id = t.id
     LEFT JOIN entrada e ON e.id = ee.entrada_id AND e.deleted = 0
     GROUP BY t.id, t.nombre
     ORDER BY t.nombre ASC`,
  );
}

export async function eliminarEtiquetaLocal(db: DbClient, etiquetaId: number): Promise<void> {
  await db.runAsync("DELETE FROM entrada_etiqueta WHERE etiqueta_id = ?", [etiquetaId]);
  await db.runAsync("DELETE FROM etiqueta WHERE id = ?", [etiquetaId]);
}

export async function listarPendientesSync(db: DbClient): Promise<Entrada[]> {
  const rows = await db.getAllAsync<EntradaRow>("SELECT * FROM entrada WHERE pending = 1");
  const result: Entrada[] = [];
  for (const row of rows) {
    const tags = await obtenerEtiquetasDeEntrada(db, row.id);
    result.push(mapRow(row, tags));
  }
  return result;
}

export async function marcarSincronizada(
  db: DbClient,
  id: number,
  serverUpdatedAt: string,
): Promise<void> {
  await db.runAsync("UPDATE entrada SET pending = 0, updated_at = ? WHERE id = ?", [
    serverUpdatedAt,
    id,
  ]);
}

export async function guardarPreferencia(
  db: DbClient,
  clave: string,
  valor: string,
): Promise<void> {
  await db.runAsync(
    "INSERT INTO preferencias (clave, valor) VALUES (?, ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor",
    [clave, valor],
  );
}

export async function obtenerPreferencia(db: DbClient, clave: string): Promise<string | null> {
  const row = await db.getFirstAsync<{ valor: string }>(
    "SELECT valor FROM preferencias WHERE clave = ?",
    [clave],
  );
  return row ? row.valor : null;
}
