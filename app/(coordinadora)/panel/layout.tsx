"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import RutaProtegida from "@/components/auth/RutaProtegida";
import { useAuth } from "@/contexts/AuthContext";

const ENLACES = [
  { href: "/panel/pagos", etiqueta: "Pagos" },
  { href: "/panel/aula-virtual", etiqueta: "Aula Virtual" },
  { href: "/panel/examenes", etiqueta: "Exámenes" },
  { href: "/panel/diplomas", etiqueta: "Diplomas" },
  { href: "/panel/noticias", etiqueta: "Noticias" },
  { href: "/panel/testimonios", etiqueta: "Testimonios" },
  { href: "/panel/faq", etiqueta: "FAQ" },
];

// Estos dos solo los ve admin (la fundadora) — coordinadora no
const ENLACES_ADMIN = [
  { href: "/admin/contabilidad", etiqueta: "Contabilidad" },
  { href: "/admin/contenido-pagina", etiqueta: "Contenido de Página" },
];

function PanelHeader() {
  const { usuario } = useAuth();
  const pathname = usePathname();
  const esAdmin = usuario?.rol === "admin";

  const enlacesVisibles = esAdmin ? [...ENLACES, ...ENLACES_ADMIN] : ENLACES;

  return (
    <div className="bg-brand-blue text-white px-6 py-4 mb-8">
      <p className="text-xs opacity-80">Panel de gestión</p>
      <h1 className="font-display text-xl font-bold mb-4">
        Hola, {usuario?.nombre}
      </h1>
      <nav className="flex gap-1 flex-wrap">
        {enlacesVisibles.map((enlace) => (
          <Link
            key={enlace.href}
            href={enlace.href}
            className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${pathname === enlace.href
              ? "bg-white text-brand-blue font-medium"
              : "text-white/80 hover:bg-white/10"
              }`}
          >
            {enlace.etiqueta}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RutaProtegida rolesPermitidos={["coordinadora", "admin"]}>
      <div className="bg-neutral-bg min-h-screen">
        <PanelHeader />
        <div className="px-6 pb-16">{children}</div>
      </div>
    </RutaProtegida>
  );
}