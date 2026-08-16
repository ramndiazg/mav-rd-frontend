import type { MetadataRoute } from "next";

const SITE_URL = "https://muvo-rd.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Nada de contenido privado (paneles, dashboard, exámenes) debe
        // indexarse — no aporta a SEO y no tiene sentido que aparezca en
        // resultados de búsqueda para alguien que no ha iniciado sesión.
        disallow: [
          "/dashboard",
          "/panel",
          "/admin",
          "/aula-virtual",
          "/examen",
          "/perfil",
          "/inscripcion",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
