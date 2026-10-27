// NUEVO (24/10/2026): configuración común de las páginas legales de /us.
//
// *** ANTES DE LANZAR ***
//  1. Una abogada debe revisar los tres textos (lib/us/legal/*.ts).
//  2. Decidir los valores marcados en esos textos:
//       [[ valor ]]   = decisión pendiente con un valor propuesto. Con
//                       LEGAL_EN_REVISION = true se resalta; con false pasa a
//                       texto normal (el valor propuesto queda como definitivo).
//       [[! nota ]]   = nota interna para quien revisa. Se ve resaltada en el
//                       borrador y DESAPARECE al poner la bandera en false.
//  3. Poner LEGAL_EN_REVISION = false y actualizar LEGAL_ACTUALIZADO.

export const LEGAL_EN_REVISION = true;

// Fecha de la última versión (YYYY-MM-DD).
export const LEGAL_ACTUALIZADO = "2026-10-24";

// Nombre de quien ofrece el curso (razón social). Variable opcional; hasta
// definirla se usa el nombre comercial.
export const LEGAL_ENTIDAD =
  process.env.NEXT_PUBLIC_US_ENTITY_NAME || "Muvo RD Vial";

// Correo de contacto/soporte del curso. Variable opcional; si no existe, los
// textos muestran un marcador "por definir" (el sitio de RD no tiene un correo
// público de soporte que se pueda reutilizar).
export const LEGAL_CONTACTO = process.env.NEXT_PUBLIC_US_SUPPORT_EMAIL || "";

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
    .replaceAll(
      "{contacto}",
      LEGAL_CONTACTO ||
        "[[correo de contacto por definir / contact email to be defined]]",
    );
}
