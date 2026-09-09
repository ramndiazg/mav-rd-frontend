"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, CheckCircle2, Lock, Trophy, ClipboardList, Phone, Mail, Clock } from "lucide-react";
import RutaProtegida from "@/components/auth/RutaProtegida";
import { useAuth } from "@/contexts/AuthContext";
import ProgresoCarretera from "@/components/dashboard/ProgresoCarretera";

type Progreso = {
  sesionActualDesbloqueada: number;
  sesionesAprobadas: number[];
  cursoCompletado: boolean;
  practicaAprobada: boolean; // NUEVO (05/09/2026)
};

type Inscripcion = {
  _id: string;
  tipoPlan: "normal" | "vip";
  monto: number;
  estadoPago: "pendiente" | "pendiente_verificacion" | "pagado" | "rechazado";
  notaRechazo?: string | null;
};

type Instructor = {
  _id: string;
  diasDisponibles: { dia: string; horario: string }[];
  userId: { nombre: string; apellido: string; telefono: string; email: string; provincia: string };
}

const SESIONES = [1, 2, 3, 4];

const NOMBRES_DIA: Record<string, string> = {
  lunes: "Lunes",
  martes: "Martes",
  miercoles: "Miércoles",
  jueves: "Jueves",
  viernes: "Viernes",
  sabado: "Sábado",
  domingo: "Domingo",
};

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

// ACTUALIZADO (08/09/2026): href dinámico — apunta al formulario correcto
// según si a la estudiante le toca TestPsicologico o
// InformacionComplementariaEscolar (ver DashboardContenido, cálculo de
// esEscolar). El texto se deja genérico a propósito, sirve para ambos.
function AvisoTestPendiente({ href }: { href: string }) {
  return (
    <div className="rounded-xl bg-white border border-neutral-bg p-8 text-center">
      <ClipboardList className="mx-auto mb-3 text-brand-blue" size={32} />
      <p className="font-display font-semibold text-brand-blue text-lg mb-2">
        Antes de empezar, completa tu cuestionario de perfil
      </p>
      <p className="text-sm text-neutral-text mb-6">
        Es un paso único, tarda unos minutos y nos ayuda a conocer tu
        experiencia previa antes de tu primera sesión.
      </p>
      <Link
        href={href}
        className="inline-block rounded-full bg-brand-pink text-white px-6 py-3 font-medium hover:opacity-90"
      >
        Completar cuestionario
      </Link>
    </div>
  );
}

// NUEVO (05/09/2026): terminó toda la teoría, todavía no la aprueba un
// instructor. En vez de las tarjetas de sesión, felicitación + lista de
// choferes activos para que la estudiante misma los contacte.
// Solo aplica al flujo estándar (requierePractica true) — ver
// PantallaTeoriaCompletadaGrupo para Escolar/Empresarial.
function PantallaListaParaPractica() {
  const { token } = useAuth();
  const [instructores, setInstructores] = useState<Instructor[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelado = false;

    (async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/instructores/activos`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const json = await res.json();
        if (!cancelado) {
          if (json.success) setInstructores(json.data);
          else setError(true);
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
    <div className="rounded-xl bg-white border border-neutral-bg p-8 text-center">
      <Trophy className="mx-auto mb-3 text-brand-pink" size={36} />
      <p className="font-display font-semibold text-brand-blue text-xl mb-2">
        ¡Felicidades, terminaste toda la teoría!
      </p>
      <p className="text-sm text-neutral-text mb-6">
        Ahora falta la parte práctica en el vehiculo. Contacta a uno de
        nuestros instructores para coordinar día y hora — cuando confirme
        tu práctica, tu diploma quedará disponible.
      </p>
      <p className="text-xs text-neutral-text mb-6">
        Cada clase presencial tiene un costo de RD$500, que se paga en
        efectivo directo al instructor.
      </p>

      {cargando && <p className="text-sm text-neutral-text">Cargando instructores...</p>}

      {error && !cargando && (
        <p className="text-sm text-brand-pink">
          No pudimos cargar la lista de instructores. Intenta de nuevo en
          unos minutos.
        </p>
      )}

      {!cargando && !error && instructores.length === 0 && (
        <p className="text-sm text-neutral-text">
          Todavía no hay instructores disponibles — tu coordinadora te
          contactará pronto.
        </p>
      )}

      {!cargando && !error && instructores.length > 0 && (
        <div className="grid gap-3 text-left">
          {instructores.map((instructor) => (
            <div
              key={instructor._id}
              className="rounded-lg border border-neutral-bg p-4"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="font-display font-semibold text-brand-blue">
                  {instructor.userId.nombre} {instructor.userId.apellido}
                </p>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-brand-pinkLight text-brand-pink shrink-0">
                  {instructor.userId.provincia}
                </span>
              </div>
              <div className="flex flex-col gap-1 text-sm text-neutral-text">
                <span className="flex items-center gap-2">
                  <Phone size={14} className="text-brand-pink shrink-0" />
                  {instructor.userId.telefono}
                </span>
                <span className="flex items-center gap-2">
                  <Mail size={14} className="text-brand-pink shrink-0" />
                  {instructor.userId.email}
                </span>
                {instructor.diasDisponibles.length > 0 && (
                  <span className="flex items-start gap-2">
                    <Clock size={14} className="text-brand-pink shrink-0 mt-0.5" />
                    <span>
                      {instructor.diasDisponibles
                        .map((d) => `${NOMBRES_DIA[d.dia] || d.dia} ${d.horario}`)
                        .join(" · ")}
                    </span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// NUEVO (05/09/2026): terminó teoría Y el instructor ya aprobó la práctica —
// solo falta que la coordinadora genere el diploma. Solo aplica al flujo
// estándar (requierePractica true).
function PantallaPracticaAprobada() {
  return (
    <div className="rounded-xl bg-white border border-neutral-bg p-8 text-center">
      <Trophy className="mx-auto mb-3 text-status-success" size={36} />
      <p className="font-display font-semibold text-brand-blue text-xl mb-2">
        ¡Tu instructor confirmó tu práctica!
      </p>
      <p className="text-sm text-neutral-text">
        Ya completaste el curso por completo. Tu diploma está siendo
        preparado — te avisaremos por correo en cuanto esté listo.
      </p>
    </div>
  );
}

// NUEVO (08/09/2026): terminó toda la teoría y para esta estudiante (Grupo
// Escolar/Empresarial) eso es TODO el curso — no hay práctica que
// coordinar. Solo falta que la coordinadora genere el diploma. Texto
// propio: nunca menciona instructores, práctica, ni el costo de RD$500 de
// las clases presenciales, porque nada de eso le aplica.
function PantallaTeoriaCompletadaGrupo() {
  return (
    <div className="rounded-xl bg-white border border-neutral-bg p-8 text-center">
      <Trophy className="mx-auto mb-3 text-status-success" size={36} />
      <p className="font-display font-semibold text-brand-blue text-xl mb-2">
        ¡Felicidades, completaste el curso!
      </p>
      <p className="text-sm text-neutral-text">
        Terminaste las 4 sesiones y todos tus exámenes. Tu diploma está
        siendo preparado — te avisaremos por correo en cuanto esté listo.
      </p>
    </div>
  );
}

function DashboardContenido() {
  const { usuario, token } = useAuth();
  const [inscripcion, setInscripcion] = useState<Inscripcion | null>(null);
  const [progreso, setProgreso] = useState<Progreso | null>(null);
  const [testCompletado, setTestCompletado] = useState<boolean | null>(null);
  const [diplomaListo, setDiplomaListo] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  // NUEVO (08/09/2026): estudiantes de un Grupo (Escolar/Empresarial) no
  // cursan práctica de manejo — su diploma depende únicamente de
  // cursoCompletado. El resto (grupoId null, flujo estándar) sigue
  // exigiendo practicaAprobada, igual que antes del 08/09/2026.
  const requierePractica = !usuario?.grupoId;

  // NUEVO (08/09/2026): decide qué cuestionario de perfil le toca a esta
  // estudiante — mismo criterio que sesionController.js en el backend
  // (grupoTipo === "colegio"). Empresarial sigue usando TestPsicologico,
  // igual que el flujo estándar.
  const esEscolar = usuario?.grupoTipo === "colegio";

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

        if (inscripcionActual?.estadoPago === "pagado") {
          // NUEVO (08/09/2026): el endpoint de "¿ya completé mi
          // cuestionario?" depende de esEscolar — mismo shape de
          // respuesta en los dos casos ({ success, completado }), así que
          // el resto de la lógica no cambia.
          const endpointCuestionario = esEscolar
            ? "informacion-complementaria-escolar/mi-respuesta"
            : "test-psicologico/mi-respuesta";

          const [resProgreso, resTest] = await Promise.all([
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/progreso/me`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/${endpointCuestionario}`,
              { headers: { Authorization: `Bearer ${token}` } },
            ),
          ]);
          const jsonProgreso = await resProgreso.json();
          const jsonTest = await resTest.json();

          if (cancelado) return;

          if (jsonProgreso.success) setProgreso(jsonProgreso.data);
          if (jsonTest.success) setTestCompletado(jsonTest.completado);

          // NUEVO (08/09/2026): para un estudiante de Grupo (sin
          // requierePractica), cursoCompletado por sí solo ya vuelve
          // elegible el diploma — no depende de practicaAprobada, que
          // para estas estudiantes nunca se vuelve true.
          const elegibleParaDiploma =
            jsonProgreso.success &&
            jsonProgreso.data.cursoCompletado &&
            (!requierePractica || jsonProgreso.data.practicaAprobada);

          if (elegibleParaDiploma) {
            const resDiploma = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/diplomas/me`,
              { headers: { Authorization: `Bearer ${token}` } },
            );
            const jsonDiploma = await resDiploma.json();
            if (!cancelado) setDiplomaListo(jsonDiploma.success);
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
  }, [token, requierePractica, esEscolar]);

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

        {!cargando &&
          !error &&
          inscripcion?.estadoPago === "pagado" &&
          progreso &&
          testCompletado === false && (
            <AvisoTestPendiente
              href={esEscolar ? "/informacion-complementaria-escolar" : "/test-psicologico"}
            />
          )}

        {!cargando &&
          !error &&
          inscripcion?.estadoPago === "pagado" &&
          progreso &&
          testCompletado === true && (
            <>
              <ProgresoCarretera
                progreso={progreso}
                diplomaListo={diplomaListo}
                requierePractica={requierePractica}
              />

              {!progreso.cursoCompletado && (
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
                </div>
              )}

              {progreso.cursoCompletado && diplomaListo && (
                <Link
                  href="/diploma"
                  className="session-card-in rounded-xl bg-brand-blue text-white p-6 text-center font-display font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <Trophy size={20} />
                  Ver mi diploma
                </Link>
              )}

              {/* NUEVO (08/09/2026): estudiantes de Grupo van directo de
                  "curso completado" a "esperando diploma" — nunca pasan
                  por PantallaListaParaPractica ni PantallaPracticaAprobada,
                  que hablan de instructores y práctica en vehículo. */}
              {progreso.cursoCompletado && !diplomaListo && !requierePractica && (
                <PantallaTeoriaCompletadaGrupo />
              )}

              {progreso.cursoCompletado &&
                !diplomaListo &&
                requierePractica &&
                progreso.practicaAprobada && <PantallaPracticaAprobada />}

              {progreso.cursoCompletado &&
                requierePractica &&
                !progreso.practicaAprobada && <PantallaListaParaPractica />}
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