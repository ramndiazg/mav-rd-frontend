"use client";

import Link from "next/link";
import RutaProtegida from "@/components/auth/RutaProtegida";
import { useAuth } from "@/contexts/AuthContext";

function AdminHeader() {
  const { usuario } = useAuth();

  return (
    <div className="bg-brand-blue text-white px-6 py-4 mb-8">
      <p className="text-xs opacity-80">Panel de administración</p>
      <h1 className="font-display text-xl font-bold">Hola, {usuario?.nombre}</h1>
      <Link href="/panel" className="inline-block mt-2 text-sm text-white/80 hover:text-white">
        ← Volver al panel
      </Link>
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