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
          // NUEVO (24/10/2026): curso Driver Prep USA. Mismo criterio que RD:
          // el registro no se rastrea (ataque de bots) y tampoco el pago ni
          // el aula. /us, /us/login y /us/legal/* siguen abiertos; las
          // pantallas de cuenta además llevan `noindex` en su metadata.
          "/us/register",
          "/us/enroll",
          "/us/pay",
          "/us/pending",
          "/us/dashboard",
          "/us/course",
          "/us/exam",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
