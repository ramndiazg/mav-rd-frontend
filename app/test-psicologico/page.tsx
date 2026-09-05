"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RutaProtegida from "@/components/auth/RutaProtegida";
import { useAuth } from "@/contexts/AuthContext";
import {
  ESCALA_LIKERT,
  SECCIONES,
  PREGUNTAS_REFLEXION,
  TEXTO_CONSENTIMIENTO,
} from "@/lib/bancoPreguntasTest";

function TestPsicologicoContenido() {
  const { token } = useAuth();
  const router = useRouter();

  const [cargandoEstado, setCargandoEstado] = useState(true);
  const [yaCompletado, setYaCompletado] = useState(false);
  const [aceptoConsentimiento, setAceptoConsentimiento] = useState(false);

  const [respuestas, setRespuestas] = useState<(number | null)[]>(
    Array(54).fill(null),
  );
  const [reflexiones, setReflexiones] = useState<string[]>(Array(5).fill(""));
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Al entrar, confirmamos si ya lo completó antes — no se puede volver
  // a llenar (una sola vez, igual que un diploma).
  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/test-psicologico/mi-respuesta`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const json = await res.json();
        if (!cancelado && json.success) {
          setYaCompletado(json.completado);
        }
      } catch {
        // si falla la verificación, dejamos que intente llenar el
        // formulario igual — el backend rechaza duplicados de todas formas
      } finally {
        if (!cancelado) setCargandoEstado(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [token]);

  function responderPregunta(indice: number, valor: number) {
    setRespuestas((prev) => {
      const copia = [...prev];
      copia[indice] = valor;
      return copia;
    });
  }

  function responderReflexion(indice: number, texto: string) {
    setReflexiones((prev) => {
      const copia = [...prev];
      copia[indice] = texto;
      return copia;
    });
  }

  const faltanPreguntas = respuestas.some((r) => r === null);

  async function enviar() {
    if (faltanPreguntas) {
      setError("Responde todas las preguntas de escala antes de enviar.");
      return;
    }

    setEnviando(true);
    setError(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/test-psicologico/mi-respuesta`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ respuestas, reflexiones }),
        },
      );
      const json = await res.json();

      if (json.success) {
        router.push("/dashboard");
      } else {
        setError(json.error || "No se pudo enviar el cuestionario.");
      }
    } catch {
      setError("No pudimos conectar con el servidor. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  if (cargandoEstado) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-neutral-bg">
        <p className="text-neutral-text text-sm">Cargando...</p>
      </main>
    );
  }

  if (yaCompletado) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-neutral-bg px-6">
        <div className="max-w-md rounded-xl bg-white border border-neutral-bg p-8 text-center">
          <p className="font-display font-semibold text-brand-blue text-lg mb-2">
            Ya completaste este cuestionario
          </p>
          <p className="text-sm text-neutral-text mb-6">
            Gracias por responder. Puedes continuar con tu curso.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-full bg-brand-pink text-white px-6 py-3 font-medium hover:opacity-90"
          >
            Ir a mi panel
          </button>
        </div>
      </main>
    );
  }

  if (!aceptoConsentimiento) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-neutral-bg px-6 py-16">
        <div className="max-w-lg rounded-xl bg-white border border-neutral-bg p-8">
          <h1 className="font-display text-xl font-bold text-brand-blue mb-4">
            Antes de empezar
          </h1>
          <p className="text-sm text-neutral-text mb-6 leading-relaxed">
            {TEXTO_CONSENTIMIENTO}
          </p>
          <label className="flex items-start gap-2 text-sm text-neutral-text mb-6">
            <input
              type="checkbox"
              onChange={(e) => setAceptoConsentimiento(e.target.checked)}
              className="mt-1"
            />
            Entiendo y deseo continuar.
          </label>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-neutral-bg min-h-screen px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="font-display text-2xl font-bold text-brand-blue">
            Cuestionario de perfil conductual
          </h1>
          <p className="text-sm text-neutral-text mt-1">
            Responde con sinceridad. Esto solo se pide una vez.
          </p>
        </div>

        {SECCIONES.map((seccion, indiceSeccion) => {
          // Offset acumulado de preguntas de secciones anteriores, para
          // saber la posición real en el array plano de 54.
          const offset = SECCIONES.slice(0, indiceSeccion).reduce(
            (acc, s) => acc + s.preguntas.length,
            0,
          );

          return (
            <div
              key={seccion.clave}
              className="rounded-xl bg-white border border-neutral-bg p-6 mb-4"
            >
              <p className="font-display font-semibold text-brand-blue mb-4">
                {seccion.clave}. {seccion.titulo}
              </p>
              <div className="flex flex-col gap-5">
                {seccion.preguntas.map((texto, i) => {
                  const indiceGlobal = offset + i;
                  return (
                    <div key={indiceGlobal}>
                      <p className="text-sm text-neutral-text mb-2">{texto}</p>
                      <div className="flex flex-wrap gap-2">
                        {ESCALA_LIKERT.map((op) => (
                          <button
                            key={op.valor}
                            type="button"
                            onClick={() => responderPregunta(indiceGlobal, op.valor)}
                            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${respuestas[indiceGlobal] === op.valor
                              ? "bg-brand-blue text-white border-brand-blue"
                              : "bg-white text-neutral-text border-neutral-bg hover:border-brand-blue/40"
                              }`}
                          >
                            {op.etiqueta}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="rounded-xl bg-white border border-neutral-bg p-6 mb-4">
          <p className="font-display font-semibold text-brand-blue mb-4">
            H. Preguntas de reflexión (opcionales)
          </p>
          <div className="flex flex-col gap-4">
            {PREGUNTAS_REFLEXION.map((pregunta, i) => (
              <div key={i}>
                <p className="text-sm text-neutral-text mb-2">{pregunta}</p>
                <textarea
                  value={reflexiones[i]}
                  onChange={(e) => responderReflexion(i, e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
                />
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-brand-pinkLight border border-brand-pink p-3 text-sm text-brand-blue mb-4">
            {error}
          </div>
        )}

        <button
          onClick={enviar}
          disabled={enviando || faltanPreguntas}
          className="w-full rounded-full bg-brand-pink text-white py-3 font-medium hover:opacity-90 disabled:opacity-60"
        >
          {enviando ? "Enviando..." : "Enviar cuestionario"}
        </button>
      </div>
    </main>
  );
}

export default function TestPsicologicoPage() {
  return (
    <RutaProtegida rolesPermitidos={["estudiante"]}>
      <TestPsicologicoContenido />
    </RutaProtegida>
  );
}