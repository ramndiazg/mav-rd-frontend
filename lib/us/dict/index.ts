import { comun } from "./comun";

// NUEVO (24/10/2026): diccionario completo del curso de EE. UU. Cada parte
// del frontend añade su sección en este directorio y la suma aquí con una
// línea en `es` y otra en `en`. El tipo DictKey se deduce solo.
//
// Secciones: comun (F1)

export const dict = {
  es: { ...comun.es },
  en: { ...comun.en },
};

export type DictKey = keyof typeof dict.es;
