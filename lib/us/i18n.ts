// NUEVO (24/10/2026): idioma de la interfaz del curso Driver Prep USA (/us/*).
// Sin librerías: diccionarios TypeScript con las MISMAS claves en es y en
// (si falta una, el compilador lo marca — ver lib/us/dict/definir.ts).

export type Locale = "es" | "en";

export const LOCALES: Locale[] = ["es", "en"];
export const LOCALE_KEY = "us_lang";

export function esLocale(valor: unknown): valor is Locale {
  return valor === "es" || valor === "en";
}

// Orden de detección: ?lang=es|en → localStorage → idioma del navegador
// (si empieza por "es", español; si no, inglés). Solo se llama en el cliente;
// en el servidor el idioma por defecto es "es" (ver UsLocaleContext).
export function detectarLocale(): Locale {
  if (typeof window === "undefined") return "es";

  const parametro = new URLSearchParams(window.location.search).get("lang");
  if (esLocale(parametro)) return parametro;

  try {
    const guardado = window.localStorage.getItem(LOCALE_KEY);
    if (esLocale(guardado)) return guardado;
  } catch {
    // localStorage bloqueado (modo privado estricto): se sigue con el navegador.
  }

  const idiomaNavegador = (window.navigator.language || "").toLowerCase();
  return idiomaNavegador.startsWith("es") ? "es" : "en";
}

// Reemplaza {nombre} por vars.nombre. Si falta la variable, deja el marcador.
export function interpolar(
  texto: string,
  vars?: Record<string, string | number>,
): string {
  if (!vars) return texto;
  return texto.replace(/\{(\w+)\}/g, (marcador, nombre: string) =>
    nombre in vars ? String(vars[nombre]) : marcador,
  );
}

// Códigos de idioma para Intl.* (montos y fechas).
export function intlLocale(locale: Locale): string {
  return locale === "en" ? "en-US" : "es-US";
}
