import type { Metadata } from "next";
import type { ReactNode } from "react";

// NUEVO (24/10/2026): las pantallas de cuenta, pago y aula no se indexan.
// (Route group: no cambia las URLs — /us/login sigue siendo /us/login.)
// `robots` reemplaza al del layout superior (fusión superficial de Next 16).
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function UsPrivadoLayout({ children }: { children: ReactNode }) {
  return children;
}