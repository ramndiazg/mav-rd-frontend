import type { Locale } from "./i18n";

// NUEVO (24/10/2026): los 4 estados del curso y la ficha de su examen de
// conocimientos. Los datos vienen de CURSO_DRIVER_PREP_USA_ESTUDIO.md §2
// (revisión 10/2026): son REFERENCIA, no promesa — cada ficha enlaza al
// organismo oficial y la pantalla debe decir que se confirme allí.

export type EstadoUS = "NY" | "NJ" | "FL" | "MA";

export const ESTADOS_US: EstadoUS[] = ["NY", "NJ", "FL", "MA"];

export function esEstadoUS(valor: unknown): valor is EstadoUS {
  return typeof valor === "string" && (ESTADOS_US as string[]).includes(valor);
}

type Bilingue = { es: string; en: string };

export type FichaEstado = {
  nombre: Bilingue;
  organismo: string; // siglas oficiales (DMV, MVC, FLHSMV, RMV)
  sitio: string; // URL oficial
  // Aviso destacado (solo Florida): el examen es únicamente en inglés.
  soloIngles: boolean;
  examen: Bilingue; // resumen del formato del examen de conocimientos
};

export const ESTADOS_INFO: Record<EstadoUS, FichaEstado> = {
  NY: {
    nombre: { es: "Nueva York", en: "New York" },
    organismo: "DMV",
    sitio: "https://dmv.ny.gov",
    soloIngles: false,
    examen: {
      es: "20 preguntas; se aprueba con 14 correctas y al menos 2 de las 4 preguntas de señales. El examen se ofrece en varios idiomas, incluido español.",
      en: "20 questions; you pass with 14 correct and at least 2 of the 4 sign questions. The exam is offered in several languages, including Spanish.",
    },
  },
  NJ: {
    nombre: { es: "Nueva Jersey", en: "New Jersey" },
    organismo: "MVC",
    sitio: "https://www.nj.gov/mvc",
    soloIngles: false,
    examen: {
      es: "50 preguntas; se aprueba con 40 correctas (80 %). El examen se ofrece en inglés, español y otros idiomas.",
      en: "50 questions; you pass with 40 correct (80%). The exam is offered in English, Spanish and other languages.",
    },
  },
  FL: {
    nombre: { es: "Florida", en: "Florida" },
    organismo: "FLHSMV",
    sitio: "https://www.flhsmv.gov",
    soloIngles: true,
    examen: {
      es: "50 preguntas; se aprueba con 40 correctas (80 %). Desde el 6 de febrero de 2026 el examen se rinde solo en inglés, sin intérprete ni traductor.",
      en: "50 questions; you pass with 40 correct (80%). Since February 6, 2026 the exam is given in English only, with no interpreter or translator.",
    },
  },
  MA: {
    nombre: { es: "Massachusetts", en: "Massachusetts" },
    organismo: "RMV",
    sitio: "https://www.mass.gov/rmv",
    soloIngles: false,
    examen: {
      es: "25 preguntas; se aprueba con 18 correctas. El examen se ofrece en inglés, español y otros idiomas.",
      en: "25 questions; you pass with 18 correct. The exam is offered in English, Spanish and other languages.",
    },
  },
};

export function nombreEstado(
  codigo: string | null | undefined,
  locale: Locale,
): string {
  if (!codigo || !esEstadoUS(codigo)) return codigo || "";
  return ESTADOS_INFO[codigo].nombre[locale];
}
