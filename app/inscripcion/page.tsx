"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, UploadCloud, Clock, GraduationCap, Copy, Check } from "lucide-react";
import RutaProtegida from "@/components/auth/RutaProtegida";
import { useAuth } from "@/contexts/AuthContext";

// Migración de planes (06/09/2026): antes solo llegaba el precio desde
// Configuracion; ahora GET /api/planes trae el plan completo, incluida la
// lista de características que se muestra aquí en el detalle.
// ACTUALIZADO (13/09/2026): "teorico" es el código del plan único de
// Motorizados/Pesados — sin niveles, sin práctica de manejo, así que
// modalidadPractica/duracionSesionMinutos/costoPorSesion quedan opcionales
// (ver models/Plan.js).
type Plan = {
  codigo: "fundacion" | "normal" | "vip" | "teorico";
  nombre: string;
  precio: number;
  modalidadPractica?: "grupal" | "individual";
  cantidadSesionesPractica?: number | null;
  duracionSesionMinutos?: number;
  costoPorSesion?: number;
  caracteristicas: string[];
  orden: number;
};

type Programa = "estandar" | "motorizados" | "pesados";

const PROGRAMAS: {
  valor: Programa;
  nombre: string;
  foco: string;
  imagen: string;
}[] = [
    {
      valor: "estandar",
      nombre: "Categoría 02 — Vehículos Livianos",
      foco: "Curso completo (teoría + práctica) para sacar tu licencia de vehículo liviano.",
      imagen: "/inscripcion/teoria-1.jpg",
    },
    {
      valor: "motorizados",
      nombre: "Categoría 01 — Motocicletas",
      foco: "Para conductores de motocicleta — solo teoría, organizada en 4 sesiones.",
      imagen: "/inscripcion/teoria-2.jpg",
    },
    {
      valor: "pesados",
      nombre: "Categoría 03/04 — Vehículos Pesados",
      foco: "Para conductores de camiones y trailers — solo teoría, organizada en 4 sesiones.",
      imagen: "/inscripcion/teoria-3.jpg",
    },
  ];

type EstadoPago = "pendiente" | "pendiente_verificacion" | "pagado" | "rechazado";

type Inscripcion = {
  _id: string;
  tipoPlan: "fundacion" | "normal" | "vip" | "teorico";
  programa?: Programa;
  estadoPago: EstadoPago;
  notaRechazo?: string | null;
};

const BANCOS = [
  "Banco Popular Dominicano",
  "Banreservas",
  "BHD",
  "Scotiabank",
  "Banco Santa Cruz",
  "Asociación Popular de Ahorros y Préstamos",
  "Otro",
];

const CUENTAS_BANCARIAS = [
  { banco: "Banco Popular Dominicano", numero: "no disponible" },
  { banco: "Banco De Reservas", numero: "no disponible" },
];

function formatearMonto(valor: number) {
  return `RD$${valor.toLocaleString("es-DO")}`;
}

function InscripcionContenido() {
  const { usuario, token } = useAuth();
  const searchParams = useSearchParams();

  // NUEVO (13/09/2026): selector de programa — primer paso, antes de
  // elegir plan (ver ANALISIS_MOTORISTA_PESADOS.md, sección 5). Admite
  // preselección vía ?programa=motorizados (para cuando exista un botón
  // "Inscríbete" desde una página de marketing propia de cada programa).
  const programaInicial = searchParams.get("programa");
  const [programa, setPrograma] = useState<Programa | null>(
    PROGRAMAS.some((p) => p.valor === programaInicial)
      ? (programaInicial as Programa)
      : null,
  );

  const [planes, setPlanes] = useState<Plan[]>([]);
  const [inscripcion, setInscripcion] = useState<Inscripcion | null>(null);
  const [cargando, setCargando] = useState(true);
  // ACTUALIZADO (13/09/2026): antes había un `cargandoPlanes` que se
  // prendía con setState al inicio del efecto — eso dispara el lint
  // react-hooks/set-state-in-effect y provoca un render extra en cascada.
  // Ahora se guarda de QUÉ programa son los planes que hay en memoria y
  // el "cargando" se deriva: si el programa elegido no coincide con el
  // que ya está cargado, es que viene uno en camino.
  const [planesDe, setPlanesDe] = useState<Programa | null>(null);
  const [cuentaCopiada, setCuentaCopiada] = useState<number | null>(null);

  const cargandoPlanes = Boolean(programa) && planesDe !== programa;

  // Planes del programa que está mirando AHORA — si `planesDe` quedó
  // atrás, los que hay en memoria son del programa anterior y no deben
  // mostrarse ni un frame.
  const planesActuales = planesDe === programa ? planes : [];

  // --- Formulario ---
  // Guarda SOLO la elección explícita de la estudiante; empieza vacío. El
  // plan realmente seleccionado se deriva más abajo en `tipoPlanEfectivo`
  // (si no eligió nada, o si lo que eligió dejó de estar disponible, cae
  // al primero de la lista). Antes esto se sincronizaba con setState
  // dentro de un efecto — ver nota en `planesDe`.
  const [tipoPlan, setTipoPlan] = useState<Plan["codigo"] | "">("");
  const [bancoEmisor, setBancoEmisor] = useState("");
  const [numeroReferencia, setNumeroReferencia] = useState("");
  const [fechaDeposito, setFechaDeposito] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(
    null,
  );
  const [enviado, setEnviado] = useState(false);

  // Trae la inscripción actual una sola vez (no depende del programa
  // elegido — si ya tiene una activa, se le avisa sin importar cuál
  // programa esté mirando).
  useEffect(() => {
    let cancelado = false;

    (async () => {
      try {
        const resInscripcion = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/inscripciones/me`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const jsonInscripcion = await resInscripcion.json();
        if (!cancelado && jsonInscripcion.success) {
          setInscripcion(jsonInscripcion.data);
        }
      } catch {
        // si falla, el formulario simplemente no se prellena — no es bloqueante
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [token]);

  // Trae los planes del programa elegido — se repite cada vez que cambia
  // `programa` (empieza en null, así que no dispara hasta que la
  // estudiante elige uno de los 3).
  useEffect(() => {
    if (!programa) return;
    let cancelado = false;

    (async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/planes?programa=${programa}`,
        );
        const json = await res.json();
        if (cancelado) return;
        if (json.success) setPlanes(json.data);
      } catch {
        // si falla, el formulario simplemente no se prellena — no es bloqueante
      } finally {
        // Marca que lo que hay en memoria corresponde a ESTE programa —
        // es lo que apaga el "Cargando planes..." derivado. Va también en
        // el catch a propósito: si falló, se muestra la lista vacía en vez
        // de dejar el spinner colgado para siempre.
        if (!cancelado) setPlanesDe(programa);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [programa]);

  // NUEVO (13/09/2026): cobertura de la práctica de manejo en el municipio
  // de la estudiante — ver ANALISIS_COBERTURA_PRACTICA.md. Solo importa
  // para "estandar" (Motorizados/Pesados son 100% teóricos en todo el
  // país).
  //
  // `coberturaApi` guarda únicamente lo que respondió el backend. El valor
  // que usa la pantalla es `cobertura`, derivado: una cuenta vieja sin
  // municipio (ver models/User.js) es "no cubierta" sin necesidad de
  // consultar nada, así que eso se resuelve aquí en vez de con un
  // setState dentro del efecto (lint react-hooks/set-state-in-effect).
  // null = todavía no se sabe; el filtrado de planes espera a que se
  // resuelva para no mostrar por un instante planes que luego desaparecen.
  const [coberturaApi, setCoberturaApi] = useState<boolean | null>(null);

  const municipioConocido = Boolean(usuario?.municipio && usuario?.provincia);
  const cobertura: boolean | null = !usuario
    ? null
    : !municipioConocido
      ? false
      : coberturaApi;

  useEffect(() => {
    // Mismo criterio que el backend en inscripcionController.js: sin
    // municipio no se consulta la API, ya se resolvió arriba como false.
    if (!usuario || !usuario.municipio || !usuario.provincia) return;

    const { provincia, municipio } = usuario;
    let cancelado = false;

    (async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/municipios-practica/cobertura?provincia=${encodeURIComponent(provincia)}&municipio=${encodeURIComponent(municipio)}`,
        );
        const json = await res.json();
        if (!cancelado && json.success) setCoberturaApi(json.data.cubierto);
      } catch {
        // si falla, se asume "no cubierto": es el lado seguro — como
        // mucho le ofrecemos solo el teórico y el backend la rechazaría
        // igual si intentara un plan con práctica sin cobertura.
        if (!cancelado) setCoberturaApi(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [usuario]);

  // Planes que de verdad puede elegir esta estudiante. En "estandar" sin
  // cobertura, solo queda "teorico"; con cobertura (o en cualquier otro
  // programa) se muestran todos los del programa.
  const planesDisponibles =
    programa === "estandar" && cobertura === false
      ? planesActuales.filter((p) => p.codigo === "teorico")
      : planesActuales;

  // Plan realmente seleccionado. Si la estudiante todavía no eligió, o si
  // lo que eligió dejó de estar disponible (cambió de programa, o resolvió
  // que su municipio no tiene cobertura y su plan tenía práctica), cae al
  // primero de la lista. Derivado a propósito: antes esto era un efecto
  // con setTipoPlan, que disparaba un render en cascada por cada cambio.
  const tipoPlanEfectivo: Plan["codigo"] | "" = planesDisponibles.some(
    (p) => p.codigo === tipoPlan,
  )
    ? tipoPlan
    : (planesDisponibles[0]?.codigo ?? "");

  async function copiarCuenta(numero: string, indice: number) {
    try {
      await navigator.clipboard.writeText(numero);
      setCuentaCopiada(indice);
      setTimeout(() => setCuentaCopiada(null), 2000);
    } catch {
      // si el navegador bloquea el portapapeles, la estudiante igual puede
      // copiar el número a mano — no bloqueante
    }
  }

  async function enviarFormulario(e: React.FormEvent) {
    e.preventDefault();
    if (!archivo) {
      setMensaje({ tipo: "error", texto: "Sube una foto de tu comprobante." });
      return;
    }
    if (!bancoEmisor || !numeroReferencia || !fechaDeposito) {
      setMensaje({ tipo: "error", texto: "Completa todos los campos." });
      return;
    }

    setEnviando(true);
    setMensaje(null);

    try {
      const datosForm = new FormData();
      datosForm.append("imagen", archivo);
      const resUpload = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/uploads/imagen`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: datosForm,
        },
      );
      const jsonUpload = await resUpload.json();
      if (!jsonUpload.success) {
        setMensaje({ tipo: "error", texto: jsonUpload.error || "No se pudo subir el comprobante." });
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/inscripciones/mia`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tipoPlan: tipoPlanEfectivo,
          programa,
          bancoEmisor,
          numeroReferencia,
          fechaDeposito,
          comprobanteUrl: jsonUpload.data.url,
        }),
      });
      const json = await res.json();

      if (json.success) {
        setEnviado(true);
      } else {
        setMensaje({ tipo: "error", texto: json.error || "No se pudo enviar tu inscripción." });
      }
    } catch {
      setMensaje({ tipo: "error", texto: "No pudimos conectar con el servidor." });
    } finally {
      setEnviando(false);
    }
  }

  const [reenviandoVerificacion, setReenviandoVerificacion] = useState(false);
  const [mensajeVerificacion, setMensajeVerificacion] = useState<string | null>(null);

  async function reenviarVerificacion() {
    setReenviandoVerificacion(true);
    setMensajeVerificacion(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/reenviar-verificacion`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } },
      );
      const json = await res.json();
      setMensajeVerificacion(
        json.success
          ? "Correo reenviado — revisa tu bandeja de entrada."
          : json.error || "No se pudo reenviar.",
      );
    } catch {
      setMensajeVerificacion("No pudimos conectar con el servidor.");
    } finally {
      setReenviandoVerificacion(false);
    }
  }

  const yaTieneInscripcionActiva =
    inscripcion &&
    (inscripcion.estadoPago === "pagado" ||
      inscripcion.estadoPago === "pendiente_verificacion" ||
      inscripcion.estadoPago === "pendiente");

  return (
    <main className="bg-neutral-bg min-h-screen">
      {/* --- Hero --- */}
      <section className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/inscripcion/teoria-2.jpg"
          alt="Clase teórica de Muvo RD Vial"
          className="w-full h-72 md:h-96 object-cover"
        />
        <div className="absolute inset-0 bg-brand-blue/60 flex items-center">
          <div className="max-w-3xl mx-auto px-6 text-center text-white">
            <h1 className="font-display text-3xl md:text-5xl font-bold mb-3">
              Aprende a conducir con confianza
            </h1>
            <p className="text-sm md:text-base opacity-90">
              Clases teóricas y prácticas guiadas por Muvo RD Vial —
              embajadores de la educación vial.
            </p>
          </div>
        </div>
      </section>

      {/* --- Galería --- */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        <h2 className="font-display text-xl font-bold text-brand-blue mb-6 text-center">
          Así es nuestro curso
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/inscripcion/teoria-1.jpg"
            alt="Estudiantes en clase teórica"
            className="w-full h-56 object-cover rounded-xl"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/inscripcion/teoria-3.jpg"
            alt="Graduación de estudiantes"
            className="w-full h-56 object-cover rounded-xl"
          />
        </div>
      </section>

      {/* --- Selector de programa (NUEVO 13/09/2026) --- */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        <h2 className="font-display text-xl font-bold text-brand-blue mb-2 text-center">
          Elige tu curso
        </h2>
        <p className="text-sm text-neutral-text text-center mb-8">
          Cada programa tiene su propio contenido y precio.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {PROGRAMAS.map((p) => (
            <button
              key={p.valor}
              type="button"
              onClick={() => setPrograma(p.valor)}
              className={`text-left rounded-xl bg-white overflow-hidden border transition-colors ${programa === p.valor ? "border-brand-pink ring-2 ring-brand-pink" : "border-neutral-bg hover:border-brand-blueLight"
                }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.imagen} alt={p.nombre} className="w-full h-32 object-cover" />
              <div className="p-5">
                <h3 className="font-display font-bold text-brand-blue text-lg mb-1">
                  {p.nombre}
                </h3>
                <p className="text-sm text-neutral-text">{p.foco}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* --- Comparación de planes --- */}
      {programa && (
        <section className="max-w-5xl mx-auto px-6 py-12">
          <h2 className="font-display text-xl font-bold text-brand-blue mb-2 text-center">
            Elige tu plan
          </h2>
          <p className="text-sm text-neutral-text text-center mb-8">
            {cargandoPlanes && "Cargando planes..."}
          </p>

          {/* NUEVO (13/09/2026): aviso de cobertura de práctica — ver
            ANALISIS_COBERTURA_PRACTICA.md, sección 6. Solo aplica a
            "estandar"; Motorizados y Pesados son teóricos en todo el país,
            así que ahí el aviso sobraría. */}
          {programa === "estandar" && cobertura === false && (
            <div className="mb-8 rounded-xl border border-brand-blueLight bg-brand-blueLight/10 px-5 py-4">
              <p className="text-sm text-neutral-text">
                {usuario?.municipio ? (
                  <>
                    Por ahora la práctica de manejo presencial no está
                    disponible en <strong>{usuario.municipio}</strong>. Puedes
                    inscribirte en la modalidad <strong>Solo Teórico</strong> y
                    completar el curso completo en línea. Estamos trabajando
                    para llegar a más municipios.
                  </>
                ) : (
                  <>
                    No tenemos registrado tu municipio, así que por ahora solo
                    podemos ofrecerte la modalidad{" "}
                    <strong>Solo Teórico</strong>. Si quieres la práctica de
                    manejo, contáctanos para actualizar tus datos.
                  </>
                )}
              </p>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-6">
            {planesDisponibles.map((plan) => {
              const destacado = plan.codigo === "vip";
              return (
                <div
                  key={plan.codigo}
                  className={`rounded-xl bg-white overflow-hidden border ${destacado ? "border-brand-pink" : "border-neutral-bg"
                    }`}
                >
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-display font-bold text-brand-blue text-lg">
                        {plan.nombre}
                      </h3>
                      {destacado && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-brand-pink text-white">
                          Más completo
                        </span>
                      )}
                    </div>
                    <p className="text-2xl font-display font-bold text-brand-blue mb-1">
                      {formatearMonto(plan.precio)}
                    </p>
                    {/* <p className="text-xs text-neutral-text mb-4">
                    {plan.modalidadPractica === "grupal"
                      ? `Práctica en grupo, sesiones de ${plan.duracionSesionMinutos} min por estudiante`
                      : `${plan.cantidadSesionesPractica} sesiones de práctica de ${plan.duracionSesionMinutos} min, individuales`}
                    {" · "}
                    RD${plan.costoPorSesion}/sesión de combustible (se paga
                    en el lugar de la práctica)
                  </p> */}
                    <ul className="grid gap-2 text-sm text-neutral-text mt-4 mb-4">
                      {plan.caracteristicas.map((caracteristica) => (
                        <li key={caracteristica} className="flex gap-2">
                          <CheckCircle2
                            size={18}
                            className={`shrink-0 ${destacado ? "text-brand-pink" : "text-brand-blueLight"}`}
                          />
                          {caracteristica}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* --- Cómo inscribirte --- */}
      <section className="max-w-3xl mx-auto px-6 py-12">
        <h2 className="font-display text-xl font-bold text-brand-blue mb-8 text-center">
          Cómo inscribirte
        </h2>
        <div className="grid gap-6">
          <div className="flex gap-4 items-start">
            <div className="rounded-full bg-brand-blue text-white w-9 h-9 flex items-center justify-center font-display font-bold shrink-0">
              1
            </div>
            <div>
              <p className="font-medium text-brand-blue mb-1">Elige tu curso y tu plan</p>
              <p className="text-sm text-neutral-text">
                Categoría 01 (Motocicletas), 02 (Vehículos Livianos) o 03/04
                (Vehículos Pesados) — cada uno con el plan que mejor se
                ajuste a lo que necesitas.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="rounded-full bg-brand-blue text-white w-9 h-9 flex items-center justify-center font-display font-bold shrink-0">
              2
            </div>
            <div className="w-full">
              <p className="font-medium text-brand-blue mb-2">
                Deposita el monto en nuestra cuenta
              </p>
              <div className="grid gap-2 max-w-sm">
                {CUENTAS_BANCARIAS.map((cuenta, indice) => (
                  <div
                    key={cuenta.banco}
                    className="flex items-center justify-between gap-3 text-sm bg-neutral-bg border border-neutral-bg rounded-lg p-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs text-neutral-text opacity-70 truncate">
                        {cuenta.banco} · Muvo RD Vial
                      </p>
                      <p className="font-display font-semibold text-brand-blue tracking-wide">
                        {cuenta.numero}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copiarCuenta(cuenta.numero, indice)}
                      className="shrink-0 flex items-center gap-1.5 rounded-full bg-white border border-neutral-bg px-3 py-1.5 text-xs font-medium text-brand-blue hover:bg-brand-blue hover:text-white transition-colors"
                    >
                      {cuentaCopiada === indice ? (
                        <>
                          <Check size={14} /> Copiado
                        </>
                      ) : (
                        <>
                          <Copy size={14} /> Copiar
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="rounded-full bg-brand-blue text-white w-9 h-9 flex items-center justify-center font-display font-bold shrink-0">
              <UploadCloud size={18} />
            </div>
            <div>
              <p className="font-medium text-brand-blue mb-1">
                Sube tu comprobante
              </p>
              <p className="text-sm text-neutral-text">
                Una foto del voucher, junto con el banco, la referencia y la
                fecha del depósito — en el formulario de abajo.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="rounded-full bg-brand-blue text-white w-9 h-9 flex items-center justify-center font-display font-bold shrink-0">
              <Clock size={18} />
            </div>
            <div>
              <p className="font-medium text-brand-blue mb-1">
                Espera la verificación
              </p>
              <p className="text-sm text-neutral-text">
                Revisamos tu comprobante y te avisamos en tu panel de
                estudiante.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="rounded-full bg-brand-blue text-white w-9 h-9 flex items-center justify-center font-display font-bold shrink-0">
              <GraduationCap size={18} />
            </div>
            <div>
              <p className="font-medium text-brand-blue mb-1">
                Accede al aula virtual
              </p>
              <p className="text-sm text-neutral-text">
                Una vez confirmado tu pago, ya puedes empezar la Sesión 1.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- Formulario --- */}
      <section id="formulario" className="max-w-xl mx-auto px-6 pb-20">
        <div className="rounded-xl bg-white border border-neutral-bg p-6 md:p-8">
          {cargando && <p className="text-sm text-neutral-text">Cargando...</p>}

          {!cargando && enviado && (
            <div className="text-center">
              <p className="font-display font-semibold text-brand-blue text-lg mb-2">
                ¡Listo! Tu comprobante fue enviado
              </p>
              <p className="text-sm text-neutral-text mb-6">
                Te avisaremos en tu panel de estudiante en cuanto lo
                verifiquemos.
              </p>
              <Link
                href="/dashboard"
                className="inline-block rounded-full bg-brand-blue text-white px-6 py-3 font-medium hover:opacity-90"
              >
                Ir a mi panel
              </Link>
            </div>
          )}

          {!cargando && !enviado && usuario && !usuario.emailVerificado && (
            <div className="text-center">
              <p className="font-display font-semibold text-brand-blue text-lg mb-2">
                Verifica tu correo primero
              </p>
              <p className="text-sm text-neutral-text mb-4">
                Antes de inscribirte, confirma tu correo con el link que te
                enviamos al registrarte.
              </p>
              {mensajeVerificacion && (
                <p className="text-xs text-neutral-text mb-4">{mensajeVerificacion}</p>
              )}
              <button
                onClick={reenviarVerificacion}
                disabled={reenviandoVerificacion}
                className="inline-block rounded-full bg-brand-pink text-white px-6 py-3 font-medium hover:opacity-90 disabled:opacity-60"
              >
                {reenviandoVerificacion ? "Enviando..." : "Reenviar correo de verificación"}
              </button>
            </div>
          )}

          {!cargando && !enviado && usuario?.emailVerificado && yaTieneInscripcionActiva && (
            <div className="text-center">
              <p className="font-display font-semibold text-brand-blue text-lg mb-2">
                Ya tienes una inscripción activa
              </p>
              <p className="text-sm text-neutral-text mb-6">
                Revisa el estado de tu pago en tu panel de estudiante.
              </p>
              <Link
                href="/dashboard"
                className="inline-block rounded-full bg-brand-blue text-white px-6 py-3 font-medium hover:opacity-90"
              >
                Ir a mi panel
              </Link>
            </div>
          )}

          {!cargando && !enviado && usuario?.emailVerificado && !yaTieneInscripcionActiva && !programa && (
            <p className="text-sm text-neutral-text text-center">
              Elige uno de los 3 cursos arriba para ver sus planes y continuar.
            </p>
          )}

          {!cargando && !enviado && usuario?.emailVerificado && !yaTieneInscripcionActiva && programa && (
            <>
              <h3 className="font-display font-semibold text-brand-blue text-lg mb-1">
                Formulario de inscripción
              </h3>

              {inscripcion?.estadoPago === "rechazado" && (
                <div className="text-sm bg-brand-pinkLight border border-brand-pink rounded-lg p-3 mb-4 text-brand-blue">
                  Tu comprobante anterior no fue validado
                  {inscripcion.notaRechazo && `: ${inscripcion.notaRechazo}`}.
                  Puedes corregirlo y reenviarlo abajo.
                </div>
              )}

              <form onSubmit={enviarFormulario} className="grid gap-4 mt-4">
                <label className="text-sm text-neutral-text">
                  Plan
                  <select
                    value={tipoPlanEfectivo}
                    onChange={(e) =>
                      setTipoPlan(e.target.value as Plan["codigo"])
                    }
                    required
                    className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
                  >
                    {planesDisponibles.map((plan) => (
                      <option key={plan.codigo} value={plan.codigo}>
                        {plan.nombre} — {formatearMonto(plan.precio)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm text-neutral-text">
                  Banco emisor
                  <select
                    value={bancoEmisor}
                    onChange={(e) => setBancoEmisor(e.target.value)}
                    required
                    className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
                  >
                    <option value="">Selecciona tu banco...</option>
                    {BANCOS.map((banco) => (
                      <option key={banco} value={banco}>
                        {banco}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm text-neutral-text">
                  Número de referencia/confirmación
                  <input
                    type="text"
                    value={numeroReferencia}
                    onChange={(e) => setNumeroReferencia(e.target.value)}
                    required
                    className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
                  />
                </label>

                <label className="text-sm text-neutral-text">
                  Fecha del depósito
                  <input
                    type="date"
                    value={fechaDeposito}
                    onChange={(e) => setFechaDeposito(e.target.value)}
                    required
                    className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
                  />
                </label>

                <label className="text-sm text-neutral-text">
                  Foto del comprobante
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
                    required
                    className="mt-1 w-full text-sm"
                  />
                </label>

                {mensaje && (
                  <div
                    className={`rounded-lg p-3 text-sm ${mensaje.tipo === "ok"
                      ? "bg-status-success/10 border border-status-success text-status-success"
                      : "bg-brand-pinkLight border border-brand-pink text-brand-blue"
                      }`}
                  >
                    {mensaje.texto}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    enviando ||
                    cargandoPlanes ||
                    planesDisponibles.length === 0 ||
                    !tipoPlanEfectivo
                  }
                  className="rounded-xl bg-brand-pink text-white p-4 font-display font-semibold hover:opacity-90 disabled:opacity-60"
                >
                  {enviando ? "Enviando..." : "Enviar comprobante"}
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

export default function InscripcionPage() {
  return (
    <RutaProtegida rolesPermitidos={["estudiante"]}>
      {/* Suspense requerido por useSearchParams (?programa=) en Next.js */}
      <Suspense fallback={null}>
        <InscripcionContenido />
      </Suspense>
    </RutaProtegida>
  );
}