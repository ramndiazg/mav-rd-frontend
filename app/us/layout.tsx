import type { Metadata } from "next";
import type { ReactNode } from "react";
import UsProviders from "@/components/us/UsProviders";

// NUEVO (24/10/2026): layout de todo /us/*. Server component para poder
// declarar `metadata`.
//
// OJO (Next 16): la metadata de varios segmentos se fusiona de forma
// SUPERFICIAL — `alternates`, `openGraph` y `title` de este archivo REEMPLAZAN
// a los del layout raíz (que declara canonical "/", locale es_DO, el volante
// de la escuela de Santo Domingo…). Por eso aquí se declaran completos; si no,
// /us heredaría el canonical de la página de inicio de RD.
const TITULO = "Driver Prep USA — Prepárate para tu examen de manejo";
const DESCRIPCION =
  "Curso de preparación para hispanos en Nueva York, Nueva Jersey, Florida y Massachusetts: señales, reglas de la vía y examen de conocimientos, con glosario en inglés. Formación complementaria, no oficial.";

export const metadata: Metadata = {
  title: {
    default: `${TITULO} | Muvo RD Vial`,
    template: "%s | Muvo RD Vial USA",
  },
  description: DESCRIPCION,
  alternates: { canonical: "/us" },
  openGraph: {
    type: "website",
    locale: "es_US",
    siteName: "Muvo RD Vial",
    title: TITULO,
    description: DESCRIPCION,
    url: "/us",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Muvo RD Vial — Driver Prep USA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITULO,
    description: DESCRIPCION,
    images: ["/og-image.png"],
  },
};

export default function UsLayout({ children }: { children: ReactNode }) {
  return <UsProviders>{children}</UsProviders>;
}