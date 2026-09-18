"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

type TipoReporte = "tecnico" | "contenido" | "pago" | "otro";
type Configuracion = Record<TipoReporte, boolean>;

const ETIQUETAS_TIPO: Record<TipoReporte, string> = {
  tecnico: "Error técnico",
  contenido: "Duda o atasco con el contenido",
  pago: "Pago o comprobante",
  otro: "Otro",
};

export default function NotificacionesReportesPage() {
  const { token } = useAuth();

  const [config, setConfig] = useState<Configuracion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState<TipoReporte | null>(null);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(
    null,
  );

  useEffect(() => {
    if (!token) return;
    let cancelado = false;

    queueMicrotask(async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/reportes/configuracion-notificaciones`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const json = await res.json();
        if (!cancelado && json.success) setConfig(json.data);
      } catch {
        if (!cancelado) {
          setMensaje({ tipo: "error", texto: "No pudimos cargar la configuración." });
        }
      } finally {
        if (!cancelado) setCargando(false);
      }
    });

    return () => {
      cancelado = true;
    };
  }, [token]);

  async function alternar(tipo: TipoReporte) {
    if (!config) return;
    const nuevoValor = !config[tipo];
    setGuardando(tipo);
    setMensaje(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/reportes/configuracion-notificaciones`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ [tipo]: nuevoValor }),
        },
      );
      const json = await res.json();
      if (json.success) {
        setConfig(json.data);
      } else {
        setMensaje({ tipo: "error", texto: json.error || "No se pudo actualizar." });
      }
    } catch {
      setMensaje({ tipo: "error", texto: "No pudimos conectar con el servidor." });
    } finally {
      setGuardando(null);
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="font-display text-2xl font-bold text-brand-blue mb-1">
        Notif. de reportes
      </h2>
      <p className="text-sm text-neutral-text mb-6">
        Por cada tipo de reporte, decide si quieres recibir un aviso (correo
        o Telegram, según lo configurado en Notificaciones) cuando una
        estudiante lo envíe. Verlo en el panel de{" "}
        <span className="font-medium">Soporte</span> siempre está disponible,
        esto solo controla el aviso inmediato.
      </p>

      {cargando && <p className="text-sm text-neutral-text">Cargando...</p>}

      {!cargando && config && (
        <div className="flex flex-col gap-3">
          {(Object.keys(ETIQUETAS_TIPO) as TipoReporte[]).map((tipo) => (
            <div
              key={tipo}
              className="flex items-center justify-between rounded-lg bg-white border border-neutral-bg p-4"
            >
              <p className="text-sm font-medium text-brand-blue">
                {ETIQUETAS_TIPO[tipo]}
              </p>
              <button
                onClick={() => alternar(tipo)}
                disabled={guardando === tipo}
                className={`text-xs font-medium px-3 py-1.5 rounded-full disabled:opacity-60 ${config[tipo]
                  ? "bg-status-success/10 text-status-success"
                  : "bg-neutral-bg text-neutral-text"
                  }`}
              >
                {config[tipo] ? "Activado" : "Desactivado"}
              </button>
            </div>
          ))}
        </div>
      )}

      {mensaje && (
        <div
          className={`mt-6 rounded-lg p-4 text-sm ${mensaje.tipo === "ok"
            ? "bg-status-success/10 border border-status-success text-status-success"
            : "bg-brand-pink-light border border-brand-pink text-brand-blue"
            }`}
        >
          {mensaje.texto}
        </div>
      )}
    </div>
  );
}