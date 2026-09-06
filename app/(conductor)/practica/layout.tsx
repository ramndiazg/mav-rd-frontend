"use client";

import RutaProtegida from "@/components/auth/RutaProtegida";
import { useAuth } from "@/contexts/AuthContext";

function PracticaHeader() {
  const { usuario } = useAuth();

  return (
    <div className="bg-brand-blue text-white px-6 py-4 mb-8">
      <p className="text-xs opacity-80">Panel de práctica</p>
      <h1 className="font-display text-xl font-bold">Hola, {usuario?.nombre}</h1>
    </div>
  );
}

export default function PracticaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RutaProtegida rolesPermitidos={["conductor", "admin"]}>
      <div className="bg-neutral-bg min-h-screen">
        <PracticaHeader />
        <div className="px-6 pb-16">{children}</div>
      </div>
    </RutaProtegida>
  );
}