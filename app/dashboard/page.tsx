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

type Inscripcion = {
  _id: string;
  tipoPlan: "normal" | "vip";
  monto: number;
  estadoPago: "pendiente" | "pendiente_verificacion" | "pagado" | "rechazado";
  notaRechazo?: string | null;
};

const SESIONES = [1, 2, 3];

function estadoSesion(numero: number, progreso: Progreso) {
  if (progreso.sesionesAprobadas.includes(numero)) return "aprobada";
  if (numero <= progreso.sesionActualDesbloqueada) return "desbloqueada";
  return "bloqueada";
}

function DashboardContenido() {
  const { usuario, token } = useAuth();
  const [inscripcion, setInscripcion] = useState<Inscripcion | null>(null);
  const [progreso, setProgreso] = useState<Progreso | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelado = false;

    (async () => {
      try {
        const resInscripcion = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/inscripciones/me`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const jsonInscripcion = await resInscripcion.json();

        if (cancelado) return;

        if (!jsonInscripcion.success) {
          setError(true);
          return;
        }

        const inscripcionActual: Inscripcion | null = jsonInscripcion.data;
        setInscripcion(inscripcionActual);

        // Solo si el pago ya está confirmado tiene sentido cargar el progreso
        // del Aula Virtual — para los otros 3 estados no existe todavía.
        if (inscripcionActual?.estadoPago === "pagado") {
          const resProgreso = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/progreso/me`,
            { headers: { Authorization: `Bearer ${token}` } },
          );
          const jsonProgreso = await resProgreso.json();
          if (!cancelado && jsonProgreso.success) {
            setProgreso(jsonProgreso.data);
          }
        }
      } catch {
        if (!cancelado) setError(true);
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();

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
          <p className="text-neutral-text text-sm text-center">Cargando...</p>
        )}

        {error && !cargando && (
          <div className="rounded-lg bg-brand-pinkLight border border-brand-pink p-4 text-brand-blue text-sm">
            No pudimos cargar tu información. Intenta de nuevo en unos minutos.
          </div>
        )}

        {!cargando && !error && !inscripcion && (
          <div className="rounded-xl bg-white border border-neutral-bg p-8 text-center">
            <p className="font-display font-semibold text-brand-blue text-lg mb-2">
              Todavía no te has inscrito
            </p>
            <p className="text-sm text-neutral-text mb-6">
              Conoce el curso, elige tu plan y sube tu comprobante de pago para
              empezar.
            </p>
            <Link
              href="/inscripcion"
              className="inline-block rounded-full bg-brand-pink text-white px-6 py-3 font-medium hover:opacity-90"
            >
              Inscribirme
            </Link>
          </div>
        )}

        {!cargando && !error && inscripcion?.estadoPago === "pendiente" && (
          <div className="rounded-xl bg-white border border-neutral-bg p-8 text-center">
            <p className="text-neutral-text mb-2">
              Tu inscripción está pendiente de confirmación de pago.
            </p>
            <p className="text-sm text-neutral-text">
              Una vez tu coordinadora confirme el pago, aquí vas a ver el
              acceso a las 3 sesiones del curso.
            </p>
          </div>
        )}

        {!cargando && !error && inscripcion?.estadoPago === "pendiente_verificacion" && (
          <div className="rounded-xl bg-white border border-neutral-bg p-8 text-center">
            <p className="font-display font-semibold text-brand-blue text-lg mb-2">
              Tu comprobante está en revisión
            </p>
            <p className="text-sm text-neutral-text">
              Estamos verificando tu depósito. Te avisaremos en cuanto quede
              confirmado — normalmente toma poco tiempo.
            </p>
          </div>
        )}

        {!cargando && !error && inscripcion?.estadoPago === "rechazado" && (
          <div className="rounded-xl bg-white border border-brand-pink p-8 text-center">
            <p className="font-display font-semibold text-brand-blue text-lg mb-2">
              Tu comprobante no pudo ser validado
            </p>
            {inscripcion.notaRechazo && (
              <p className="text-sm text-neutral-text mb-6">
                Motivo: {inscripcion.notaRechazo}
              </p>
            )}
            <Link
              href="/inscripcion"
              className="inline-block rounded-full bg-brand-pink text-white px-6 py-3 font-medium hover:opacity-90"
            >
              Reenviar comprobante
            </Link>
          </div>
        )}

        {!cargando && !error && inscripcion?.estadoPago === "pagado" && progreso && (
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