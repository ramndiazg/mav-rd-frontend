"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, CheckCircle2, Lock, Trophy } from "lucide-react";
import RutaProtegida from "@/components/auth/RutaProtegida";
import { useAuth } from "@/contexts/AuthContext";
import ProgresoCarretera from "@/components/dashboard/ProgresoCarretera";

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

// Ampliado de 3 a 4 sesiones el 06/08/2026 — ver HISTORIAL_MODIFICACIONES.md.
const SESIONES = [1, 2, 3, 4];

function estadoSesion(numero: number, progreso: Progreso) {
  if (progreso.sesionesAprobadas.includes(numero)) return "aprobada";
  if (numero <= progreso.sesionActualDesbloqueada) return "desbloqueada";
  return "bloqueada";
}

function AvisoEmailSinVerificar() {
  const { usuario, token } = useAuth();
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  if (!usuario || usuario.emailVerificado) return null;

  async function reenviar() {
    setEnviando(true);
    setMensaje(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/reenviar-verificacion`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } },
      );
      const json = await res.json();
      setMensaje(
        json.success
          ? "Correo reenviado — revisa tu bandeja de entrada."
          : json.error || "No se pudo reenviar.",
      );
    } catch {
      setMensaje("No pudimos conectar con el servidor.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="rounded-lg bg-brand-pinkLight border border-brand-pink p-3 text-sm text-brand-blue mb-6 flex items-center justify-between gap-3 flex-wrap">
      <span>Verifica tu correo para poder inscribirte en el curso.</span>
      <div className="flex items-center gap-2">
        {mensaje && <span className="text-xs">{mensaje}</span>}
        <button
          onClick={reenviar}
          disabled={enviando}
          className="text-xs font-medium px-3 py-1.5 rounded-full bg-brand-pink text-white hover:opacity-90 disabled:opacity-60 shrink-0"
        >
          {enviando ? "Enviando..." : "Reenviar correo"}
        </button>
      </div>
    </div>
  );
}

function DashboardContenido() {
  const { usuario, token } = useAuth();
  const [inscripcion, setInscripcion] = useState<Inscripcion | null>(null);
  const [progreso, setProgreso] = useState<Progreso | null>(null);
  const [diplomaListo, setDiplomaListo] = useState(false);
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

            // Solo tiene sentido preguntar por el diploma si ya completó
            // las sesiones — antes de eso, GET /diplomas/me siempre
            // respondería 404, así que nos ahorramos la llamada.
            if (jsonProgreso.data.cursoCompletado) {
              const resDiploma = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/diplomas/me`,
                { headers: { Authorization: `Bearer ${token}` } },
              );
              const jsonDiploma = await resDiploma.json();
              if (!cancelado) setDiplomaListo(jsonDiploma.success);
            }
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

        <AvisoEmailSinVerificar />

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
              acceso a las 4 sesiones del curso.
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
          <>
            <ProgresoCarretera progreso={progreso} diplomaListo={diplomaListo} />
            <div className="grid gap-4">
              {SESIONES.map((numero, indice) => {
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
                const Icono =
                  estado === "aprobada" ? CheckCircle2 : estado === "desbloqueada" ? BookOpen : Lock;
                const colorIcono =
                  estado === "aprobada"
                    ? "text-status-success"
                    : estado === "desbloqueada"
                      ? "text-brand-pink"
                      : "text-neutral-text opacity-40";

                const tarjeta = (
                  <div
                    className="session-card-in rounded-xl bg-white border border-neutral-bg p-6 flex items-center justify-between hover:shadow-md transition-shadow"
                    style={{ animationDelay: `${indice * 80}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <Icono size={20} className={colorIcono} />
                      <p className="font-display font-semibold text-brand-blue">
                        Sesion {numero}
                      </p>
                    </div>
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
                  className="session-card-in rounded-xl bg-brand-blue text-white p-6 text-center font-display font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  style={{ animationDelay: `${SESIONES.length * 80}ms` }}
                >
                  <Trophy size={20} />
                  Ver mi diploma
                </Link>
              )}
            </div>
          </>
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