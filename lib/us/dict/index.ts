import { comun } from "./comun";
import { landing } from "./landing";
import { cuenta } from "./cuenta";
import { pago } from "./pago";
import { aula } from "./aula";

// NUEVO (24/10/2026): diccionario completo del curso de EE. UU. Cada parte
// del frontend añade su sección en este directorio y la suma aquí con una
// línea en `es` y otra en `en`. El tipo DictKey se deduce solo.
//
// Secciones: comun (F1) · landing, cuenta (F2) · pago (F3) · aula (F4)

export const dict = {
  es: { ...comun.es, ...landing.es, ...cuenta.es, ...pago.es, ...aula.es },
  en: { ...comun.en, ...landing.en, ...cuenta.en, ...pago.en, ...aula.en },
};

export type DictKey = keyof typeof dict.es;
