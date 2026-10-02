"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { rutaInicioPorRol } from "@/lib/rutasPorRol";

type Rol = "estudiante" | "coordinadora" | "admin" | "conductor";

export default function RutaProtegida({
  rolesPermitidos,
  children,
}: {
  rolesPermitidos: Rol[];
  children: React.ReactNode;
}) {
  const { usuario, cargando } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (cargando) return;

    // NUEVO (13/09/2026): antes se perdía cualquier ?query= al mandar a
    // /login (ej. /inscripcion?programa=motorizados desde las tarjetas de
    // categoría del home). Se usa window.location.search en vez de
    // useSearchParams porque este componente envuelve páginas que no
    // siempre están dentro de un <Suspense> (useSearchParams lo exigiría
    // aquí) — y en el navegador siempre existe window.location, así que
    // no hace falta ese boundary.
    const rutaCompleta =
      typeof window !== "undefined"
        ? `${pathname}${window.location.search}`
        : pathname;

    if (!usuario) {
      router.push(`/login?redirect=${encodeURIComponent(rutaCompleta)}`);
      return;
    }

    // Con sesión pero rol equivocado: NUNCA mandar a /login (el login ve
    // a un usuario ya logueado y lo devuelve aquí → bucle infinito). Se le
    // lleva a su propia pantalla de inicio.
    if (!rolesPermitidos.includes(usuario.rol)) {
      router.replace(rutaInicioPorRol(usuario.rol));
    }
  }, [cargando, usuario, rolesPermitidos, router, pathname]);

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