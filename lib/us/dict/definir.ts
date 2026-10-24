// NUEVO (24/10/2026): `definir(es, en)` exige que `en` tenga EXACTAMENTE las
// mismas claves que `es`: si falta una o sobra otra, TypeScript marca error.
// Cada sección del diccionario vive en su propio archivo de lib/us/dict/.
export function definir<T extends Record<string, string>>(
  es: T,
  en: Record<keyof T, string>,
) {
  return { es, en };
}
