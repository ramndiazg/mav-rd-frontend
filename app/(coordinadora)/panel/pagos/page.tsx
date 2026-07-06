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

type Inscripcion = {
  _id: string;
  userId: Estudiante;
  tipoPlan: "normal" | "vip";
  monto: number;
  estadoPago: "pendiente" | "pagado";
  fechaPago: string | null;
  createdAt: string;
};

type Precios = { precio_plan_normal: number; precio_plan_vip: number };

export default function PanelPagosPage() {
  const { token } = useAuth();

  // --- Nueva inscripción ---
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
  const [filtro, setFiltro] = useState<"" | "pendiente" | "pagado">("");
  const [cargandoLista, setCargandoLista] = useState(true);
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);

  const [mensaje, setMensaje] = useState<{
    tipo: "ok" | "error";
    texto: string;
  } | null>(null);

  // Precios configurados (público, para prellenar el monto por plan)
  useEffect(() => {
    async function cargarPrecios() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/configuracion`,
        );
        const json = await res.json();
        if (json.success) {
          setPrecios(json.data);
          // Plan por defecto al montar es "normal" — prellenamos con ese precio
          setMonto(String(json.data.precio_plan_normal));
        }
      } catch {
        // si falla, la coordinadora simplemente escribe el monto a mano
      }
    }
    cargarPrecios();
  }, []);

  // Cuando la coordinadora cambia el plan, recalculamos el monto sugerido
  // directamente en el evento (no en un efecto) — sigue siendo editable después.
  function cambiarPlan(valor: "normal" | "vip") {
    setTipoPlan(valor);
    if (precios) {
      setMonto(
        String(valor === "vip" ? precios.precio_plan_vip : precios.precio_plan_normal),
      );
    }
  }

  async function cargarInscripciones(estado: "" | "pendiente" | "pagado") {
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

  // El cambio de filtro sí es un evento (no un efecto), así que aquí es
  // seguro poner el loading en true sincrónicamente antes de recargar.
  function cambiarFiltro(valor: "" | "pendiente" | "pagado") {
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
    setConfirmandoId(inscripcion._id);
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
      setConfirmandoId(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="font-display text-2xl font-bold text-brand-blue mb-1">
        Pagos e inscripciones
      </h2>
      <p className="text-sm text-neutral-text mb-8">
        Registra una inscripción nueva y confirma los pagos recibidos en
        efectivo.
      </p>

      {/* --- Nueva inscripción --- */}
      <div className="rounded-xl bg-white border border-neutral-bg p-6 mb-10">
        <h3 className="font-display font-semibold text-brand-blue mb-4">
          Nueva inscripción
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
      <div className="flex items-center gap-2 mb-4">
        {(["", "pendiente", "pagado"] as const).map((valor) => (
          <button
            key={valor}
            onClick={() => cambiarFiltro(valor)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${filtro === valor
              ? "bg-brand-blue text-white"
              : "bg-white border border-neutral-bg text-neutral-text"
              }`}
          >
            {valor === "" ? "Todas" : valor === "pendiente" ? "Pendientes" : "Pagadas"}
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
            className="flex items-center justify-between rounded-lg bg-white border border-neutral-bg p-4"
          >
            <div>
              <p className="font-medium text-brand-blue text-sm">
                {ins.userId?.nombre} {ins.userId?.apellido}
              </p>
              <p className="text-xs text-neutral-text">
                Plan {ins.tipoPlan} · RD${ins.monto}
              </p>
            </div>

            {ins.estadoPago === "pagado" ? (
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-status-success text-white">
                Pagado
              </span>
            ) : (
              <button
                onClick={() => confirmarPago(ins)}
                disabled={confirmandoId === ins._id}
                className="text-xs font-medium px-3 py-1.5 rounded-full bg-brand-pink text-white hover:opacity-90 disabled:opacity-60"
              >
                {confirmandoId === ins._id ? "Confirmando..." : "Confirmar pago"}
              </button>
            )}
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