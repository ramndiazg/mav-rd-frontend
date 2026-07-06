"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

type Faq = {
  _id: string;
  pregunta: string;
  respuesta: string;
  orden: number;
  activo: boolean;
};

function formularioVacio() {
  return { pregunta: "", respuesta: "", orden: 0 };
}

export default function PanelFaqPage() {
  const { token } = useAuth();

  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [cargando, setCargando] = useState(true);
  const [editandoId, setEditandoId] = useState<string | "nueva" | null>(null);
  const [form, setForm] = useState(formularioVacio());
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelado = false;

    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/faqs/admin`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!cancelado && json.success) setFaqs(json.data);
      } catch {
        if (!cancelado) setMensaje({ tipo: "error", texto: "No pudimos cargar las FAQ." });
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [token]);

  async function recargar() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/faqs/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setFaqs(json.data);
    } catch {
      // silencioso
    }
  }

  function abrirNueva() {
    setForm(formularioVacio());
    setEditandoId("nueva");
    setMensaje(null);
  }

  function abrirEdicion(f: Faq) {
    setForm({ pregunta: f.pregunta, respuesta: f.respuesta, orden: f.orden });
    setEditandoId(f._id);
    setMensaje(null);
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setMensaje(null);
    try {
      const esNueva = editandoId === "nueva";
      const url = esNueva
        ? `${process.env.NEXT_PUBLIC_API_URL}/faqs`
        : `${process.env.NEXT_PUBLIC_API_URL}/faqs/${editandoId}`;
      const res = await fetch(url, {
        method: esNueva ? "POST" : "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        setMensaje({ tipo: "ok", texto: esNueva ? "Pregunta creada." : "Pregunta actualizada." });
        setEditandoId(null);
        recargar();
      } else {
        setMensaje({ tipo: "error", texto: json.error || "No se pudo guardar." });
      }
    } catch {
      setMensaje({ tipo: "error", texto: "No pudimos conectar con el servidor." });
    } finally {
      setGuardando(false);
    }
  }

  async function alternarActivo(f: Faq) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/faqs/${f._id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !f.activo }),
      });
      const json = await res.json();
      if (json.success) {
        recargar();
      } else {
        setMensaje({ tipo: "error", texto: json.error || "No se pudo actualizar." });
      }
    } catch {
      setMensaje({ tipo: "error", texto: "No pudimos conectar con el servidor." });
    }
  }

  async function eliminar(f: Faq) {
    if (!confirm(`¿Eliminar la pregunta "${f.pregunta}"?`)) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/faqs/${f._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setMensaje({ tipo: "ok", texto: "Pregunta eliminada." });
        recargar();
      } else {
        setMensaje({ tipo: "error", texto: json.error || "No se pudo eliminar." });
      }
    } catch {
      setMensaje({ tipo: "error", texto: "No pudimos conectar con el servidor." });
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="font-display text-2xl font-bold text-brand-blue mb-1">
        Preguntas frecuentes
      </h2>
      <p className="text-sm text-neutral-text mb-6">
        Las Activas se muestran en la página pública de FAQ, ordenadas por
        el número de orden (menor = primero).
      </p>

      {!editandoId && (
        <>
          <button
            onClick={abrirNueva}
            className="mb-6 rounded-lg bg-brand-pink text-white text-sm px-4 py-2 font-medium hover:opacity-90"
          >
            + Nueva pregunta
          </button>

          {cargando && <p className="text-sm text-neutral-text">Cargando...</p>}

          <div className="grid gap-3">
            {faqs.map((f) => (
              <div key={f._id} className="rounded-lg bg-white border border-neutral-bg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-brand-blue text-sm">
                      {f.pregunta}{" "}
                      <span className="text-xs text-neutral-text">(orden: {f.orden})</span>
                    </p>
                    <p className="text-sm text-neutral-text mt-1">{f.respuesta}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full shrink-0 ml-3 ${f.activo ? "bg-status-success text-white" : "bg-neutral-bg text-neutral-text"
                      }`}
                  >
                    {f.activo ? "Activa" : "Inactiva"}
                  </span>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => abrirEdicion(f)}
                    className="text-xs font-medium px-3 py-1.5 rounded-full bg-brand-blueLight text-white hover:opacity-90"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => alternarActivo(f)}
                    className="text-xs font-medium px-3 py-1.5 rounded-full bg-white border border-neutral-bg text-neutral-text hover:bg-neutral-bg"
                  >
                    {f.activo ? "Desactivar" : "Activar"}
                  </button>
                  <button
                    onClick={() => eliminar(f)}
                    className="text-xs font-medium px-3 py-1.5 rounded-full bg-white border border-brand-pink text-brand-pink hover:bg-brand-pinkLight"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {editandoId && (
        <form onSubmit={guardar} className="grid gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold text-brand-blue">
              {editandoId === "nueva" ? "Nueva pregunta" : "Editar pregunta"}
            </h3>
            <button type="button" onClick={() => setEditandoId(null)} className="text-xs text-brand-blueLight hover:underline">
              Cancelar
            </button>
          </div>

          <label className="text-sm text-neutral-text">
            Pregunta
            <input
              type="text"
              required
              value={form.pregunta}
              onChange={(e) => setForm((prev) => ({ ...prev, pregunta: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
            />
          </label>

          <label className="text-sm text-neutral-text">
            Respuesta
            <textarea
              required
              rows={4}
              value={form.respuesta}
              onChange={(e) => setForm((prev) => ({ ...prev, respuesta: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
            />
          </label>

          <label className="text-sm text-neutral-text">
            Orden
            <input
              type="number"
              value={form.orden}
              onChange={(e) => setForm((prev) => ({ ...prev, orden: Number(e.target.value) }))}
              className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
            />
          </label>

          <button
            type="submit"
            disabled={guardando}
            className="rounded-xl bg-brand-blue text-white p-4 font-display font-semibold hover:opacity-90 disabled:opacity-60"
          >
            {guardando ? "Guardando..." : "Guardar"}
          </button>
        </form>
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