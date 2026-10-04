"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import RutaProtegida from "@/components/auth/RutaProtegida";
import { useAuth } from "@/contexts/AuthContext";

type Pregunta = { texto: string; opciones: string[] };
type Resultado = {
  calificacion: number;
  aprobado: boolean;
  proximaSesionDisponibleEn: string | null;
  // NUEVO (04/10/2026): el servidor ahora valida el tiempo límite; viene
  // en true si la entrega llegó pasado el tiempo (nota 0).
  fueraDeTiempo?: boolean;
};
type PreguntaDetalle = {
  texto: string;
  opciones: string[];
  respuestaEstudiante: number | null;
  respuestaCorrectaIndex: number;
  acerto: boolean;
};

// Formatea una fecha futura como algo legible: "mañana a las 3:00 p.m."
// o, si es más de un día, la fecha completa.
function formatearDisponibleEn(fecha: Date): string {
  return fecha.toLocaleString("es-DO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
  });
}

function ExamenContenido() {
  const { token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const intentoId = params.intentoId as string;

  const [preguntas, setPreguntas] = useState<Pregunta[] | null>(null);
  const [respuestas, setRespuestas] = useState<(number | null)[]>([]);
  const [segundosRestantes, setSegundosRestantes] = useState<number | null>(
    null,
  );
  const [cargando, setCargando] = useState(true);
  const [entregando, setEntregando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [yaIniciado, setYaIniciado] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [detalle, setDetalle] = useState<PreguntaDetalle[] | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // NUEVO (04/10/2026):
  // - mensajeIniciado: texto que manda el servidor cuando el intento ya no
  //   se puede abrir (ya entregado, o el tiempo terminó mientras estaba
  //   fuera de la página).
  // - finRef: momento exacto (reloj del dispositivo) en que termina el
  //   examen. El contador se calcula contra esa hora en cada tick, en vez
  //   de restar 1 por segundo — si el celular se bloquea o la pestaña
  //   queda en segundo plano, al volver muestra el tiempo REAL que queda
  //   (el servidor ahora también valida el límite).
  // - respuestasRef: copia siempre actualizada de las respuestas, para que
  //   la entrega automática al llegar a 0 mande las respuestas marcadas
  //   (antes usaba las del momento en que arrancó el contador, es decir,
  //   todas vacías).
  const [mensajeIniciado, setMensajeIniciado] = useState<string | null>(null);
  const finRef = useRef<number | null>(null);
  const respuestasRef = useRef<(number | null)[]>([]);
  const entregandoRef = useRef(false);

  // Iniciar el examen al montar la página
  useEffect(() => {
    let cancelado = false;

    async function iniciar() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/intentos-examen/${intentoId}/iniciar`,
          { method: "POST", headers: { Authorization: `Bearer ${token}` } },
        );
        const json = await res.json();
        if (cancelado) return;

        if (json.success) {
          const vacias = new Array(json.data.preguntas.length).fill(null);
          respuestasRef.current = vacias;
          finRef.current = Date.now() + json.data.tiempoLimiteSegundos * 1000;
          setPreguntas(json.data.preguntas);
          setRespuestas(vacias);
          setSegundosRestantes(json.data.tiempoLimiteSegundos);
        } else if (res.status === 409) {
          // CAMBIO (04/10/2026): si recargó con tiempo disponible, el
          // servidor ahora REANUDA el examen (responde success, caso de
          // arriba). Un 409 solo llega si el intento ya fue entregado o su
          // tiempo ya terminó — se muestra el mensaje exacto del servidor.
          setMensajeIniciado(json.error || null);
          setYaIniciado(true);
        } else {
          setError(json.error || "No pudimos iniciar el examen.");
        }
      } catch {
        if (!cancelado) setError("No pudimos conectar con el servidor.");
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    if (token && intentoId) iniciar();

    return () => {
      cancelado = true;
    };
  }, [token, intentoId]);

  // Countdown del timer
  useEffect(() => {
    if (segundosRestantes === null || resultado) return;

    timerRef.current = setInterval(() => {
      if (finRef.current === null) return;
      const restante = Math.max(
        0,
        Math.ceil((finRef.current - Date.now()) / 1000),
      );
      setSegundosRestantes(restante);
      if (restante <= 0) {
        entregar(); // se acabó el tiempo: entrega automática
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segundosRestantes !== null]);

  function elegirRespuesta(indicePregunta: number, indiceOpcion: number) {
    const copia = [...respuestasRef.current];
    copia[indicePregunta] = indiceOpcion;
    respuestasRef.current = copia;
    setRespuestas(copia);
  }

  async function entregar() {
    if (timerRef.current) clearInterval(timerRef.current);
    // Evita doble entrega (clic + entrega automática a la vez).
    if (entregandoRef.current) return;
    entregandoRef.current = true;
    setEntregando(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/intentos-examen/${intentoId}/entregar`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ respuestas: respuestasRef.current }),
        },
      );
      const json = await res.json();

      if (json.success) {
        setResultado(json.data);

        // El detalle correcta/incorrecta es un endpoint aparte — si falla,
        // igual mostramos la calificación, solo sin el desglose verde/rojo.
        try {
          const resDetalle = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/intentos-examen/${intentoId}/detalle`,
            { headers: { Authorization: `Bearer ${token}` } },
          );
          const jsonDetalle = await resDetalle.json();
          if (jsonDetalle.success) setDetalle(jsonDetalle.data.preguntas);
        } catch {
          // silencioso: no es crítico para que la estudiante vea su nota
        }
      } else {
        setError(json.error || "No pudimos entregar el examen.");
      }
    } catch {
      setError("No pudimos conectar con el servidor.");
    } finally {
      entregandoRef.current = false;
      setEntregando(false);
    }
  }

  const minutos = segundosRestantes ? Math.floor(segundosRestantes / 60) : 0;
  const segundos = segundosRestantes ? segundosRestantes % 60 : 0;
  const todasRespondidas = respuestas.every((r) => r !== null);

  return (
    <main className="bg-neutral-bg min-h-screen px-6 py-16">
      <div className="max-w-2xl mx-auto">
        {cargando && (
          <p className="text-neutral-text text-sm">Preparando tu examen...</p>
        )}

        {!cargando && yaIniciado && (
          <div className="rounded-xl bg-white border border-neutral-bg p-8 text-center">
            {mensajeIniciado ? (
              <p className="text-neutral-text mb-6">{mensajeIniciado}</p>
            ) : (
              <>
                <p className="text-neutral-text mb-2">
                  Este examen ya fue iniciado antes y no se puede volver a
                  cargar desde aquí.
                </p>
                <p className="text-sm text-neutral-text mb-6">
                  Si se te fue el tiempo o cerraste la página por error,
                  contacta a tu coordinadora — ella puede ver el estado de tu
                  intento.
                </p>
              </>
            )}
            <Link
              href="/dashboard"
              className="text-brand-blue-light hover:underline text-sm"
            >
              Volver a mi panel
            </Link>
          </div>
        )}

        {!cargando && error && !resultado && (
          <div className="rounded-lg bg-brand-pink-light border border-brand-pink p-4 text-brand-blue text-sm mb-6">
            {error}
          </div>
        )}

        {!cargando && resultado && (
          <div className="rounded-xl bg-white border border-neutral-bg p-8 text-center">
            <p
              className={`font-display text-3xl font-bold mb-2 ${resultado.aprobado ? "text-status-success" : "text-brand-pink"
                }`}
            >
              {resultado.calificacion}%
            </p>
            {resultado.fueraDeTiempo && (
              <p className="text-sm text-neutral-text mb-2">
                Tu entrega llegó después de que terminara el tiempo del examen.
              </p>
            )}
            <p className="text-neutral-text mb-4">
              {resultado.aprobado
                ? "¡Aprobaste! Ya puedes ver tu progreso actualizado en tu panel."
                : "No alcanzaste el 70% necesario. Habla con tu coordinadora sobre tu próximo intento."}
            </p>

            {resultado.aprobado && resultado.proximaSesionDisponibleEn && (
              <div className="rounded-lg bg-brand-pink-light border border-brand-pink/30 p-4 text-sm text-brand-blue mb-6">
                Ya puedes empezar a estudiar la siguiente sesión ahora mismo.
                Su examen se habilitará el{" "}
                <strong>
                  {formatearDisponibleEn(
                    new Date(resultado.proximaSesionDisponibleEn),
                  )}
                </strong>{" "}
                — 24 horas después de este resultado.
              </div>
            )}

            {detalle && (
              <div className="grid gap-4 mb-6 text-left">
                {detalle.map((p, i) => (
                  <div
                    key={i}
                    className={`rounded-xl border p-4 ${p.acerto
                      ? "border-status-success bg-status-success/5"
                      : "border-brand-pink bg-brand-pink-light"
                      }`}
                  >
                    <p className="font-medium text-neutral-text mb-2">
                      {i + 1}. {p.texto}
                    </p>
                    <div className="grid gap-1.5">
                      {p.opciones.map((opcion, j) => {
                        const esCorrecta = j === p.respuestaCorrectaIndex;
                        const esLaQueMarcoLaEstudiante =
                          j === p.respuestaEstudiante;
                        return (
                          <div
                            key={j}
                            className={`text-sm rounded-lg px-3 py-2 ${esCorrecta
                              ? "bg-status-success text-white font-medium"
                              : esLaQueMarcoLaEstudiante
                                ? "bg-brand-pink text-white"
                                : "bg-white text-neutral-text"
                              }`}
                          >
                            {opcion}
                            {esCorrecta && " ✓"}
                            {!esCorrecta && esLaQueMarcoLaEstudiante && " ✗"}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Link
              href="/dashboard"
              className="inline-block rounded-xl bg-brand-blue text-white px-6 py-3 font-display font-semibold hover:opacity-90 transition-opacity"
            >
              Volver a mi panel
            </Link>
          </div>
        )}

        {!cargando && preguntas && !resultado && (
          <>
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-neutral-bg py-2">
              <h1 className="font-display text-xl font-bold text-brand-blue">
                Examen
              </h1>
              {segundosRestantes !== null && (
                <span
                  className={`font-display font-semibold px-3 py-1 rounded-full text-sm ${segundosRestantes < 300
                    ? "bg-brand-pink text-white"
                    : "bg-white border border-neutral-bg text-brand-blue"
                    }`}
                >
                  {minutos}:{segundos.toString().padStart(2, "0")}
                </span>
              )}
            </div>

            <div className="grid gap-4 mb-6">
              {preguntas.map((pregunta, i) => (
                <div
                  key={i}
                  className="rounded-xl bg-white border border-neutral-bg p-5"
                >
                  <p className="font-medium text-neutral-text mb-3">
                    {i + 1}. {pregunta.texto}
                  </p>
                  <div className="grid gap-2">
                    {pregunta.opciones.map((opcion, j) => (
                      <label
                        key={j}
                        className={`flex items-center gap-2 rounded-lg border p-3 cursor-pointer text-sm transition-colors ${respuestas[i] === j
                          ? "border-brand-pink bg-brand-pink-light"
                          : "border-neutral-bg hover:border-brand-blue-light"
                          }`}
                      >
                        <input
                          type="radio"
                          name={`pregunta-${i}`}
                          checked={respuestas[i] === j}
                          onChange={() => elegirRespuesta(i, j)}
                          className="accent-brand-pink"
                        />
                        {opcion}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={entregar}
              disabled={
                (!todasRespondidas && segundosRestantes !== 0) || entregando
              }
              className="w-full rounded-xl bg-brand-blue text-white p-4 font-display font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {entregando
                ? "Entregando..."
                : todasRespondidas
                  ? "Entregar examen"
                  : `Responde las ${respuestas.filter((r) => r === null).length} preguntas que faltan`}
            </button>
          </>
        )}
      </div>
    </main>
  );
}

export default function ExamenPage() {
  return (
    <RutaProtegida rolesPermitidos={["estudiante"]}>
      <ExamenContenido />
    </RutaProtegida>
  );
}