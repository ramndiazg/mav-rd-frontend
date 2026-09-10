import type { MetadataRoute } from "next";

const SITE_URL = "https://www.muvordvial.com";

// Solo páginas PÚBLICAS — nada que requiera login (dashboard, panel,
// aula-virtual, examen, perfil) va aquí. Esas ya quedaron bloqueadas en
// robots.ts, así que tampoco tiene sentido listarlas como "visítame" para
// Google en el sitemap.
export default function sitemap(): MetadataRoute.Sitemap {
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

  return paginas.map((p) => ({
    url: `${SITE_URL}${p.ruta}`,
    lastModified: ahora,
    changeFrequency: p.frecuencia,
    priority: p.prioridad,
  }));
}
