"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

type Tipo = "entrada" | "salida";
type Categoria =
  | "inscripcion"
  | "sueldo"
  | "materiales"
  | "transporte"
  | "publicidad"
  | "otro";

type Movimiento = {
  _id: string;
  tipo: Tipo;
  categoria: Categoria;
  monto: number;
  descripcion?: string;
  fecha: string;
};

type Balance = {
  _id: string;
  mes: number;
  anio: number;
  totalEntradas: number;
  totalSalidas: number;
  saldo: number;
  urlPDF: string;
};

const CATEGORIAS: Categoria[] = [
  "inscripcion",
  "sueldo",
  "materiales",
  "transporte",
  "publicidad",
  "otro",
];

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function formularioMovimientoVacio() {
  const hoy = new Date().toISOString().slice(0, 10);
  return {
    tipo: "entrada" as Tipo,
    categoria: "otro" as Categoria,
    monto: "",
    descripcion: "",
    fecha: hoy,
  };
}

export default function PanelContabilidadPage() {
  const { token } = useAuth();

  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [cargandoMovimientos, setCargandoMovimientos] = useState(true);

  const [filtroMes, setFiltroMes] = useState("");
  const [filtroAnio, setFiltroAnio] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<"" | Tipo>("");
  const [filtroCategoria, setFiltroCategoria] = useState<"" | Categoria>("");

  const [formMovimiento, setFormMovimiento] = useState(formularioMovimientoVacio());
  const [guardandoMovimiento, setGuardandoMovimiento] = useState(false);

  const [balances, setBalances] = useState<Balance[]>([]);
  const [cargandoBalances, setCargandoBalances] = useState(true);
  const [mesBalance, setMesBalance] = useState(String(new Date().getMonth() + 1));
  const [anioBalance, setAnioBalance] = useState(String(new Date().getFullYear()));
  const [generandoBalance, setGenerandoBalance] = useState(false);

  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  // Carga inicial: movimientos sin filtro + balances. Efecto solo al montar.
  useEffect(() => {
    if (!token) return;
    let cancelado = false;

    (async () => {
      try {
        const [resMov, resBal] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/contabilidad/movimientos`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/contabilidad/balances`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        const jsonMov = await resMov.json();
        const jsonBal = await resBal.json();

        if (!cancelado) {
          if (jsonMov.success) setMovimientos(jsonMov.data);
          if (jsonBal.success) setBalances(jsonBal.data);
        }
      } catch {
        if (!cancelado) {
          setMensaje({ tipo: "error", texto: "No pudimos cargar la información contable." });
        }
      } finally {
        if (!cancelado) {
          setCargandoMovimientos(false);
          setCargandoBalances(false);
        }
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [token]);

  // Filtrar es un evento (botón), no un efecto — seguro llamar aquí directo.
  async function aplicarFiltros() {
    setCargandoMovimientos(true);
    setMensaje(null);
    try {
      const params = new URLSearchParams();
      if (filtroMes) params.set("mes", filtroMes);
      if (filtroAnio) params.set("anio", filtroAnio);
      if (filtroTipo) params.set("tipo", filtroTipo);
      if (filtroCategoria) params.set("categoria", filtroCategoria);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/contabilidad/movimientos?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const json = await res.json();
      if (json.success) setMovimientos(json.data);
    } catch {
      setMensaje({ tipo: "error", texto: "No pudimos filtrar los movimientos." });
    } finally {
      setCargandoMovimientos(false);
    }
  }

  async function registrarMovimiento(e: React.FormEvent) {
    e.preventDefault();
    setGuardandoMovimiento(true);
    setMensaje(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/contabilidad/movimientos`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tipo: formMovimiento.tipo,
            categoria: formMovimiento.categoria,
            monto: Number(formMovimiento.monto),
            descripcion: formMovimiento.descripcion || undefined,
            fecha: formMovimiento.fecha,
          }),
        },
      );
      const json = await res.json();

      if (json.success) {
        setMensaje({ tipo: "ok", texto: "Movimiento registrado." });
        setFormMovimiento(formularioMovimientoVacio());
        aplicarFiltros();
      } else {
        setMensaje({ tipo: "error", texto: json.error || "No se pudo registrar." });
      }
    } catch {
      setMensaje({ tipo: "error", texto: "No pudimos conectar con el servidor." });
    } finally {
      setGuardandoMovimiento(false);
    }
  }

  async function generarBalance() {
    setGenerandoBalance(true);
    setMensaje(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/contabilidad/balances/generar`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ mes: Number(mesBalance), anio: Number(anioBalance) }),
        },
      );
      const json = await res.json();

      if (json.success) {
        setMensaje({
          tipo: "ok",
          texto: `Balance de ${MESES[Number(mesBalance) - 1]} ${anioBalance} generado.`,
        });
        const resBal = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/contabilidad/balances`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const jsonBal = await resBal.json();
        if (jsonBal.success) setBalances(jsonBal.data);
      } else {
        setMensaje({ tipo: "error", texto: json.error || "No se pudo generar el balance." });
      }
    } catch {
      setMensaje({ tipo: "error", texto: "No pudimos conectar con el servidor." });
    } finally {
      setGenerandoBalance(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="font-display text-2xl font-bold text-brand-blue mb-1">
        Contabilidad
      </h2>
      <p className="text-sm text-neutral-text mb-8">
        Registra movimientos manuales y genera el balance mensual en PDF. Los
        pagos de inscripción se registran solos al confirmarse — no los
        dupliques aquí.
      </p>

      {/* --- Registrar movimiento --- */}
      <div className="rounded-xl bg-white border border-neutral-bg p-6 mb-10">
        <h3 className="font-display font-semibold text-brand-blue mb-4">
          Registrar movimiento
        </h3>
        <form onSubmit={registrarMovimiento} className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <label className="text-sm text-neutral-text">
              Tipo
              <select
                value={formMovimiento.tipo}
                onChange={(e) =>
                  setFormMovimiento((prev) => ({ ...prev, tipo: e.target.value as Tipo }))
                }
                className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
              >
                <option value="entrada">Entrada</option>
                <option value="salida">Salida</option>
              </select>
            </label>

            <label className="text-sm text-neutral-text">
              Categoría
              <select
                value={formMovimiento.categoria}
                onChange={(e) =>
                  setFormMovimiento((prev) => ({
                    ...prev,
                    categoria: e.target.value as Categoria,
                  }))
                }
                className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
              >
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="text-sm text-neutral-text">
              Monto (RD$)
              <input
                type="number"
                required
                min={0}
                value={formMovimiento.monto}
                onChange={(e) =>
                  setFormMovimiento((prev) => ({ ...prev, monto: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
              />
            </label>

            <label className="text-sm text-neutral-text">
              Fecha
              <input
                type="date"
                value={formMovimiento.fecha}
                onChange={(e) =>
                  setFormMovimiento((prev) => ({ ...prev, fecha: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
              />
            </label>
          </div>

          <label className="text-sm text-neutral-text">
            Descripción (opcional)
            <input
              type="text"
              value={formMovimiento.descripcion}
              onChange={(e) =>
                setFormMovimiento((prev) => ({ ...prev, descripcion: e.target.value }))
              }
              className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
            />
          </label>

          <button
            type="submit"
            disabled={guardandoMovimiento}
            className="rounded-lg bg-brand-pink text-white text-sm px-4 py-2 font-medium hover:opacity-90 disabled:opacity-60 w-fit"
          >
            {guardandoMovimiento ? "Guardando..." : "Registrar"}
          </button>
        </form>
      </div>

      {/* --- Filtros + listado de movimientos --- */}
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <label className="text-xs text-neutral-text">
          Mes
          <select
            value={filtroMes}
            onChange={(e) => setFiltroMes(e.target.value)}
            className="mt-1 block rounded-lg border border-neutral-bg px-2 py-1.5 text-sm"
          >
            <option value="">Todos</option>
            {MESES.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs text-neutral-text">
          Año
          <input
            type="number"
            value={filtroAnio}
            onChange={(e) => setFiltroAnio(e.target.value)}
            placeholder="2026"
            className="mt-1 block w-24 rounded-lg border border-neutral-bg px-2 py-1.5 text-sm"
          />
        </label>

        <label className="text-xs text-neutral-text">
          Tipo
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value as "" | Tipo)}
            className="mt-1 block rounded-lg border border-neutral-bg px-2 py-1.5 text-sm"
          >
            <option value="">Todos</option>
            <option value="entrada">Entrada</option>
            <option value="salida">Salida</option>
          </select>
        </label>

        <label className="text-xs text-neutral-text">
          Categoría
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value as "" | Categoria)}
            className="mt-1 block rounded-lg border border-neutral-bg px-2 py-1.5 text-sm"
          >
            <option value="">Todas</option>
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <button
          onClick={aplicarFiltros}
          className="rounded-lg bg-brand-blue text-white text-sm px-4 py-2 font-medium hover:opacity-90"
        >
          Filtrar
        </button>
      </div>

      {cargandoMovimientos && <p className="text-sm text-neutral-text">Cargando...</p>}

      {!cargandoMovimientos && movimientos.length === 0 && (
        <p className="text-sm text-neutral-text mb-8">No hay movimientos para mostrar.</p>
      )}

      <div className="grid gap-2 mb-10">
        {movimientos.map((m) => (
          <div
            key={m._id}
            className="flex items-center justify-between rounded-lg bg-white border border-neutral-bg p-3"
          >
            <div>
              <p className="text-sm text-neutral-text">
                <span
                  className={`font-medium ${m.tipo === "entrada" ? "text-status-success" : "text-brand-pink"
                    }`}
                >
                  {m.tipo === "entrada" ? "+" : "−"} RD${m.monto}
                </span>{" "}
                · {m.categoria}
                {m.descripcion ? ` · ${m.descripcion}` : ""}
              </p>
              <p className="text-xs text-neutral-text">
                {new Date(m.fecha).toLocaleDateString("es-DO")}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* --- Balances mensuales --- */}
      <div className="rounded-xl bg-white border border-neutral-bg p-6 mb-8">
        <h3 className="font-display font-semibold text-brand-blue mb-4">
          Generar balance mensual
        </h3>
        <p className="text-xs text-neutral-text mb-4">
          Generar de nuevo el mismo mes/año reemplaza el balance anterior —
          útil si corriges un movimiento después de haberlo generado.
        </p>
        <div className="flex items-end gap-3">
          <label className="text-sm text-neutral-text">
            Mes
            <select
              value={mesBalance}
              onChange={(e) => setMesBalance(e.target.value)}
              className="mt-1 block rounded-lg border border-neutral-bg px-3 py-2 text-sm"
            >
              {MESES.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-neutral-text">
            Año
            <input
              type="number"
              value={anioBalance}
              onChange={(e) => setAnioBalance(e.target.value)}
              className="mt-1 block w-24 rounded-lg border border-neutral-bg px-3 py-2 text-sm"
            />
          </label>

          <button
            onClick={generarBalance}
            disabled={generandoBalance}
            className="rounded-lg bg-brand-pink text-white text-sm px-4 py-2 font-medium hover:opacity-90 disabled:opacity-60"
          >
            {generandoBalance ? "Generando..." : "Generar balance"}
          </button>
        </div>
      </div>

      <h3 className="font-display font-semibold text-brand-blue mb-3">
        Historial de balances
      </h3>

      {cargandoBalances && <p className="text-sm text-neutral-text">Cargando...</p>}

      {!cargandoBalances && balances.length === 0 && (
        <p className="text-sm text-neutral-text">Todavía no se ha generado ningún balance.</p>
      )}

      <div className="grid gap-2">
        {balances.map((b) => (
          <a
            key={b._id}
            href={b.urlPDF}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-lg bg-white border border-neutral-bg p-4 hover:border-brand-blueLight transition-colors"
          >
            <p className="text-sm font-medium text-brand-blue">
              {MESES[b.mes - 1]} {b.anio}
            </p>
            <p className="text-xs text-neutral-text">
              Entradas RD${b.totalEntradas} · Salidas RD${b.totalSalidas} · Saldo{" "}
              <span className={b.saldo >= 0 ? "text-status-success" : "text-brand-pink"}>
                RD${b.saldo}
              </span>
            </p>
          </a>
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