"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import RutaProtegida from "@/components/auth/RutaProtegida";
import { useAuth } from "@/contexts/AuthContext";

type Pregunta = { texto: string; opciones: string[] };
type Resultado = { calificacion: number; aprobado: boolean };

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
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
          setPreguntas(json.data.preguntas);
          setRespuestas(new Array(json.data.preguntas.length).fill(null));
          setSegundosRestantes(json.data.tiempoLimiteSegundos);
        } else if (res.status === 409) {
          // Ya se había iniciado antes (ej. recargó la página). El backend
          // no tiene endpoint para volver a pedir las preguntas de un intento
          // ya iniciado, así que no podemos recuperar el examen desde aquí.
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
      setSegundosRestantes((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          entregar(); // se acabó el tiempo: entrega automática
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segundosRestantes !== null]);

  function elegirRespuesta(indicePregunta: number, indiceOpcion: number) {
    setRespuestas((prev) => {
      const copia = [...prev];
      copia[indicePregunta] = indiceOpcion;
      return copia;
    });
  }

  async function entregar() {
    if (timerRef.current) clearInterval(timerRef.current);
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
          body: JSON.stringify({ respuestas }),
        },
      );
      const json = await res.json();

      if (json.success) {
        setResultado(json.data);
      } else {
        setError(json.error || "No pudimos entregar el examen.");
      }
    } catch {
      setError("No pudimos conectar con el servidor.");
    } finally {
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
            <p className="text-neutral-text mb-2">
              Este examen ya fue iniciado antes y no se puede volver a
              cargar desde aquí.
            </p>
            <p className="text-sm text-neutral-text mb-6">
              Si se te fue el tiempo o cerraste la página por error, contacta
              a tu coordinadora — ella puede ver el estado de tu intento.
            </p>
            <Link
              href="/dashboard"
              className="text-brand-blueLight hover:underline text-sm"
            >
              Volver a mi panel
            </Link>
          </div>
        )}

        {!cargando && error && !resultado && (
          <div className="rounded-lg bg-brand-pinkLight border border-brand-pink p-4 text-brand-blue text-sm mb-6">
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
            <p className="text-neutral-text mb-6">
              {resultado.aprobado
                ? "¡Aprobaste! Ya puedes ver tu progreso actualizado en tu panel."
                : "No alcanzaste el 70% necesario. Habla con tu coordinadora sobre tu próximo intento."}
            </p>
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
                          ? "border-brand-pink bg-brand-pinkLight"
                          : "border-neutral-bg hover:border-brand-blueLight"
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
              disabled={!todasRespondidas || entregando}
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