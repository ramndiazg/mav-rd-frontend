// NUEVO (24/10/2026), VERSIÓN FINAL (27/10/2026): configuración común de las
// páginas legales de /us. Los tres textos (lib/us/legal/*.ts) fueron revisados
// con la asesora legal de la fundación el 27/10/2026.
//
// Si algún día se vuelve a editar un texto y se quiere publicar como borrador:
//   - poner LEGAL_EN_REVISION = true (muestra un aviso de borrador);
//   - dentro de los textos, [[ valor ]] marca una decisión pendiente (se
//     resalta en borrador y pasa a texto normal al publicar) y [[! nota ]] una
//     nota interna (se resalta en borrador y NO se publica).
// Al publicar de nuevo: LEGAL_EN_REVISION = false y actualizar LEGAL_ACTUALIZADO.

export const LEGAL_EN_REVISION = false;

// Fecha de la última versión (YYYY-MM-DD).
export const LEGAL_ACTUALIZADO = "2026-10-27";

// Nombre de quien ofrece el curso (razón social). Variable opcional
// NEXT_PUBLIC_US_ENTITY_NAME; si no existe se usa el nombre comercial.
export const LEGAL_ENTIDAD =
  process.env.NEXT_PUBLIC_US_ENTITY_NAME || "Muvo RD Vial";

// Correo de contacto y soporte del curso (el de la fundadora). Se puede cambiar
// sin tocar el código con la variable NEXT_PUBLIC_US_SUPPORT_EMAIL.
export const LEGAL_CONTACTO =
  process.env.NEXT_PUBLIC_US_SUPPORT_EMAIL || "mariadiazmuvo@gmail.com";

export type SeccionLegal = {
  titulo: string;
  parrafos?: string[]; // antes de la lista
  lista?: string[];
  cierre?: string[]; // después de la lista
};

export type DocumentoLegal = {
  titulo: string;
  resumen: string;
  secciones: SeccionLegal[];
};

export type DocumentoBilingue = { es: DocumentoLegal; en: DocumentoLegal };

export type TipoLegal = "terms" | "privacy" | "refunds";

// Sustituye {entidad} y {contacto}. Los marcadores [[...]] los resuelve
// LegalPage al pintar.
export function resolverMarcadores(texto: string): string {
  return texto
    .replaceAll("{entidad}", LEGAL_ENTIDAD)
    .replaceAll("{contacto}", LEGAL_CONTACTO);
}
