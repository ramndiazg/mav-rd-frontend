"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RutaProtegida from "@/components/auth/RutaProtegida";
import { useAuth } from "@/contexts/AuthContext";

type Diploma = {
  codigoVerificacion: string;
  fechaEmision: string;
  urlPDF: string;
};

function DiplomaContenido() {
  const { token } = useAuth();
  const [diploma, setDiploma] = useState<Diploma | null>(null);
  const [cargando, setCargando] = useState(true);
  const [aunNoExiste, setAunNoExiste] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    (async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/diplomas/me`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const json = await res.json();
        if (cancelado) return;

        if (json.success) {
          setDiploma(json.data);
        } else if (res.status === 404) {
          setAunNoExiste(true);
        } else {
          setError(json.error || "No pudimos cargar tu diploma.");
        }
      } catch {
        if (!cancelado) setError("No pudimos conectar con el servidor.");
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [token]);

  const fechaFormateada = diploma
    ? new Date(diploma.fechaEmision).toLocaleDateString("es-DO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    : "";

  return (
    <main className="bg-neutral-bg min-h-screen px-6 py-16">
      <div className="max-w-xl mx-auto">
        <Link
          href="/dashboard"
          className="text-sm text-brand-blueLight hover:underline"
        >
          ← Volver a mi panel
        </Link>

        {cargando && (
          <p className="text-neutral-text text-sm mt-6">Buscando tu diploma...</p>
        )}

        {!cargando && error && (
          <div className="mt-6 rounded-lg bg-brand-pinkLight border border-brand-pink p-4 text-brand-blue text-sm">
            {error}
          </div>
        )}

        {!cargando && aunNoExiste && (
          <div className="mt-6 rounded-xl bg-white border border-neutral-bg p-8 text-center">
            <p className="text-neutral-text mb-2">
              Todavía no tienes un diploma generado.
            </p>
            <p className="text-sm text-neutral-text">
              Ya completaste y aprobaste las 3 sesiones — pide a tu
              coordinadora que lo genere. En cuanto lo haga, va a aparecer
              aquí automáticamente.
            </p>
          </div>
        )}

        {!cargando && diploma && (
          <div className="mt-6 rounded-xl bg-white border border-neutral-bg p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-brand-pinkLight flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎓</span>
            </div>
            <h1 className="font-display text-2xl font-bold text-brand-blue mb-1">
              ¡Felicidades!
            </h1>
            <p className="text-neutral-text text-sm mb-6">
              Completaste el curso de Mujeres al Volante RD
            </p>

            <div className="rounded-lg bg-neutral-bg p-4 mb-6 text-left">
              <p className="text-xs text-neutral-text">Código de verificación</p>
              <p className="font-mono font-semibold text-brand-blue mb-3">
                {diploma.codigoVerificacion}
              </p>
              <p className="text-xs text-neutral-text">Fecha de emisión</p>
              <p className="text-sm text-neutral-text">{fechaFormateada}</p>
            </div>

            <a
              href={diploma.urlPDF}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block w-full rounded-xl bg-brand-blue text-white p-4 font-display font-semibold hover:opacity-90 transition-opacity mb-3"
            >
              Ver / descargar mi diploma (PDF)
            </a>

            <p className="text-xs text-neutral-text">
              Cualquiera puede confirmar la autenticidad de este diploma en{" "}
              <Link href="/verificar-diploma" className="text-brand-blueLight hover:underline">
                la página de verificación
              </Link>{" "}
              usando el código de arriba.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function DiplomaPage() {
  return (
    <RutaProtegida rolesPermitidos={["estudiante"]}>
      <DiplomaContenido />
    </RutaProtegida>
  );
}