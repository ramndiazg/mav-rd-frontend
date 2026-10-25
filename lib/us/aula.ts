// NUEVO (24/10/2026): tipos y utilidades del aula (dashboard, módulo, examen).
// Las formas de respuesta vienen de los endpoints de RD que el curso reutiliza
// (progreso, intentos de examen) y de /api/us/sesiones y /api/us/contenido.

export const TOTAL_MODULOS = 4;
export const MAX_INTENTOS = 3;
export const HORAS_ESPERA_ENTRE_EXAMENES = 24;
export const NOTA_APROBATORIA = 70;

export type ProgresoUS = {
  programa: string;
  sesionActualDesbloqueada: number;
  sesionesAprobadas: number[];
  cursoCompletado: boolean;
  contenidosVistos: string[];
  fechasAprobacionSesion: { sesion: number; fecha: string }[];
};

export type SesionUS = { _id: string; numero: number; titulo: string };

export type ContenidoUS = {
  _id: string;
  titulo: string;
  tipo: "video" | "pdf" | "enlace" | "texto";
  url?: string;
  publicIdCloudinary?: string;
  orden: number;
  estado: string | null; // null = general; "NY"… = solo ese estado
};

export type IntentoHistorial = {
  _id: string;
  fechaFin: string | null;
  aprobado: boolean | null;
  calificacion: number | null;
};

export type ResultadoMarcarVisto = {
  contenidoId: string;
  examenDesbloqueado: boolean;
  esperaActiva: boolean;
  disponibleEn: string | null;
};

export type PreguntaExamen = { texto: string; opciones: string[] };

export type InicioExamen = {
  intentoId: string;
  preguntas: PreguntaExamen[];
  tiempoLimiteSegundos: number;
  fechaInicio: string;
  reanudado?: boolean;
};

export type ResultadoExamen = {
  calificacion: number;
  aprobado: boolean;
  proximaSesionDisponibleEn: string | null;
  fueraDeTiempo?: boolean;
};

export type DetallePregunta = {
  texto: string;
  opciones: string[];
  respuestaEstudiante: number | null;
  respuestaCorrectaIndex: number;
  acerto: boolean;
};

// Cuándo se habilita el examen del módulo `numero`: 24 h después de aprobar el
// anterior (mismo criterio del servidor en intentarDesbloquear). null si no
// aplica (módulo 1, o el anterior aún no está aprobado).
export function examenDisponibleEn(
  progreso: ProgresoUS,
  numero: number,
): Date | null {
  if (numero <= 1) return null;
  const previa = progreso.fechasAprobacionSesion.find(
    (f) => f.sesion === numero - 1,
  );
  if (!previa) return null;
  return new Date(
    new Date(previa.fecha).getTime() +
      HORAS_ESPERA_ENTRE_EXAMENES * 60 * 60 * 1000,
  );
}

// "23:59:12" — tiempo que falta (ms) como hh:mm:ss.
export function formatearRestante(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

// --- Preguntas bilingües -----------------------------------------------------
// Convención de contenido (ESTUDIO §6): el modelo guarda UN texto por pregunta,
//  - pregunta: enunciado en inglés, salto de línea, traducción al español;
//  - opción:   texto en inglés seguido de la traducción corta entre paréntesis.
// Estas funciones los separan para poder ocultar la traducción ("Modo examen
// en inglés"). Un texto sin esa forma se muestra completo, sin cambios.

export function partirPregunta(texto: string): {
  principal: string;
  traduccion: string;
} {
  const i = texto.indexOf("\n");
  if (i < 0) return { principal: texto.trim(), traduccion: "" };
  return {
    principal: texto.slice(0, i).trim(),
    traduccion: texto.slice(i + 1).trim(),
  };
}

export function partirOpcion(texto: string): {
  principal: string;
  traduccion: string;
} {
  const m = /^([\s\S]*?)\s*\(([^()]+)\)\s*$/.exec(texto);
  if (!m || !m[1].trim()) return { principal: texto.trim(), traduccion: "" };
  return { principal: m[1].trim(), traduccion: m[2].trim() };
}
