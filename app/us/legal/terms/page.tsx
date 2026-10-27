import type { Metadata } from "next";
import LegalPage from "@/components/us/LegalPage";

// NUEVO (24/10/2026): página pública e indexable (fuera del grupo (privado)).
// `metadata` reemplaza la del layout /us (fusión superficial de Next 16), por
// eso declara su propio canonical y Open Graph.
export const metadata: Metadata = {
  title: "Términos y condiciones · Terms and conditions",
  description: "Reglas para usar el sitio y el curso Driver Prep USA. / Rules for using the site and the Driver Prep USA course.",
  alternates: { canonical: "/us/legal/terms" },
  openGraph: {
    type: "website",
    siteName: "Muvo RD Vial",
    title: "Términos y condiciones · Terms and conditions",
    description: "Reglas para usar el sitio y el curso Driver Prep USA. / Rules for using the site and the Driver Prep USA course.",
    url: "/us/legal/terms",
  },
};

export default function Page() {
  return <LegalPage tipo="terms" />;
}