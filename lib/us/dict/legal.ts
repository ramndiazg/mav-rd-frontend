import { definir } from "./definir";

// Elementos comunes de las páginas legales (el contenido de cada documento
// vive en lib/us/legal/*.ts).
export const legal = definir(
  {
    "legal.actualizado": "Última actualización: {fecha}",
    "legal.borrador.titulo": "Borrador en revisión",
    "legal.borrador.texto":
      "Este texto está pendiente de revisión legal y puede cambiar antes del lanzamiento. Las partes resaltadas son decisiones por confirmar.",
    "legal.otros": "Otros documentos legales",
    "legal.volver": "Volver al curso",
    "legal.indice": "En esta página",
  },
  {
    "legal.actualizado": "Last updated: {fecha}",
    "legal.borrador.titulo": "Draft under review",
    "legal.borrador.texto":
      "This text is pending legal review and may change before launch. Highlighted parts are decisions still to be confirmed.",
    "legal.otros": "Other legal documents",
    "legal.volver": "Back to the course",
    "legal.indice": "On this page",
  },
);
