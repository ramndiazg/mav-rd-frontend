import type { Metadata } from "next";
import LegalPage from "@/components/us/LegalPage";

// NUEVO (24/10/2026): página pública e indexable (fuera del grupo (privado)).
// `metadata` reemplaza la del layout /us (fusión superficial de Next 16), por
// eso declara su propio canonical y Open Graph.
export const metadata: Metadata = {
  title: "Política de reembolsos · Refund policy",
  description: "Cuándo y cómo devolvemos tu dinero. / When and how we return your money.",
  alternates: { canonical: "/us/legal/refunds" },
  openGraph: {
    type: "website",
    siteName: "Muvo RD Vial",
    title: "Política de reembolsos · Refund policy",
    description: "Cuándo y cómo devolvemos tu dinero. / When and how we return your money.",
    url: "/us/legal/refunds",
  },
};

export default function Page() {
  return <LegalPage tipo="refunds" />;
}