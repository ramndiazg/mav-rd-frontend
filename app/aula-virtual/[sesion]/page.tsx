"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import RutaProtegida from "@/components/auth/RutaProtegida";
import { useAuth } from "@/contexts/AuthContext";

type Progreso = {
  sesionActualDesbloqueada: number;
  sesionesAprobadas: number[];
  cursoCompletado: boolean;
};

type Sesion = {
  _id: string;
  numero: number;
  titulo: string;
  teoria: string;
  videos: { titulo: string; url: string }[];
};

function AulaVirtualContenido() {
  const { token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const numeroSesion = Number(params.sesion);

  const [progreso, setProgreso] = useState<Progreso | null>(null);
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buscandoExamen, setBuscandoExamen] = useState(false);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      try {
        // 1) Verificar progreso primero — el backend también valida esto en
        // GET /api/sesiones/:numero, pero chequearlo aquí nos deja mostrar un
        // mensaje claro en vez de solo un error genérico.
        const resProgreso = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/progreso/me`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const jsonProgreso = await resProgreso.json();
        if (cancelado) return;

        if (!jsonProgreso.success) {
          setError("No pudimos verificar tu progreso.");
          setCargando(false);
          return;
        }

        setProgreso(jsonProgreso.data);

        if (numeroSesion > jsonProgreso.data.sesionActualDesbloqueada) {
          // Sesión bloqueada — no hace falta ni pedir la teoría
          setCargando(false);
          return;
        }

        // 2) Traer teoría y videos de la sesión
        const resSesion = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/sesiones/${numeroSesion}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const jsonSesion = await resSesion.json();
        if (cancelado) return;

        if (jsonSesion.success) {
          setSesion(jsonSesion.data);
        } else {
          setError(jsonSesion.error || "No pudimos cargar esta sesión.");
        }
      } catch {
        if (!cancelado) setError("No pudimos conectar con el servidor.");
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    if (token && numeroSesion) cargar();

    return () => {
      cancelado = true;
    };
  }, [token, numeroSesion]);

  // Botón "Ir al examen": busca el intento activo y navega a él.
  // Si no hay ninguno, es porque la coordinadora todavía no lo desbloqueó.
  async function irAlExamen() {
    setBuscandoExamen(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/intentos-examen/activo/${sesion?._id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const json = await res.json();

      if (json.success) {
        router.push(`/examen/${json.data._id}`);
      } else {
        setError(
          "Todavía no tienes un examen desbloqueado para esta sesión. Pide a tu coordinadora que lo habilite.",
        );
      }
    } catch {
      setError("No pudimos conectar con el servidor.");
    } finally {
      setBuscandoExamen(false);
    }
  }

  const bloqueada =
    progreso !== null && numeroSesion > progreso.sesionActualDesbloqueada;
  const yaAprobada = progreso?.sesionesAprobadas.includes(numeroSesion);

  return (
    <main className="bg-neutral-bg min-h-screen px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/dashboard"
          className="text-sm text-brand-blueLight hover:underline"
        >
          ← Volver a mi panel
        </Link>

        {cargando && (
          <p className="text-neutral-text text-sm mt-6">Cargando sesión...</p>
        )}

        {!cargando && bloqueada && (
          <div className="mt-6 rounded-xl bg-white border border-neutral-bg p-8 text-center">
            <p className="text-neutral-text">
              Todavía no tienes acceso a esta sesión. Completa las anteriores
              primero.
            </p>
          </div>
        )}

        {!cargando && !bloqueada && error && (
          <div className="mt-6 rounded-lg bg-brand-pinkLight border border-brand-pink p-4 text-brand-blue text-sm">
            {error}
          </div>
        )}

        {!cargando && !bloqueada && sesion && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="font-display text-2xl font-bold text-brand-blue">
                {sesion.titulo}
              </h1>
              {yaAprobada && (
                <span className="text-xs font-medium px-3 py-1 rounded-full bg-status-success text-white">
                  Aprobada
                </span>
              )}
            </div>

            <div
              className="rounded-xl bg-white border border-neutral-bg p-6 mb-6 prose prose-sm max-w-none text-neutral-text"
              dangerouslySetInnerHTML={{ __html: sesion.teoria }}
            />

            {sesion.videos.length > 0 && (
              <div className="grid gap-4 mb-8">
                {sesion.videos.map((video, i) => (
                  <div
                    key={i}
                    className="rounded-xl bg-white border border-neutral-bg p-4"
                  >
                    <p className="font-display font-semibold text-brand-blue mb-2">
                      {video.titulo}
                    </p>
                    <div className="aspect-video">
                      <iframe
                        className="w-full h-full rounded-lg"
                        src={video.url}
                        title={video.titulo}
                        allowFullScreen
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!yaAprobada && (
              <button
                onClick={irAlExamen}
                disabled={buscandoExamen}
                className="w-full rounded-xl bg-brand-pink text-white p-4 font-display font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {buscandoExamen ? "Buscando tu examen..." : "Ir al examen"}
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default function AulaVirtualPage() {
  return (
    <RutaProtegida rolesPermitidos={["estudiante"]}>
      <AulaVirtualContenido />
    </RutaProtegida>
  );
}