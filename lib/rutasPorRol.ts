export type Rol = "estudiante" | "coordinadora" | "admin" | "conductor";

// Pantalla "de inicio" de cada rol.
export function rutaInicioPorRol(rol: Rol): string {
  if (rol === "coordinadora" || rol === "admin") return "/panel";
  if (rol === "conductor") return "/practica";
  return "/dashboard";
}

// Prefijos de rutas protegidas por rol (ver los layouts con RutaProtegida).
const PREFIJOS_STAFF = ["/panel", "/admin", "/practica"];

// Devuelve el ?redirect= solo si ese rol realmente puede abrir esa ruta.
// Evita el ping-pong /login <-> /panel cuando queda un redirect viejo en la
// URL (ej. admin cerró sesión en /panel y luego entra una estudiante).
export function redirectValidoParaRol(
  redirect: string | null,
  rol: Rol,
): string | null {
  if (!redirect || !redirect.startsWith("/") || redirect.startsWith("//")) {
    return null;
  }
  const esStaff = PREFIJOS_STAFF.some(
    (p) =>
      redirect === p ||
      redirect.startsWith(p + "/") ||
      redirect.startsWith(p + "?"),
  );
  if (rol === "estudiante" && esStaff) return null;
  if (rol !== "estudiante") return null; // staff siempre va a su panel
  return redirect;
}
