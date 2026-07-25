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

type EstadoPago = "pendiente" | "pendiente_verificacion" | "pagado" | "rechazado";

type Inscripcion = {
  _id: string;
  userId: Estudiante;
  tipoPlan: "normal" | "vip";
  monto: number;
  estadoPago: EstadoPago;
  fechaPago: string | null;
  createdAt: string;
  // --- campos del flujo de auto-inscripción con voucher ---
  comprobanteUrl?: string | null;
  bancoEmisor?: string | null;
  numeroReferencia?: string | null;
  fechaDeposito?: string | null;
  notaRechazo?: string | null;
};

type Precios = { precio_plan_normal: number; precio_plan_vip: number };

function formatearFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString("es-DO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const FILTROS: { valor: "" | EstadoPago; etiqueta: string }[] = [
  { valor: "", etiqueta: "Todas" },
  { valor: "pendiente_verificacion", etiqueta: "Por verificar" },
  { valor: "pendiente", etiqueta: "Pendientes (efectivo)" },
  { valor: "pagado", etiqueta: "Pagadas" },
  { valor: "rechazado", etiqueta: "Rechazadas" },
];

export default function PanelPagosPage() {
  const { token } = useAuth();

  // --- Nueva inscripción (flujo manual/efectivo, sin cambios) ---
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<Estudiante[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [estudianteElegida, setEstudianteElegida] = useState<Estudiante | null>(
    null,
  );
  const [tipoPlan, setTipoPlan] = useState<"normal" | "vip">("normal");
  const [monto, setMonto] = useState<string>("");
  const [precios, setPrecios] = useState<Precios | null>(null);
  const [creando, setCreando] = useState(false);

  // --- Listado ---
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [filtro, setFiltro] = useState<"" | EstadoPago>("pendiente_verificacion");
  const [cargandoLista, setCargandoLista] = useState(true);
  const [procesandoId, setProcesandoId] = useState<string | null>(null);

  const [mensaje, setMensaje] = useState<{
    tipo: "ok" | "error";
    texto: string;
  } | null>(null);

  useEffect(() => {
    async function cargarPrecios() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/configuracion`,
        );
        const json = await res.json();
        if (json.success) {
          setPrecios(json.data);
          setMonto(String(json.data.precio_plan_normal));
        }
      } catch {
        // si falla, la coordinadora simplemente escribe el monto a mano
      }
    }
    cargarPrecios();
  }, []);

  function cambiarPlan(valor: "normal" | "vip") {
    setTipoPlan(valor);
    if (precios) {
      setMonto(
        String(valor === "vip" ? precios.precio_plan_vip : precios.precio_plan_normal),
      );
    }
  }

  async function cargarInscripciones(estado: "" | EstadoPago) {
    try {
      const query = estado ? `?estadoPago=${estado}` : "";
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/inscripciones${query}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const json = await res.json();
      if (json.success) setInscripciones(json.data);
    } catch {
      setMensaje({ tipo: "error", texto: "No pudimos cargar las inscripciones." });
    } finally {
      setCargandoLista(false);
    }
  }

  useEffect(() => {
    if (!token) return;
    let cancelado = false;

    (async () => {
      try {
        const query = filtro ? `?estadoPago=${filtro}` : "";
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/inscripciones${query}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const json = await res.json();
        if (!cancelado && json.success) setInscripciones(json.data);
      } catch {
        if (!cancelado) {
          setMensaje({ tipo: "error", texto: "No pudimos cargar las inscripciones." });
        }
      } finally {
        if (!cancelado) setCargandoLista(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [token, filtro]);

  function cambiarFiltro(valor: "" | EstadoPago) {
    setCargandoLista(true);
    setFiltro(valor);
  }

  async function buscarEstudiantes(e: React.FormEvent) {
    e.preventDefault();
    setBuscando(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/usuarios?rol=estudiante&search=${encodeURIComponent(busqueda)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const json = await res.json();
      if (json.success) setResultados(json.data);
    } catch {
      setMensaje({ tipo: "error", texto: "No pudimos buscar estudiantes." });
    } finally {
      setBuscando(false);
    }
  }

  async function crearInscripcion(e: React.FormEvent) {
    e.preventDefault();
    if (!estudianteElegida) return;
    setCreando(true);
    setMensaje(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/inscripciones`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: estudianteElegida._id,
            tipoPlan,
            monto: Number(monto),
          }),
        },
      );
      const json = await res.json();

      if (json.success) {
        setMensaje({
          tipo: "ok",
          texto: `Inscripción creada para ${estudianteElegida.nombre}. Ya aparece como pendiente de pago abajo.`,
        });
        setEstudianteElegida(null);
        setResultados([]);
        setBusqueda("");
        cargarInscripciones(filtro);
      } else {
        setMensaje({ tipo: "error", texto: json.error || "No se pudo crear." });
      }
    } catch {
      setMensaje({ tipo: "error", texto: "No pudimos conectar con el servidor." });
    } finally {
      setCreando(false);
    }
  }

  async function confirmarPago(inscripcion: Inscripcion) {
    setProcesandoId(inscripcion._id);
    setMensaje(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/inscripciones/${inscripcion._id}/confirmar-pago`,
        { method: "PATCH", headers: { Authorization: `Bearer ${token}` } },
      );
      const json = await res.json();

      if (json.success) {
        setMensaje({
          tipo: "ok",
          texto: `Pago confirmado para ${inscripcion.userId.nombre}. Ya puede ver la Sesión 1 en su Aula Virtual.`,
        });
        cargarInscripciones(filtro);
      } else {
        setMensaje({ tipo: "error", texto: json.error || "No se pudo confirmar." });
      }
    } catch {
      setMensaje({ tipo: "error", texto: "No pudimos conectar con el servidor." });
    } finally {
      setProcesandoId(null);
    }
  }

  async function rechazarPago(inscripcion: Inscripcion) {
    const motivo = window.prompt(
      `¿Por qué se rechaza el comprobante de ${inscripcion.userId?.nombre}? (esto lo verá la estudiante)`,
    );
    if (!motivo || !motivo.trim()) return;

    setProcesandoId(inscripcion._id);
    setMensaje(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/inscripciones/${inscripcion._id}/rechazar-pago`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ motivo: motivo.trim() }),
        },
      );
      const json = await res.json();

      if (json.success) {
        setMensaje({
          tipo: "ok",
          texto: `Comprobante rechazado. ${inscripcion.userId?.nombre} podrá reenviarlo.`,
        });
        cargarInscripciones(filtro);
      } else {
        setMensaje({ tipo: "error", texto: json.error || "No se pudo rechazar." });
      }
    } catch {
      setMensaje({ tipo: "error", texto: "No pudimos conectar con el servidor." });
    } finally {
      setProcesandoId(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="font-display text-2xl font-bold text-brand-blue mb-1">
        Pagos e inscripciones
      </h2>
      <p className="text-sm text-neutral-text mb-8">
        Verifica los comprobantes de transferencia, registra inscripciones en
        efectivo y confirma los pagos recibidos.
      </p>

      {/* --- Nueva inscripción (efectivo/presencial) --- */}
      <div className="rounded-xl bg-white border border-neutral-bg p-6 mb-10">
        <h3 className="font-display font-semibold text-brand-blue mb-4">
          Nueva inscripción (efectivo/presencial)
        </h3>

        {!estudianteElegida && (
          <>
            <form onSubmit={buscarEstudiantes} className="flex gap-2 mb-4">
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Nombre, cédula o email de la estudiante..."
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

            {resultados.length > 0 && (
              <div className="grid gap-2">
                {resultados.map((est) => (
                  <button
                    key={est._id}
                    onClick={() => setEstudianteElegida(est)}
                    className="text-left rounded-lg border border-neutral-bg p-3 hover:border-brand-blueLight transition-colors"
                  >
                    <p className="font-medium text-brand-blue text-sm">
                      {est.nombre} {est.apellido}
                    </p>
                    <p className="text-xs text-neutral-text">
                      {est.cedula} · {est.email}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {estudianteElegida && (
          <form onSubmit={crearInscripcion} className="grid gap-4">
            <div className="flex items-center justify-between rounded-lg bg-neutral-bg p-3">
              <p className="text-sm text-brand-blue font-medium">
                {estudianteElegida.nombre} {estudianteElegida.apellido}
              </p>
              <button
                type="button"
                onClick={() => setEstudianteElegida(null)}
                className="text-xs text-brand-blueLight hover:underline"
              >
                Cambiar
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="text-sm text-neutral-text">
                Plan
                <select
                  value={tipoPlan}
                  onChange={(e) => cambiarPlan(e.target.value as "normal" | "vip")}
                  className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
                >
                  <option value="normal">Normal</option>
                  <option value="vip">VIP</option>
                </select>
              </label>

              <label className="text-sm text-neutral-text">
                Monto (RD$)
                <input
                  type="number"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
                  required
                  min={0}
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={creando}
              className="rounded-lg bg-brand-pink text-white px-5 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-60"
            >
              {creando ? "Creando..." : "Crear inscripción"}
            </button>
          </form>
        )}
      </div>

      {/* --- Listado --- */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {FILTROS.map(({ valor, etiqueta }) => (
          <button
            key={valor}
            onClick={() => cambiarFiltro(valor)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${filtro === valor
              ? "bg-brand-blue text-white"
              : "bg-white border border-neutral-bg text-neutral-text"
              }`}
          >
            {etiqueta}
          </button>
        ))}
      </div>

      {cargandoLista && (
        <p className="text-sm text-neutral-text">Cargando inscripciones...</p>
      )}

      {!cargandoLista && inscripciones.length === 0 && (
        <p className="text-sm text-neutral-text">No hay inscripciones para mostrar.</p>
      )}

      <div className="grid gap-3">
        {inscripciones.map((ins) => (
          <div
            key={ins._id}
            className="rounded-lg bg-white border border-neutral-bg p-4"
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-3">
                {ins.comprobanteUrl && (
                  <a
                    href={ins.comprobanteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Ver comprobante completo"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={ins.comprobanteUrl}
                      alt="Comprobante de depósito"
                      className="w-16 h-16 object-cover rounded-lg border border-neutral-bg hover:opacity-80 transition-opacity"
                    />
                  </a>
                )}

                <div>
                  <p className="font-medium text-brand-blue text-sm">
                    {ins.userId?.nombre} {ins.userId?.apellido}
                  </p>
                  <p className="text-xs text-neutral-text">
                    Plan {ins.tipoPlan} · RD${ins.monto}
                  </p>
                  {ins.bancoEmisor && (
                    <p className="text-xs text-neutral-text mt-1">
                      {ins.bancoEmisor}
                      {ins.numeroReferencia && ` · Ref: ${ins.numeroReferencia}`}
                      {ins.fechaDeposito && ` · ${formatearFecha(ins.fechaDeposito)}`}
                    </p>
                  )}
                  {ins.estadoPago === "rechazado" && ins.notaRechazo && (
                    <p className="text-xs text-brand-pink mt-1">
                      Rechazado: {ins.notaRechazo}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {ins.estadoPago === "pagado" && (
                  <span className="text-xs font-medium px-3 py-1 rounded-full bg-status-success text-white">
                    Pagado
                  </span>
                )}

                {ins.estadoPago === "rechazado" && (
                  <span className="text-xs font-medium px-3 py-1 rounded-full bg-neutral-bg text-neutral-text">
                    Rechazado
                  </span>
                )}

                {(ins.estadoPago === "pendiente" ||
                  ins.estadoPago === "pendiente_verificacion") && (
                    <>
                      {ins.estadoPago === "pendiente_verificacion" && (
                        <button
                          onClick={() => rechazarPago(ins)}
                          disabled={procesandoId === ins._id}
                          className="text-xs font-medium px-3 py-1.5 rounded-full bg-white border border-brand-pink text-brand-pink hover:bg-brand-pinkLight disabled:opacity-60"
                        >
                          Rechazar
                        </button>
                      )}
                      <button
                        onClick={() => confirmarPago(ins)}
                        disabled={procesandoId === ins._id}
                        className="text-xs font-medium px-3 py-1.5 rounded-full bg-brand-pink text-white hover:opacity-90 disabled:opacity-60"
                      >
                        {procesandoId === ins._id ? "Procesando..." : "Confirmar pago"}
                      </button>
                    </>
                  )}
              </div>
            </div>
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