"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Mail,
  Phone,
  KeyRound,
  Award,
  BarChart3,
  BookOpen,
  GraduationCap,
  CheckCircle2,
  Circle,
  XCircle,
  Lock,
  ChevronDown,
  ChevronUp,
  Video,
  FileText,
  Link2,
  AlignLeft,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  BarraProgreso,
  Indicador,
  calcularEdad,
  formatearFecha,
} from "@/components/ui/grupos";
import * as BancoEscolar from "@/lib/bancoPreguntasEscolar";
import * as BancoPerfil from "@/lib/bancoPreguntasTest";

// NUEVO (18/09/2026) — ficha completa de UNA estudiante de un grupo:
// datos, avance por sesión (material visto + exámenes con sus notas y,
// al abrirlos, pregunta por pregunta), cuestionario de ingreso con sus
// respuestas y diploma. Se llega desde la lista de estudiantes de
// /panel/grupos/[id].

type Material = { _id: string; titulo: string; tipo: "video" | "pdf" | "enlace" | "texto"; visto: boolean };

type Intento = {
  _id: string;
  numeroIntento: number;
  calificacion: number | null;
  aprobado: boolean | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  estadoIntento: "entregado" | "en_curso" | "sin_iniciar";
  duracionSegundos: number | null;
};

type SesionFicha = {
  _id: string;
  numero: number;
  titulo: string;
  estado: "aprobada" | "disponible" | "bloqueada";
  fechaAprobacion: string | null;
  materiales: Material[];
  intentos: Intento[];
  mejorCalificacion: number | null;
};

type Ficha = {
  grupo: { _id: string; tipo: "colegio" | "empresa"; nombreInstitucion: string };
  estudiante: {
    _id: string;
    nombre: string;
    apellido: string;
    cedula?: string;
    email: string;
    telefono: string;
    provincia: string;
    municipio: string | null;
    fechaNacimiento: string;
    activo: boolean;
    createdAt: string;
  };
  progreso: {
    cursoCompletado: boolean;
    sesionesAprobadas: number;
    totalSesiones: number;
    materialVisto: number;
    materialTotal: number;
    promedioExamenes: number | null;
  };
  sesiones: SesionFicha[];
  cuestionario: {
    tipo: "escolar" | "perfil_conductual";
    completado: boolean;
    fecha: string | null;
    respuestas: number[];
    reflexiones: string[];
  };
  diploma: { emitido: boolean; fechaEmision?: string; codigoVerificacion?: string };
  inscripcion: { estadoPago: string; fechaPago: string | null; creadaEl: string } | null;
};

type PreguntaDetalle = {
  texto: string;
  opciones: string[];
  respuestaEstudiante: number | null;
  respuestaCorrectaIndex: number;
  acerto: boolean;
};

function formatearDuracion(segundos: number | null): string {
  if (segundos === null) return "—";
  const minutos = Math.max(1, Math.round(segundos / 60));
  return `${minutos} min`;
}

const ICONO_MATERIAL = { video: Video, pdf: FileText, enlace: Link2, texto: AlignLeft };

// ---------------------------------------------------------------------
// Un intento de examen, con el detalle pregunta por pregunta que se pide
// solo cuando se abre (no se descarga con la ficha).
// ---------------------------------------------------------------------
function FilaIntento({
  intento,
  grupoId,
  userId,
  token,
}: {
  intento: Intento;
  grupoId: string;
  userId: string;
  token: string | null;
}) {
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preguntas, setPreguntas] = useState<PreguntaDetalle[] | null>(null);

  async function alternar() {
    if (abierto) {
      setAbierto(false);
      return;
    }
    setAbierto(true);
    if (preguntas) return;

    setCargando(true);
    setError(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/grupos/${grupoId}/estudiantes/${userId}/intentos/${intento._id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const json = await res.json();
      if (json.success) setPreguntas(json.data.preguntas);
      else setError(json.error || "No se pudo cargar el detalle.");
    } catch {
      setError("No pudimos conectar con el servidor.");
    } finally {
      setCargando(false);
    }
  }

  const entregado = intento.estadoIntento === "entregado";

  return (
    <div className="border border-neutral-bg rounded-lg">
      <div className="flex items-center justify-between gap-3 px-3 py-2.5 flex-wrap">
        <div>
          <p className="text-sm font-medium text-brand-blue">
            Intento {intento.numeroIntento}
          </p>
          <p className="text-xs text-neutral-text">
            {entregado
              ? `Entregado el ${formatearFecha(intento.fechaFin)} · ${formatearDuracion(intento.duracionSegundos)}`
              : intento.estadoIntento === "en_curso"
                ? "Empezado, sin entregar"
                : "Desbloqueado, todavía no lo abre"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {entregado && intento.calificacion !== null && (
            <span
              className={`text-xs font-medium px-3 py-1 rounded-full ${intento.aprobado ? "bg-status-success text-white" : "bg-brand-pink text-white"
                }`}
            >
              {intento.calificacion}% · {intento.aprobado ? "Aprobó" : "No aprobó"}
            </span>
          )}
          {entregado && (
            <button
              onClick={alternar}
              className="inline-flex items-center gap-1 text-xs text-brand-blue font-medium hover:underline"
            >
              {abierto ? "Ocultar respuestas" : "Ver respuestas"}
              {abierto ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>
      </div>

      {abierto && (
        <div className="border-t border-neutral-bg px-3 py-3 grid gap-3">
          {cargando && <p className="text-xs text-neutral-text">Cargando...</p>}
          {error && <p className="text-xs text-brand-pink">{error}</p>}
          {preguntas?.map((p, i) => (
            <div key={i} className="text-sm">
              <p className="flex items-start gap-2 text-neutral-text">
                {p.acerto ? (
                  <CheckCircle2 size={16} className="text-status-success shrink-0 mt-0.5" />
                ) : (
                  <XCircle size={16} className="text-brand-pink shrink-0 mt-0.5" />
                )}
                <span>
                  {i + 1}. {p.texto}
                </span>
              </p>
              <div className="ml-6 mt-1 text-xs grid gap-0.5">
                <p className={p.acerto ? "text-status-success" : "text-brand-pink"}>
                  Respondió:{" "}
                  {p.respuestaEstudiante !== null
                    ? p.opciones[p.respuestaEstudiante] ?? "—"
                    : "Sin responder"}
                </p>
                {!p.acerto && (
                  <p className="text-status-success">
                    Correcta: {p.opciones[p.respuestaCorrectaIndex]}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Cuestionario de ingreso — oculto hasta que la coordinadora lo abre.
// ---------------------------------------------------------------------
function SeccionCuestionario({ cuestionario }: { cuestionario: Ficha["cuestionario"] }) {
  const [visible, setVisible] = useState(false);
  const banco = cuestionario.tipo === "escolar" ? BancoEscolar : BancoPerfil;
  const titulo =
    cuestionario.tipo === "escolar" ? "Cuestionario Escolar" : "Perfil conductual";

  function etiqueta(valor: number | undefined) {
    return banco.ESCALA_LIKERT.find((e) => e.valor === valor)?.etiqueta ?? "—";
  }

  return (
    <div className="rounded-xl bg-white border border-neutral-bg p-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="font-display font-semibold text-brand-blue">
            {titulo} (respuestas de ingreso)
          </p>
          <p className="text-xs text-neutral-text mt-0.5">
            {cuestionario.completado
              ? `Completado el ${formatearFecha(cuestionario.fecha)}`
              : "Todavía no lo ha completado."}
          </p>
        </div>
        {cuestionario.completado && (
          <button
            onClick={() => setVisible((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-blue text-brand-blue px-3 py-1.5 text-sm font-medium hover:bg-brand-blue hover:text-white transition-colors"
          >
            {visible ? "Ocultar respuestas" : "Mostrar respuestas"}
          </button>
        )}
      </div>

      <p className="flex items-start gap-1.5 text-xs text-neutral-text bg-neutral-bg rounded-lg px-3 py-2 mt-3">
        <Lock size={13} className="shrink-0 mt-0.5" />
        Información sensible: solo la ven coordinadora y admin. No se incluye en
        el CSV ni en los reportes por correo a la institución.
      </p>

      {cuestionario.completado && visible && (
        <div className="flex flex-col gap-6 mt-5">
          {banco.SECCIONES.map((seccion, indiceSeccion) => {
            const offset = banco.SECCIONES.slice(0, indiceSeccion).reduce(
              (acc, s) => acc + s.preguntas.length,
              0,
            );
            return (
              <div key={seccion.clave}>
                <p className="text-sm font-semibold text-brand-blue mb-2">
                  {seccion.clave}. {seccion.titulo}
                </p>
                <div className="flex flex-col">
                  {seccion.preguntas.map((texto, i) => (
                    <div
                      key={i}
                      className="flex justify-between gap-4 text-sm py-1 border-b border-neutral-bg last:border-0"
                    >
                      <span className="text-neutral-text">{texto}</span>
                      <span className="font-medium text-brand-blue whitespace-nowrap">
                        {etiqueta(cuestionario.respuestas[offset + i])}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          <div>
            <p className="text-sm font-semibold text-brand-blue mb-2">Preguntas abiertas</p>
            <div className="flex flex-col gap-3">
              {banco.PREGUNTAS_REFLEXION.map((pregunta, i) => (
                <div key={i}>
                  <p className="text-sm text-neutral-text">{pregunta}</p>
                  <p className="text-sm text-brand-blue mt-1">
                    {cuestionario.reflexiones[i] || (
                      <span className="italic text-neutral-text/60">Sin respuesta</span>
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Pantalla
// ---------------------------------------------------------------------
function FichaEstudianteContenido() {
  const params = useParams();
  const grupoId = params.id as string;
  const userId = params.userId as string;
  const { token, usuario } = useAuth();
  const esAdmin = usuario?.rol === "admin";

  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [accionEnCurso, setAccionEnCurso] = useState(false);

  const cargar = useCallback(async () => {
    if (!token || !grupoId || !userId) return;
    setCargando(true);
    setError(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/grupos/${grupoId}/estudiantes/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const json = await res.json();
      if (json.success) setFicha(json.data);
      else setError(json.error || "No se pudo cargar la ficha.");
    } catch {
      setError("No pudimos conectar con el servidor.");
    } finally {
      setCargando(false);
    }
  }, [token, grupoId, userId]);

  useEffect(() => {
    queueMicrotask(() => cargar());
  }, [cargar]);

  async function reenviarCredenciales() {
    if (!ficha) return;
    if (
      !window.confirm(
        `Se generará una contraseña NUEVA para ${ficha.estudiante.nombre} y se enviará a ${ficha.estudiante.email}. La contraseña anterior dejará de funcionar. ¿Continuar?`,
      )
    ) {
      return;
    }
    setAccionEnCurso(true);
    setMensaje(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/grupos/${grupoId}/estudiantes/${userId}/reenviar-credenciales`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } },
      );
      const json = await res.json();
      setMensaje(
        json.success
          ? {
            tipo: "ok",
            texto: `Listo: se envió una contraseña nueva a ${json.data.email}. Si no le llega, que revise spam o confirma que el correo esté bien escrito.`,
          }
          : { tipo: "error", texto: json.error || "No se pudo reenviar." },
      );
    } catch {
      setMensaje({ tipo: "error", texto: "No pudimos conectar con el servidor." });
    } finally {
      setAccionEnCurso(false);
    }
  }

  async function cambiarEstadoCuenta(nuevoActivo: boolean) {
    setAccionEnCurso(true);
    setMensaje(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/${userId}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ activo: nuevoActivo }),
      });
      const json = await res.json();
      if (json.success) {
        setMensaje({
          tipo: "ok",
          texto: nuevoActivo ? "Cuenta reactivada." : "Cuenta desactivada.",
        });
        cargar();
      } else {
        setMensaje({ tipo: "error", texto: json.error || "No se pudo actualizar." });
      }
    } catch {
      setMensaje({ tipo: "error", texto: "No pudimos conectar con el servidor." });
    } finally {
      setAccionEnCurso(false);
    }
  }

  if (cargando && !ficha) return <p className="text-sm text-neutral-text">Cargando...</p>;

  if (!ficha) {
    return (
      <div className="max-w-5xl mx-auto">
        <Link
          href={`/panel/grupos/${grupoId}`}
          className="text-sm text-brand-blue-light hover:underline mb-4 inline-block"
        >
          ← Volver al grupo
        </Link>
        <p className="text-sm text-neutral-text">{error || "Estudiante no encontrada."}</p>
      </div>
    );
  }

  const { estudiante: e, progreso, sesiones, cuestionario, diploma } = ficha;
  const edad = calcularEdad(e.fechaNacimiento);
  const porcentaje = progreso.cursoCompletado
    ? 100
    : progreso.totalSesiones
      ? Math.round((progreso.sesionesAprobadas / progreso.totalSesiones) * 100)
      : 0;

  return (
    <div className="max-w-5xl mx-auto">
      <Link
        href={`/panel/grupos/${grupoId}`}
        className="text-sm text-brand-blue-light hover:underline mb-4 inline-block"
      >
        ← {ficha.grupo.nombreInstitucion}
      </Link>

      <div className="rounded-xl bg-white border border-neutral-bg p-6 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="font-display font-semibold text-brand-blue text-xl">
              {e.nombre} {e.apellido}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full ${e.activo
                  ? "bg-status-success/15 text-status-success"
                  : "bg-neutral-bg text-neutral-text"
                  }`}
              >
                {e.activo ? "Cuenta activa" : "Cuenta inactiva"}
              </span>
              {progreso.cursoCompletado && (
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-brand-blue/10 text-brand-blue">
                  Completó la teoría
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {e.activo && (
              <button
                onClick={reenviarCredenciales}
                disabled={accionEnCurso}
                className="inline-flex items-center gap-1.5 rounded-lg border border-brand-blue text-brand-blue px-3 py-2 text-sm font-medium hover:bg-brand-blue hover:text-white transition-colors disabled:opacity-50"
              >
                <KeyRound size={15} /> Reenviar credenciales
              </button>
            )}
            {esAdmin &&
              (e.activo ? (
                <button
                  onClick={() => {
                    if (window.confirm("¿Desactivar esta cuenta? No podrá iniciar sesión.")) {
                      cambiarEstadoCuenta(false);
                    }
                  }}
                  disabled={accionEnCurso}
                  className="rounded-lg border border-neutral-bg text-neutral-text px-3 py-2 text-sm font-medium hover:border-brand-pink hover:text-brand-pink transition-colors disabled:opacity-50"
                >
                  Desactivar cuenta
                </button>
              ) : (
                <button
                  onClick={() => cambiarEstadoCuenta(true)}
                  disabled={accionEnCurso}
                  className="rounded-lg border border-status-success text-status-success px-3 py-2 text-sm font-medium hover:bg-status-success hover:text-white transition-colors disabled:opacity-50"
                >
                  Reactivar cuenta
                </button>
              ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 mt-5 text-sm text-neutral-text">
          <a href={`mailto:${e.email}`} className="inline-flex items-center gap-1.5 hover:text-brand-blue">
            <Mail size={14} /> {e.email}
          </a>
          <a href={`tel:${e.telefono}`} className="inline-flex items-center gap-1.5 hover:text-brand-blue">
            <Phone size={14} /> {e.telefono}
          </a>
          <span>Cédula: {e.cedula || "Sin cédula"}</span>
          <span>
            Nació el {formatearFecha(e.fechaNacimiento)}
            {edad !== null && ` (${edad} años)`}
          </span>
          <span>
            {e.provincia}
            {e.municipio ? `, ${e.municipio}` : ""}
          </span>
          <span>Cuenta creada el {formatearFecha(e.createdAt)}</span>
        </div>

        {mensaje && (
          <div
            className={`rounded-lg p-3 text-sm mt-4 ${mensaje.tipo === "ok"
              ? "bg-status-success/10 border border-status-success text-status-success"
              : "bg-brand-pink-light border border-brand-pink text-brand-blue"
              }`}
          >
            {mensaje.texto}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="rounded-xl bg-white border border-neutral-bg p-4">
          <GraduationCap size={18} className="text-brand-blue" />
          <p className="font-display text-2xl font-bold text-brand-blue mt-1">
            {progreso.sesionesAprobadas}/{progreso.totalSesiones}
          </p>
          <p className="text-xs text-neutral-text mb-2">Sesiones aprobadas</p>
          <BarraProgreso porcentaje={porcentaje} />
        </div>
        <Indicador
          Icono={BarChart3}
          valor={progreso.promedioExamenes !== null ? `${progreso.promedioExamenes}%` : "—"}
          etiqueta="Promedio de exámenes"
          detalle="Mejor nota de cada sesión"
        />
        <Indicador
          Icono={BookOpen}
          valor={`${progreso.materialVisto}/${progreso.materialTotal}`}
          etiqueta="Material leído"
        />
        <Indicador
          Icono={Award}
          valor={diploma.emitido ? "Emitido" : "Pendiente"}
          etiqueta="Diploma"
          detalle={
            diploma.emitido && diploma.fechaEmision
              ? formatearFecha(diploma.fechaEmision)
              : undefined
          }
        />
      </div>

      <p className="font-display font-semibold text-brand-blue mb-3">Avance por sesión</p>
      <div className="grid gap-4 mb-6">
        {sesiones.length === 0 && (
          <p className="text-sm text-neutral-text">No hay sesiones cargadas para este programa.</p>
        )}
        {sesiones.map((s) => {
          const vistos = s.materiales.filter((m) => m.visto).length;
          const estilo =
            s.estado === "aprobada"
              ? "bg-status-success/15 text-status-success"
              : s.estado === "disponible"
                ? "bg-brand-blue/10 text-brand-blue"
                : "bg-neutral-bg text-neutral-text/60";
          const textoEstado =
            s.estado === "aprobada" ? "Aprobada" : s.estado === "disponible" ? "En curso" : "Bloqueada";
          return (
            <div key={s._id} className="rounded-xl bg-white border border-neutral-bg p-5">
              <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
                <div>
                  <p className="font-display font-semibold text-brand-blue">
                    Sesión {s.numero} — {s.titulo}
                  </p>
                  <p className="text-xs text-neutral-text mt-0.5">
                    Material: {vistos}/{s.materiales.length}
                    {s.mejorCalificacion !== null && ` · Mejor nota: ${s.mejorCalificacion}%`}
                    {s.fechaAprobacion && ` · Aprobada el ${formatearFecha(s.fechaAprobacion)}`}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${estilo}`}>
                  {textoEstado}
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <p className="text-xs font-medium text-neutral-text mb-2">Material</p>
                  {s.materiales.length === 0 ? (
                    <p className="text-xs text-neutral-text/60">Sin material cargado.</p>
                  ) : (
                    <ul className="grid gap-1.5">
                      {s.materiales.map((m) => {
                        const Icono = ICONO_MATERIAL[m.tipo] ?? FileText;
                        return (
                          <li key={m._id} className="flex items-center gap-2 text-sm">
                            {m.visto ? (
                              <CheckCircle2 size={16} className="text-status-success shrink-0" />
                            ) : (
                              <Circle size={16} className="text-neutral-text/30 shrink-0" />
                            )}
                            <Icono size={14} className="text-neutral-text/50 shrink-0" />
                            <span className={m.visto ? "text-neutral-text" : "text-neutral-text/60"}>
                              {m.titulo}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                <div>
                  <p className="text-xs font-medium text-neutral-text mb-2">Examen</p>
                  {s.intentos.length === 0 ? (
                    <p className="text-xs text-neutral-text/60">
                      Todavía no se desbloquea el examen (falta terminar el material).
                    </p>
                  ) : (
                    <div className="grid gap-2">
                      {s.intentos.map((i) => (
                        <FilaIntento
                          key={i._id}
                          intento={i}
                          grupoId={grupoId}
                          userId={userId}
                          token={token}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <SeccionCuestionario cuestionario={cuestionario} />
    </div>
  );
}

export default function FichaEstudiantePage() {
  return <FichaEstudianteContenido />;
}