"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, UploadCloud, Clock, GraduationCap } from "lucide-react";
import RutaProtegida from "@/components/auth/RutaProtegida";
import { useAuth } from "@/contexts/AuthContext";

type Precios = { precio_plan_normal: number; precio_plan_vip: number };

type EstadoPago = "pendiente" | "pendiente_verificacion" | "pagado" | "rechazado";

type Inscripcion = {
  _id: string;
  tipoPlan: "normal" | "vip";
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

function formatearMonto(valor: number) {
  return `RD$${valor.toLocaleString("es-DO")}`;
}

function InscripcionContenido() {
  const { token } = useAuth();

  const [precios, setPrecios] = useState<Precios | null>(null);
  const [inscripcion, setInscripcion] = useState<Inscripcion | null>(null);
  const [cargando, setCargando] = useState(true);

  // --- Formulario ---
  const [tipoPlan, setTipoPlan] = useState<"normal" | "vip">("normal");
  const [bancoEmisor, setBancoEmisor] = useState("");
  const [numeroReferencia, setNumeroReferencia] = useState("");
  const [fechaDeposito, setFechaDeposito] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(
    null,
  );
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    let cancelado = false;

    (async () => {
      try {
        const [resPrecios, resInscripcion] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/configuracion`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/inscripciones/me`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        const jsonPrecios = await resPrecios.json();
        const jsonInscripcion = await resInscripcion.json();

        if (cancelado) return;

        if (jsonPrecios.success) setPrecios(jsonPrecios.data);
        if (jsonInscripcion.success) setInscripcion(jsonInscripcion.data);
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
          tipoPlan,
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
              Clases teóricas y prácticas guiadas por Mujeres al Volante RD —
              embajadoras de la educación vial.
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

      {/* --- Comparación de planes --- */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        <h2 className="font-display text-xl font-bold text-brand-blue mb-2 text-center">
          Elige tu plan
        </h2>
        <p className="text-sm text-neutral-text text-center mb-8">
          La parte teórica es la misma en ambos planes — la diferencia está en
          la práctica.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Plan Normal */}
          <div className="rounded-xl bg-white border border-neutral-bg overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/inscripcion/practica-normal-ilustracion.jpg"
              alt="Práctica en grupo del plan Normal"
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <h3 className="font-display font-bold text-brand-blue text-lg mb-1">
                Plan Normal
              </h3>
              <p className="text-2xl font-display font-bold text-brand-blue mb-4">
                {precios ? formatearMonto(precios.precio_plan_normal) : "..."}
              </p>
              <ul className="grid gap-2 text-sm text-neutral-text">
                <li className="flex gap-2">
                  <CheckCircle2 size={18} className="text-brand-blueLight shrink-0" />
                  Clases teóricas completas
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 size={18} className="text-brand-blueLight shrink-0" />
                  Práctica en grupo — conduces por turnos junto a otras
                  estudiantes
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 size={18} className="text-brand-blueLight shrink-0" />
                  Examen y diploma incluidos
                </li>
              </ul>
            </div>
          </div>

          {/* Plan VIP */}
          <div className="rounded-xl bg-white border border-brand-pink overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/inscripcion/practica-vip.jpg"
              alt="Práctica individual del plan VIP"
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-display font-bold text-brand-blue text-lg">
                  Plan VIP
                </h3>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-brand-pink text-white">
                  Más personalizado
                </span>
              </div>
              <p className="text-2xl font-display font-bold text-brand-blue mb-4">
                {precios ? formatearMonto(precios.precio_plan_vip) : "..."}
              </p>
              <ul className="grid gap-2 text-sm text-neutral-text">
                <li className="flex gap-2">
                  <CheckCircle2 size={18} className="text-brand-pink shrink-0" />
                  Clases teóricas completas
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 size={18} className="text-brand-pink shrink-0" />
                  Práctica 1 a 1 — solo tú y el chofer, sin esperar turno
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 size={18} className="text-brand-pink shrink-0" />
                  Más horas de práctica al volante y trato personalizado
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 size={18} className="text-brand-pink shrink-0" />
                  Examen y diploma incluidos
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

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
              <p className="font-medium text-brand-blue mb-1">Elige tu plan</p>
              <p className="text-sm text-neutral-text">
                Normal o VIP, según lo que necesites en la parte práctica.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="rounded-full bg-brand-blue text-white w-9 h-9 flex items-center justify-center font-display font-bold shrink-0">
              2
            </div>
            <div>
              <p className="font-medium text-brand-blue mb-1">
                Deposita el monto en nuestra cuenta
              </p>
              <div className="text-sm text-neutral-text bg-brand-pinkLight border border-brand-pink rounded-lg p-3 inline-block">
                Datos bancarios: <strong>pendientes de confirmar</strong> — se
                completarán aquí en cuanto la fundadora los proporcione.
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

          {!cargando && !enviado && yaTieneInscripcionActiva && (
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

          {!cargando && !enviado && !yaTieneInscripcionActiva && (
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
                    value={tipoPlan}
                    onChange={(e) => setTipoPlan(e.target.value as "normal" | "vip")}
                    className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
                  >
                    <option value="normal">
                      Normal {precios && `— ${formatearMonto(precios.precio_plan_normal)}`}
                    </option>
                    <option value="vip">
                      VIP {precios && `— ${formatearMonto(precios.precio_plan_vip)}`}
                    </option>
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
                  disabled={enviando}
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
      <InscripcionContenido />
    </RutaProtegida>
  );
}