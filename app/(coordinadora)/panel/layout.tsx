"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import RutaProtegida from "@/components/auth/RutaProtegida";
import { useAuth } from "@/contexts/AuthContext";

function PanelHeader() {
  const { usuario } = useAuth();
  const pathname = usePathname();
  const enInicio = pathname === "/panel";

  return (
    <div className="bg-brand-blue text-white px-6 py-4 mb-8">
      <p className="text-xs opacity-80">Panel de gestión</p>
      <h1 className="font-display text-xl font-bold">Hola, {usuario?.nombre}</h1>
      {!enInicio && (
        <Link href="/panel" className="inline-block mt-2 text-sm text-white/80 hover:text-white">
          ← Volver al panel
        </Link>
      )}
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