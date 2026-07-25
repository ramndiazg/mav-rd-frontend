"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

type Tipo = "email" | "telegram";

type Destinatario = {
  _id: string;
  tipo: Tipo;
  valor: string;
  etiqueta: string;
  activo: boolean;
};

function formularioVacio() {
  return { tipo: "email" as Tipo, valor: "", etiqueta: "" };
}

export default function NotificacionesPage() {
  const { token } = useAuth();

  const [destinatarios, setDestinatarios] = useState<Destinatario[]>([]);
  const [cargando, setCargando] = useState(true);

  const [editandoId, setEditandoId] = useState<string | "nuevo" | null>(null);
  const [form, setForm] = useState(formularioVacio());
  const [guardando, setGuardando] = useState(false);

  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(
    null,
  );

  async function cargar() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/destinatarios`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setDestinatarios(json.data);
    } catch {
      setMensaje({ tipo: "error", texto: "No pudimos cargar los destinatarios." });
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    if (!token) return;
    let cancelado = false;

    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/destinatarios`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!cancelado && json.success) setDestinatarios(json.data);
      } catch {
        if (!cancelado) {
          setMensaje({ tipo: "error", texto: "No pudimos cargar los destinatarios." });
        }
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [token]);

  function abrirNuevo() {
    setForm(formularioVacio());
    setEditandoId("nuevo");
    setMensaje(null);
  }

  function abrirEdicion(d: Destinatario) {
    setForm({ tipo: d.tipo, valor: d.valor, etiqueta: d.etiqueta });
    setEditandoId(d._id);
    setMensaje(null);
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setMensaje(null);

    try {
      const esNuevo = editandoId === "nuevo";
      const url = esNuevo
        ? `${process.env.NEXT_PUBLIC_API_URL}/destinatarios`
        : `${process.env.NEXT_PUBLIC_API_URL}/destinatarios/${editandoId}`;

      const res = await fetch(url, {
        method: esNuevo ? "POST" : "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      const json = await res.json();

      if (json.success) {
        setMensaje({ tipo: "ok", texto: esNuevo ? "Destinatario agregado." : "Actualizado." });
        setEditandoId(null);
        cargar();
      } else {
        setMensaje({ tipo: "error", texto: json.error || "No se pudo guardar." });
      }
    } catch {
      setMensaje({ tipo: "error", texto: "No pudimos conectar con el servidor." });
    } finally {
      setGuardando(false);
    }
  }

  async function toggleActivo(d: Destinatario) {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/destinatarios/${d._id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ activo: !d.activo }),
        },
      );
      const json = await res.json();
      if (json.success) {
        cargar();
      } else {
        setMensaje({ tipo: "error", texto: json.error || "No se pudo actualizar." });
      }
    } catch {
      setMensaje({ tipo: "error", texto: "No pudimos conectar con el servidor." });
    }
  }

  async function eliminar(d: Destinatario) {
    if (!confirm(`¿Eliminar a "${d.etiqueta}" de la lista de notificaciones?`)) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/destinatarios/${d._id}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
      );
      const json = await res.json();
      if (json.success) {
        setMensaje({ tipo: "ok", texto: "Destinatario eliminado." });
        cargar();
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
        Notificaciones
      </h2>
      <p className="text-sm text-neutral-text mb-6">
        Quiénes reciben un aviso por correo o Telegram cuando una estudiante
        sube un comprobante de pago nuevo.
      </p>

      {!editandoId && (
        <>
          <button
            onClick={abrirNuevo}
            className="mb-6 rounded-lg bg-brand-pink text-white text-sm px-4 py-2 font-medium hover:opacity-90"
          >
            + Agregar destinatario
          </button>

          {cargando && <p className="text-sm text-neutral-text">Cargando...</p>}

          {!cargando && destinatarios.length === 0 && (
            <p className="text-sm text-neutral-text">
              Todavía no hay nadie configurado para recibir avisos.
            </p>
          )}

          <div className="grid gap-3">
            {destinatarios.map((d) => (
              <div
                key={d._id}
                className="flex items-center justify-between rounded-lg bg-white border border-neutral-bg p-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${d.tipo === "email"
                        ? "bg-brand-blueLight text-white"
                        : "bg-brand-pink text-white"
                        }`}
                    >
                      {d.tipo === "email" ? "Email" : "Telegram"}
                    </span>
                    <p className="font-medium text-brand-blue text-sm">{d.etiqueta}</p>
                    {!d.activo && (
                      <span className="text-[10px] text-neutral-text">(inactivo)</span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-text">{d.valor}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => toggleActivo(d)}
                    className="text-xs font-medium px-3 py-1.5 rounded-full bg-neutral-bg text-neutral-text hover:bg-brand-pinkLight"
                  >
                    {d.activo ? "Desactivar" : "Activar"}
                  </button>
                  <button
                    onClick={() => abrirEdicion(d)}
                    className="text-xs font-medium px-3 py-1.5 rounded-full bg-brand-blueLight text-white hover:opacity-90"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => eliminar(d)}
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
              {editandoId === "nuevo" ? "Nuevo destinatario" : "Editar destinatario"}
            </h3>
            <button
              type="button"
              onClick={() => setEditandoId(null)}
              className="text-xs text-brand-blueLight hover:underline"
            >
              Cancelar
            </button>
          </div>

          <label className="text-sm text-neutral-text">
            Tipo
            <select
              value={form.tipo}
              onChange={(e) => setForm((prev) => ({ ...prev, tipo: e.target.value as Tipo }))}
              className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
            >
              <option value="email">Email</option>
              <option value="telegram">Telegram</option>
            </select>
          </label>

          <label className="text-sm text-neutral-text">
            Etiqueta (para identificarlo en la lista)
            <input
              type="text"
              required
              value={form.etiqueta}
              onChange={(e) => setForm((prev) => ({ ...prev, etiqueta: e.target.value }))}
              placeholder='Ej: "María (fundadora)"'
              className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
            />
          </label>

          <label className="text-sm text-neutral-text">
            {form.tipo === "email" ? "Correo electrónico" : "Chat ID de Telegram"}
            <input
              type={form.tipo === "email" ? "email" : "text"}
              required
              value={form.valor}
              onChange={(e) => setForm((prev) => ({ ...prev, valor: e.target.value }))}
              placeholder={form.tipo === "email" ? "correo@ejemplo.com" : "123456789"}
              className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
            />
            {form.tipo === "telegram" && (
              <span className="block text-xs text-neutral-text mt-1">
                No es el @usuario — es el número que da{" "}
                <code>api.telegram.org/bot&lt;token&gt;/getUpdates</code> después
                de que esa persona le escriba algo al bot.
              </span>
            )}
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