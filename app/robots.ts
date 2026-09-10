import type { MetadataRoute } from "next";

const SITE_URL = "https://www.muvordvial.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Nada de contenido privado (paneles, dashboard, exámenes) debe
        // indexarse — no aporta a SEO y no tiene sentido que aparezca en
        // resultados de búsqueda para alguien que no ha iniciado sesión.
        // NUEVO (10/09/2026): /registro se agregó aquí después de un
        // ataque de registro masivo de bots — ver ARQUITECTURA_BACKEND.md.
        // Ya no tiene sentido que Google la indexe activamente; queda
        // accesible por URL directa para quien la necesite, solo se le
        // pide a los buscadores que no la promuevan ni la rastreen.
        disallow: [
          "/dashboard",
          "/panel",
          "/admin",
          "/aula-virtual",
          "/examen",
          "/perfil",
          "/registro",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
