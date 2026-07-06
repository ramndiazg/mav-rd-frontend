"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

type Testimonio = {
  _id: string;
  nombre: string;
  texto: string;
  fotoUrl?: string;
  orden: number;
  activo: boolean;
};

function formularioVacio() {
  return { nombre: "", texto: "", fotoUrl: "", orden: 0 };
}

export default function PanelTestimoniosPage() {
  const { token } = useAuth();

  const [testimonios, setTestimonios] = useState<Testimonio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [editandoId, setEditandoId] = useState<string | "nueva" | null>(null);
  const [form, setForm] = useState(formularioVacio());
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelado = false;

    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/testimonios/admin`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!cancelado && json.success) setTestimonios(json.data);
      } catch {
        if (!cancelado) setMensaje({ tipo: "error", texto: "No pudimos cargar los testimonios." });
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/testimonios/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setTestimonios(json.data);
    } catch {
      // silencioso
    }
  }

  function abrirNuevo() {
    setForm(formularioVacio());
    setEditandoId("nueva");
    setMensaje(null);
  }

  function abrirEdicion(t: Testimonio) {
    setForm({ nombre: t.nombre, texto: t.texto, fotoUrl: t.fotoUrl || "", orden: t.orden });
    setEditandoId(t._id);
    setMensaje(null);
  }

  async function subirFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setSubiendoFoto(true);
    try {
      const datosForm = new FormData();
      datosForm.append("imagen", archivo);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/uploads/imagen`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: datosForm,
      });
      const json = await res.json();
      if (json.success) {
        setForm((prev) => ({ ...prev, fotoUrl: json.data.url }));
      } else {
        setMensaje({ tipo: "error", texto: json.error || "No se pudo subir la foto." });
      }
    } catch {
      setMensaje({ tipo: "error", texto: "No pudimos conectar con el servidor." });
    } finally {
      setSubiendoFoto(false);
    }
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setMensaje(null);
    try {
      const esNuevo = editandoId === "nueva";
      const url = esNuevo
        ? `${process.env.NEXT_PUBLIC_API_URL}/testimonios`
        : `${process.env.NEXT_PUBLIC_API_URL}/testimonios/${editandoId}`;
      const res = await fetch(url, {
        method: esNuevo ? "POST" : "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        setMensaje({ tipo: "ok", texto: esNuevo ? "Testimonio creado." : "Testimonio actualizado." });
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

  async function alternarActivo(t: Testimonio) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/testimonios/${t._id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !t.activo }),
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

  async function eliminar(t: Testimonio) {
    if (!confirm(`¿Eliminar el testimonio de "${t.nombre}"?`)) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/testimonios/${t._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setMensaje({ tipo: "ok", texto: "Testimonio eliminado." });
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
      <h2 className="font-display text-2xl font-bold text-brand-blue mb-1">Testimonios</h2>
      <p className="text-sm text-neutral-text mb-6">
        Los que estén Activos se muestran en la página pública. El número de
        orden controla en qué posición aparecen (menor número = primero).
      </p>

      {!editandoId && (
        <>
          <button
            onClick={abrirNuevo}
            className="mb-6 rounded-lg bg-brand-pink text-white text-sm px-4 py-2 font-medium hover:opacity-90"
          >
            + Nuevo testimonio
          </button>

          {cargando && <p className="text-sm text-neutral-text">Cargando...</p>}

          <div className="grid gap-3">
            {testimonios.map((t) => (
              <div key={t._id} className="rounded-lg bg-white border border-neutral-bg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-brand-blue text-sm">
                      {t.nombre}{" "}
                      <span className="text-xs text-neutral-text">(orden: {t.orden})</span>
                    </p>
                    <p className="text-sm text-neutral-text mt-1">{t.texto}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full shrink-0 ml-3 ${t.activo ? "bg-status-success text-white" : "bg-neutral-bg text-neutral-text"
                      }`}
                  >
                    {t.activo ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => abrirEdicion(t)}
                    className="text-xs font-medium px-3 py-1.5 rounded-full bg-brand-blueLight text-white hover:opacity-90"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => alternarActivo(t)}
                    className="text-xs font-medium px-3 py-1.5 rounded-full bg-white border border-neutral-bg text-neutral-text hover:bg-neutral-bg"
                  >
                    {t.activo ? "Desactivar" : "Activar"}
                  </button>
                  <button
                    onClick={() => eliminar(t)}
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
              {editandoId === "nueva" ? "Nuevo testimonio" : "Editar testimonio"}
            </h3>
            <button type="button" onClick={() => setEditandoId(null)} className="text-xs text-brand-blueLight hover:underline">
              Cancelar
            </button>
          </div>

          <label className="text-sm text-neutral-text">
            Nombre
            <input
              type="text"
              required
              value={form.nombre}
              onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
            />
          </label>

          <label className="text-sm text-neutral-text">
            Testimonio
            <textarea
              required
              rows={4}
              value={form.texto}
              onChange={(e) => setForm((prev) => ({ ...prev, texto: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
            />
          </label>

          <div className="text-sm text-neutral-text">
            Foto (opcional)
            <input type="file" accept="image/*" onChange={subirFoto} className="mt-1 w-full text-sm" />
            {subiendoFoto && <p className="text-xs text-brand-blueLight mt-1">Subiendo...</p>}
            {form.fotoUrl && !subiendoFoto && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.fotoUrl} alt="Vista previa" className="mt-2 rounded-full w-16 h-16 object-cover" />
            )}
          </div>

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
            disabled={guardando || subiendoFoto}
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