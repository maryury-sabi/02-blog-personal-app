import * as SQLite from "expo-sqlite";

export type DbClient = SQLite.SQLiteDatabase;

let dbInstance: DbClient | null = null;

export async function getDatabase(): Promise<DbClient> {
  if (dbInstance) return dbInstance;
  const db = await SQLite.openDatabaseAsync("blog_personal.db");
  await initDatabase(db);
  dbInstance = db;
  return db;
}

export async function initDatabase(db: DbClient): Promise<void> {
  await db.execAsync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS entrada (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      remote_id TEXT UNIQUE NOT NULL,
      titulo TEXT NOT NULL,
      contenido TEXT NOT NULL,
      foto_uri TEXT,
      foto_url TEXT,
      borrador INTEGER NOT NULL DEFAULT 0 CHECK (borrador IN (0, 1)),
      destacada INTEGER NOT NULL DEFAULT 0 CHECK (destacada IN (0, 1)),
      lugar TEXT,
      altitud_m REAL,
      creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      actualizado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted INTEGER NOT NULL DEFAULT 0 CHECK (deleted IN (0, 1)),
      pending INTEGER NOT NULL DEFAULT 1 CHECK (pending IN (0, 1))
    );

    CREATE TABLE IF NOT EXISTS etiqueta (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS entrada_etiqueta (
      entrada_id INTEGER NOT NULL REFERENCES entrada(id) ON DELETE CASCADE,
      etiqueta_id INTEGER NOT NULL REFERENCES etiqueta(id) ON DELETE CASCADE,
      PRIMARY KEY (entrada_id, etiqueta_id)
    );

    CREATE TABLE IF NOT EXISTS preferencias (
      clave TEXT PRIMARY KEY,
      valor TEXT NOT NULL
    );
  `);
}
