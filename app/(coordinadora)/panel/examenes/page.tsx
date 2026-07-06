"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

type Sesion = { _id: string; numero: number; titulo: string };

type Pregunta = {
  texto: string;
  opciones: string[];
  respuestaCorrectaIndex: number;
};

type Examen = {
  _id: string;
  sesionId: string;
  nombreVersion: string;
  preguntas: Pregunta[];
  activo: boolean;
};

function preguntaVacia(): Pregunta {
  return { texto: "", opciones: ["", "", "", ""], respuestaCorrectaIndex: 0 };
}

function formularioVacio() {
  return {
    nombreVersion: "",
    preguntas: Array.from({ length: 10 }, preguntaVacia),
  };
}

export default function PanelExamenesPage() {
  const { token, usuario } = useAuth();
  const esAdmin = usuario?.rol === "admin";

  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [sesionId, setSesionId] = useState<string | null>(null);

  const [versiones, setVersiones] = useState<Examen[]>([]);
  const [cargandoVersiones, setCargandoVersiones] = useState(true);

  const [editandoId, setEditandoId] = useState<string | "nueva" | null>(null);
  const [form, setForm] = useState(formularioVacio());
  const [guardando, setGuardando] = useState(false);

  const [mensaje, setMensaje] = useState<{
    tipo: "ok" | "error";
    texto: string;
  } | null>(null);

  // Cargar sesiones una vez, y seleccionar la primera por defecto
  useEffect(() => {
    if (!token) return;
    let cancelado = false;

    (async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/sesiones`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const json = await res.json();
        if (!cancelado && json.success) {
          setSesiones(json.data);
          if (json.data.length > 0) setSesionId(json.data[0]._id);
        }
      } catch {
        if (!cancelado) {
          setMensaje({ tipo: "error", texto: "No pudimos cargar las sesiones." });
        }
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [token]);

  // Cargar versiones de examen cada vez que cambia la sesión seleccionada
  useEffect(() => {
    if (!token || !sesionId) return;
    let cancelado = false;

    (async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/examenes/sesion/${sesionId}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const json = await res.json();
        if (!cancelado && json.success) setVersiones(json.data);
      } catch {
        if (!cancelado) {
          setMensaje({ tipo: "error", texto: "No pudimos cargar las versiones." });
        }
      } finally {
        if (!cancelado) setCargandoVersiones(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [token, sesionId]);

  async function recargarVersiones() {
    if (!sesionId) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/examenes/sesion/${sesionId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const json = await res.json();
      if (json.success) setVersiones(json.data);
    } catch {
      // silencioso: si falla, el usuario puede recargar la página
    }
  }

  function abrirNueva() {
    setForm(formularioVacio());
    setEditandoId("nueva");
    setMensaje(null);
  }

  function abrirEdicion(examen: Examen) {
    setForm({
      nombreVersion: examen.nombreVersion,
      preguntas: examen.preguntas.map((p) => ({ ...p, opciones: [...p.opciones] })),
    });
    setEditandoId(examen._id);
    setMensaje(null);
  }

  function actualizarPregunta(indice: number, campo: keyof Pregunta, valor: unknown) {
    setForm((prev) => {
      const preguntas = [...prev.preguntas];
      preguntas[indice] = { ...preguntas[indice], [campo]: valor };
      return { ...prev, preguntas };
    });
  }

  function actualizarOpcion(indicePregunta: number, indiceOpcion: number, valor: string) {
    setForm((prev) => {
      const preguntas = [...prev.preguntas];
      const opciones = [...preguntas[indicePregunta].opciones];
      opciones[indiceOpcion] = valor;
      preguntas[indicePregunta] = { ...preguntas[indicePregunta], opciones };
      return { ...prev, preguntas };
    });
  }

  function formularioValido() {
    if (!form.nombreVersion.trim()) return false;
    return form.preguntas.every(
      (p) => p.texto.trim() && p.opciones.every((o) => o.trim()),
    );
  }

  async function guardar() {
    if (!sesionId || !formularioValido()) {
      setMensaje({
        tipo: "error",
        texto: "Completa el nombre de la versión y las 10 preguntas con sus 4 opciones antes de guardar.",
      });
      return;
    }

    setGuardando(true);
    setMensaje(null);

    try {
      const esNueva = editandoId === "nueva";
      const url = esNueva
        ? `${process.env.NEXT_PUBLIC_API_URL}/examenes`
        : `${process.env.NEXT_PUBLIC_API_URL}/examenes/${editandoId}`;
      const method = esNueva ? "POST" : "PATCH";
      const body = esNueva
        ? { sesionId, nombreVersion: form.nombreVersion, preguntas: form.preguntas }
        : { nombreVersion: form.nombreVersion, preguntas: form.preguntas };

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (json.success) {
        setMensaje({
          tipo: "ok",
          texto: esNueva ? "Versión creada." : "Versión actualizada.",
        });
        setEditandoId(null);
        recargarVersiones();
      } else {
        setMensaje({ tipo: "error", texto: json.error || "No se pudo guardar." });
      }
    } catch {
      setMensaje({ tipo: "error", texto: "No pudimos conectar con el servidor." });
    } finally {
      setGuardando(false);
    }
  }

  async function desactivar(examen: Examen) {
    if (!confirm(`¿Desactivar "${examen.nombreVersion}"? Ya no se asignará al azar, pero los intentos pasados que la usaron no se ven afectados.`)) {
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/examenes/${examen._id}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
      );
      const json = await res.json();

      if (json.success) {
        setMensaje({ tipo: "ok", texto: "Versión desactivada." });
        recargarVersiones();
      } else {
        setMensaje({ tipo: "error", texto: json.error || "No se pudo desactivar." });
      }
    } catch {
      setMensaje({ tipo: "error", texto: "No pudimos conectar con el servidor." });
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="font-display text-2xl font-bold text-brand-blue mb-1">
        Banco de exámenes
      </h2>
      <p className="text-sm text-neutral-text mb-6">
        Cada sesión puede tener varias versiones de examen — el sistema asigna
        una al azar cuando se desbloquea. Edítalas aquí si cambia la Ley 63-17.
      </p>

      {/* Selector de sesión */}
      <div className="flex gap-2 mb-6">
        {sesiones.map((s) => (
          <button
            key={s._id}
            onClick={() => {
              setCargandoVersiones(true);
              setSesionId(s._id);
              setEditandoId(null);
            }}
            className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${sesionId === s._id
              ? "bg-brand-blue text-white"
              : "bg-white border border-neutral-bg text-neutral-text"
              }`}
          >
            Sesión {s.numero}
          </button>
        ))}
      </div>

      {!editandoId && (
        <>
          <button
            onClick={abrirNueva}
            className="mb-4 rounded-lg bg-brand-pink text-white text-sm px-4 py-2 font-medium hover:opacity-90"
          >
            + Nueva versión
          </button>

          {cargandoVersiones && (
            <p className="text-sm text-neutral-text">Cargando versiones...</p>
          )}

          {!cargandoVersiones && versiones.length === 0 && (
            <p className="text-sm text-neutral-text">
              No hay versiones activas para esta sesión todavía.
            </p>
          )}

          <div className="grid gap-3">
            {versiones.map((v) => (
              <div
                key={v._id}
                className="flex items-center justify-between rounded-lg bg-white border border-neutral-bg p-4"
              >
                <div>
                  <p className="font-medium text-brand-blue text-sm">
                    {v.nombreVersion}
                  </p>
                  <p className="text-xs text-neutral-text">
                    {v.preguntas.length} preguntas
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => abrirEdicion(v)}
                    className="text-xs font-medium px-3 py-1.5 rounded-full bg-brand-blueLight text-white hover:opacity-90"
                  >
                    Editar
                  </button>
                  {esAdmin && (
                    <button
                      onClick={() => desactivar(v)}
                      className="text-xs font-medium px-3 py-1.5 rounded-full bg-white border border-brand-pink text-brand-pink hover:bg-brand-pinkLight"
                    >
                      Desactivar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {editandoId && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-brand-blue">
              {editandoId === "nueva" ? "Nueva versión" : "Editar versión"}
            </h3>
            <button
              onClick={() => setEditandoId(null)}
              className="text-xs text-brand-blueLight hover:underline"
            >
              Cancelar
            </button>
          </div>

          <label className="block text-sm text-neutral-text mb-6">
            Nombre de la versión
            <input
              type="text"
              value={form.nombreVersion}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, nombreVersion: e.target.value }))
              }
              placeholder='Ej: "Versión A"'
              className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
            />
          </label>

          <div className="grid gap-6 mb-6">
            {form.preguntas.map((pregunta, i) => (
              <div
                key={i}
                className="rounded-xl bg-white border border-neutral-bg p-5"
              >
                <label className="block text-sm font-medium text-neutral-text mb-3">
                  Pregunta {i + 1}
                  <input
                    type="text"
                    value={pregunta.texto}
                    onChange={(e) => actualizarPregunta(i, "texto", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm font-normal"
                  />
                </label>

                <div className="grid gap-2">
                  {pregunta.opciones.map((opcion, j) => (
                    <div key={j} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correcta-${i}`}
                        checked={pregunta.respuestaCorrectaIndex === j}
                        onChange={() =>
                          actualizarPregunta(i, "respuestaCorrectaIndex", j)
                        }
                        className="accent-status-success"
                        title="Marcar como respuesta correcta"
                      />
                      <input
                        type="text"
                        value={opcion}
                        onChange={(e) => actualizarOpcion(i, j, e.target.value)}
                        placeholder={`Opción ${j + 1}`}
                        className={`flex-1 rounded-lg border px-3 py-2 text-sm ${pregunta.respuestaCorrectaIndex === j
                          ? "border-status-success bg-status-success/5"
                          : "border-neutral-bg"
                          }`}
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-neutral-text mt-2">
                  Marca el círculo junto a la opción correcta.
                </p>
              </div>
            ))}
          </div>

          <button
            onClick={guardar}
            disabled={guardando}
            className="w-full rounded-xl bg-brand-blue text-white p-4 font-display font-semibold hover:opacity-90 disabled:opacity-60"
          >
            {guardando ? "Guardando..." : "Guardar versión"}
          </button>
        </div>
      )}

      {mensaje && (
        <div
          className={`mt-6 rounded-lg p-4 text-sm ${mensaje.tipo === "ok"
            ? "bg-status-success/10 border border-status-success text-status-success"
            : "bg-brand-pinkLight border border-brand-pink text-brand-blue"
            }`}
        >
          {mensaje.texto}
        </div>
      )}
    </div>
  );
}