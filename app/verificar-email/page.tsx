"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type Estado = "verificando" | "ok" | "error";

function VerificarEmailContenido() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [estado, setEstado] = useState<Estado>("verificando");
  const [mensajeError, setMensajeError] = useState("");

  useEffect(() => {
    let cancelado = false;

    (async () => {
      if (!token) {
        if (!cancelado) {
          setEstado("error");
          setMensajeError("Falta el token de verificación en el link.");
        }
        return;
      }

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/verificar-email?token=${encodeURIComponent(token)}`,
        );
        const json = await res.json();

        if (cancelado) return;

        if (json.success) {
          setEstado("ok");
        } else {
          setEstado("error");
          setMensajeError(json.error || "No se pudo verificar tu correo.");
        }
      } catch {
        if (!cancelado) {
          setEstado("error");
          setMensajeError("No pudimos conectar con el servidor.");
        }
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [token]);

  return (
    <div className="w-full max-w-md bg-white rounded-xl p-8 text-center">
      {estado === "verificando" && (
        <p className="text-sm text-neutral-text">Verificando tu correo...</p>
      )}

      {estado === "ok" && (
        <>
          <p className="font-display font-semibold text-brand-blue text-lg mb-2">
            ¡Correo verificado!
          </p>
          <p className="text-sm text-neutral-text mb-6">
            Ya puedes inscribirte en el curso.
          </p>
          <Link
            href="/dashboard"
            className="inline-block rounded-full bg-brand-blue text-white px-6 py-3 font-medium hover:opacity-90"
          >
            Ir a mi panel
          </Link>
        </>
      )}

      {estado === "error" && (
        <>
          <p className="font-display font-semibold text-brand-blue text-lg mb-2">
            No pudimos verificar tu correo
          </p>
          <p className="text-sm text-neutral-text mb-6">{mensajeError}</p>
          <Link
            href="/dashboard"
            className="inline-block rounded-full bg-brand-blue text-white px-6 py-3 font-medium hover:opacity-90"
          >
            Ir a mi panel
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerificarEmailPage() {
  return (
    <main className="bg-neutral-bg min-h-screen flex items-center justify-center px-6 py-16">
      <Suspense
        fallback={
          <div className="w-full max-w-md bg-white rounded-xl p-8 text-center">
            <p className="text-sm text-neutral-text">Cargando...</p>
          </div>
        }
      >
        <VerificarEmailContenido />
      </Suspense>
    </main>
  );
}