"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

type Rol = "estudiante" | "coordinadora" | "admin";

export default function RutaProtegida({
  rolesPermitidos,
  children,
}: {
  rolesPermitidos: Rol[];
  children: React.ReactNode;
}) {
  const { usuario, cargando } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (cargando) return;

    if (!usuario) {
      router.push("/login");
      return;
    }

    if (!rolesPermitidos.includes(usuario.rol)) {
      router.push("/login");
    }
  }, [cargando, usuario, rolesPermitidos, router]);

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-bg">
        <p className="text-neutral-text text-sm">Cargando...</p>
      </div>
    );
  }

  if (!usuario || !rolesPermitidos.includes(usuario.rol)) {
    return null;
  }

  return <>{children}</>;
}
