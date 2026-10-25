// NUEVO (24/10/2026): prepara la foto del recibo antes de subirla.
// Una foto de celular suele pesar 3-8 MB y el servidor acepta máximo 5 MB, y
// además la mayoría paga con datos móviles: se reduce a ~1800 px de lado largo
// y JPEG calidad 0.82 (el texto del recibo sigue legible).

export const MAX_BYTES_IMAGEN = 5 * 1024 * 1024;
const LADO_MAXIMO = 1800;
const UMBRAL_SIN_TOCAR = 1.5 * 1024 * 1024;

export function esImagen(archivo: File): boolean {
  return archivo.type.startsWith("image/");
}

export async function prepararImagen(archivo: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(archivo);
    const escala = Math.min(
      1,
      LADO_MAXIMO / Math.max(bitmap.width, bitmap.height),
    );

    if (escala === 1 && archivo.size <= UMBRAL_SIN_TOCAR) {
      bitmap.close();
      return archivo;
    }

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * escala);
    canvas.height = Math.round(bitmap.height * escala);
    const contexto = canvas.getContext("2d");
    if (!contexto) {
      bitmap.close();
      return archivo;
    }
    contexto.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolver) =>
      canvas.toBlob(resolver, "image/jpeg", 0.82),
    );
    if (blob && blob.size < archivo.size) {
      const nombre = archivo.name.replace(/\.[^.]+$/, "") || "recibo";
      return new File([blob], `${nombre}.jpg`, { type: "image/jpeg" });
    }
    return archivo;
  } catch {
    // Formato que el navegador no sabe leer (p. ej. HEIC en algunos
    // navegadores): se sube tal cual y el servidor decide.
    return archivo;
  }
}
