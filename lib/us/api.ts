import type { Locale } from "./i18n";
import type { DictKey } from "./dict";

// NUEVO (24/10/2026): cliente HTTP del curso de EE. UU.
//
// Por qué no se usa lib/api.ts (el de RD): ese lee el token de
// localStorage["token"]; aquí la sesión vive en localStorage["us_token"] para
// que las dos cuentas (RD y EE. UU.) nunca se mezclen en el mismo navegador.
//
// Formas de respuesta del backend:
//   - /api/us/*      → { success:false, code, error }   (code estable)
//   - endpoints de RD reutilizados (progreso, exámenes, uploads…)
//                    → { success:false, error }         (sin code, en español)

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export const US_TOKEN_KEY = "us_token";
export const EVENTO_SESION_VENCIDA = "us-auth-expired";

export class ApiErrorUS extends Error {
  status: number;
  code: string | null;
  constructor(mensaje: string, status: number, code: string | null) {
    super(mensaje);
    this.name = "ApiErrorUS";
    this.status = status;
    this.code = code;
  }
}

export function leerTokenUS(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(US_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function guardarTokenUS(token: string | null) {
  try {
    if (token) window.localStorage.setItem(US_TOKEN_KEY, token);
    else window.localStorage.removeItem(US_TOKEN_KEY);
  } catch {
    // localStorage bloqueado: la sesión dura lo que dure la pestaña.
  }
}

type OpcionesUS = Omit<RequestInit, "body"> & {
  body?: unknown; // se serializa a JSON
  locale?: Locale; // idioma de los mensajes del servidor
  token?: string | null; // por defecto, el guardado
};

/**
 * Llama al backend y devuelve `data` si success=true; si no, lanza ApiErrorUS.
 * `path` es lo que va después de /api: "/us/inscripcion/me", "/auth/perfil"…
 *
 * Nota: el backend en Render puede tardar 30-60 s en responder si estuvo
 * dormido (cold start). Las pantallas deben mostrar un estado de carga que
 * lo contemple.
 */
export async function usFetch<T>(
  path: string,
  { body, locale, token, headers, ...resto }: OpcionesUS = {},
): Promise<T> {
  const tokenUsado = token === undefined ? leerTokenUS() : token;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...resto,
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(locale ? { "Accept-Language": locale } : {}),
        ...(tokenUsado ? { Authorization: `Bearer ${tokenUsado}` } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiErrorUS("network", 0, "red");
  }

  let json: {
    success?: boolean;
    data?: T;
    error?: string;
    code?: string;
  } | null = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  if (res.ok && json?.success) return json.data as T;

  // Sesión vencida o cuenta desactivada: se avisa a UsAuthContext.
  if (res.status === 401 && tokenUsado && typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENTO_SESION_VENCIDA));
  }

  const code =
    json?.code ||
    (res.status === 401
      ? "sesionExpirada"
      : res.status === 429
        ? "limite"
        : null);
  throw new ApiErrorUS(json?.error || `HTTP ${res.status}`, res.status, code);
}

type Traductor = (
  clave: DictKey,
  vars?: Record<string, string | number>,
) => string;

/**
 * Convierte cualquier error en un mensaje para mostrar, en el idioma activo.
 *  1) Si trae `code` conocido → texto traducido (err.<code>).
 *  2) Si no trae code (endpoints de RD reutilizados): en español se muestra
 *     el texto del servidor; en inglés, el mensaje genérico (no se puede
 *     traducir un texto libre).
 */
export function mensajeDeError(
  error: unknown,
  t: Traductor,
  locale: Locale,
  diccionario: Record<string, string>,
): string {
  if (error instanceof ApiErrorUS) {
    if (error.code && `err.${error.code}` in diccionario) {
      return t(`err.${error.code}` as DictKey);
    }
    if (error.code === "red") return t("err.red");
    if (
      error.status >= 400 &&
      error.status < 500 &&
      locale === "es" &&
      error.message
    ) {
      return error.message;
    }
  }
  return t("err.generico");
}
