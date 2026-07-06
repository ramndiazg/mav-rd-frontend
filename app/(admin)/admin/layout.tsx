"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import RutaProtegida from "@/components/auth/RutaProtegida";
import { useAuth } from "@/contexts/AuthContext";

const ENLACES = [
  { href: "/admin/contenido-pagina", etiqueta: "Contenido de Página" },
  // Agregar aquí /admin/contabilidad cuando se construya
];

function AdminHeader() {
  const { usuario } = useAuth();
  const pathname = usePathname();

  return (
    <div className="bg-brand-blue text-white px-6 py-4 mb-8">
      <p className="text-xs opacity-80">Panel de administración</p>
      <h1 className="font-display text-xl font-bold mb-4">
        Hola, {usuario?.nombre}
      </h1>
      <nav className="flex gap-1 flex-wrap">
        <Link
          href="/panel/pagos"
          className="text-sm px-3 py-1.5 rounded-lg text-white/80 hover:bg-white/10"
        >
          ← Panel de coordinadora
        </Link>
        {ENLACES.map((enlace) => (
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

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RutaProtegida rolesPermitidos={["admin"]}>
      <div className="bg-neutral-bg min-h-screen">
        <AdminHeader />
        <div className="px-6 pb-16">{children}</div>
      </div>
    </RutaProtegida>
  );
}