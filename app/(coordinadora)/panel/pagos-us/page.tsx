"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRevalidar } from "@/hooks/useRevalidar";
import { apiFetch } from "@/lib/api";
import Paginacion from "@/components/ui/Paginacion";

// NUEVO (24/10/2026): panel de pagos del curso Driver Prep USA. Los pagos son
// envíos de dinero con foto del recibo: la coordinadora compara el recibo con
// lo que la estudiante escribió, mira el estado de cuenta (o confirma el cobro
// en la agencia) y entonces confirma indicando los PESOS que realmente
// recibió (ese valor entra a la contabilidad en RD$). Todo en español: lo usa
// el equipo de RD. Usa el token de RD (no el de la estudiante de EE. UU.).

type Estado = "creado" | "pendiente_verificacion" | "pagado" | "rechazado" | "reembolsado" | "disputado";

type Item = {
  _id: string;
  userId: string;
  estadoUS: string;
  montoCentavos: number;
  metodoPago: string;
  estadoPago: Estado;
  fechaPago: string | null;
  notaRechazo: string | null;
  montoRecibidoRD?: number;
  createdAt: string;
  updatedAt: string;
  // NUEVO (27/10/2026): pago con PayPal (enlace PayPal.Me + ID de transacción).
  pagoExterno?: {
    proveedor: string;
    idExterno: string;
    pagador: string;
    montoEnviadoCentavos: number;
    fechaEnvio: string;
    comprobanteUrl: string | null;
  };
  remesa?: {
    via: "deposito" | "efectivo";
    agencia: string;
    numeroControl: string;
    remitente: string;
    montoEnviadoCentavos: number;
    fechaEnvio: string;
    comprobanteUrl: string;
  };
  usuario: {
    _id: string;
    nombre: string;
    apellido: string;
    email: string;
    telefono?: string;
    estadoUS?: string;
    idioma?: string;
  } | null;
};

type Respuesta = {
  items: Item[];
  total: number;
  pagina: number;
  totalPaginas: number;
  resumen: Record<string, { cantidad: number; montoCentavos: number }>;
};

type Accion = { id: string; tipo: "confirmar" | "rechazar" | "reembolsar" };

const FILTROS: { valor: "" | Estado; etiqueta: string }[] = [
  { valor: "pendiente_verificacion", etiqueta: "Por verificar" },
  { valor: "pagado", etiqueta: "Pagadas" },
  { valor: "rechazado", etiqueta: "Rechazadas" },
  { valor: "reembolsado", etiqueta: "Reembolsadas" },
  { valor: "creado", etiqueta: "Sin enviar" },
  { valor: "", etiqueta: "Todas" },
];

const ETIQUETA_ESTADO: Record<Estado, { texto: string; clase: string }> = {
  creado: { texto: "Sin enviar", clase: "bg-neutral-bg text-neutral-text" },
  pendiente_verificacion: { texto: "Por verificar", clase: "bg-brand-blue-light text-white" },
  pagado: { texto: "Pagado", clase: "bg-status-success text-white" },
  rechazado: { texto: "Rechazado", clase: "bg-neutral-text text-white" },
  reembolsado: { texto: "Reembolsado", clase: "bg-brand-pink text-white" },
  disputado: { texto: "En disputa", clase: "bg-brand-pink text-white" },
};

const MOTIVOS_RAPIDOS = [
  "Recibo ilegible",
  "Monto menor al precio",
  "El beneficiario no coincide",
  "Los datos del recibo no coinciden con lo escrito",
];

const usd = (centavos: number) =>
  (centavos / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });

// NUEVO (27/10/2026)
const etiquetaMetodo = (metodo: string) =>
  metodo === "remesa_deposito" ? "Depósito a cuenta" : metodo === "paypal" ? "PayPal" : "Retiro en efectivo";

const fechaHora = (iso: string) =>
  new Date(iso).toLocaleString("es-DO", { dateStyle: "medium", timeStyle: "short" });

// "western_union" → "Western Union"
const nombreAgencia = (id: string) =>
  id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function PanelPagosUSPage() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === "admin";

  const [filtro, setFiltro] = useState<"" | Estado>("pendiente_verificacion");
  const [metodo, setMetodo] = useState("");
  const [pagina, setPagina] = useState(1);
  const [datos, setDatos] = useState<Respuesta | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [recarga, setRecarga] = useState(0);

  const [accion, setAccion] = useState<Accion | null>(null);
  const [montoRD, setMontoRD] = useState("");
  const [motivo, setMotivo] = useState("");
  const [nota, setNota] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  // Carga (y recarga) la lista según filtros y página.
  useEffect(() => {
    let cancelado = false;
    async function traer() {
      try {
        const params = new URLSearchParams({ pagina: String(pagina), limite: "20" });
        if (filtro) params.set("estadoPago", filtro);
        if (metodo) params.set("metodo", metodo);
        const respuesta = await apiFetch<Respuesta>(`/us/admin/inscripciones?${params}`);
        if (cancelado) return;
        setDatos(respuesta);
        setError("");
      } catch (e) {
        if (!cancelado) setError(e instanceof Error ? e.message : "No se pudo cargar la lista.");
      } finally {
        if (!cancelado) setCargando(false);
      }
    }
    void traer();
    return () => {
      cancelado = true;
    };
  }, [filtro, metodo, pagina, recarga]);

  // Un pago nuevo aparece solo: al volver a la pestaña y cada 60 s mientras
  // se mira "Por verificar".
  const refrescar = useCallback(async () => {
    setRecarga((n) => n + 1);
  }, []);
  useRevalidar(refrescar, { activo: filtro === "pendiente_verificacion", intervaloMs: 60000 });

  function cambiarFiltro(valor: "" | Estado) {
    setFiltro(valor);
    setPagina(1);
    setCargando(true);
    setAccion(null);
  }

  function abrirAccion(id: string, tipo: Accion["tipo"]) {
    setAccion({ id, tipo });
    setMontoRD("");
    setMotivo("");
    setNota("");
    setMensaje(null);
  }

  async function ejecutar(item: Item) {
    if (!accion) return;
    setProcesando(true);
    setMensaje(null);
    try {
      if (accion.tipo === "confirmar") {
        const monto = Number(montoRD.replace(",", "."));
        await apiFetch(`/us/admin/inscripciones/${item._id}/confirmar`, {
          method: "PATCH",
          body: JSON.stringify({ montoRecibidoRD: montoRD.trim() === "" ? undefined : monto }),
        });
        setMensaje({ tipo: "ok", texto: "Pago confirmado. La estudiante ya puede entrar al curso y recibió un correo." });
      } else if (accion.tipo === "rechazar") {
        await apiFetch(`/us/admin/inscripciones/${item._id}/rechazar`, {
          method: "PATCH",
          body: JSON.stringify({ motivo }),
        });
        setMensaje({ tipo: "ok", texto: "Comprobante rechazado. La estudiante recibió un correo con el motivo." });
      } else {
        await apiFetch(`/us/admin/inscripciones/${item._id}/reembolsar`, {
          method: "PATCH",
          body: JSON.stringify({ nota }),
        });
        setMensaje({
          tipo: "ok",
          texto: "Reembolso registrado y acceso cerrado. Recuerda devolver el dinero por remesa o depósito.",
        });
      }
      setAccion(null);
      setRecarga((n) => n + 1);
    } catch (e) {
      setMensaje({ tipo: "error", texto: e instanceof Error ? e.message : "No se pudo completar la acción." });
    } finally {
      setProcesando(false);
    }
  }

  const resumen = datos?.resumen ?? {};
  const porVerificar = resumen.pendiente_verificacion?.cantidad ?? 0;
  const pagadas = resumen.pagado;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-brand-blue">Pagos — Curso EE. UU.</h2>
          <p className="text-sm text-neutral-text">
            Envíos de dinero desde Estados Unidos. Compara el recibo con los datos escritos y con el estado de cuenta
            (o el cobro en agencia) antes de confirmar.
          </p>
        </div>
        {esAdmin && (
          <Link
            href="/panel/pagos-us/configuracion"
            className="rounded-lg border border-brand-blue px-4 py-2 text-sm font-medium text-brand-blue hover:bg-white"
          >
            Configuración del curso
          </Link>
        )}
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-bg bg-white p-4">
          <p className="text-xs text-neutral-text">Por verificar</p>
          <p className="font-display text-2xl font-bold text-brand-blue">{porVerificar}</p>
        </div>
        <div className="rounded-xl border border-neutral-bg bg-white p-4">
          <p className="text-xs text-neutral-text">Pagadas</p>
          <p className="font-display text-2xl font-bold text-brand-blue">{pagadas?.cantidad ?? 0}</p>
          <p className="text-xs text-neutral-text">{usd(pagadas?.montoCentavos ?? 0)} en total</p>
        </div>
        <div className="rounded-xl border border-neutral-bg bg-white p-4">
          <p className="text-xs text-neutral-text">Reembolsadas</p>
          <p className="font-display text-2xl font-bold text-brand-blue">{resumen.reembolsado?.cantidad ?? 0}</p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {FILTROS.map(({ valor, etiqueta }) => (
          <button
            key={etiqueta}
            onClick={() => cambiarFiltro(valor)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${filtro === valor ? "bg-brand-blue text-white" : "border border-neutral-bg bg-white text-neutral-text"
              }`}
          >
            {etiqueta}
          </button>
        ))}
        <select
          aria-label="Filtrar por método"
          value={metodo}
          onChange={(e) => {
            setMetodo(e.target.value);
            setPagina(1);
            setCargando(true);
          }}
          className="ml-auto rounded-lg border border-neutral-bg bg-white px-3 py-1.5 text-xs"
        >
          <option value="">Todos los métodos</option>
          <option value="remesa_deposito">Depósito a cuenta</option>
          <option value="remesa_efectivo">Retiro en efectivo</option>
          <option value="paypal">PayPal</option>
        </select>
      </div>

      {mensaje && (
        <div
          role={mensaje.tipo === "error" ? "alert" : "status"}
          className={`mb-4 rounded-lg p-4 text-sm ${mensaje.tipo === "ok"
            ? "border border-status-success bg-status-success/10 text-status-success"
            : "border border-brand-pink bg-brand-pink-light text-brand-blue"
            }`}
        >
          {mensaje.texto}
        </div>
      )}
      {error && <p className="mb-4 text-sm text-brand-pink">{error}</p>}
      {cargando && <p className="text-sm text-neutral-text">Cargando pagos...</p>}
      {!cargando && datos && datos.items.length === 0 && (
        <p className="text-sm text-neutral-text">No hay pagos para mostrar con este filtro.</p>
      )}

      <div className="grid gap-3">
        {datos?.items.map((item) => {
          const r = item.remesa;
          const pp = item.pagoExterno?.proveedor === "paypal" ? item.pagoExterno : null;
          const imagenRecibo = r?.comprobanteUrl || pp?.comprobanteUrl || null;
          const estado = ETIQUETA_ESTADO[item.estadoPago] ?? ETIQUETA_ESTADO.creado;
          const abierta = accion?.id === item._id ? accion.tipo : null;
          return (
            <div key={item._id} className="rounded-lg border border-neutral-bg bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  {imagenRecibo && (
                    <a href={imagenRecibo} target="_blank" rel="noopener noreferrer" title="Ver el recibo completo">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imagenRecibo}
                        alt="Recibo del envío"
                        className="h-20 w-20 rounded-lg border border-neutral-bg object-cover hover:opacity-80"
                      />
                    </a>
                  )}
                  <div className="text-sm">
                    <p className="font-medium text-brand-blue">
                      {item.usuario ? `${item.usuario.nombre} ${item.usuario.apellido}` : "(cuenta eliminada)"}{" "}
                      <span className="rounded bg-brand-blue px-1.5 py-0.5 text-[11px] font-bold text-white">
                        {item.estadoUS}
                      </span>
                    </p>
                    {item.usuario && (
                      <p className="text-xs text-neutral-text">
                        {item.usuario.email} · {item.usuario.telefono} · idioma {item.usuario.idioma?.toUpperCase()}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-neutral-text">
                      Precio del curso <strong>{usd(item.montoCentavos)}</strong> ·{" "}
                      {etiquetaMetodo(item.metodoPago)}
                    </p>
                    {pp && (
                      <ul className="mt-1 space-y-0.5 text-xs text-neutral-text">
                        <li>
                          ID de transacción de PayPal: <strong className="break-all">{pp.idExterno}</strong>
                        </li>
                        <li>
                          Pagó con: <strong>{pp.pagador}</strong>
                        </li>
                        <li>
                          Monto pagado: <strong>{usd(pp.montoEnviadoCentavos)}</strong> · Fecha:{" "}
                          {new Date(pp.fechaEnvio).toLocaleDateString("es-DO", { dateStyle: "medium", timeZone: "UTC" })}
                        </li>
                        <li>Registrado el {fechaHora(item.updatedAt)}</li>
                        <li className="text-neutral-text/80">
                          Busca este ID en la actividad de tu cuenta de PayPal y comprueba que el monto coincide antes de
                          confirmar.
                        </li>
                      </ul>
                    )}
                    {r && (
                      <ul className="mt-1 space-y-0.5 text-xs text-neutral-text">
                        <li>
                          Agencia: <strong>{nombreAgencia(r.agencia)}</strong> · Control:{" "}
                          <strong className="break-all">{r.numeroControl}</strong>
                        </li>
                        <li>
                          Remitente: <strong>{r.remitente}</strong>
                        </li>
                        <li>
                          Monto enviado (sin comisión): <strong>{usd(r.montoEnviadoCentavos)}</strong> · Fecha del envío:{" "}
                          {new Date(r.fechaEnvio).toLocaleDateString("es-DO", { dateStyle: "medium", timeZone: "UTC" })}
                        </li>
                        <li>Registrado el {fechaHora(item.updatedAt)}</li>
                      </ul>
                    )}
                    {item.estadoPago === "rechazado" && item.notaRechazo && (
                      <p className="mt-1 text-xs text-brand-pink">Rechazado: {item.notaRechazo}</p>
                    )}
                    {item.estadoPago === "pagado" && (
                      <p className="mt-1 text-xs text-status-success">
                        Confirmado {item.fechaPago ? fechaHora(item.fechaPago) : ""}
                        {item.montoRecibidoRD ? ` · Recibido RD$${item.montoRecibidoRD.toLocaleString("es-DO")}` : ""}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${estado.clase}`}>{estado.texto}</span>
                  {item.estadoPago === "pendiente_verificacion" && (
                    <>
                      <button
                        onClick={() => abrirAccion(item._id, "rechazar")}
                        className="rounded-full border border-brand-pink bg-white px-3 py-1.5 text-xs font-medium text-brand-pink hover:bg-brand-pink-light"
                      >
                        Rechazar
                      </button>
                      <button
                        onClick={() => abrirAccion(item._id, "confirmar")}
                        className="rounded-full bg-brand-pink px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
                      >
                        Confirmar pago
                      </button>
                    </>
                  )}
                  {item.estadoPago === "pagado" && esAdmin && (
                    <button
                      onClick={() => abrirAccion(item._id, "reembolsar")}
                      className="rounded-full border border-neutral-text bg-white px-3 py-1.5 text-xs font-medium text-neutral-text hover:bg-neutral-bg"
                    >
                      Reembolsar
                    </button>
                  )}
                </div>
              </div>

              {abierta === "confirmar" && (
                <div className="mt-4 rounded-lg bg-neutral-bg p-4">
                  <label className="block text-sm text-neutral-text">
                    {item.metodoPago === "paypal" ? "Pesos recibidos (RD$) — opcional con PayPal" : "Pesos que recibiste (RD$)"}
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="0.01"
                      value={montoRD}
                      onChange={(e) => setMontoRD(e.target.value)}
                      className="mt-1 w-full max-w-xs rounded-lg border border-neutral-bg bg-white px-3 py-2 text-sm"
                    />
                  </label>
                  <p className="mt-1 text-xs text-neutral-text">
                    {item.metodoPago === "paypal"
                      ? "El dinero queda en dólares en tu cuenta de PayPal. Si todavía no lo has pasado a tu banco, déjalo vacío y registra el ingreso en la contabilidad cuando lo recibas en pesos."
                      : "Anota lo que llegó en pesos según el estado de cuenta o lo cobrado en la agencia: es lo que entra a la contabilidad. No incluyas la comisión del envío."}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => ejecutar(item)}
                      disabled={procesando}
                      className="rounded-full bg-brand-pink px-4 py-1.5 text-xs font-medium text-white disabled:opacity-60"
                    >
                      {procesando ? "Procesando..." : "Confirmar y abrir el curso"}
                    </button>
                    <button onClick={() => setAccion(null)} className="text-xs text-neutral-text underline">
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {abierta === "rechazar" && (
                <div className="mt-4 rounded-lg bg-neutral-bg p-4">
                  <p className="text-sm text-neutral-text">Motivo (la estudiante lo recibe por correo)</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {MOTIVOS_RAPIDOS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMotivo(m)}
                        className="rounded-full border border-neutral-text/30 bg-white px-3 py-1 text-xs text-neutral-text hover:border-brand-pink"
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    rows={2}
                    maxLength={300}
                    className="mt-2 w-full rounded-lg border border-neutral-bg bg-white px-3 py-2 text-sm"
                    aria-label="Motivo del rechazo"
                  />
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => ejecutar(item)}
                      disabled={procesando || motivo.trim().length < 3}
                      className="rounded-full bg-brand-pink px-4 py-1.5 text-xs font-medium text-white disabled:opacity-60"
                    >
                      {procesando ? "Procesando..." : "Rechazar comprobante"}
                    </button>
                    <button onClick={() => setAccion(null)} className="text-xs text-neutral-text underline">
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {abierta === "reembolsar" && (
                <div className="mt-4 rounded-lg bg-neutral-bg p-4">
                  <p className="text-sm text-neutral-text">
                    Esto cierra el acceso de la estudiante al curso y registra la salida en la contabilidad.{" "}
                    {item.metodoPago === "paypal"
                      ? "El dinero hay que devolverlo aparte: en PayPal, abre la transacción en tu actividad y usa «Reembolsar»."
                      : "El dinero hay que devolverlo aparte (remesa o depósito)."}
                  </p>
                  <textarea
                    value={nota}
                    onChange={(e) => setNota(e.target.value)}
                    rows={2}
                    maxLength={300}
                    placeholder="Nota interna (opcional)"
                    className="mt-2 w-full rounded-lg border border-neutral-bg bg-white px-3 py-2 text-sm"
                    aria-label="Nota del reembolso"
                  />
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => ejecutar(item)}
                      disabled={procesando}
                      className="rounded-full bg-neutral-text px-4 py-1.5 text-xs font-medium text-white disabled:opacity-60"
                    >
                      {procesando ? "Procesando..." : "Registrar reembolso"}
                    </button>
                    <button onClick={() => setAccion(null)} className="text-xs text-neutral-text underline">
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Paginacion
        paginaActual={datos?.pagina ?? 1}
        totalPaginas={datos?.totalPaginas ?? 1}
        onCambiarPagina={(p) => {
          setPagina(p);
          setCargando(true);
        }}
      />
    </div>
  );
}