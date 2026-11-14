import type { Entrada } from "@/types/entrada";

const WORDS_PER_MINUTE = 200;
const MAX_TAGS = 5;

export function tiempoDeLectura(contenido: string): number {
  const clean = contenido.trim();
  if (clean.length === 0) return 0;
  const words = clean.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

export function fechaRelativa(isoDate: string, now: Date = new Date()): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "fecha desconocida";
  const diffSec = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));
  if (diffSec < 60) return "hace unos segundos";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `hace ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "hace 1 día";
  if (diffDays < 30) return `hace ${diffDays} días`;
  const diffMonths = Math.floor(diffDays / 30);
  return diffMonths === 1 ? "hace 1 mes" : `hace ${diffMonths} meses`;
}

export function normalizarEtiquetas(raw: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const tag of raw) {
    const clean = tag.trim().toLowerCase();
    if (!clean || seen.has(clean)) continue;
    seen.add(clean);
    result.push(clean);
    if (result.length >= MAX_TAGS) break;
  }
  return result;
}

export function validarEntrada(
  titulo: string,
  contenido: string,
  etiquetas: string[],
): { valido: boolean; errores: Record<string, string> } {
  const errores: Record<string, string> = {};
  const t = titulo.trim();
  const c = contenido.trim();
  if (t.length < 3 || t.length > 80) {
    errores.titulo = "El título debe tener entre 3 y 80 caracteres.";
  }
  if (c.length < 10) {
    errores.contenido = "El contenido debe tener al menos 10 caracteres.";
  }
  if (etiquetas.length > MAX_TAGS) {
    errores.etiquetas = "Máximo 5 etiquetas por entrada.";
  }
  return { valido: Object.keys(errores).length === 0, errores };
}

export interface MarkdownSegment {
  text: string;
  bold: boolean;
}

export interface MarkdownLine {
  isBullet: boolean;
  segments: MarkdownSegment[];
}

function parseBoldSegments(line: string): MarkdownSegment[] {
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  return parts
    .filter((p) => p.length > 0)
    .map((part) => {
      if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
        return { text: part.slice(2, -2), bold: true };
      }
      return { text: part, bold: false };
    });
}

export function parsearMarkdownBasico(texto: string): MarkdownLine[] {
  return texto.split(/\r?\n/).map((rawLine) => {
    const trimmed = rawLine.trimStart();
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      return { isBullet: true, segments: parseBoldSegments(trimmed.slice(2)) };
    }
    return { isBullet: false, segments: parseBoldSegments(rawLine) };
  });
}

export function formatearEntradaParaCompartir(entrada: Entrada): string {
  const tags = entrada.etiquetas.map((t) => `#${t}`).join(" ");
  const metaParts: string[] = [];
  if (entrada.lugar) metaParts.push(entrada.lugar);
  if (entrada.altitud_m !== null) metaParts.push(`${Math.round(entrada.altitud_m)} m s. n. m.`);
  const meta = metaParts.length > 0 ? `\n(${metaParts.join(" · ")})` : "";
  const footer = tags ? `\n\n${tags}` : "";
  return `${entrada.titulo}${meta}\n\n${entrada.contenido}${footer}`;
}

export function generarUuidV4(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
