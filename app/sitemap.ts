import type { MetadataRoute } from "next";

const SITE_URL = "https://www.muvordvial.com";

// Solo páginas PÚBLICAS — nada que requiera login (dashboard, panel,
// aula-virtual, examen, perfil) va aquí. Esas ya quedaron bloqueadas en
// robots.ts, así que tampoco tiene sentido listarlas como "visítame" para
// Google en el sitemap.
// NUEVO (24/10/2026): el curso Driver Prep USA entra al sitemap solo mientras
// está activo (GET /api/us/config → activo:true). Apagado = no se promueve.
// Si el servidor no responde, simplemente no se incluye.
async function cursoUSActivo(): Promise<boolean> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/us/config`, {
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    const json = await res.json();
    return !!(json.success && json.data?.activo);
  } catch {
    return false;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const ahora = new Date();

  const paginas: {
    ruta: string;
    prioridad: number;
    frecuencia: MetadataRoute.Sitemap[number]["changeFrequency"];
  }[] = [
    { ruta: "", prioridad: 1.0, frecuencia: "weekly" },
    { ruta: "/empresas", prioridad: 0.9, frecuencia: "monthly" },
    { ruta: "/acerca-de-nosotros", prioridad: 0.7, frecuencia: "monthly" },
    { ruta: "/kit-preparacion", prioridad: 0.7, frecuencia: "monthly" },
    { ruta: "/testimonios", prioridad: 0.6, frecuencia: "weekly" },
    { ruta: "/noticias", prioridad: 0.6, frecuencia: "weekly" },
    { ruta: "/faq", prioridad: 0.5, frecuencia: "monthly" },
    // NUEVO (10/09/2026): /registro se quitó del sitemap a propósito —
    // ver ARQUITECTURA_BACKEND.md, sección "Seguridad — ataque de
    // registro masivo". No tiene sentido invitar activamente a Google a
    // indexar la página que un bot usó para crear cuentas falsas en
    // masa. /login se queda (no crea nada, no dispara correos).
    { ruta: "/login", prioridad: 0.3, frecuencia: "yearly" },
    { ruta: "/verificar-diploma", prioridad: 0.3, frecuencia: "yearly" },
  ];

  // Páginas públicas del curso de EE. UU. (las privadas — registro, pago,
  // aula — no se listan; ver robots.ts).
  if (await cursoUSActivo()) {
    paginas.push(
      { ruta: "/us", prioridad: 0.8, frecuencia: "weekly" },
      { ruta: "/us/legal/terms", prioridad: 0.2, frecuencia: "yearly" },
      { ruta: "/us/legal/privacy", prioridad: 0.2, frecuencia: "yearly" },
      { ruta: "/us/legal/refunds", prioridad: 0.2, frecuencia: "yearly" },
    );
  }

  return paginas.map((p) => ({
    url: `${SITE_URL}${p.ruta}`,
    lastModified: ahora,
    changeFrequency: p.frecuencia,
    priority: p.prioridad,
  }));
}
