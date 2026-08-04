"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Paginacion from "@/components/ui/Paginacion";

type Estudiante = {
  _id: string;
  nombre: string;
  apellido: string;
  cedula: string;
  email: string;
  activo: boolean;
};

type EstadoPago = "pendiente" | "pendiente_verificacion" | "pagado" | "rechazado";

type Inscripcion = { userId: { _id: string }; estadoPago: EstadoPago };

type EstadoMostrado = EstadoPago | "sin_inscripcion";

type Progreso = {
  sesionActualDesbloqueada: number;
  sesionesAprobadas: number[];
  cursoCompletado: boolean;
};

type Intento = {
  _id: string;
  sesionId: { numero: number; titulo: string } | null;
  numeroIntento: number;
  calificacion: number | null;
  aprobado: boolean | null;
  fechaFin: string | null;
};

type Pestana = "activas" | "graduadas" | "inactivas";

const POR_PAGINA = 20;

export default function PanelEstudiantesPage() {
  const { token } = useAuth();

  const [pestana, setPestana] = useState<Pestana>("activas");
  const [busqueda, setBusqueda] = useState("");
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [estadosPago, setEstadosPago] = useState<Record<string, EstadoMostrado>>({});
  const [cargando, setCargando] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);

  const [seleccionada, setSeleccionada] = useState<Estudiante | null>(null);
  const [progreso, setProgreso] = useState<Progreso | null>(null);
  const [intentos, setIntentos] = useState<Intento[]>([]);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);

  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  function queryParaPestana(p: Pestana) {
    if (p === "activas") return "activo=true&conDiploma=false";
    if (p === "graduadas") return "activo=true&conDiploma=true";
    return "activo=false"; // inactivas — archivadas, tengan o no diploma
  }

  const cargarLista = useCallback(
    async (termino: string, paginaBuscada: number, pestanaActual: Pestana) => {
      setCargando(true);
      try {
        const [resUsuarios, resInscripciones] = await Promise.all([
          fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/usuarios?rol=estudiante&${queryParaPestana(pestanaActual)}&search=${encodeURIComponent(termino)}&page=${paginaBuscada}&limit=${POR_PAGINA}`,
            { headers: { Authorization: `Bearer ${token}` } },
          ),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/inscripciones`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        const jsonUsuarios = await resUsuarios.json();
        const jsonInscripciones = await resInscripciones.json();

        if (jsonUsuarios.success) {
          setEstudiantes(jsonUsuarios.data);
          setTotalPaginas(jsonUsuarios.paginacion?.totalPaginas || 1);
        }

        if (jsonInscripciones.success) {
          const mapa: Record<string, EstadoPago> = {};
          jsonInscripciones.data.forEach((ins: Inscripcion) => {
            mapa[ins.userId._id] = ins.estadoPago;
          });
          const conEstado: Record<string, EstadoMostrado> = {};
          (jsonUsuarios.success ? jsonUsuarios.data : []).forEach((est: Estudiante) => {
            conEstado[est._id] = mapa[est._id] || "sin_inscripcion";
          });
          setEstadosPago(conEstado);
        }
      } catch {
        setMensaje({ tipo: "error", texto: "No pudimos cargar la lista de estudiantes." });
      } finally {
        setCargando(false);
      }
    },
    [token],
  );

  useEffect(() => {
    if (!token) return;
    queueMicrotask(() => cargarLista("", 1, pestana));
  }, [token, pestana, cargarLista]);

  function cambiarPestana(nueva: Pestana) {
    if (nueva === pestana) return;
    setSeleccionada(null);
    setBusqueda("");
    setPagina(1);
    setPestana(nueva);
  }

  function buscar(e: React.FormEvent) {
    e.preventDefault();
    setPagina(1);
    cargarLista(busqueda, 1, pestana);
  }

  function irAPagina(nuevaPagina: number) {
    setPagina(nuevaPagina);
    cargarLista(busqueda, nuevaPagina, pestana);
  }

  async function seleccionar(est: Estudiante) {
    setSeleccionada(est);
    setProgreso(null);
    setIntentos([]);
    setCargandoDetalle(true);
    setMensaje(null);

    try {
      const [resProgreso, resIntentos] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/progreso/${est._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/intentos-examen/estudiante/${est._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const jsonProgreso = await resProgreso.json();
      const jsonIntentos = await resIntentos.json();

      if (jsonProgreso.success) setProgreso(jsonProgreso.data);
      if (jsonIntentos.success) setIntentos(jsonIntentos.data);
    } catch {
      setMensaje({ tipo: "error", texto: "No pudimos cargar su información." });
    } finally {
      setCargandoDetalle(false);
    }
  }

  // PATCH /usuarios/:id/estado — archivar (activo:false) o reactivar (activo:true)
  async function cambiarEstadoCuenta(nuevoActivo: boolean) {
    if (!seleccionada) return;
    setCambiandoEstado(true);
    setMensaje(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/usuarios/${seleccionada._id}/estado`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ activo: nuevoActivo }),
        },
      );
      const json = await res.json();
      if (json.success) {
        setSeleccionada(json.data);
        setMensaje({
          tipo: "ok",
          texto: nuevoActivo ? "Cuenta reactivada." : "Cuenta archivada.",
        });
        // La estudiante probablemente ya no pertenece a esta pestaña —
        // recargamos la lista de fondo para que quede consistente al volver.
        cargarLista(busqueda, pagina, pestana);
      } else {
        setMensaje({ tipo: "error", texto: json.error || "No se pudo actualizar el estado." });
      }
    } catch {
      setMensaje({ tipo: "error", texto: "No se pudo actualizar el estado." });
    } finally {
      setCambiandoEstado(false);
    }
  }

  // Las 4 llaves reales de estadoPago + "sin_inscripcion". Si en el futuro se
  // agrega un valor nuevo a estadoPago en el backend, hay que agregarlo aquí
  // también o vuelve a pasar el mismo error (undefined.clase).
  const etiquetaPago: Record<EstadoMostrado, { texto: string; clase: string }> = {
    pagado: { texto: "Pagó", clase: "bg-status-success text-white" },
    pendiente: { texto: "Pago pendiente", clase: "bg-brand-pink text-white" },
    pendiente_verificacion: { texto: "Voucher por verificar", clase: "bg-brand-blueLight text-white" },
    rechazado: { texto: "Voucher rechazado", clase: "bg-neutral-text text-white" },
    sin_inscripcion: { texto: "Sin inscripción", clase: "bg-neutral-bg text-neutral-text" },
  };

  const pestanas: { id: Pestana; etiqueta: string }[] = [
    { id: "activas", etiqueta: "Activas" },
    { id: "graduadas", etiqueta: "Graduadas" },
    { id: "inactivas", etiqueta: "Inactivas" },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="font-display text-2xl font-bold text-brand-blue mb-1">
        Estudiantes
      </h2>
      <p className="text-sm text-neutral-text mb-6">
        Estado de pago y calificaciones de examen por sesión.
      </p>

      {!seleccionada && (
        <>
          <div className="flex gap-1 mb-4 border-b border-neutral-bg">
            {pestanas.map((p) => (
              <button
                key={p.id}
                onClick={() => cambiarPestana(p.id)}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${pestana === p.id
                  ? "border-brand-blue text-brand-blue"
                  : "border-transparent text-neutral-text hover:text-brand-blue"
                  }`}
              >
                {p.etiqueta}
              </button>
            ))}
          </div>

          <form onSubmit={buscar} className="flex gap-2 mb-6">
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Nombre, cédula o email..."
              className="flex-1 rounded-lg border border-neutral-bg px-4 py-2 text-sm focus:outline-none focus:border-brand-blueLight"
            />
            <button
              type="submit"
              className="rounded-lg bg-brand-blue text-white px-5 py-2 text-sm font-medium hover:opacity-90"
            >
              Buscar
            </button>
          </form>

          {cargando && <p className="text-sm text-neutral-text">Cargando...</p>}

          {!cargando && estudiantes.length === 0 && (
            <p className="text-sm text-neutral-text">
              {pestana === "activas" && "No hay estudiantes activas."}
              {pestana === "graduadas" && "Todavía no hay estudiantes graduadas."}
              {pestana === "inactivas" && "No hay estudiantes archivadas."}
            </p>
          )}

          <div className="grid gap-2">
            {estudiantes.map((est) => {
              const estado = estadosPago[est._id] || "sin_inscripcion";
              return (
                <button
                  key={est._id}
                  onClick={() => seleccionar(est)}
                  className="flex items-center justify-between text-left rounded-lg bg-white border border-neutral-bg p-4 hover:border-brand-blueLight transition-colors"
                >
                  <div>
                    <p className="font-medium text-brand-blue text-sm">
                      {est.nombre} {est.apellido}
                    </p>
                    <p className="text-xs text-neutral-text">
                      {est.cedula} · {est.email}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0 ml-3">
                    {pestana === "graduadas" ? (
                      <span className="text-xs font-medium px-3 py-1 rounded-full bg-status-success text-white">
                        Graduada
                      </span>
                    ) : (
                      <span className={`text-xs font-medium px-3 py-1 rounded-full ${etiquetaPago[estado].clase}`}>
                        {etiquetaPago[estado].texto}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {!cargando && (
            <Paginacion
              paginaActual={pagina}
              totalPaginas={totalPaginas}
              onCambiarPagina={irAPagina}
            />
          )}
        </>
      )}

      {seleccionada && (
        <div>
          <button
            onClick={() => setSeleccionada(null)}
            className="text-sm text-brand-blueLight hover:underline mb-4 block"
          >
            ← Volver a la lista
          </button>

          <div className="rounded-xl bg-white border border-neutral-bg p-6 mb-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display font-semibold text-brand-blue">
                  {seleccionada.nombre} {seleccionada.apellido}
                </p>
                <p className="text-xs text-neutral-text">
                  {seleccionada.cedula} · {seleccionada.email}
                </p>
              </div>
              {seleccionada.activo ? (
                <button
                  onClick={() => cambiarEstadoCuenta(false)}
                  disabled={cambiandoEstado}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg border border-neutral-bg text-neutral-text hover:border-brand-pink hover:text-brand-pink transition-colors shrink-0 disabled:opacity-50"
                >
                  {cambiandoEstado ? "..." : "Archivar cuenta"}
                </button>
              ) : (
                <button
                  onClick={() => cambiarEstadoCuenta(true)}
                  disabled={cambiandoEstado}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg border border-status-success text-status-success hover:bg-status-success hover:text-white transition-colors shrink-0 disabled:opacity-50"
                >
                  {cambiandoEstado ? "..." : "Reactivar cuenta"}
                </button>
              )}
            </div>
            {!seleccionada.activo && (
              <p className="text-xs text-neutral-text mt-3 bg-neutral-bg rounded-lg px-3 py-2">
                Esta cuenta está archivada — no puede iniciar sesión mientras esté así.
              </p>
            )}
          </div>

          {cargandoDetalle && <p className="text-sm text-neutral-text">Cargando...</p>}

          {!cargandoDetalle && progreso && (
            <div className="rounded-xl bg-white border border-neutral-bg p-6 mb-4">
              <p className="text-sm text-neutral-text mb-2">
                Sesión desbloqueada actualmente:{" "}
                <span className="font-medium text-brand-blue">
                  {progreso.sesionActualDesbloqueada || "ninguna"}
                </span>
              </p>
              <p className="text-sm text-neutral-text">
                Curso completo:{" "}
                <span className={progreso.cursoCompletado ? "text-status-success font-medium" : ""}>
                  {progreso.cursoCompletado ? "Sí" : "No"}
                </span>
              </p>
            </div>
          )}

          {!cargandoDetalle && !progreso && (
            <div className="rounded-lg bg-brand-pinkLight border border-brand-pink p-4 text-sm text-brand-blue mb-4">
              Sin pago confirmado — no tiene progreso todavía.
            </div>
          )}

          {!cargandoDetalle && intentos.length > 0 && (
            <div className="grid gap-2">
              <p className="text-sm font-medium text-neutral-text mb-1">
                Historial de exámenes
              </p>
              {intentos.map((intento) => (
                <div
                  key={intento._id}
                  className="flex items-center justify-between rounded-lg bg-white border border-neutral-bg p-4"
                >
                  <div>
                    <p className="text-sm font-medium text-brand-blue">
                      Sesión {intento.sesionId?.numero ?? "?"} · Intento {intento.numeroIntento}
                    </p>
                    <p className="text-xs text-neutral-text">
                      {intento.fechaFin ? "Entregado" : "En curso / sin entregar"}
                    </p>
                  </div>
                  {intento.calificacion !== null && (
                    <span
                      className={`text-xs font-medium px-3 py-1 rounded-full ${intento.aprobado
                        ? "bg-status-success text-white"
                        : "bg-brand-pink text-white"
                        }`}
                    >
                      {intento.calificacion}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {!cargandoDetalle && intentos.length === 0 && progreso && (
            <p className="text-sm text-neutral-text">
              Todavía no ha tomado ningún examen.
            </p>
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