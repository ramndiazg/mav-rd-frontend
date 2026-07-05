// Cliente centralizado hacia el backend de Mujeres al Volante RD.
// Todas las respuestas del backend siguen la forma:
//   { success: true, data: ... }  o  { success: false, error: "mensaje" }
// Ver Arquitectura_Backend.md / BITACORA_FRONTEND.md para el detalle.

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

type ApiSuccess<T> = { success: true; data: T };
type ApiError = { success: false; error: string };
type ApiResponse<T> = ApiSuccess<T> | ApiError;

/**
 * Llama al backend y devuelve directamente `data` si success=true.
 * Si success=false, lanza un Error con el mensaje ya en español listo
 * para mostrar (así lo definió el backend).
 *
 * Nota sobre el free tier de Render: si el backend lleva ~15 min dormido,
 * la primera petición puede tardar 30-60s en responder (cold start). Los
 * componentes que usan esta función deben mostrar un estado de carga que
 * contemple esa demora.
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const json: ApiResponse<T> = await res.json();

  if (!json.success) {
    throw new Error(json.error);
  }

  return json.data;
}
