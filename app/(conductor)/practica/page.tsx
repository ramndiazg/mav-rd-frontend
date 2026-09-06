"use client";

import { useEffect, useState } from "react";
import { Phone, Mail, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type Pendiente = {
  userId: string;
  nombre: string;
  apellido: string;
  cedula: string;
  telefono: string;
  email: string;
  tipoPlan: "normal" | "vip" | null;
  fechaCompletado: string | null;
};

export default function PracticaPendientesPage() {
  const { token } = useAuth();

  const [pendientes, setPendientes] = useState<Pendiente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const [aprobando, setAprobando] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(
    null,
  );

  useEffect(() => {
    if (!token) return;
    let cancelado = false;

    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/practica/pendientes`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (cancelado) return;
        if (json.success) {
          setPendientes(json.data);
          setError(false);
        } else {
          setError(true);
        }
      } catch {
        if (!cancelado) setError(true);
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [token]);

  async function aprobar(userId: string) {
    setAprobando(userId);
    setMensaje(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/practica/${userId}/aprobar`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const json = await res.json();

      if (json.success) {
        setMensaje({ tipo: "ok", texto: "Práctica aprobada — ya puede recibir su diploma." });
        setPendientes((prev) => prev.filter((p) => p.userId !== userId));
      } else {
        setMensaje({ tipo: "error", texto: json.error || "No se pudo aprobar." });
      }
    } catch {
      setMensaje({ tipo: "error", texto: "No pudimos conectar con el servidor." });
    } finally {
      setAprobando(null);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="font-display text-2xl font-bold text-brand-blue mb-1">
        Estudiantes listas para práctica
      </h2>
      <p className="text-sm text-neutral-text mb-6">
        Terminaron toda la teoría. Apruébalas aquí en cuanto confirmes que
        completaron su práctica de manejo contigo — eso habilita su diploma.
      </p>

      {cargando && <p className="text-sm text-neutral-text">Cargando...</p>}

      {error && !cargando && (
        <p className="text-sm text-brand-pink">
          No pudimos cargar la lista. Intenta de nuevo en unos minutos.
        </p>
      )}

      {!cargando && !error && pendientes.length === 0 && (
        <p className="text-sm text-neutral-text">
          No hay estudiantes esperando aprobación de práctica en este momento.
        </p>
      )}

      <div className="grid gap-3">
        {pendientes.map((p) => (
          <div
            key={p.userId}
            className="rounded-lg bg-white border border-neutral-bg p-4 flex items-center justify-between gap-3 flex-wrap"
          >
            <div>
              <p className="font-medium text-brand-blue text-sm">
                {p.nombre} {p.apellido}
                {p.tipoPlan && (
                  <span className="ml-2 text-[10px] font-medium px-2 py-0.5 rounded-full bg-brand-pinkLight text-brand-pink">
                    Plan {p.tipoPlan}
                  </span>
                )}
              </p>
              <p className="text-xs text-neutral-text mt-1">Cédula: {p.cedula}</p>
              <div className="flex gap-4 mt-1 text-xs text-neutral-text">
                <span className="flex items-center gap-1">
                  <Phone size={12} className="text-brand-pink" />
                  {p.telefono}
                </span>
                <span className="flex items-center gap-1">
                  <Mail size={12} className="text-brand-pink" />
                  {p.email}
                </span>
              </div>
            </div>
            <button
              onClick={() => aprobar(p.userId)}
              disabled={aprobando === p.userId}
              className="text-xs font-medium px-4 py-2 rounded-full bg-status-success text-white hover:opacity-90 disabled:opacity-60 flex items-center gap-1.5 shrink-0"
            >
              <CheckCircle2 size={14} />
              {aprobando === p.userId ? "Aprobando..." : "Aprobar práctica"}
            </button>
          </div>
        ))}
      </div>

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