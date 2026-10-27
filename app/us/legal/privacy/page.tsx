import type { Metadata } from "next";
import LegalPage from "@/components/us/LegalPage";

// NUEVO (24/10/2026): página pública e indexable (fuera del grupo (privado)).
// `metadata` reemplaza la del layout /us (fusión superficial de Next 16), por
// eso declara su propio canonical y Open Graph.
export const metadata: Metadata = {
  title: "Política de privacidad · Privacy policy",
  description: "Qué datos recopilamos y qué derechos tienes. / What data we collect and what rights you have.",
  alternates: { canonical: "/us/legal/privacy" },
  openGraph: {
    type: "website",
    siteName: "Muvo RD Vial",
    title: "Política de privacidad · Privacy policy",
    description: "Qué datos recopilamos y qué derechos tienes. / What data we collect and what rights you have.",
    url: "/us/legal/privacy",
  },
};

export default function Page() {
  return <LegalPage tipo="privacy" />;
}