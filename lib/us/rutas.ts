// NUEVO (24/10/2026): evita "open redirect": después del login solo se
// acepta volver a una ruta interna de /us (nunca a otro sitio).
export function siguienteSegura(
  valor: string | null | undefined,
  porDefecto = "/us/dashboard",
): string {
  if (!valor) return porDefecto;
  // Debe ser /us o /us/..., sin "//" ni esquemas ni barras invertidas.
  if (!/^\/us(\/[A-Za-z0-9\-_/]*)?(\?[A-Za-z0-9=&\-_%]*)?$/.test(valor)) {
    return porDefecto;
  }
  if (valor.includes("//")) return porDefecto;
  return valor;
}
