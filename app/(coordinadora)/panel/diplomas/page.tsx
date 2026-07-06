"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

type Estudiante = {
  _id: string;
  nombre: string;
  apellido: string;
  cedula: string;
  email: string;
};

type DiplomaGenerado = {
  _id: string;
  codigoVerificacion: string;
  urlPDF: string;
  fechaEmision: string;
};

export default function PanelDiplomasPage() {
  const { token } = useAuth();

  const [elegibles, setElegibles] = useState<Estudiante[]>([]);
  const [cargando, setCargando] = useState(true);
  const [generandoId, setGenerandoId] = useState<string | null>(null);
  const [generados, setGenerados] = useState<Record<string, DiplomaGenerado>>({});
  const [mensaje, setMensaje] = useState<{
    tipo: "ok" | "error";
    texto: string;
  } | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelado = false;

    (async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/diplomas/elegibles`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const json = await res.json();
        if (!cancelado && json.success) setElegibles(json.data);
      } catch {
        if (!cancelado) {
          setMensaje({ tipo: "error", texto: "No pudimos cargar las estudiantes elegibles." });
        }
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [token]);

  async function generar(estudiante: Estudiante) {
    setGenerandoId(estudiante._id);
    setMensaje(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/diplomas/${estudiante._id}/generar`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } },
      );
      const json = await res.json();

      if (json.success) {
        setGenerados((prev) => ({ ...prev, [estudiante._id]: json.data }));
        setElegibles((prev) => prev.filter((e) => e._id !== estudiante._id));
        setMensaje({
          tipo: "ok",
          texto: `Diploma generado para ${estudiante.nombre} — código ${json.data.codigoVerificacion}.`,
        });
      } else {
        setMensaje({ tipo: "error", texto: json.error || "No se pudo generar." });
      }
    } catch {
      setMensaje({ tipo: "error", texto: "No pudimos conectar con el servidor." });
    } finally {
      setGenerandoId(null);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="font-display text-2xl font-bold text-brand-blue mb-1">
        Diplomas
      </h2>
      <p className="text-sm text-neutral-text mb-6">
        Estudiantes que ya completaron y aprobaron las 3 sesiones, listas para
        recibir su diploma.
      </p>

      {cargando && <p className="text-sm text-neutral-text">Cargando...</p>}

      {!cargando && elegibles.length === 0 && (
        <p className="text-sm text-neutral-text">
          No hay estudiantes elegibles pendientes de diploma en este momento.
        </p>
      )}

      <div className="grid gap-3">
        {elegibles.map((est) => (
          <div
            key={est._id}
            className="flex items-center justify-between rounded-lg bg-white border border-neutral-bg p-4"
          >
            <div>
              <p className="font-medium text-brand-blue text-sm">
                {est.nombre} {est.apellido}
              </p>
              <p className="text-xs text-neutral-text">
                {est.cedula} · {est.email}
              </p>
            </div>
            <button
              onClick={() => generar(est)}
              disabled={generandoId === est._id}
              className="rounded-lg bg-brand-pink text-white text-sm px-4 py-2 font-medium hover:opacity-90 disabled:opacity-60"
            >
              {generandoId === est._id ? "Generando..." : "Generar diploma"}
            </button>
          </div>
        ))}
      </div>

      {Object.keys(generados).length > 0 && (
        <div className="mt-8">
          <h3 className="font-display font-semibold text-brand-blue mb-3">
            Generados en esta sesión
          </h3>
          <div className="grid gap-2">
            {Object.entries(generados).map(([userId, diploma]) => (
              <a
                key={userId}
                href={diploma.urlPDF}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-status-success/10 border border-status-success p-3 text-sm text-status-success hover:opacity-80"
              >
                {diploma.codigoVerificacion} — ver PDF
              </a>
            ))}
          </div>
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