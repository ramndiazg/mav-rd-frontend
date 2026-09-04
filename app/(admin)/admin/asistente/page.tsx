"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

type Mensaje = {
  id: string;
  rol: "usuario" | "asistente";
  texto: string;
  esError?: boolean;
};

// Preguntas de ejemplo para que María no tenga que pensar qué escribir
// la primera vez — cubren las 7 herramientas disponibles.
const PREGUNTAS_SUGERIDAS = [
  "¿Cuántos vouchers están pendientes de verificar?",
  "¿Cómo va el balance de este mes?",
  "¿Cuántas estudiantes activas hay en total?",
  "¿Hubo solicitudes de Empresas esta semana?",
];

function idUnico() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function AsistentePage() {
  const { token } = useAuth();

  const [mensajes, setMensajes] = useState<Mensaje[]>([
    {
      id: idUnico(),
      rol: "asistente",
      texto:
        "Hola, María. Puedo responder preguntas sobre inscripciones, pagos, estudiantes, balance contable, solicitudes de Empresas y resultados de exámenes. ¿Qué quieres saber?",
    },
  ]);
  const [pregunta, setPregunta] = useState("");
  const [enviando, setEnviando] = useState(false);

  const finRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  async function enviarPregunta(texto: string) {
    const preguntaLimpia = texto.trim();
    if (!preguntaLimpia || enviando) return;

    setMensajes((prev) => [
      ...prev,
      { id: idUnico(), rol: "usuario", texto: preguntaLimpia },
    ]);
    setPregunta("");
    setEnviando(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chatbot/preguntar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pregunta: preguntaLimpia }),
      });
      const json = await res.json();

      if (json.success) {
        setMensajes((prev) => [
          ...prev,
          { id: idUnico(), rol: "asistente", texto: json.respuesta },
        ]);
      } else {
        setMensajes((prev) => [
          ...prev,
          {
            id: idUnico(),
            rol: "asistente",
            texto: json.error || "No pude procesar la pregunta.",
            esError: true,
          },
        ]);
      }
    } catch {
      setMensajes((prev) => [
        ...prev,
        {
          id: idUnico(),
          rol: "asistente",
          texto: "No pude conectar con el servidor. Intenta de nuevo en un momento.",
          esError: true,
        },
      ]);
    } finally {
      setEnviando(false);
    }
  }

  function alEnviarFormulario(e: React.FormEvent) {
    e.preventDefault();
    enviarPregunta(pregunta);
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="font-display text-2xl font-bold text-brand-blue mb-1">
        Asistente
      </h2>
      <p className="text-sm text-neutral-text mb-6">
        Consulta inscripciones, pagos, estudiantes, balance contable,
        solicitudes de Empresas y resultados de exámenes.
      </p>

      <div className="rounded-xl bg-white border border-neutral-bg p-4 mb-4 h-[60vh] overflow-y-auto flex flex-col gap-3">
        {mensajes.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.rol === "usuario" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 text-sm whitespace-pre-wrap ${m.rol === "usuario"
                ? "bg-brand-blue text-white"
                : m.esError
                  ? "bg-brand-pinkLight border border-brand-pink text-brand-blue"
                  : "bg-neutral-bg text-neutral-text"
                }`}
            >
              {m.texto}
            </div>
          </div>
        ))}

        {enviando && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg p-3 text-sm bg-neutral-bg text-neutral-text">
              Pensando...
            </div>
          </div>
        )}

        <div ref={finRef} />
      </div>

      {mensajes.length <= 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {PREGUNTAS_SUGERIDAS.map((sugerida) => (
            <button
              key={sugerida}
              type="button"
              onClick={() => enviarPregunta(sugerida)}
              disabled={enviando}
              className="rounded-lg border border-brand-blue/20 text-brand-blueLight text-xs px-3 py-1.5 hover:bg-brand-blue/5 disabled:opacity-60"
            >
              {sugerida}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={alEnviarFormulario} className="flex gap-2">
        <input
          type="text"
          value={pregunta}
          onChange={(e) => setPregunta(e.target.value)}
          placeholder="Escribe tu pregunta..."
          disabled={enviando}
          className="flex-1 rounded-lg border border-neutral-bg px-3 py-2 text-sm disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={enviando || !pregunta.trim()}
          className="rounded-lg bg-brand-pink text-white text-sm px-4 py-2 font-medium hover:opacity-90 disabled:opacity-60"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}