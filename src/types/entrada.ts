export interface Entrada {
  id: number;
  remote_id: string;
  titulo: string;
  contenido: string;
  foto_uri: string | null;
  foto_url: string | null;
  borrador: boolean;
  destacada: boolean;
  lugar: string | null;
  altitud_m: number | null;
  etiquetas: string[];
  creado_en: string;
  actualizado_en: string;
  updated_at: string;
  deleted: boolean;
  pending: boolean;
}

export interface EntradaInput {
  id?: number;
  remote_id?: string;
  titulo: string;
  contenido: string;
  foto_uri: string | null;
  foto_url: string | null;
  borrador: boolean;
  destacada: boolean;
  lugar: string | null;
  altitud_m: number | null;
  etiquetas: string[];
}

export interface EtiquetaResumen {
  id: number;
  nombre: string;
  total: number;
}

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthSession {
  token: string;
  refreshToken: string;
  usuario: AuthUser;
}
