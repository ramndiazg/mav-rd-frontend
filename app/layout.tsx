import type { Metadata } from "next";
import { Poppins, Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/contexts/AuthContext";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-poppins",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

// CORREGIDO (13/08/2026): este dominio estaba mal — apuntaba a
// "mav-rd-vial.vercel.app", que no es el dominio real del sitio
// ("muvo-rd.vercel.app"). Esto hacía que las etiquetas Open Graph,
// Twitter Card y la URL canónica apuntaran todas a un dominio ajeno,
// confundiendo a Google y a las vistas previas de WhatsApp/Facebook.
const SITE_URL = "https://muvo-rd.vercel.app";

// Descripción reescrita para incluir las palabras que la gente realmente
// busca en Google ("escuela de manejo", "licencia de conducir",
// "Santo Domingo", "INTRANT"), no solo el lenguaje interno del producto.
const DESCRIPCION_SITIO =
  "Escuela de manejo en Santo Domingo para mujeres y jóvenes. Clases teóricas y prácticas para sacar tu licencia de conducir del INTRANT en República Dominicana, a tu ritmo y sin prisa.";

const PALABRAS_CLAVE = [
  "escuela de manejo Santo Domingo",
  "clases de manejo República Dominicana",
  "academia de conducir Santo Domingo",
  "licencia de conducir INTRANT",
  "aprender a manejar mujeres",
  "clases de manejo para mujeres",
  "curso de manejo defensivo",
  "examen práctico INTRANT",
  "Mujeres al Volante RD",
];

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Muvo RD Vial — Escuela de Manejo en Santo Domingo",
    template: "%s | Muvo RD Vial",
  },
  description: DESCRIPCION_SITIO,
  keywords: PALABRAS_CLAVE,
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
  openGraph: {
    type: "website",
    locale: "es_DO",
    siteName: "Muvo RD Vial",
    title: "Muvo RD Vial — Escuela de Manejo en Santo Domingo",
    description: DESCRIPCION_SITIO,
    url: SITE_URL,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Muvo RD Vial - Embajadores de la educación vial",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Muvo RD Vial — Escuela de Manejo en Santo Domingo",
    description: DESCRIPCION_SITIO,
    images: ["/og-image.png"],
  },
  // TODO: cuando registres el sitio en Google Search Console, pega aquí
  // el código de verificación que te dé (Settings > Ownership verification
  // > HTML tag). Se ve como "aBcD123...". Sin esto, igual puedes verificar
  // el sitio subiendo un archivo, pero esta vía es más rápida.
  // verification: { google: "PEGA_TU_CODIGO_AQUI" },
};

// Datos estructurados (Schema.org) — le dicen a Google explícitamente
// "esto es una escuela de manejo, ubicada en Santo Domingo, y esto es lo
// que ofrece". No garantiza aparecer arriba, pero ayuda a que Google
// entienda de qué se trata el sitio más rápido, y habilita resultados
// enriquecidos (rich snippets) a futuro.
const JSON_LD_ORGANIZACION = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: "Muvo RD Vial",
  alternateName: "Mujeres al Volante RD",
  url: SITE_URL,
  logo: `${SITE_URL}/logo-mav-rd.png`,
  description: DESCRIPCION_SITIO,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Santo Domingo",
    addressCountry: "DO",
  },
  areaServed: {
    "@type": "Country",
    name: "República Dominicana",
  },
  founder: {
    "@type": "Person",
    name: "María Díaz",
  },
  foundingDate: "2017-11-25",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD_ORGANIZACION) }}
        />
      </head>
      <body className={`${poppins.variable} ${inter.variable} antialiased`}>
        <AuthProvider>
          <Navbar />
          {children}
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}