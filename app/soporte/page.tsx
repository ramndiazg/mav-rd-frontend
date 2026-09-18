"use client";

import { useEffect, useState } from "react";
import { LifeBuoy, Plus, X } from "lucide-react";
import RutaProtegida from "@/components/auth/RutaProtegida";
import { useAuth } from "@/contexts/AuthContext";

type TipoReporte = "tecnico" | "contenido" | "pago" | "otro";
type EstadoReporte = "abierto" | "en_revision" | "resuelto";

type Respuesta = {
  _id: string;
  rolAutor: "estudiante" | "coordinadora" | "admin";
  mensaje: string;
  fecha: string;
};

type Reporte = {
  _id: string;
  tipo: TipoReporte;
  tipoOtro: string | null;
  mensaje: string;
  estado: EstadoReporte;
  respuestas: Respuesta[];
  createdAt: string;
};

const ETIQUETAS_TIPO: Record<TipoReporte, string> = {
  tecnico: "Error técnico (algo no funciona)",
  contenido: "Duda o atasco con el contenido del curso",
  pago: "Problema con un pago o comprobante",
  otro: "Otro",
};

const ETIQUETAS_ESTADO: Record<EstadoReporte, string> = {
  abierto: "Abierto",
  en_revision: "En revisión",
  resuelto: "Resuelto",
};

function colorEstado(estado: EstadoReporte) {
  if (estado === "resuelto") return "bg-status-success/10 text-status-success";
  if (estado === "en_revision") return "bg-brand-blue-light/10 text-brand-blue-light";
  return "bg-status-warning/10 text-status-warning";
}

function tituloReporte(reporte: Reporte) {
  return reporte.tipo === "otro" && reporte.tipoOtro
    ? reporte.tipoOtro
    : ETIQUETAS_TIPO[reporte.tipo];
}

function formularioVacio() {
  return { tipo: "tecnico" as TipoReporte, tipoOtro: "", mensaje: "" };
}

function SoportePage() {
  const { token } = useAuth();

  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [cargando, setCargando] = useState(true);
  const [vista, setVista] = useState<"lista" | "nuevo">("lista");
  const [form, setForm] = useState(formularioVacio());
  const [enviando, setEnviando] = useState(false);
  const [errorForm, setErrorForm] = useState<string | null>(null);

  const [reporteAbiertoId, setReporteAbiertoId] = useState<string | null>(null);
  const [respuestaTexto, setRespuestaTexto] = useState("");
  const [enviandoRespuesta, setEnviandoRespuesta] = useState(false);

  async function cargar() {
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reportes/mios`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setReportes(json.data);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => cargar());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function alternarDetalle(id: string) {
    setReporteAbiertoId((actual) => (actual === id ? null : id));
    setRespuestaTexto("");
  }

  async function enviarNuevoReporte(e: React.FormEvent) {
    e.preventDefault();
    setErrorForm(null);

    if (form.tipo === "otro" && !form.tipoOtro.trim()) {
      setErrorForm('Cuéntanos brevemente de qué se trata cuando eliges "Otro".');
      return;
    }
    if (!form.mensaje.trim()) {
      setErrorForm("Escribe un mensaje describiendo la incidencia.");
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reportes`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tipo: form.tipo,
          tipoOtro: form.tipo === "otro" ? form.tipoOtro : undefined,
          mensaje: form.mensaje,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setForm(formularioVacio());
        setVista("lista");
        cargar();
      } else {
        setErrorForm(json.error || "No se pudo enviar el reporte.");
      }
    } catch {
      setErrorForm("No pudimos conectar con el servidor.");
    } finally {
      setEnviando(false);
    }
  }

  async function enviarRespuesta(reporteId: string) {
    if (!respuestaTexto.trim()) return;
    setEnviandoRespuesta(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/reportes/${reporteId}/respuestas`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ mensaje: respuestaTexto }),
        },
      );
      const json = await res.json();
      if (json.success) {
        setReportes((prev) =>
          prev.map((r) => (r._id === reporteId ? json.data : r)),
        );
        setRespuestaTexto("");
      }
    } finally {
      setEnviandoRespuesta(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-bg">
      <div className="bg-brand-blue text-white px-6 py-4 mb-8">
        <p className="text-xs opacity-80 flex items-center gap-1.5">
          <LifeBuoy size={14} /> Soporte
        </p>
        <h1 className="font-display text-xl font-bold">Reporta una incidencia</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-16">
        {vista === "lista" && (
          <>
            <button
              onClick={() => {
                setForm(formularioVacio());
                setErrorForm(null);
                setVista("nuevo");
              }}
              className="mb-6 flex items-center gap-1.5 rounded-lg bg-brand-pink text-white text-sm px-4 py-2 font-medium hover:opacity-90"
            >
              <Plus size={16} /> Nuevo reporte
            </button>

            {cargando && <p className="text-sm text-neutral-text">Cargando...</p>}

            {!cargando && reportes.length === 0 && (
              <p className="text-sm text-neutral-text">
                Todavía no has enviado ningún reporte. Si algo no funciona o
                tienes una duda, usa el botón de arriba.
              </p>
            )}

            <div className="flex flex-col gap-3">
              {reportes.map((reporte) => (
                <div
                  key={reporte._id}
                  className="rounded-xl bg-white border border-neutral-bg overflow-hidden"
                >
                  <button
                    onClick={() => alternarDetalle(reporte._id)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-neutral-bg/50"
                  >
                    <div>
                      <p className="font-display font-semibold text-brand-blue">
                        {tituloReporte(reporte)}
                      </p>
                      <p className="text-xs text-neutral-text mt-0.5 line-clamp-1">
                        {reporte.mensaje}
                      </p>
                    </div>
                    <span
                      className={`text-[11px] font-medium px-2 py-1 rounded-full whitespace-nowrap ml-3 ${colorEstado(reporte.estado)}`}
                    >
                      {ETIQUETAS_ESTADO[reporte.estado]}
                    </span>
                  </button>

                  {reporteAbiertoId === reporte._id && (
                    <div className="border-t border-neutral-bg p-4">
                      <div className="flex flex-col gap-3">
                        <div className="rounded-lg bg-neutral-bg p-3">
                          <p className="text-[11px] text-neutral-text mb-1">
                            Tú — {new Date(reporte.createdAt).toLocaleDateString("es-DO")}
                          </p>
                          <p className="text-sm text-neutral-text">{reporte.mensaje}</p>
                        </div>

                        {reporte.respuestas.map((r) => (
                          <div
                            key={r._id}
                            className={`rounded-lg p-3 ${r.rolAutor === "estudiante" ? "bg-neutral-bg" : "bg-brand-pink-light"}`}
                          >
                            <p className="text-[11px] text-neutral-text mb-1">
                              {r.rolAutor === "estudiante"
                                ? "Tú"
                                : "Administración"}{" "}
                              — {new Date(r.fecha).toLocaleDateString("es-DO")}
                            </p>
                            <p className="text-sm text-neutral-text">{r.mensaje}</p>
                          </div>
                        ))}
                      </div>

                      {reporte.estado === "resuelto" ? (
                        <p className="text-xs text-neutral-text italic mt-4">
                          Este reporte está resuelto. Si necesitas algo más,
                          crea un reporte nuevo.
                        </p>
                      ) : (
                        <div className="mt-4 flex gap-2">
                          <input
                            type="text"
                            value={respuestaTexto}
                            onChange={(e) => setRespuestaTexto(e.target.value)}
                            placeholder="Escribe una respuesta..."
                            className="flex-1 rounded-lg border border-neutral-bg px-3 py-2 text-sm"
                          />
                          <button
                            onClick={() => enviarRespuesta(reporte._id)}
                            disabled={enviandoRespuesta || !respuestaTexto.trim()}
                            className="rounded-lg bg-brand-blue text-white text-sm px-4 py-2 font-medium hover:opacity-90 disabled:opacity-60"
                          >
                            Enviar
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {vista === "nuevo" && (
          <form onSubmit={enviarNuevoReporte} className="grid gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-brand-blue">
                Nuevo reporte
              </h3>
              <button
                type="button"
                onClick={() => setVista("lista")}
                className="text-neutral-text hover:text-brand-blue"
                aria-label="Cancelar"
              >
                <X size={18} />
              </button>
            </div>

            <label className="text-sm text-neutral-text">
              ¿De qué se trata?
              <select
                value={form.tipo}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, tipo: e.target.value as TipoReporte }))
                }
                className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
              >
                {Object.entries(ETIQUETAS_TIPO).map(([valor, etiqueta]) => (
                  <option key={valor} value={valor}>
                    {etiqueta}
                  </option>
                ))}
              </select>
            </label>

            {form.tipo === "otro" && (
              <label className="text-sm text-neutral-text">
                Cuéntanos brevemente de qué se trata
                <input
                  type="text"
                  value={form.tipoOtro}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, tipoOtro: e.target.value }))
                  }
                  placeholder="Ej: no puedo cambiar mi contraseña"
                  className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
                />
              </label>
            )}

            <label className="text-sm text-neutral-text">
              Describe lo que pasó
              <textarea
                value={form.mensaje}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, mensaje: e.target.value }))
                }
                rows={5}
                placeholder="Mientras más detalle nos das, más rápido podemos ayudarte."
                className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
              />
            </label>

            {errorForm && (
              <p className="text-sm text-brand-pink">{errorForm}</p>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="rounded-xl bg-brand-blue text-white p-4 font-display font-semibold hover:opacity-90 disabled:opacity-60"
            >
              {enviando ? "Enviando..." : "Enviar reporte"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <RutaProtegida rolesPermitidos={["estudiante"]}>
      <SoportePage />
    </RutaProtegida>
  );
}