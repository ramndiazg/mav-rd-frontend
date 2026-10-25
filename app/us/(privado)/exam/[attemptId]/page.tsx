"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import RutaProtegidaUS from "@/components/us/RutaProtegidaUS";
import { BotonPrimario, MensajeError } from "@/components/us/FormUI";
import { useUsLocale } from "@/contexts/UsLocaleContext";
import { ApiErrorUS, usFetch } from "@/lib/us/api";
import {
  NOTA_APROBATORIA,
  partirOpcion,
  partirPregunta,
  type DetallePregunta,
  type InicioExamen,
  type PreguntaExamen,
  type ResultadoExamen,
} from "@/lib/us/aula";
import { formatearFecha } from "@/lib/us/pagos";

// NUEVO (24/10/2026): examen del módulo. Misma mecánica que /examen/[intentoId]
// de RD (que no se modifica): iniciar o reanudar → contestar con cuenta regresiva
// → entregar → ver nota y revisión.
//
// "Modo examen en inglés": cada pregunta trae el enunciado en inglés y, en una
// segunda línea, su traducción (las opciones, la traducción entre paréntesis).
// Un interruptor oculta la traducción para practicar solo en inglés; la
// preferencia se recuerda en este navegador.

const CLAVE_TRADUCCION = "us_exam_sin_traduccion";

function TextoBilingue({
  principal,
  traduccion,
  mostrar,
  tipo,
}: {
  principal: string;
  traduccion: string;
  mostrar: boolean;
  tipo: "pregunta" | "opcion";
}) {
  return (
    <>
      <span className={tipo === "pregunta" ? "block font-medium text-neutral-text" : "block"}>
        {principal}
      </span>
      {mostrar && traduccion && (
        <span lang="es" className="mt-0.5 block text-sm italic text-neutral-text/70">
          {traduccion}
        </span>
      )}
    </>
  );
}

function ExamenContenido() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const { t, locale, mensajeError } = useUsLocale();

  const [preguntas, setPreguntas] = useState<PreguntaExamen[] | null>(null);
  const [respuestas, setRespuestas] = useState<(number | null)[]>([]);
  const [segundos, setSegundos] = useState<number | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [cerrado, setCerrado] = useState("");
  const [entregando, setEntregando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoExamen | null>(null);
  const [detalle, setDetalle] = useState<DetallePregunta[] | null>(null);
  const [mostrarTraduccion, setMostrarTraduccion] = useState(() => {
    try {
      return window.localStorage.getItem(CLAVE_TRADUCCION) !== "1";
    } catch {
      return true;
    }
  });

  const finRef = useRef<number | null>(null);
  const respuestasRef = useRef<(number | null)[]>([]);
  const entregandoRef = useRef(false);

  // Iniciar (o reanudar) el intento al abrir la pantalla.
  useEffect(() => {
    let cancelado = false;

    async function iniciar() {
      try {
        const datos = await usFetch<InicioExamen>(`/intentos-examen/${attemptId}/iniciar`, {
          method: "POST",
          locale,
        });
        if (cancelado) return;
        const vacias = new Array<number | null>(datos.preguntas.length).fill(null);
        respuestasRef.current = vacias;
        finRef.current = Date.now() + datos.tiempoLimiteSegundos * 1000;
        setPreguntas(datos.preguntas);
        setRespuestas(vacias);
        setSegundos(datos.tiempoLimiteSegundos);
      } catch (e) {
        if (cancelado) return;
        // 409: ya entregado, o se acabó el tiempo estando fuera. El servidor
        // manda el texto exacto (en español; en inglés se usa el genérico).
        if (e instanceof ApiErrorUS && e.status === 409) {
          setCerrado(locale === "es" && e.message ? e.message : t("exam.cerrado"));
        } else {
          setError(mensajeError(e));
        }
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    void iniciar();
    return () => {
      cancelado = true;
    };
  }, [attemptId, locale, mensajeError, t]);

  const entregar = useCallback(async () => {
    if (entregandoRef.current) return; // evita doble entrega (clic + tiempo agotado)
    entregandoRef.current = true;
    setEntregando(true);
    setError("");
    try {
      const datos = await usFetch<ResultadoExamen>(`/intentos-examen/${attemptId}/entregar`, {
        method: "POST",
        body: { respuestas: respuestasRef.current },
        locale,
      });
      setResultado(datos);
      // El detalle correcta/incorrecta es otro endpoint: si falla, igual se
      // muestra la nota.
      try {
        const rev = await usFetch<{ preguntas: DetallePregunta[] }>(
          `/intentos-examen/${attemptId}/detalle`,
          { locale },
        );
        setDetalle(rev.preguntas);
      } catch {
        // no es crítico
      }
    } catch (e) {
      setError(mensajeError(e));
      entregandoRef.current = false; // permite reintentar la entrega
    } finally {
      setEntregando(false);
    }
  }, [attemptId, locale, mensajeError]);

  // Cuenta regresiva contra la hora de fin (no resta 1 por segundo: si el
  // celular se bloquea, al volver muestra el tiempo REAL que queda).
  const corriendo = segundos !== null && !resultado;
  useEffect(() => {
    if (!corriendo) return;
    const intervalo = window.setInterval(() => {
      if (finRef.current === null) return;
      const restante = Math.max(0, Math.ceil((finRef.current - Date.now()) / 1000));
      setSegundos(restante);
      if (restante <= 0) {
        window.clearInterval(intervalo);
        void entregar();
      }
    }, 1000);
    return () => window.clearInterval(intervalo);
  }, [corriendo, entregar]);

  function elegir(pregunta: number, opcion: number) {
    const copia = [...respuestasRef.current];
    copia[pregunta] = opcion;
    respuestasRef.current = copia;
    setRespuestas(copia);
  }

  function cambiarTraduccion(valor: boolean) {
    setMostrarTraduccion(valor);
    try {
      window.localStorage.setItem(CLAVE_TRADUCCION, valor ? "0" : "1");
    } catch {
      // sin localStorage: vale para esta visita
    }
  }

  const faltan = respuestas.filter((r) => r === null).length;
  const minutos = segundos !== null ? Math.floor(segundos / 60) : 0;
  const seg = segundos !== null ? segundos % 60 : 0;
  const poco = segundos !== null && segundos < 300;

  const interruptor = (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-neutral-text">
      <input
        type="checkbox"
        checked={!mostrarTraduccion}
        onChange={(e) => cambiarTraduccion(!e.target.checked)}
        className="size-5 accent-brand-pink"
        aria-describedby="ayuda-traduccion"
      />
      <span>{t("exam.traduccion.ocultar")}</span>
    </label>
  );

  return (
    <section className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      {cargando && (
        <p role="status" className="text-neutral-text/70">
          {t("exam.preparando")}
        </p>
      )}

      {!cargando && cerrado && (
        <div role="alert" className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-neutral-bg">
          <p className="text-neutral-text">{cerrado}</p>
          <Link href="/us/dashboard" className="mt-5 inline-block font-medium text-brand-blue underline">
            {t("exam.volverCurso")}
          </Link>
        </div>
      )}

      {!cargando && error && !resultado && (
        <div className="mb-4">
          <MensajeError>{error}</MensajeError>
          {!preguntas && (
            <Link href="/us/dashboard" className="mt-3 inline-block font-medium text-brand-blue underline">
              {t("exam.volverCurso")}
            </Link>
          )}
        </div>
      )}

      {/* Resultado */}
      {resultado && (
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-bg">
          <p
            role="status"
            className={`flex items-center justify-center gap-2 font-display text-4xl font-bold ${resultado.aprobado ? "text-status-success" : "text-brand-pink"
              }`}
          >
            {resultado.aprobado ? <CheckCircle2 aria-hidden size={36} /> : <XCircle aria-hidden size={36} />}
            {resultado.calificacion}%
          </p>
          <p className="mt-2 text-center text-lg font-semibold text-neutral-text">
            {resultado.aprobado ? t("exam.aprobado") : t("exam.reprobado", { nota: NOTA_APROBATORIA })}
          </p>
          {resultado.fueraDeTiempo && (
            <p className="mt-2 text-center text-sm text-neutral-text/80">{t("exam.fueraTiempo")}</p>
          )}
          {!resultado.aprobado && (
            <p className="mt-2 text-center text-sm text-neutral-text/80">{t("exam.reprobadoTexto")}</p>
          )}
          {resultado.aprobado && resultado.proximaSesionDisponibleEn && (
            <p className="mt-4 rounded-lg bg-brand-yellow-light px-4 py-3 text-sm text-neutral-text">
              {t("exam.proxima", {
                fecha: formatearFecha(resultado.proximaSesionDisponibleEn, locale, {
                  dateStyle: "full",
                  timeStyle: "short",
                }),
              })}
            </p>
          )}

          {detalle && (
            <div className="mt-6">
              <h2 className="font-display text-lg font-semibold text-brand-blue">{t("exam.revision")}</h2>
              <ol className="mt-3 space-y-4">
                {detalle.map((p, i) => {
                  const q = partirPregunta(p.texto);
                  return (
                    <li
                      key={i}
                      className={`rounded-xl border p-4 ${p.acerto ? "border-status-success" : "border-brand-pink"}`}
                    >
                      <p className="flex items-start gap-2 font-medium text-neutral-text">
                        {p.acerto ? (
                          <CheckCircle2 aria-hidden className="mt-0.5 size-5 shrink-0 text-status-success" />
                        ) : (
                          <XCircle aria-hidden className="mt-0.5 size-5 shrink-0 text-brand-pink" />
                        )}
                        <span>
                          <span className="sr-only">
                            {p.acerto ? t("exam.correcta") : t("exam.incorrecta")}.{" "}
                          </span>
                          <TextoBilingue
                            principal={`${i + 1}. ${q.principal}`}
                            traduccion={q.traduccion}
                            mostrar
                            tipo="pregunta"
                          />
                        </span>
                      </p>
                      <ul className="mt-2 space-y-1.5 text-sm">
                        {p.opciones.map((opcion, j) => {
                          const o = partirOpcion(opcion);
                          const esCorrecta = j === p.respuestaCorrectaIndex;
                          const esMia = j === p.respuestaEstudiante;
                          return (
                            <li
                              key={j}
                              className={`rounded-lg px-3 py-2 ${esCorrecta
                                ? "bg-status-success/15 font-medium text-neutral-text"
                                : esMia
                                  ? "bg-brand-pink/10 text-neutral-text"
                                  : "bg-neutral-bg/60 text-neutral-text"
                                }`}
                            >
                              <TextoBilingue principal={o.principal} traduccion={o.traduccion} mostrar tipo="opcion" />
                              {esCorrecta && (
                                <span className="mt-1 block text-xs font-semibold text-status-success">
                                  ✓ {t("exam.laCorrecta")}
                                </span>
                              )}
                              {esMia && !esCorrecta && (
                                <span className="mt-1 block text-xs font-semibold text-brand-pink">
                                  ✗ {t("exam.tuRespuesta")}
                                </span>
                              )}
                            </li>
                          );
                        })}
                        {p.respuestaEstudiante === null && (
                          <li className="text-xs text-neutral-text/70">{t("exam.sinRespuesta")}</li>
                        )}
                      </ul>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          <Link
            href="/us/dashboard"
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-brand-blue px-6 font-semibold text-white hover:bg-brand-blue/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
          >
            {t("exam.volverCurso")}
          </Link>
        </div>
      )}

      {/* Examen en curso */}
      {!cargando && preguntas && !resultado && (
        <>
          <div className="sticky top-14 z-10 -mx-4 mb-4 flex items-center justify-between gap-3 bg-neutral-bg px-4 py-2 sm:top-16">
            <h1 className="font-display text-xl font-bold text-brand-blue">{t("exam.titulo")}</h1>
            <p
              role="timer"
              aria-label={t("exam.tiempo")}
              className={`rounded-full px-3 py-1 font-display text-sm font-semibold ${poco ? "bg-brand-pink text-white" : "bg-white text-brand-blue ring-1 ring-neutral-bg"
                }`}
            >
              {minutos}:{String(seg).padStart(2, "0")}
            </p>
          </div>

          <div className="mb-4 rounded-xl bg-white p-3 ring-1 ring-neutral-bg">
            {interruptor}
            <p id="ayuda-traduccion" className="px-1 text-xs text-neutral-text/70">
              {t("exam.traduccion.ayuda")}
            </p>
          </div>

          <ol className="space-y-4">
            {preguntas.map((pregunta, i) => {
              const q = partirPregunta(pregunta.texto);
              return (
                <li key={i} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-bg">
                  <fieldset>
                    <legend className="mb-3 w-full">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-blue/70">
                        {t("exam.pregunta", { n: i + 1 })}
                      </span>
                      <TextoBilingue
                        principal={q.principal}
                        traduccion={q.traduccion}
                        mostrar={mostrarTraduccion}
                        tipo="pregunta"
                      />
                    </legend>
                    <div className="space-y-2">
                      {pregunta.opciones.map((opcion, j) => {
                        const o = partirOpcion(opcion);
                        const marcada = respuestas[i] === j;
                        return (
                          <label
                            key={j}
                            className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition has-focus-visible:outline-2 has-focus-visible:outline-offset-1 has-focus-visible:outline-brand-blue ${marcada ? "border-brand-pink bg-brand-pink/5" : "border-neutral-bg hover:border-brand-blue/40"
                              }`}
                          >
                            <input
                              type="radio"
                              name={`pregunta-${i}`}
                              checked={marcada}
                              onChange={() => elegir(i, j)}
                              className="mt-0.5 size-5 shrink-0 accent-brand-pink"
                            />
                            <span>
                              <TextoBilingue
                                principal={o.principal}
                                traduccion={o.traduccion}
                                mostrar={mostrarTraduccion}
                                tipo="opcion"
                              />
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                </li>
              );
            })}
          </ol>

          <BotonPrimario
            type="button"
            onClick={() => void entregar()}
            disabled={faltan > 0 && segundos !== 0}
            cargando={entregando}
            textoCargando={t("exam.entregando")}
            className="mt-6 w-full"
          >
            {faltan > 0 ? t("exam.faltan", { n: faltan }) : t("exam.entregar")}
          </BotonPrimario>
        </>
      )}
    </section>
  );
}

export default function ExamPage() {
  return (
    <RutaProtegidaUS requiereCorreo>
      <ExamenContenido />
    </RutaProtegidaUS>
  );
}