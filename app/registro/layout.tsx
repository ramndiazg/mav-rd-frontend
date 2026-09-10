import type { Metadata } from "next";

// NUEVO (10/09/2026): noindex explícito a nivel de página, además de
// quitarla del sitemap y agregarla a disallow en robots.ts — ver
// ARQUITECTURA_BACKEND.md, sección "Seguridad — ataque de registro
// masivo". robots.txt es solo una sugerencia que los buscadores
// respetuosos siguen; esta etiqueta es una instrucción más fuerte que
// además cubre el caso de que algún sitio externo enlace directo a esta
// página. page.tsx es "use client" y no puede exportar metadata por su
// cuenta, de ahí este layout server-component aparte.
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function RegistroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}