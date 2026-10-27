"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";

// NUEVO (24/10/2026): configuración del curso Driver Prep USA (solo admin).
// Edita las claves us_* de Configuracion: encender/apagar el curso, precio en
// USD, métodos de pago, datos de depósito y de retiro en efectivo, agencias,
// estados disponibles y plazo. El backend (PUT /api/us/admin/config) valida
// TODO otra vez y no deja encender el curso sin precio y un método activo.

type Agencia = {
  id: string;
  nombre: string;
  via: ("deposito" | "efectivo")[];
  notas_es: string;
  notas_en: string;
};

type ConfigUS = {
  us_activo: boolean;
  us_precio_centavos: number | null;
  us_metodos: { id: string; activo: boolean }[];
  us_agencias: Agencia[];
  us_destino_deposito: Record<string, string>;
  us_destino_efectivo: Record<string, string>;
  us_plazo_confirmacion_horas: number;
  us_estados_activos: string[];
  us_contabilizar: boolean;
};

const METODOS = [
  { id: "remesa_deposito", etiqueta: "Depósito a cuenta bancaria" },
  { id: "remesa_efectivo", etiqueta: "Retiro en efectivo" },
];

const ESTADOS = [
  { id: "NY", etiqueta: "Nueva York" },
  { id: "NJ", etiqueta: "Nueva Jersey" },
  { id: "FL", etiqueta: "Florida" },
  { id: "MA", etiqueta: "Massachusetts" },
];

const CAMPOS_DEPOSITO: [string, string][] = [
  ["titular", "Titular de la cuenta (exactamente como figura en el banco)"],
  ["banco", "Banco"],
  ["numero", "Número de cuenta"],
  ["tipo", "Tipo de cuenta (ahorros, corriente)"],
  ["rnc", "RNC (si las apps de envío lo piden)"],
];

const CAMPOS_EFECTIVO: [string, string][] = [
  ["nombreBeneficiario", "Nombre de quien cobra (como en su cédula)"],
  ["ciudad", "Ciudad donde cobra"],
];

const estiloInput = "mt-1 w-full rounded-lg border border-neutral-bg bg-white px-3 py-2 text-sm";

function idDesdeNombre(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 30);
}

export default function ConfiguracionUSPage() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === "admin";

  const [cfg, setCfg] = useState<ConfigUS | null>(null);
  const [precioUSD, setPrecioUSD] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [idsExistentes, setIdsExistentes] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!esAdmin) return;
    let cancelado = false;
    async function traer() {
      try {
        const datos = await apiFetch<ConfigUS>("/us/admin/config");
        if (cancelado) return;
        setCfg(datos);
        setIdsExistentes(new Set(datos.us_agencias.map((a) => a.id)));
        setPrecioUSD(datos.us_precio_centavos ? (datos.us_precio_centavos / 100).toFixed(2) : "");
      } catch (e) {
        if (!cancelado) setMensaje({ tipo: "error", texto: e instanceof Error ? e.message : "No se pudo cargar." });
      } finally {
        if (!cancelado) setCargando(false);
      }
    }
    void traer();
    return () => {
      cancelado = true;
    };
  }, [esAdmin]);

  if (!esAdmin) {
    return (
      <p className="text-sm text-neutral-text">
        Solo la fundadora (admin) puede cambiar la configuración del curso.{" "}
        <Link href="/panel/pagos-us" className="text-brand-blue underline">
          Volver a los pagos
        </Link>
      </p>
    );
  }
  if (cargando) return <p className="text-sm text-neutral-text">Cargando configuración...</p>;
  if (!cfg) return mensaje && <p className="text-sm text-brand-pink">{mensaje.texto}</p>;

  function actualizar<K extends keyof ConfigUS>(clave: K, valor: ConfigUS[K]) {
    setCfg((previa) => (previa ? { ...previa, [clave]: valor } : previa));
  }

  function actualizarAgencia(indice: number, cambios: Partial<Agencia>) {
    setCfg((previa) =>
      previa
        ? {
          ...previa,
          us_agencias: previa.us_agencias.map((a, i) => (i === indice ? { ...a, ...cambios } : a)),
        }
        : previa,
    );
  }

  async function guardar(evento: FormEvent) {
    evento.preventDefault();
    if (!cfg) return;
    setMensaje(null);

    const cambios: Record<string, unknown> = {
      us_activo: cfg.us_activo,
      us_metodos: cfg.us_metodos,
      us_agencias: cfg.us_agencias,
      us_destino_deposito: cfg.us_destino_deposito,
      us_destino_efectivo: cfg.us_destino_efectivo,
      us_plazo_confirmacion_horas: cfg.us_plazo_confirmacion_horas,
      us_estados_activos: cfg.us_estados_activos,
      us_contabilizar: cfg.us_contabilizar,
    };
    // El precio no puede quedar vacío en la base: solo se envía si hay uno.
    if (precioUSD.trim() !== "") {
      const centavos = Math.round(Number(precioUSD.replace(",", ".")) * 100);
      if (!Number.isFinite(centavos) || centavos < 100) {
        return setMensaje({ tipo: "error", texto: "El precio debe ser de al menos USD 1.00." });
      }
      cambios.us_precio_centavos = centavos;
    }

    setGuardando(true);
    try {
      const guardada = await apiFetch<ConfigUS>("/us/admin/config", {
        method: "PUT",
        body: JSON.stringify({ cambios }),
      });
      setCfg(guardada);
      setIdsExistentes(new Set(guardada.us_agencias.map((a) => a.id)));
      setMensaje({ tipo: "ok", texto: "Configuración guardada." });
    } catch (e) {
      setMensaje({ tipo: "error", texto: e instanceof Error ? e.message : "No se pudo guardar." });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={guardar} className="mx-auto grid max-w-3xl gap-6">
      <div>
        <Link href="/panel/pagos-us" className="text-sm text-brand-blue underline">
          ← Volver a los pagos
        </Link>
        <h2 className="mt-2 font-display text-xl font-bold text-brand-blue">Configuración del curso EE. UU.</h2>
      </div>

      <section className="rounded-xl border border-neutral-bg bg-white p-5">
        <h3 className="font-semibold text-brand-blue">Estado del curso</h3>
        <label className="mt-3 flex items-center gap-3 text-sm text-neutral-text">
          <input
            type="checkbox"
            checked={cfg.us_activo}
            onChange={(e) => actualizar("us_activo", e.target.checked)}
            className="size-5"
          />
          <span>
            <strong>Curso activo</strong> (se muestra en la página de inicio y en /us). Apagado = oculto; las cuentas y
            pagos existentes no se tocan.
          </span>
        </label>
        <p className="mt-2 text-xs text-neutral-text">
          Para encenderlo hace falta un precio y al menos un método de pago activo. Prueba todo el recorrido con una
          cuenta de prueba <em>antes</em> de activarlo.
        </p>

        <label className="mt-4 block text-sm text-neutral-text">
          Precio del curso (USD)
          <input
            inputMode="decimal"
            value={precioUSD}
            onChange={(e) => setPrecioUSD(e.target.value)}
            placeholder="Ej.: 49.00"
            className={`${estiloInput} max-w-xs`}
          />
        </label>

        <label className="mt-4 block text-sm text-neutral-text">
          Plazo prometido para confirmar un pago (horas)
          <input
            type="number"
            min={1}
            max={240}
            value={cfg.us_plazo_confirmacion_horas}
            onChange={(e) => actualizar("us_plazo_confirmacion_horas", Number(e.target.value))}
            className={`${estiloInput} max-w-xs`}
          />
        </label>

        <label className="mt-4 flex items-center gap-3 text-sm text-neutral-text">
          <input
            type="checkbox"
            checked={cfg.us_contabilizar}
            onChange={(e) => actualizar("us_contabilizar", e.target.checked)}
            className="size-5"
          />
          <span>Registrar en la contabilidad los pesos recibidos al confirmar cada pago (recomendado)</span>
        </label>
      </section>

      <section className="rounded-xl border border-neutral-bg bg-white p-5">
        <h3 className="font-semibold text-brand-blue">Estados disponibles</h3>
        <div className="mt-3 flex flex-wrap gap-4">
          {ESTADOS.map((e) => (
            <label key={e.id} className="flex items-center gap-2 text-sm text-neutral-text">
              <input
                type="checkbox"
                checked={cfg.us_estados_activos.includes(e.id)}
                onChange={(ev) =>
                  actualizar(
                    "us_estados_activos",
                    ev.target.checked
                      ? [...cfg.us_estados_activos, e.id]
                      : cfg.us_estados_activos.filter((x) => x !== e.id),
                  )
                }
                className="size-5"
              />
              {e.etiqueta} ({e.id})
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-neutral-bg bg-white p-5">
        <h3 className="font-semibold text-brand-blue">Métodos de pago</h3>
        <div className="mt-3 grid gap-2">
          {METODOS.map((m) => {
            const actual = cfg.us_metodos.find((x) => x.id === m.id);
            return (
              <label key={m.id} className="flex items-center gap-3 text-sm text-neutral-text">
                <input
                  type="checkbox"
                  checked={!!actual?.activo}
                  onChange={(e) =>
                    actualizar(
                      "us_metodos",
                      METODOS.map((otro) => ({
                        id: otro.id,
                        activo:
                          otro.id === m.id
                            ? e.target.checked
                            : !!cfg.us_metodos.find((x) => x.id === otro.id)?.activo,
                      })),
                    )
                  }
                  className="size-5"
                />
                {m.etiqueta}
              </label>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-neutral-bg bg-white p-5">
        <h3 className="font-semibold text-brand-blue">Datos para el depósito a cuenta</h3>
        <p className="text-xs text-neutral-text">
          Se muestran solo a estudiantes con sesión. Deben coincidir exactamente con la cuenta (algunas apps validan el
          nombre del titular).
        </p>
        <div className="mt-3 grid gap-3">
          {CAMPOS_DEPOSITO.map(([clave, etiqueta]) => (
            <label key={clave} className="block text-sm text-neutral-text">
              {etiqueta}
              <input
                value={cfg.us_destino_deposito[clave] ?? ""}
                onChange={(e) => actualizar("us_destino_deposito", { ...cfg.us_destino_deposito, [clave]: e.target.value })}
                className={estiloInput}
              />
            </label>
          ))}
          <label className="block text-sm text-neutral-text">
            Nota para la estudiante (español)
            <input
              value={cfg.us_destino_deposito.notas_es ?? ""}
              onChange={(e) => actualizar("us_destino_deposito", { ...cfg.us_destino_deposito, notas_es: e.target.value })}
              className={estiloInput}
            />
          </label>
          <label className="block text-sm text-neutral-text">
            Nota para la estudiante (inglés)
            <input
              value={cfg.us_destino_deposito.notas_en ?? ""}
              onChange={(e) => actualizar("us_destino_deposito", { ...cfg.us_destino_deposito, notas_en: e.target.value })}
              className={estiloInput}
            />
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-neutral-bg bg-white p-5">
        <h3 className="font-semibold text-brand-blue">Datos para el retiro en efectivo</h3>
        <div className="mt-3 grid gap-3">
          {CAMPOS_EFECTIVO.map(([clave, etiqueta]) => (
            <label key={clave} className="block text-sm text-neutral-text">
              {etiqueta}
              <input
                value={cfg.us_destino_efectivo[clave] ?? ""}
                onChange={(e) => actualizar("us_destino_efectivo", { ...cfg.us_destino_efectivo, [clave]: e.target.value })}
                className={estiloInput}
              />
            </label>
          ))}
          <label className="block text-sm text-neutral-text">
            Nota para la estudiante (español)
            <input
              value={cfg.us_destino_efectivo.notas_es ?? ""}
              onChange={(e) => actualizar("us_destino_efectivo", { ...cfg.us_destino_efectivo, notas_es: e.target.value })}
              className={estiloInput}
            />
          </label>
          <label className="block text-sm text-neutral-text">
            Nota para la estudiante (inglés)
            <input
              value={cfg.us_destino_efectivo.notas_en ?? ""}
              onChange={(e) => actualizar("us_destino_efectivo", { ...cfg.us_destino_efectivo, notas_en: e.target.value })}
              className={estiloInput}
            />
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-neutral-bg bg-white p-5">
        <h3 className="font-semibold text-brand-blue">Apps y agencias de envío</h3>
        <p className="text-xs text-neutral-text">
          La lista inicial es provisional: confirma con un envío de prueba de USD 1–5 cuáles aceptan tu banco, y quita
          las que no. El identificador de una agencia ya guardada no se puede cambiar (los recibos viejos lo usan).
        </p>
        <div className="mt-3 grid gap-4">
          {cfg.us_agencias.map((a, i) => (
            <div key={i} className="rounded-lg border border-neutral-bg p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm text-neutral-text">
                  Nombre
                  <input
                    value={a.nombre}
                    onChange={(e) =>
                      actualizarAgencia(i, {
                        nombre: e.target.value,
                        ...(idsExistentes.has(a.id) ? {} : { id: idDesdeNombre(e.target.value) }),
                      })
                    }
                    className={estiloInput}
                  />
                </label>
                <label className="block text-sm text-neutral-text">
                  Identificador
                  <input
                    value={a.id}
                    readOnly={idsExistentes.has(a.id)}
                    onChange={(e) => actualizarAgencia(i, { id: idDesdeNombre(e.target.value) })}
                    className={`${estiloInput} ${idsExistentes.has(a.id) ? "bg-neutral-bg" : ""}`}
                  />
                </label>
              </div>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-neutral-text">
                {(["deposito", "efectivo"] as const).map((via) => (
                  <label key={via} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={a.via.includes(via)}
                      onChange={(e) =>
                        actualizarAgencia(i, {
                          via: e.target.checked ? [...a.via, via] : a.via.filter((v) => v !== via),
                        })
                      }
                      className="size-4"
                    />
                    {via === "deposito" ? "Depósito a cuenta" : "Retiro en efectivo"}
                  </label>
                ))}
              </div>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <label className="block text-sm text-neutral-text">
                  Consejo (español)
                  <input value={a.notas_es} onChange={(e) => actualizarAgencia(i, { notas_es: e.target.value })} className={estiloInput} />
                </label>
                <label className="block text-sm text-neutral-text">
                  Consejo (inglés)
                  <input value={a.notas_en} onChange={(e) => actualizarAgencia(i, { notas_en: e.target.value })} className={estiloInput} />
                </label>
              </div>
              <button
                type="button"
                onClick={() => actualizar("us_agencias", cfg.us_agencias.filter((_, j) => j !== i))}
                className="mt-2 text-xs text-brand-pink underline"
              >
                Quitar esta agencia
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            actualizar("us_agencias", [
              ...cfg.us_agencias,
              { id: "", nombre: "", via: ["deposito"], notas_es: "", notas_en: "" },
            ])
          }
          className="mt-3 rounded-full border border-brand-blue px-4 py-1.5 text-xs font-medium text-brand-blue hover:bg-neutral-bg"
        >
          + Añadir agencia
        </button>
      </section>

      {mensaje && (
        <div
          role={mensaje.tipo === "error" ? "alert" : "status"}
          className={`rounded-lg p-4 text-sm ${mensaje.tipo === "ok"
            ? "border border-status-success bg-status-success/10 text-status-success"
            : "border border-brand-pink bg-brand-pink-light text-brand-blue"
            }`}
        >
          {mensaje.texto}
        </div>
      )}

      <button
        type="submit"
        disabled={guardando}
        className="justify-self-start rounded-lg bg-brand-pink px-6 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
      >
        {guardando ? "Guardando..." : "Guardar configuración"}
      </button>
    </form>
  );
}