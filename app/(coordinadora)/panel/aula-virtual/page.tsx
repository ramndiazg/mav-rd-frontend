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

type Progreso = {
  sesionActualDesbloqueada: number;
  sesionesAprobadas: number[];
  cursoCompletado: boolean;
};

type Sesion = { _id: string; numero: number; titulo: string };

export default function PanelAulaVirtualPage() {
  const { token } = useAuth();

  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<Estudiante[]>([]);
  const [buscando, setBuscando] = useState(false);

  const [seleccionada, setSeleccionada] = useState<Estudiante | null>(null);
  const [progreso, setProgreso] = useState<Progreso | null>(null);
  const [sinPago, setSinPago] = useState(false);
  const [cargandoProgreso, setCargandoProgreso] = useState(false);

  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [desbloqueandoNumero, setDesbloqueandoNumero] = useState<
    number | null
  >(null);
  const [mensaje, setMensaje] = useState<{
    tipo: "ok" | "error";
    texto: string;
  } | null>(null);

  // Cargar el catálogo de sesiones una sola vez (para tener el _id real de cada numero)
  useEffect(() => {
    async function cargarSesiones() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/sesiones`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const json = await res.json();
        if (json.success) setSesiones(json.data);
      } catch {
        // Si esto falla, los botones de desbloqueo simplemente no aparecen
      }
    }
    if (token) cargarSesiones();
  }, [token]);

  async function buscarEstudiantes(e: React.FormEvent) {
    e.preventDefault();
    setBuscando(true);
    setMensaje(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/usuarios?rol=estudiante&search=${encodeURIComponent(busqueda)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const json = await res.json();
      if (json.success) {
        setResultados(json.data);
      } else {
        setMensaje({ tipo: "error", texto: json.error || "Error al buscar." });
      }
    } catch {
      setMensaje({ tipo: "error", texto: "No pudimos conectar con el servidor." });
    } finally {
      setBuscando(false);
    }
  }

  async function seleccionarEstudiante(estudiante: Estudiante) {
    setSeleccionada(estudiante);
    setProgreso(null);
    setSinPago(false);
    setMensaje(null);
    setCargandoProgreso(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/progreso/${estudiante._id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const json = await res.json();

      if (json.success) {
        setProgreso(json.data);
      } else {
        // Sin ProgresoEstudiante = sin pago confirmado todavía
        setSinPago(true);
      }
    } catch {
      setMensaje({ tipo: "error", texto: "No pudimos cargar su progreso." });
    } finally {
      setCargandoProgreso(false);
    }
  }

  async function desbloquear(sesion: Sesion) {
    if (!seleccionada) return;
    setDesbloqueandoNumero(sesion.numero);
    setMensaje(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/examenes/${sesion._id}/desbloquear`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: seleccionada._id }),
        },
      );
      const json = await res.json();

      if (json.success) {
        setMensaje({
          tipo: "ok",
          texto: `Examen de la Sesión ${sesion.numero} desbloqueado para ${seleccionada.nombre}.`,
        });
        // Refrescar su progreso para reflejar el nuevo estado
        seleccionarEstudiante(seleccionada);
      } else {
        setMensaje({ tipo: "error", texto: json.error || "No se pudo desbloquear." });
      }
    } catch {
      setMensaje({ tipo: "error", texto: "No pudimos conectar con el servidor." });
    } finally {
      setDesbloqueandoNumero(null);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="font-display text-2xl font-bold text-brand-blue mb-1">
        Aula Virtual — Desbloquear exámenes
      </h2>
      <p className="text-sm text-neutral-text mb-6">
        Busca a la estudiante y desbloquea la sesión correspondiente cuando
        esté lista para tomar su examen presencial.
      </p>

      <form onSubmit={buscarEstudiantes} className="flex gap-2 mb-6">
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Nombre, cédula o email..."
          className="flex-1 rounded-lg border border-neutral-bg px-4 py-2 text-sm focus:outline-none focus:border-brand-blueLight"
        />
        <button
          type="submit"
          disabled={buscando}
          className="rounded-lg bg-brand-blue text-white px-5 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-60"
        >
          {buscando ? "Buscando..." : "Buscar"}
        </button>
      </form>

      {resultados.length > 0 && !seleccionada && (
        <div className="grid gap-2 mb-8">
          {resultados.map((est) => (
            <button
              key={est._id}
              onClick={() => seleccionarEstudiante(est)}
              className="text-left rounded-lg bg-white border border-neutral-bg p-4 hover:border-brand-blueLight transition-colors"
            >
              <p className="font-medium text-brand-blue">
                {est.nombre} {est.apellido}
              </p>
              <p className="text-xs text-neutral-text">
                {est.cedula} · {est.email}
              </p>
            </button>
          ))}
        </div>
      )}

      {seleccionada && (
        <div className="rounded-xl bg-white border border-neutral-bg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-display font-semibold text-brand-blue">
                {seleccionada.nombre} {seleccionada.apellido}
              </p>
              <p className="text-xs text-neutral-text">{seleccionada.email}</p>
            </div>
            <button
              onClick={() => {
                setSeleccionada(null);
                setProgreso(null);
                setMensaje(null);
              }}
              className="text-xs text-brand-blueLight hover:underline"
            >
              Cambiar estudiante
            </button>
          </div>

          {cargandoProgreso && (
            <p className="text-sm text-neutral-text">Cargando progreso...</p>
          )}

          {!cargandoProgreso && sinPago && (
            <div className="rounded-lg bg-brand-pinkLight border border-brand-pink p-4 text-sm text-brand-blue">
              Esta estudiante no tiene un pago confirmado — no se puede
              desbloquear ninguna sesión todavía. Confírmalo primero desde el
              panel de Pagos.
            </div>
          )}

          {!cargandoProgreso && progreso && (
            <div className="grid gap-3">
              {sesiones.map((sesion) => {
                const aprobada = progreso.sesionesAprobadas.includes(
                  sesion.numero,
                );
                const puedeDesbloquear =
                  sesion.numero <= progreso.sesionActualDesbloqueada + 1;

                return (
                  <div
                    key={sesion._id}
                    className="flex items-center justify-between rounded-lg border border-neutral-bg p-4"
                  >
                    <div>
                      <p className="font-medium text-neutral-text">
                        Sesión {sesion.numero}
                      </p>
                      {aprobada && (
                        <span className="text-xs text-status-success font-medium">
                          Aprobada
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => desbloquear(sesion)}
                      disabled={
                        !puedeDesbloquear ||
                        desbloqueandoNumero === sesion.numero
                      }
                      className="rounded-lg bg-brand-pink text-white text-sm px-4 py-2 font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {desbloqueandoNumero === sesion.numero
                        ? "Desbloqueando..."
                        : aprobada
                          ? "Repetir examen"
                          : "Desbloquear examen"}
                    </button>
                  </div>
                );
              })}
              {progreso.cursoCompletado && (
                <p className="text-sm text-status-success font-medium mt-2">
                  ✓ Esta estudiante ya completó el curso.
                </p>
              )}
            </div>
          )}
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