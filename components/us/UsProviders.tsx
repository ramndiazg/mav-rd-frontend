"use client";

import type { ReactNode } from "react";
import { UsLocaleProvider } from "@/contexts/UsLocaleContext";
import { UsAuthProvider } from "@/contexts/UsAuthContext";
import UsHeader from "@/components/us/UsHeader";
import UsFooter from "@/components/us/UsFooter";
import { useUsLocale } from "@/contexts/UsLocaleContext";

// NUEVO (24/10/2026): proveedores y "carcasa" de /us/*. app/us/layout.tsx es
// un server component (para poder declarar `metadata`) y delega aquí todo lo
// que necesita estado del navegador.
function Carcasa({ children }: { children: ReactNode }) {
  const { t } = useUsLocale();
  return (
    <>
      <a
        href="#contenido-us"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-brand-blue"
      >
        {t("nav.saltar")}
      </a>
      <UsHeader />
      <main id="contenido-us" className="min-h-[60vh]">
        {children}
      </main>
      <UsFooter />
    </>
  );
}

export default function UsProviders({ children }: { children: ReactNode }) {
  return (
    <UsLocaleProvider>
      <UsAuthProvider>
        <Carcasa>{children}</Carcasa>
      </UsAuthProvider>
    </UsLocaleProvider>
  );
}