"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RutaProtegida from "@/components/auth/RutaProtegida";
import { useAuth } from "@/contexts/AuthContext";

type Progreso = {
  sesionActualDesbloqueada: number;
  sesionesAprobadas: number[];
  cursoCompletado: boolean;
};

const SESIONES = [1, 2, 3];

function estadoSesion(numero: number, progreso: Progreso) {
  if (progreso.sesionesAprobadas.includes(numero)) return "aprobada";
  if (numero <= progreso.sesionActualDesbloqueada) return "desbloqueada";
  return "bloqueada";
}

function DashboardContenido() {
  const { usuario, token } = useAuth();
  const [progreso, setProgreso] = useState<Progreso | null>(null);
  const [cargando, setCargando] = useState(true);
  const [sinPago, setSinPago] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelado = false;

    async function cargarProgreso() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/progreso/me`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const json = await res.json();

        if (cancelado) return;

        if (json.success) {
          setProgreso(json.data);
        } else {
          // Todavia no existe ProgresoEstudiante para esta cuenta: segun
          // DATABASE.md, ese documento se crea al confirmar el pago. Si no
          // existe, asumimos que el pago sigue pendiente.
          setSinPago(true);
        }
      } catch {
        if (!cancelado) setError(true);
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    if (token) cargarProgreso();

    return () => {
      cancelado = true;
    };
  }, [token]);

  return (
    <main className="bg-neutral-bg min-h-screen px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-brand-blue">
            Hola, {usuario?.nombre}
          </h1>
          <p className="text-neutral-text text-sm">Tu panel de estudiante</p>
        </div>

        {cargando && (
          <p className="text-neutral-text text-sm">Cargando tu progreso...</p>
        )}

        {error && !cargando && (
          <div className="rounded-lg bg-brand-pinkLight border border-brand-pink p-4 text-brand-blue text-sm">
            No pudimos cargar tu progreso. Intenta de nuevo en unos minutos.
          </div>
        )}

        {!cargando && !error && sinPago && (
          <div className="rounded-xl bg-white border border-neutral-bg p-8 text-center">
            <p className="text-neutral-text mb-2">
              Tu inscripcion esta pendiente de confirmacion de pago.
            </p>
            <p className="text-sm text-neutral-text">
              Una vez tu coordinadora confirme el pago, aqui vas a ver el
              acceso a las 3 sesiones del curso.
            </p>
          </div>
        )}

        {!cargando && !error && progreso && (
          <div className="grid gap-4">
            {SESIONES.map((numero) => {
              const estado = estadoSesion(numero, progreso);
              const etiqueta =
                estado === "aprobada"
                  ? "Aprobada"
                  : estado === "desbloqueada"
                    ? "Disponible"
                    : "Bloqueada";
              const colorEtiqueta =
                estado === "aprobada"
                  ? "bg-status-success text-white"
                  : estado === "desbloqueada"
                    ? "bg-brand-pink text-white"
                    : "bg-neutral-bg text-neutral-text";

              const tarjeta = (
                <div className="rounded-xl bg-white border border-neutral-bg p-6 flex items-center justify-between hover:shadow-md transition-shadow">
                  <p className="font-display font-semibold text-brand-blue">
                    Sesion {numero}
                  </p>
                  <span
                    className={`text-xs font-medium px-3 py-1 rounded-full ${colorEtiqueta}`}
                  >
                    {etiqueta}
                  </span>
                </div>
              );

              return estado === "bloqueada" ? (
                <div key={numero}>{tarjeta}</div>
              ) : (
                <Link key={numero} href={`/aula-virtual/${numero}`}>
                  {tarjeta}
                </Link>
              );
            })}

            {progreso.cursoCompletado && (
              <Link
                href="/diploma"
                className="rounded-xl bg-brand-blue text-white p-6 text-center font-display font-semibold hover:opacity-90 transition-opacity"
              >
                Ver mi diploma
              </Link>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <RutaProtegida rolesPermitidos={["estudiante"]}>
      <DashboardContenido />
    </RutaProtegida>
  );
}
