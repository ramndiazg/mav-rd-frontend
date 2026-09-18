"use client";

import { useEffect, useState } from "react";
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
  estudianteId: { _id: string; nombre: string; apellido: string; cedula: string; email: string };
  tipo: TipoReporte;
  tipoOtro: string | null;
  mensaje: string;
  estado: EstadoReporte;
  respuestas: Respuesta[];
  createdAt: string;
};

const ETIQUETAS_TIPO: Record<TipoReporte, string> = {
  tecnico: "Error técnico",
  contenido: "Duda/atasco con el contenido",
  pago: "Pago o comprobante",
  otro: "Otro",
};

const ETIQUETAS_ESTADO: Record<EstadoReporte, string> = {
  abierto: "Abierto",
  en_revision: "En revisión",
  resuelto: "Resuelto",
};

const FILTROS: { valor: EstadoReporte | "todos"; etiqueta: string }[] = [
  { valor: "todos", etiqueta: "Todos" },
  { valor: "abierto", etiqueta: "Abiertos" },
  { valor: "en_revision", etiqueta: "En revisión" },
  { valor: "resuelto", etiqueta: "Resueltos" },
];

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

export default function PanelSoportePage() {
  const { token } = useAuth();

  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState<EstadoReporte | "todos">("todos");
  const [reporteAbiertoId, setReporteAbiertoId] = useState<string | null>(null);
  const [respuestaTexto, setRespuestaTexto] = useState("");
  const [enviandoRespuesta, setEnviandoRespuesta] = useState(false);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);

  async function cargar() {
    if (!token) return;
    setCargando(true);
    try {
      const query = filtro !== "todos" ? `?estado=${filtro}` : "";
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reportes${query}`, {
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
  }, [token, filtro]);

  function alternarDetalle(id: string) {
    setReporteAbiertoId((actual) => (actual === id ? null : id));
    setRespuestaTexto("");
  }

  function actualizarEnLista(actualizado: Reporte) {
    setReportes((prev) =>
      prev.map((r) => (r._id === actualizado._id ? actualizado : r)),
    );
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
        actualizarEnLista(json.data);
        setRespuestaTexto("");
      }
    } finally {
      setEnviandoRespuesta(false);
    }
  }

  async function cambiarEstado(reporteId: string, estado: EstadoReporte) {
    setCambiandoEstado(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/reportes/${reporteId}/estado`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ estado }),
        },
      );
      const json = await res.json();
      if (json.success) actualizarEnLista(json.data);
    } finally {
      setCambiandoEstado(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="font-display text-2xl font-bold text-brand-blue mb-1">
        Soporte a estudiantes
      </h2>
      <p className="text-sm text-neutral-text mb-6">
        Incidencias, errores y dudas reportadas desde el dashboard de cada
        estudiante.
      </p>

      <div className="flex gap-2 mb-6">
        {FILTROS.map((f) => (
          <button
            key={f.valor}
            onClick={() => setFiltro(f.valor)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full ${filtro === f.valor
              ? "bg-brand-blue text-white"
              : "bg-white border border-neutral-bg text-neutral-text"
              }`}
          >
            {f.etiqueta}
          </button>
        ))}
      </div>

      {cargando && <p className="text-sm text-neutral-text">Cargando...</p>}

      {!cargando && reportes.length === 0 && (
        <p className="text-sm text-neutral-text">
          No hay reportes {filtro !== "todos" ? `en estado "${ETIQUETAS_ESTADO[filtro]}"` : ""} por ahora.
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
                  {reporte.estudianteId.nombre} {reporte.estudianteId.apellido}
                </p>
                <p className="text-xs text-neutral-text">
                  {tituloReporte(reporte)} — {reporte.estudianteId.email}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                <span className="text-xs text-neutral-text hidden sm:inline">
                  {new Date(reporte.createdAt).toLocaleDateString("es-DO")}
                </span>
                <span
                  className={`text-[11px] font-medium px-2 py-1 rounded-full whitespace-nowrap ${colorEstado(reporte.estado)}`}
                >
                  {ETIQUETAS_ESTADO[reporte.estado]}
                </span>
              </div>
            </button>

            {reporteAbiertoId === reporte._id && (
              <div className="border-t border-neutral-bg p-4">
                <div className="flex flex-col gap-3">
                  <div className="rounded-lg bg-neutral-bg p-3">
                    <p className="text-[11px] text-neutral-text mb-1">
                      {reporte.estudianteId.nombre} — {new Date(reporte.createdAt).toLocaleDateString("es-DO")}
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
                          ? reporte.estudianteId.nombre
                          : "Administración"}{" "}
                        — {new Date(r.fecha).toLocaleDateString("es-DO")}
                      </p>
                      <p className="text-sm text-neutral-text">{r.mensaje}</p>
                    </div>
                  ))}
                </div>

                {reporte.estado === "resuelto" ? (
                  <p className="text-xs text-neutral-text italic mt-4">
                    Este reporte está resuelto y no admite más respuestas.
                  </p>
                ) : (
                  <>
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

                    <div className="mt-3 flex gap-2">
                      {reporte.estado === "abierto" && (
                        <button
                          onClick={() => cambiarEstado(reporte._id, "en_revision")}
                          disabled={cambiandoEstado}
                          className="text-xs font-medium px-3 py-1.5 rounded-full bg-neutral-bg text-neutral-text hover:bg-brand-pink-light disabled:opacity-60"
                        >
                          Marcar en revisión
                        </button>
                      )}
                      <button
                        onClick={() => cambiarEstado(reporte._id, "resuelto")}
                        disabled={cambiandoEstado}
                        className="text-xs font-medium px-3 py-1.5 rounded-full bg-status-success/10 text-status-success hover:bg-status-success/20 disabled:opacity-60"
                      >
                        Marcar como resuelto
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}