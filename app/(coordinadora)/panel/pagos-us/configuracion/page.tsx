"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";

// NUEVO (24/10/2026), REESCRITO (27/10/2026): configuración del curso Driver
// Prep USA (solo admin). Los textos están escritos para quien administra el
// negocio, sin lenguaje técnico: qué es cada dato y para qué sirve.
// Internamente edita las claves us_* de Configuracion y el backend valida todo
// otra vez (no deja abrir el curso sin precio ni forma de pago).

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
  us_destino_paypal: Record<string, string>;
  us_plazo_confirmacion_horas: number;
  us_estados_activos: string[];
  us_contabilizar: boolean;
};

const METODOS = [
  { id: "remesa_deposito", etiqueta: "Depósito a cuenta bancaria" },
  { id: "remesa_efectivo", etiqueta: "Retiro en efectivo" },
  { id: "paypal", etiqueta: "PayPal (la estudiante paga con un enlace y tú confirmas el pago)" },
];

const ESTADOS = [
  { id: "NY", etiqueta: "Nueva York" },
  { id: "NJ", etiqueta: "Nueva Jersey" },
  { id: "FL", etiqueta: "Florida" },
  { id: "MA", etiqueta: "Massachusetts" },
];

const CAMPOS_DEPOSITO: [string, string][] = [
  ["titular", "Nombre del titular de la cuenta (tal como está en el banco)"],
  ["banco", "Banco"],
  ["numero", "Número de cuenta"],
  ["tipo", "Tipo de cuenta (ahorros o corriente)"],
  ["rnc", "RNC (solo si las apps de envío lo piden)"],
];

const CAMPOS_EFECTIVO: [string, string][] = [
  ["nombreBeneficiario", "Nombre de la persona que cobra (como aparece en su cédula)"],
  ["ciudad", "Ciudad donde cobra"],
];

const estiloInput = "mt-1 w-full rounded-lg border border-neutral-bg bg-white px-3 py-2 text-sm";
const estiloSeccion = "rounded-xl border border-neutral-bg bg-white p-5";

// Identificador interno de una agencia nueva (la persona nunca lo ve):
// "Western Union" → "western_union"; si ya existe, "western_union_2".
function idUnico(nombre: string, usados: Set<string>): string {
  const base =
    nombre
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 26) || "agencia";
  let id = base;
  for (let n = 2; usados.has(id); n++) id = `${base}_${n}`;
  return id;
}

export default function ConfiguracionUSPage() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === "admin";

  const [cfg, setCfg] = useState<ConfigUS | null>(null);
  const [precioUSD, setPrecioUSD] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  useEffect(() => {
    if (!esAdmin) return;
    let cancelado = false;
    async function traer() {
      try {
        const datos = await apiFetch<ConfigUS>("/us/admin/config");
        if (cancelado) return;
        setCfg(datos);
        setPrecioUSD(datos.us_precio_centavos ? (datos.us_precio_centavos / 100).toFixed(2) : "");
      } catch (e) {
        if (!cancelado) {
          setMensaje({
            tipo: "error",
            texto: e instanceof Error ? e.message : "No se pudo cargar la configuración. Recarga la página.",
          });
        }
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
        Solo la fundadora puede cambiar la configuración del curso.{" "}
        <Link href="/panel/pagos-us" className="text-brand-blue underline">
          Volver a los pagos
        </Link>
      </p>
    );
  }
  if (cargando) return <p className="text-sm text-neutral-text">Cargando la configuración...</p>;
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

  const metodoActivo = (id: string) => !!cfg.us_metodos.find((m) => m.id === id)?.activo;
  const lleno = (obj: Record<string, string> | undefined, ...claves: string[]) =>
    claves.every((c) => (obj?.[c] ?? "").trim() !== "");
  const precioValido = Number(precioUSD.replace(",", ".")) >= 1;

  // Lista de pendientes antes de abrir el curso (se actualiza al escribir).
  const pendientes: { listo: boolean; texto: string }[] = [
    { listo: precioValido, texto: "Escribir el precio del curso" },
    {
      listo: METODOS.some((m) => metodoActivo(m.id)),
      texto: "Marcar al menos una forma de pago",
    },
    ...(metodoActivo("remesa_deposito")
      ? [
        {
          listo: lleno(cfg.us_destino_deposito, "titular", "banco", "numero"),
          texto: "Completar los datos de la cuenta bancaria (titular, banco y número)",
        },
      ]
      : []),
    ...(metodoActivo("remesa_efectivo")
      ? [
        {
          listo: lleno(cfg.us_destino_efectivo, "nombreBeneficiario", "ciudad"),
          texto: "Completar quién cobra en efectivo y en qué ciudad",
        },
      ]
      : []),
    ...(metodoActivo("paypal")
      ? [{ listo: lleno(cfg.us_destino_paypal, "usuario"), texto: "Escribir el usuario de PayPal" }]
      : []),
    ...(metodoActivo("remesa_deposito") || metodoActivo("remesa_efectivo")
      ? [
        {
          listo: cfg.us_agencias.some(
            (a) =>
              a.nombre.trim() !== "" &&
              ((metodoActivo("remesa_deposito") && a.via.includes("deposito")) ||
                (metodoActivo("remesa_efectivo") && a.via.includes("efectivo"))),
          ),
          texto: "Añadir al menos una app o agencia de envío que ya hayas probado",
        },
      ]
      : []),
    { listo: cfg.us_estados_activos.length > 0, texto: "Marcar al menos un estado" },
  ];
  const todoListo = pendientes.every((p) => p.listo);

  async function guardar(evento: FormEvent) {
    evento.preventDefault();
    if (!cfg) return;
    setMensaje(null);

    // Cada agencia necesita nombre y al menos una forma de recibir el dinero.
    for (const a of cfg.us_agencias) {
      if (a.nombre.trim() === "") {
        return setMensaje({ tipo: "error", texto: "Escribe el nombre de cada agencia, o quita la que esté vacía." });
      }
      if (a.via.length === 0) {
        return setMensaje({
          tipo: "error",
          texto: `Marca si «${a.nombre}» acepta depósito a cuenta, retiro en efectivo o ambos.`,
        });
      }
    }
    const usados = new Set(cfg.us_agencias.map((a) => a.id).filter(Boolean));
    const agencias = cfg.us_agencias.map((a) => {
      if (a.id) return a;
      const id = idUnico(a.nombre, usados);
      usados.add(id);
      return { ...a, id };
    });

    const cambios: Record<string, unknown> = {
      us_activo: cfg.us_activo,
      us_metodos: cfg.us_metodos,
      us_agencias: agencias,
      us_destino_deposito: cfg.us_destino_deposito,
      us_destino_efectivo: cfg.us_destino_efectivo,
      us_destino_paypal: cfg.us_destino_paypal,
      us_plazo_confirmacion_horas: cfg.us_plazo_confirmacion_horas,
      us_estados_activos: cfg.us_estados_activos,
      us_contabilizar: cfg.us_contabilizar,
    };
    if (precioUSD.trim() !== "") {
      const centavos = Math.round(Number(precioUSD.replace(",", ".")) * 100);
      if (!Number.isFinite(centavos) || centavos < 100) {
        return setMensaje({ tipo: "error", texto: "El precio debe ser de al menos 1.00 dólar." });
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
      setMensaje({ tipo: "ok", texto: "Cambios guardados. Las estudiantes ya ven la información nueva." });
    } catch (e) {
      setMensaje({ tipo: "error", texto: e instanceof Error ? e.message : "No se pudo guardar. Intenta de nuevo." });
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
        <p className="mt-1 text-sm text-neutral-text">
          Aquí decides cuánto cuesta el curso, cómo te pagan las estudiantes y a dónde envían el dinero. Completa cada
          sección y pulsa <strong>Guardar cambios</strong> al final de la página.
        </p>
      </div>

      {/* <section className={estiloSeccion} aria-labelledby="lista-pendientes">
        <h3 id="lista-pendientes" className="font-semibold text-brand-blue">
          Antes de abrir el curso
        </h3>
        <ul className="mt-3 grid gap-2 text-sm">
          {pendientes.map((p) => (
            <li key={p.texto} className="flex items-start gap-2 text-neutral-text">
              {p.listo ? (
                <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0 text-status-success" />
              ) : (
                <Circle aria-hidden className="mt-0.5 size-4 shrink-0 text-neutral-text/50" />
              )}
              <span>
                <span className="sr-only">{p.listo ? "Listo: " : "Falta: "}</span>
                {p.texto}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-neutral-text">
          {todoListo
            ? "Todo está completo. Antes de abrir el curso al público, haz una compra de prueba con una cuenta tuya."
            : "Completa lo que falta para poder abrir el curso."}
        </p>
      </section> */}

      <section className={estiloSeccion}>
        <h3 className="font-semibold text-brand-blue">Abrir o cerrar el curso</h3>
        <label className="mt-3 flex items-start gap-3 text-sm text-neutral-text">
          <input
            type="checkbox"
            checked={cfg.us_activo}
            onChange={(e) => actualizar("us_activo", e.target.checked)}
            className="mt-0.5 size-5 shrink-0"
          />
          <span>
            <strong>Mostrar el curso al público</strong> (curso abierto). Si lo desmarcas, el curso se oculta de la
            página de inicio y las personas solo ven «Muy pronto». Las cuentas y los pagos que ya existen no se pierden.
          </span>
        </label>

        <label className="mt-4 block text-sm text-neutral-text">
          Precio del curso en dólares (USD)
          <input
            inputMode="decimal"
            value={precioUSD}
            onChange={(e) => setPrecioUSD(e.target.value)}
            placeholder="Ejemplo: 49.00"
            className={`${estiloInput} max-w-xs`}
          />
          <span className="mt-1 block text-xs text-neutral-text">
            Es lo que paga cada estudiante. Para hacer pruebas puedes poner 1.00 y cambiarlo después.
          </span>
        </label>

        <label className="mt-4 block text-sm text-neutral-text">
          Horas que prometes para confirmar un pago
          <input
            type="number"
            min={1}
            max={240}
            value={cfg.us_plazo_confirmacion_horas}
            onChange={(e) => actualizar("us_plazo_confirmacion_horas", Number(e.target.value))}
            className={`${estiloInput} max-w-xs`}
          />
          <span className="mt-1 block text-xs text-neutral-text">
            Es el tiempo que ven las estudiantes después de enviar su pago. Ejemplo: 24.
          </span>
        </label>

        <label className="mt-4 flex items-start gap-3 text-sm text-neutral-text">
          <input
            type="checkbox"
            checked={cfg.us_contabilizar}
            onChange={(e) => actualizar("us_contabilizar", e.target.checked)}
            className="mt-0.5 size-5 shrink-0"
          />
          <span>Anotar en la contabilidad los pesos recibidos cada vez que confirmes un pago (recomendado)</span>
        </label>
      </section>

      <section className={estiloSeccion}>
        <h3 className="font-semibold text-brand-blue">Estados donde se vende el curso</h3>
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

      <section className={estiloSeccion}>
        <h3 className="font-semibold text-brand-blue">Formas de pago que ofreces</h3>
        <p className="text-xs text-neutral-text">
          Marca solo las que ya tengas listas. Cada forma marcada necesita sus datos más abajo.
        </p>
        <div className="mt-3 grid gap-2">
          {METODOS.map((m) => (
            <label key={m.id} className="flex items-start gap-3 text-sm text-neutral-text">
              <input
                type="checkbox"
                checked={metodoActivo(m.id)}
                onChange={(e) =>
                  actualizar(
                    "us_metodos",
                    METODOS.map((otro) => ({
                      id: otro.id,
                      activo: otro.id === m.id ? e.target.checked : metodoActivo(otro.id),
                    })),
                  )
                }
                className="mt-0.5 size-5 shrink-0"
              />
              {m.etiqueta}
            </label>
          ))}
        </div>
      </section>

      <section className={estiloSeccion}>
        <h3 className="font-semibold text-brand-blue">Cuenta bancaria para recibir depósitos</h3>
        <p className="text-xs text-neutral-text">
          La estudiante ve estos datos cuando va a pagar y los copia en la app de envío de dinero. Escríbelos
          exactamente como están en el banco: algunas apps comparan el nombre del titular. Lo que dejes vacío no se
          muestra.
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
            Mensaje para la estudiante, en español (opcional)
            <input
              value={cfg.us_destino_deposito.notas_es ?? ""}
              onChange={(e) => actualizar("us_destino_deposito", { ...cfg.us_destino_deposito, notas_es: e.target.value })}
              placeholder="Ejemplo: Envía el monto en dólares (USD) a esta cuenta."
              className={estiloInput}
            />
          </label>
          <label className="block text-sm text-neutral-text">
            Mensaje para la estudiante, en inglés (opcional)
            <input
              value={cfg.us_destino_deposito.notas_en ?? ""}
              onChange={(e) => actualizar("us_destino_deposito", { ...cfg.us_destino_deposito, notas_en: e.target.value })}
              placeholder="Example: Send the amount in U.S. dollars (USD) to this account."
              className={estiloInput}
            />
          </label>
        </div>
      </section>

      <section className={estiloSeccion}>
        <h3 className="font-semibold text-brand-blue">Persona que cobra en efectivo</h3>
        <p className="text-xs text-neutral-text">
          Es a nombre de quién la estudiante envía el dinero para que se cobre en una agencia en República Dominicana.
        </p>
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
            Mensaje para la estudiante, en español (opcional)
            <input
              value={cfg.us_destino_efectivo.notas_es ?? ""}
              onChange={(e) => actualizar("us_destino_efectivo", { ...cfg.us_destino_efectivo, notas_es: e.target.value })}
              placeholder="Ejemplo: Quien cobra debe presentar su cédula."
              className={estiloInput}
            />
          </label>
          <label className="block text-sm text-neutral-text">
            Mensaje para la estudiante, en inglés (opcional)
            <input
              value={cfg.us_destino_efectivo.notas_en ?? ""}
              onChange={(e) => actualizar("us_destino_efectivo", { ...cfg.us_destino_efectivo, notas_en: e.target.value })}
              placeholder="Example: The person collecting must show their ID."
              className={estiloInput}
            />
          </label>
        </div>
      </section>

      <section className={estiloSeccion}>
        <h3 className="font-semibold text-brand-blue">Datos de PayPal</h3>
        <p className="text-xs text-neutral-text">
          La estudiante paga desde un enlace de PayPal que ya trae el monto y luego te escribe el número de su
          transacción; tú lo buscas en tu cuenta de PayPal y confirmas el pago. La cuenta debe ser de tipo{" "}
          <strong>Negocio (Business)</strong>: PayPal no permite cobrar ventas con una cuenta personal.
        </p>
        <div className="mt-3 grid gap-3">
          <label className="block text-sm text-neutral-text">
            Usuario de PayPal
            <input
              value={cfg.us_destino_paypal?.usuario ?? ""}
              onChange={(e) => actualizar("us_destino_paypal", { ...cfg.us_destino_paypal, usuario: e.target.value })}
              placeholder="Ejemplo: MariaDG424"
              className={estiloInput}
            />
            <span className="mt-1 block text-xs text-neutral-text">
              Es el nombre que aparece en tu enlace de PayPal.Me (paypal.me/<strong>MariaDG424</strong>). También puedes
              pegar el enlace completo.
            </span>
          </label>
          <label className="block text-sm text-neutral-text">
            Mensaje para la estudiante, en español (opcional)
            <input
              value={cfg.us_destino_paypal?.notas_es ?? ""}
              onChange={(e) => actualizar("us_destino_paypal", { ...cfg.us_destino_paypal, notas_es: e.target.value })}
              placeholder="Ejemplo: Guarda el correo de recibo de PayPal hasta que confirmemos tu pago."
              className={estiloInput}
            />
          </label>
          <label className="block text-sm text-neutral-text">
            Mensaje para la estudiante, en inglés (opcional)
            <input
              value={cfg.us_destino_paypal?.notas_en ?? ""}
              onChange={(e) => actualizar("us_destino_paypal", { ...cfg.us_destino_paypal, notas_en: e.target.value })}
              placeholder="Example: Keep the PayPal receipt email until we confirm your payment."
              className={estiloInput}
            />
          </label>
        </div>
      </section>

      <section className={estiloSeccion}>
        <h3 className="font-semibold text-brand-blue">Apps y agencias para enviar dinero</h3>
        <p className="text-xs text-neutral-text">
          Son las opciones que la estudiante elige para decir con cuál envió su dinero. Deja solo las que ya probaste
          con un envío pequeño (de 1 a 5 dólares) y que sabes que llegan a tu cuenta; quita las demás.
        </p>
        <div className="mt-3 grid gap-4">
          {cfg.us_agencias.map((a, i) => (
            <div key={a.id || `nueva-${i}`} className="rounded-lg border border-neutral-bg p-3">
              <label className="block text-sm text-neutral-text">
                Nombre de la agencia o app
                <input
                  value={a.nombre}
                  onChange={(e) => actualizarAgencia(i, { nombre: e.target.value })}
                  placeholder="Ejemplo: Ria"
                  className={estiloInput}
                />
              </label>
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
                    {via === "deposito" ? "Acepta depósito a cuenta" : "Acepta retiro en efectivo"}
                  </label>
                ))}
              </div>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <label className="block text-sm text-neutral-text">
                  Mensaje en español (opcional)
                  <input
                    value={a.notas_es}
                    onChange={(e) => actualizarAgencia(i, { notas_es: e.target.value })}
                    className={estiloInput}
                  />
                </label>
                <label className="block text-sm text-neutral-text">
                  Mensaje en inglés (opcional)
                  <input
                    value={a.notas_en}
                    onChange={(e) => actualizarAgencia(i, { notas_en: e.target.value })}
                    className={estiloInput}
                  />
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
          + Añadir agencia o app
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
        {guardando ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}