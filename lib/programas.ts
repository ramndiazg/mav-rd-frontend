// Programas (categorías) que puede contratar un grupo (colegio/empresa).
// Mismos valores que Sesion.programaContenido / ProgresoEstudiante.programa
// en el backend (backend: src/utils/programas.js — mantener en sync).
//
// NUEVO (04/10/2026). Las etiquetas del panel de aula virtual y del de
// exámenes siguen viviendo en sus propios archivos y no se tocaron; este
// archivo evita sumar una copia más.

export type ProgramaGrupo =
  | "estandar"
  | "motorizados"
  | "pesados"
  | "montacargas";

export const PROGRAMAS_GRUPO: { valor: ProgramaGrupo; etiqueta: string }[] = [
  { valor: "estandar", etiqueta: "Categoría 02 — Livianos" },
  { valor: "motorizados", etiqueta: "Categoría 01 — Motocicletas" },
  { valor: "pesados", etiqueta: "Categoría 03/04 — Pesados" },
  { valor: "montacargas", etiqueta: "Categoría 05 — Montacargas" },
];

// NUEVO (10/2026): programas que SOLO se contratan de forma individual y por
// eso NO están en PROGRAMAS_GRUPO (esa lista alimenta los desplegables de
// "Nuevo grupo" y "Cambiar programa", y el backend rechaza grupos de estos
// programas). Aquí viven únicamente para que `etiquetaPrograma` — que usa
// el dashboard de la estudiante — muestre su nombre y no caiga a
// "Categoría 02 — Livianos".
const ETIQUETAS_SOLO_INDIVIDUAL: Record<string, string> = {
  "auxiliar-escolar": "Auxiliar de Transporte Escolar",
};

// Un valor ausente o desconocido se muestra como "estandar" — igual que el
// backend, que trata así a los grupos anteriores a este campo.
export function etiquetaPrograma(programa?: string | null): string {
  if (programa && ETIQUETAS_SOLO_INDIVIDUAL[programa]) {
    return ETIQUETAS_SOLO_INDIVIDUAL[programa];
  }
  return (
    PROGRAMAS_GRUPO.find((p) => p.valor === programa)?.etiqueta ??
    PROGRAMAS_GRUPO[0].etiqueta
  );
}
