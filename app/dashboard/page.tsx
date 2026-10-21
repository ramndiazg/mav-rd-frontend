"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BookOpen, CheckCircle2, Lock, Trophy, ClipboardList, Phone, Mail, Clock, MapPin, Download, Share2, Copy, Check, RefreshCw } from "lucide-react";
import RutaProtegida from "@/components/auth/RutaProtegida";
import { useAuth } from "@/contexts/AuthContext";
import ProgresoCarretera from "@/components/dashboard/ProgresoCarretera";
import { etiquetaPrograma } from "@/lib/programas";
import { useRevalidar } from "@/hooks/useRevalidar";

type Progreso = {
  sesionActualDesbloqueada: number;
  sesionesAprobadas: number[];
  cursoCompletado: boolean;
  practicaAprobada: boolean; // NUEVO (05/09/2026)
  // NUEVO (13/09/2026): espejo de Inscripcion.programa (ver
  // models/ProgresoEstudiante.js) — decide, junto con grupoId, si a la
  // estudiante le aplica la práctica de manejo (Motorizados/Pesados no
  // la tienen, igual que Escolar/Empresarial).
  programa?:
  | "estandar"
  | "motorizados"
  | "pesados"
  | "montacargas"
  | "auxiliar-escolar";
  // NUEVO (13/09/2026): espejo de Inscripcion.tipoPlan — tercer criterio,
  // ver ANALISIS_COBERTURA_PRACTICA.md. Dentro de "estandar" ahora
  // conviven planes con y sin práctica (municipio sin cobertura ⇒ solo
  // "teorico"), así que ya no basta con mirar el programa.
  tipoPlan?: "fundacion" | "normal" | "vip" | "teorico" | "grupo" | null;
};

type Instructor = {
  _id: string;
  diasDisponibles: { dia: string; horario: string }[];
  userId: { nombre: string; apellido: string; telefono: string; email: string; provincia: string };
}

type Inscripcion = {
  _id: string;
  tipoPlan: "normal" | "vip" | "teorico";
  monto: number;
  estadoPago: "pendiente" | "pendiente_verificacion" | "pagado" | "rechazado";
  notaRechazo?: string | null;
  // NUEVO: chofer asignado automáticamente según la zona de la
  // estudiante (ver inscripcionController.js) — null si no aplica o si
  // todavía no había chofer para esa zona.
  instructorId?: Instructor | null;
};

// NUEVO (13/09/2026): mismo criterio que utils/elegibilidadPractica.js en
// el backend — Motorizados y Pesados tampoco cursan práctica de manejo,
// igual que Escolar/Empresarial (ver ANALISIS_MOTORISTA_PESADOS.md).
//
// ACTUALIZADO (27/09/2026): se suma "montacargas" (Categoría 05) — mismo
// caso, curso 100% teórico, sin práctica de manejo.
//
// ACTUALIZADO (10/2026): se suma "auxiliar-escolar" (Auxiliar de Transporte
// Escolar) — curso 100% teórico, sin práctica de manejo. Mismo criterio que
// PROGRAMAS_SIN_PRACTICA en utils/elegibilidadPractica.js (backend).
const PROGRAMAS_SIN_PRACTICA = [
  "motorizados",
  "pesados",
  "montacargas",
  "auxiliar-escolar",
];

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
  const { usuario, token, refrescarUsuario } = useAuth();
  const [enviando, setEnviando] = useState(false);
  const [comprobando, setComprobando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  if (!usuario || usuario.emailVerificado) return null;

  // NUEVO (21/10/2026): salida manual por si la actualización automática
  // (AuthContext) tarda. Si el correo ya quedó verificado, `usuario` se
  // actualiza y este aviso desaparece solo.
  async function yaVerifique() {
    setComprobando(true);
    setMensaje(null);
    const ok = await refrescarUsuario();
    setComprobando(false);
    setMensaje(
      ok
        ? "Aún no vemos la verificación. Abre el link del correo y vuelve aquí."
        : "No pudimos comprobarlo. Intenta de nuevo.",
    );
  }

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
    <div className="rounded-lg bg-brand-pink-light border border-brand-pink p-3 text-sm text-brand-blue mb-6 flex items-center justify-between gap-3 flex-wrap">
      <span>Verifica tu correo para poder inscribirte en el curso.</span>
      <div className="flex items-center gap-2 flex-wrap">
        {mensaje && <span className="text-xs">{mensaje}</span>}
        <button
          onClick={yaVerifique}
          disabled={comprobando}
          className="text-xs font-medium px-3 py-1.5 rounded-full border border-brand-pink text-brand-pink hover:bg-brand-pink hover:text-white disabled:opacity-60 shrink-0"
        >
          {comprobando ? "Comprobando..." : "Ya verifiqué"}
        </button>
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

// NUEVO (21/10/2026): le dice a la estudiante que la pantalla NO está
// congelada (se revalida sola, ver useRevalidar) y le da un botón manual.
function IndicadorActualizacion({
  onActualizar,
  actualizando,
}: {
  onActualizar: () => void;
  actualizando: boolean;
}) {
  return (
    <div className="mt-6 flex flex-col items-center gap-2">
      <p className="text-xs text-neutral-text opacity-70">
        Esta pantalla se actualiza sola cuando haya novedades.
      </p>
      <button
        onClick={onActualizar}
        disabled={actualizando}
        className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white disabled:opacity-60"
      >
        <RefreshCw size={12} className={actualizando ? "animate-spin" : ""} />
        {actualizando ? "Actualizando..." : "Actualizar ahora"}
      </button>
    </div>
  );
}

// ACTUALIZADO (08/09/2026): href dinámico — apunta al formulario correcto
// según si a la estudiante le toca TestPsicologico o
// CuestionarioEscolar (ver DashboardContenido, cálculo de
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
// Solo aplica al flujo estándar (requierePractica true). Desde el
// 19/10/2026 ya no bloquea el diploma: se muestra debajo de él.
function PantallaListaParaPractica({
  instructorAsignado,
}: {
  // NUEVO: chofer que ya le corresponde a la estudiante según su zona
  // (Inscripcion.instructorId, ver inscripcionController.js). Si viene
  // null/undefined (inscripciones de antes de este cambio, o zonas sin
  // chofer todavía), se cae al comportamiento anterior: la lista completa.
  instructorAsignado?: Instructor | null;
}) {
  const { token } = useAuth();
  const [instructores, setInstructores] = useState<Instructor[]>([]);
  const [cargando, setCargando] = useState(!instructorAsignado);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (instructorAsignado) return;
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
  }, [token, instructorAsignado]);

  // NUEVO: con chofer ya asignado, se muestra solo esa tarjeta — se salta
  // el fetch de arriba y toda la lista completa de abajo.
  const listaAMostrar = instructorAsignado ? [instructorAsignado] : instructores;

  return (
    <div className="rounded-xl bg-white border border-neutral-bg p-8 text-center mt-6">
      <Trophy className="mx-auto mb-3 text-brand-pink" size={36} />
      <p className="font-display font-semibold text-brand-blue text-xl mb-2">
        ¡Felicidades, terminaste toda la teoría!
      </p>
      {/* CAMBIO (19/10/2026): el diploma ya no espera a la práctica — se
          genera al terminar la teoría. La práctica en el vehículo la
          coordina cada estudiante directamente con instructores externos. */}
      <p className="text-sm text-neutral-text mb-6">
        {instructorAsignado
          ? "Tu diploma de la parte teórica ya es tuyo. Para la práctica en el vehículo, este es el instructor que te corresponde — coordina día y hora directamente con él."
          : "Tu diploma de la parte teórica ya es tuyo. Para la práctica en el vehículo, contacta a uno de los instructores para coordinar día y hora directamente con él."}
      </p>
      <p className="text-xs text-neutral-text mb-6">
        Cada clase presencial tiene un costo de RD$500, que se paga en
        efectivo directo al instructor.
      </p>

      {!instructorAsignado && cargando && (
        <p className="text-sm text-neutral-text">Cargando instructores...</p>
      )}

      {!instructorAsignado && error && !cargando && (
        <p className="text-sm text-brand-pink">
          No pudimos cargar la lista de instructores. Intenta de nuevo en
          unos minutos.
        </p>
      )}

      {!instructorAsignado && !cargando && !error && listaAMostrar.length === 0 && (
        <p className="text-sm text-neutral-text">
          Todavía no hay instructores disponibles — tu coordinadora te
          contactará pronto.
        </p>
      )}

      {(instructorAsignado || (!cargando && !error)) && listaAMostrar.length > 0 && (
        <div className="grid gap-3 text-left">
          {listaAMostrar.map((instructor) => (
            <div
              key={instructor._id}
              className="rounded-lg border border-neutral-bg p-4"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="font-display font-semibold text-brand-blue">
                  {instructor.userId.nombre} {instructor.userId.apellido}
                </p>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-brand-pink-light text-brand-pink shrink-0">
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

// NUEVO (19/10/2026): desde que existe el diploma, la estudiante está
// GRADUADA para la app (decisión de la fundadora). La práctica de manejo
// queda como responsabilidad de los choferes externos: cuando ellos la
// marcan como hecha solo sirve de información (desaparece la tarjeta del
// chofer), no cambia nada del diploma ni de su condición de graduada.
function PantallaGraduada({ token }: { token: string | null }) {
  return (
    <div className="session-card-in rounded-xl bg-white border border-neutral-bg p-8 text-center">
      <Trophy className="mx-auto mb-3 text-status-success" size={40} />
      <p className="font-display font-semibold text-brand-blue text-2xl mb-2">
        ¡Felicidades, te graduaste!
      </p>
      <p className="text-sm text-neutral-text mb-6">
        Completaste las 4 sesiones y todos tus exámenes. Tu diploma ya está
        listo para descargar.
      </p>
      <a
        href={`${process.env.NEXT_PUBLIC_API_URL}/diplomas/me/descargar?token=${token}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-blue p-4 font-display font-semibold text-white transition-opacity hover:opacity-90"
      >
        <Download size={20} />
        Descargar mi diploma (PDF)
      </a>
      <Link
        href="/diploma"
        className="mt-4 inline-block text-sm text-brand-blue-light hover:underline"
      >
        Ver mi código de verificación y compartir mi logro
      </Link>
    </div>
  );
}

// NUEVO (19/10/2026): invitar a la graduada a recomendar el curso. En el
// celular abre el menú de compartir del sistema (WhatsApp, etc.); donde no
// existe (escritorio) abre WhatsApp Web con el mensaje, y además hay un
// botón para copiarlo.
const URL_CURSO = "https://www.muvordvial.com";

function RecomendarCurso() {
  const [copiado, setCopiado] = useState(false);

  const textoCorto =
    "Acabo de graduarme del curso de educación vial de Muvo RD Vial. Te lo recomiendo.";
  const mensajeCompleto = `${textoCorto} ${URL_CURSO}`;

  async function compartir() {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: "Muvo RD Vial",
          text: textoCorto,
          url: URL_CURSO,
        });
      } catch {
        // Cerró el menú de compartir: no es un error.
      }
      return;
    }
    window.open(
      `https://wa.me/?text=${encodeURIComponent(mensajeCompleto)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(mensajeCompleto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      // Sin permiso de portapapeles: se puede compartir con el otro botón.
    }
  }

  return (
    <div className="rounded-xl bg-white border border-neutral-bg p-8 mt-6 text-center">
      <p className="font-display font-semibold text-brand-blue text-xl mb-2">
        Recomienda el curso a tus amigos
      </p>
      <p className="text-sm text-neutral-text mb-6">
        Si el curso te sirvió, ayuda a que más personas aprendan a moverse
        con seguridad en la vía. Compártelo con quien creas que lo necesita.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={compartir}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-pink p-3 font-display font-semibold text-white transition-opacity hover:opacity-90"
        >
          <Share2 size={18} />
          Compartir
        </button>
        <button
          type="button"
          onClick={copiar}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-neutral-bg p-3 font-display font-semibold text-brand-blue transition-colors hover:bg-neutral-bg"
        >
          {copiado ? <Check size={18} /> : <Copy size={18} />}
          {copiado ? "¡Copiado!" : "Copiar mensaje"}
        </button>
      </div>
    </div>
  );
}

// NUEVO (19/10/2026): terminó la teoría pero el diploma no se pudo generar
// (falló la emisión automática y también el intento al abrir el panel,
// por ejemplo por un corte de Cloudinary). Antes esta pantalla decía que la
// coordinadora lo estaba preparando; ahora el diploma lo obtiene la propia
// estudiante, así que se le ofrece reintentar. Reemplaza a
// PantallaPracticaAprobada y PantallaTeoriaCompletadaGrupo, que ya no aplican
// (la práctica dejó de ser requisito del diploma).
function PantallaDiplomaPendiente({
  onReintentar,
  generando,
}: {
  onReintentar: () => void;
  generando: boolean;
}) {
  return (
    <div className="rounded-xl bg-white border border-neutral-bg p-8 text-center">
      <Trophy className="mx-auto mb-3 text-status-success" size={36} />
      <p className="font-display font-semibold text-brand-blue text-xl mb-2">
        ¡Felicidades, completaste el curso!
      </p>
      <p className="text-sm text-neutral-text mb-6">
        Terminaste las 4 sesiones y todos tus exámenes, pero no pudimos
        generar tu diploma en este momento. Inténtalo de nuevo — si el
        problema continúa, escríbenos desde Soporte.
      </p>
      <button
        type="button"
        onClick={onReintentar}
        disabled={generando}
        className="rounded-full bg-brand-pink text-white px-6 py-3 font-medium hover:opacity-90 disabled:opacity-60"
      >
        {generando ? "Generando..." : "Generar mi diploma"}
      </button>
    </div>
  );
}

// NUEVO (15/10/2026): al terminar un curso 100% teórico de Camionero
// (pesados) o Montacargas, se le ofrece a la estudiante contactar a
// profesionales independientes para clases prácticas. NO son de la
// fundación — el texto lo dice de forma amable (se recomiendan, las
// condiciones se acuerdan directo con cada uno). Si no hay ninguno activo
// (o falla la carga), no se muestra nada. Backend:
// GET /api/choferes-recomendados/mis-recomendados.
type ChoferRecomendado = {
  _id: string;
  nombre: string;
  telefono: string;
  email: string;
  zonas: { provincia: string; municipio: string }[];
};

function PantallaChoferesRecomendados({
  programa,
}: {
  programa: "pesados" | "montacargas";
}) {
  const { token } = useAuth();
  const [choferes, setChoferes] = useState<ChoferRecomendado[]>([]);

  useEffect(() => {
    let cancelado = false;

    (async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/choferes-recomendados/mis-recomendados`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const json = await res.json();
        if (!cancelado && json.success) setChoferes(json.data);
      } catch {
        // Sección opcional: si falla, simplemente no se muestra.
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [token]);

  if (choferes.length === 0) return null;

  const tema =
    programa === "montacargas"
      ? "operación de montacargas"
      : "manejo de camión y vehículos pesados";

  return (
    <div className="rounded-xl bg-white border border-neutral-bg p-8 mt-6">
      <div className="text-center mb-6">
        <Trophy className="mx-auto mb-3 text-brand-pink" size={32} />
        <p className="font-display font-semibold text-brand-blue text-xl mb-2">
          ¡Felicidades por aprobar tu curso!
        </p>
        <p className="text-sm text-neutral-text">
          Si te gustaría reforzar lo aprendido con clases prácticas de{" "}
          {tema}, estos profesionales independientes pueden acompañarte.
          Son personas que conocemos y te recomendamos con gusto; no forman
          parte de la fundación, así que las clases, horarios y tarifas los
          acuerdas directamente con ellos, como mejor te convenga.
        </p>
      </div>

      <div className="grid gap-3 text-left">
        {choferes.map((c) => (
          <div key={c._id} className="rounded-lg border border-neutral-bg p-4">
            <p className="font-display font-semibold text-brand-blue mb-2">
              {c.nombre}
            </p>
            <div className="flex flex-col gap-1 text-sm text-neutral-text">
              <span className="flex items-center gap-2">
                <Phone size={14} className="text-brand-pink shrink-0" />
                <a href={`tel:${c.telefono}`} className="hover:underline">
                  {c.telefono}
                </a>
              </span>
              {c.email && (
                <span className="flex items-center gap-2">
                  <Mail size={14} className="text-brand-pink shrink-0" />
                  <a href={`mailto:${c.email}`} className="hover:underline break-all">
                    {c.email}
                  </a>
                </span>
              )}
              <span className="flex items-start gap-2">
                <MapPin size={14} className="text-brand-pink shrink-0 mt-0.5" />
                <span>
                  Zona de práctica:{" "}
                  {c.zonas.map((z) => `${z.municipio}, ${z.provincia}`).join(" · ")}
                </span>
              </span>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-neutral-text mt-5 text-center">
        Compartimos estos contactos como una referencia de cortesía. Eres
        libre de elegir al profesional que prefieras.
      </p>
    </div>
  );
}

// NUEVO (19/10/2026): devuelve true si la estudiante ya tiene diploma, y si
// no lo tiene lo pide al backend (POST /diplomas/me/generar, idempotente).
// Normalmente el diploma ya se emitió solo al aprobar la última sesión; esto
// cubre a quienes completaron antes de ese cambio y el caso en que la emisión
// automática falló.
async function obtenerODiplomaListo(token: string | null): Promise<boolean> {
  const base = process.env.NEXT_PUBLIC_API_URL;
  const cabeceras = { Authorization: `Bearer ${token}` };
  try {
    const resExistente = await fetch(`${base}/diplomas/me`, {
      headers: cabeceras,
    });
    if ((await resExistente.json()).success) return true;

    const resGenerar = await fetch(`${base}/diplomas/me/generar`, {
      method: "POST",
      headers: cabeceras,
    });
    return Boolean((await resGenerar.json()).success);
  } catch {
    return false;
  }
}

function DashboardContenido() {
  const { usuario, token } = useAuth();
  const [inscripcion, setInscripcion] = useState<Inscripcion | null>(null);
  const [progreso, setProgreso] = useState<Progreso | null>(null);
  const [testCompletado, setTestCompletado] = useState<boolean | null>(null);
  const [diplomaListo, setDiplomaListo] = useState(false);
  const [generandoDiploma, setGenerandoDiploma] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  // NUEVO (08/09/2026): estudiantes de un Grupo (Escolar/Empresarial) no
  // cursan práctica de manejo — su diploma depende únicamente de
  // cursoCompletado. El resto (grupoId null, flujo estándar) sigue
  // exigiendo practicaAprobada, igual que antes del 08/09/2026.
  // ACTUALIZADO (13/09/2026): Motorizados y Pesados tampoco cursan
  // práctica — ese dato vive en `progreso.programa` (llega recién con el
  // fetch de abajo), no en `usuario`, así que este cálculo se recalcula
  // cuando `progreso` cambia.
  // ACTUALIZADO (13/09/2026): tercer criterio — un plan "teorico" dentro
  // de "estandar" (municipio sin cobertura de práctica presencial)
  // tampoco cursa práctica. Espejo exacto de
  // utils/elegibilidadPractica.js en el backend — ver
  // ANALISIS_COBERTURA_PRACTICA.md.
  const requierePractica =
    !usuario?.grupoId &&
    !(progreso?.programa && PROGRAMAS_SIN_PRACTICA.includes(progreso.programa)) &&
    progreso?.tipoPlan !== "teorico";

  // NUEVO (08/09/2026): decide qué cuestionario de perfil le toca a esta
  // estudiante — mismo criterio que sesionController.js en el backend
  // (grupoTipo === "colegio"). Empresarial sigue usando TestPsicologico,
  // igual que el flujo estándar.
  const esEscolar = usuario?.grupoTipo === "colegio";

  // CAMBIO (21/10/2026): antes esto era un useEffect que pedía todo UNA sola
  // vez al montar — por eso, si la coordinadora confirmaba el pago, la
  // estudiante seguía viendo "pendiente" hasta salir y volver a entrar. Se
  // convirtió en una función reutilizable (`cargarTodo`) que se llama:
  //   - al montar (con "Cargando...", como siempre),
  //   - en silencio cada vez que la persona vuelve a la pestaña,
  //   - en silencio cada 10 s MIENTRAS el pago está en revisión.
  // Las llamadas en silencio no tocan `cargando` ni muestran error si
  // fallan por red: se conserva lo que ya está en pantalla.
  const ultimaSolicitud = useRef(0);
  const estadoPagoPrevio = useRef<Inscripcion["estadoPago"] | null>(null);
  const diplomaListoRef = useRef(false);
  const [actualizando, setActualizando] = useState(false);
  const [pagoRecienConfirmado, setPagoRecienConfirmado] = useState(false);

  const cargarTodo = useCallback(
    async (silencioso: boolean) => {
      // Si llegan dos cargas casi juntas, solo vale la última.
      const solicitud = ++ultimaSolicitud.current;
      const vigente = () => solicitud === ultimaSolicitud.current;

      try {
        const resInscripcion = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/inscripciones/me`,
          { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
        );
        const jsonInscripcion = await resInscripcion.json();

        if (!vigente()) return;

        if (!jsonInscripcion.success) {
          if (!silencioso) setError(true);
          return;
        }

        const inscripcionActual: Inscripcion | null = jsonInscripcion.data;

        // Avisa una sola vez cuando el pago pasa de "en revisión" a
        // "pagado" mientras la estudiante está mirando la pantalla.
        const previo = estadoPagoPrevio.current;
        estadoPagoPrevio.current = inscripcionActual?.estadoPago ?? null;
        if (
          previo &&
          previo !== "pagado" &&
          inscripcionActual?.estadoPago === "pagado"
        ) {
          setPagoRecienConfirmado(true);
        }

        setInscripcion(inscripcionActual);
        setError(false);

        if (inscripcionActual?.estadoPago === "pagado") {
          // NUEVO (08/09/2026): el endpoint de "¿ya completé mi
          // cuestionario?" depende de esEscolar — mismo shape de
          // respuesta en los dos casos ({ success, completado }), así que
          // el resto de la lógica no cambia.
          const endpointCuestionario = esEscolar
            ? "cuestionario-escolar/mi-respuesta"
            : "test-psicologico/mi-respuesta";

          const [resProgreso, resTest] = await Promise.all([
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/progreso/me`, {
              headers: { Authorization: `Bearer ${token}` },
              cache: "no-store",
            }),
            fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/${endpointCuestionario}`,
              {
                headers: { Authorization: `Bearer ${token}` },
                cache: "no-store",
              },
            ),
          ]);
          const jsonProgreso = await resProgreso.json();
          const jsonTest = await resTest.json();

          if (!vigente()) return;

          if (jsonProgreso.success) setProgreso(jsonProgreso.data);
          if (jsonTest.success) setTestCompletado(jsonTest.completado);

          // CAMBIO (19/10/2026): el diploma depende SOLO de haber
          // completado la teoría (cursoCompletado) — la práctica ya no es
          // requisito para nadie. Si todavía no existe, se genera aquí.
          // (21/10/2026) Si ya se confirmó que existe, no se vuelve a
          // consultar en cada revalidación.
          if (
            jsonProgreso.success &&
            jsonProgreso.data.cursoCompletado &&
            !diplomaListoRef.current
          ) {
            const listo = await obtenerODiplomaListo(token);
            if (!vigente()) return;
            diplomaListoRef.current = listo;
            setDiplomaListo(listo);
          }
        }
      } catch {
        if (vigente() && !silencioso) setError(true);
      } finally {
        if (vigente()) setCargando(false);
      }
    },
    [token, esEscolar],
  );

  useEffect(() => {
    const solicitudes = ultimaSolicitud;
    // Carga inicial. Se difiere un tick a propósito: la regla de lint
    // react-hooks/set-state-in-effect no distingue que los setState de
    // cargarTodo ocurren después de un await.
    const arranque = setTimeout(() => {
      void cargarTodo(false);
    }, 0);
    return () => {
      clearTimeout(arranque);
      // Al desmontar (o si cambia esEscolar) se descarta lo que siga en vuelo.
      solicitudes.current++;
    };
  }, [cargarTodo]);

  // Pago en revisión: preguntar cada 10 s. En cualquier otro estado solo se
  // revalida al volver a la pestaña (por si se aprobó una sesión, el chofer
  // marcó la práctica, etc.).
  const esperandoPago =
    inscripcion?.estadoPago === "pendiente" ||
    inscripcion?.estadoPago === "pendiente_verificacion";

  useRevalidar(() => cargarTodo(true), {
    activo: !!token,
    intervaloMs: esperandoPago ? 10000 : null,
  });

  async function actualizarAhora() {
    setActualizando(true);
    await cargarTodo(true);
    setActualizando(false);
  }

  // El aviso de "pago confirmado" se quita solo.
  useEffect(() => {
    if (!pagoRecienConfirmado) return;
    const t = setTimeout(() => setPagoRecienConfirmado(false), 10000);
    return () => clearTimeout(t);
  }, [pagoRecienConfirmado]);

  async function reintentarDiploma() {
    setGenerandoDiploma(true);
    setDiplomaListo(await obtenerODiplomaListo(token));
    setGenerandoDiploma(false);
  }

  return (
    <main className="bg-neutral-bg min-h-screen px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-brand-blue">
            Hola, {usuario?.nombre}
          </h1>
          <p className="text-neutral-text text-sm">Tu panel de estudiante</p>
          {/* NUEVO (04/10/2026): hasta ahora el panel no decía en ningún
              lado qué curso estaba cursando la estudiante. Sale del mismo
              progreso.programa que ya decide qué contenido recibe. */}
          {progreso?.programa && (
            <span className="inline-block mt-3 text-xs font-medium px-3 py-1 rounded-full bg-brand-pink-light text-brand-blue">
              {etiquetaPrograma(progreso.programa)}
            </span>
          )}
        </div>

        <AvisoEmailSinVerificar />

        {pagoRecienConfirmado && (
          <div className="rounded-lg bg-white border border-status-success p-3 text-sm text-brand-blue mb-6 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-status-success shrink-0" />
            <span>
              ¡Tu pago fue confirmado! Ya puedes empezar tu curso.
            </span>
          </div>
        )}

        {cargando && (
          <p className="text-neutral-text text-sm text-center">Cargando...</p>
        )}

        {error && !cargando && (
          <div className="rounded-lg bg-brand-pink-light border border-brand-pink p-4 text-brand-blue text-sm">
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
            <IndicadorActualizacion
              onActualizar={actualizarAhora}
              actualizando={actualizando}
            />
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
            <IndicadorActualizacion
              onActualizar={actualizarAhora}
              actualizando={actualizando}
            />
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
              href={esEscolar ? "/cuestionario-escolar" : "/test-psicologico"}
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
                requierePractica={false}
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
                <PantallaGraduada token={token} />
              )}

              {progreso.cursoCompletado && !diplomaListo && (
                <PantallaDiplomaPendiente
                  onReintentar={reintentarDiploma}
                  generando={generandoDiploma}
                />
              )}

              {/* CAMBIO (19/10/2026): graduada = tiene diploma. Debajo se
                  sigue mostrando el contacto de los instructores
                  (externos) mientras el chofer no marque la práctica como
                  hecha; cuando la marca, esta tarjeta desaparece. */}
              {progreso.cursoCompletado &&
                requierePractica &&
                !progreso.practicaAprobada && (
                  <PantallaListaParaPractica
                    instructorAsignado={inscripcion?.instructorId}
                  />
                )}

              {/* NUEVO (15/10/2026): cursos teóricos de Camionero y
                  Montacargas — recomendación de choferes para clases
                  prácticas, debajo del mensaje de curso completado. */}
              {progreso.cursoCompletado &&
                (progreso.programa === "pesados" ||
                  progreso.programa === "montacargas") && (
                  <PantallaChoferesRecomendados programa={progreso.programa} />
                )}

              {progreso.cursoCompletado && diplomaListo && <RecomendarCurso />}
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