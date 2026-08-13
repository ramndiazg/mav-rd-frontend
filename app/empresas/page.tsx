"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  ShieldCheck,
  GraduationCap,
  Send,
  CheckCircle2,
} from "lucide-react";

const beneficios = [
  {
    icono: Building2,
    titulo: "Menos accidentes, menos costos",
    detalle:
      "Un equipo capacitado en manejo defensivo reduce siniestros, reclamos de seguro y tiempo perdido por incidentes viales.",
  },
  {
    icono: ShieldCheck,
    titulo: "Responsabilidad social real",
    detalle:
      "Apoyas directamente la misión de una fundación dominicana sin fines de lucro dedicada a la educación vial.",
  },
  {
    icono: Users,
    titulo: "Se adapta al tamaño de tu equipo",
    detalle:
      "Desde un grupo pequeño hasta toda tu flotilla — cotizamos según la cantidad de personas que necesites capacitar.",
  },
  {
    icono: GraduationCap,
    titulo: "Curso completo, no un taller suelto",
    detalle:
      "Teoría y práctica de manejo con el mismo programa que ya formó a cientos de estudiantes, adaptado a tu empresa.",
  },
];

const pasos = [
  {
    numero: "01",
    titulo: "Cuéntanos de tu equipo",
    detalle:
      "Completa el formulario con la cantidad aproximada de personas que quieres capacitar.",
  },
  {
    numero: "02",
    titulo: "Te cotizamos",
    detalle:
      "Te contactamos con un plan y precio según el tamaño de tu grupo.",
  },
  {
    numero: "03",
    titulo: "Coordinamos las sesiones",
    detalle:
      "Programamos la teoría y la práctica de manejo en las fechas que mejor le funcionen a tu empresa.",
  },
];

type Form = {
  nombreEmpresa: string;
  contacto: string;
  cargo: string;
  telefono: string;
  email: string;
  cantidadEstudiantes: string;
  mensaje: string;
};

const formVacio: Form = {
  nombreEmpresa: "",
  contacto: "",
  cargo: "",
  telefono: "",
  email: "",
  cantidadEstudiantes: "",
  mensaje: "",
};

export default function EmpresasPage() {
  const [form, setForm] = useState<Form>(formVacio);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function actualizar(campo: keyof Form, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/empresas/contacto`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );
      const json = await res.json();
      if (json.success) {
        setEnviado(true);
      } else {
        setError(json.error || "No se pudo enviar tu solicitud.");
      }
    } catch {
      setError("No pudimos conectar con el servidor.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="bg-neutral-bg">
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-blue to-brand-blue-light text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:py-24">
          <p className="font-display text-sm font-semibold uppercase tracking-wide text-brand-pink-light">
            Programa empresarial
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold leading-tight sm:text-5xl">
            Educación vial para todo tu equipo
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-white/85">
            Llevamos el mismo curso de teoría y práctica que ya formó a
            cientos de estudiantes, adaptado para capacitar a tu personal —
            con un precio que se ajusta a la cantidad de personas.
          </p>
          <Link
            href="#formulario"
            className="mt-8 inline-block rounded-full bg-brand-pink px-8 py-3 text-sm font-semibold text-white transition hover:bg-brand-pink/90"
          >
            Solicitar información
          </Link>
        </div>
      </section>

      <div className="road-divider" />

      {/* Beneficios */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center font-display text-3xl font-bold text-brand-blue">
          ¿Por qué capacitar a tu equipo con nosotros?
        </h2>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {beneficios.map((b) => (
            <div
              key={b.titulo}
              className="flex gap-4 rounded-xl border border-brand-blue/10 bg-white p-6 shadow-sm"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-pink-light text-brand-pink">
                <b.icono size={20} />
              </div>
              <div>
                <h3 className="font-display font-semibold text-brand-blue">
                  {b.titulo}
                </h3>
                <p className="mt-1 text-sm text-neutral-text/75">
                  {b.detalle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="road-divider" />

      {/* Cómo funciona */}
      <section className="bg-brand-pink-light">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-center font-display text-3xl font-bold text-brand-blue">
            Cómo funciona
          </h2>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {pasos.map((paso) => (
              <div key={paso.numero} className="rounded-xl bg-white p-6 shadow-sm">
                <span className="font-display text-3xl font-bold text-brand-pink">
                  {paso.numero}
                </span>
                <h3 className="mt-3 font-display text-lg font-semibold text-brand-blue">
                  {paso.titulo}
                </h3>
                <p className="mt-2 text-sm text-neutral-text/75">
                  {paso.detalle}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-neutral-text/70">
            El precio por persona varía según el tamaño del grupo — te lo
            confirmamos apenas recibamos tu solicitud.
          </p>
        </div>
      </section>

      {/* Formulario */}
      <section id="formulario" className="mx-auto max-w-xl px-4 py-16">
        <div className="rounded-xl border border-brand-blue/10 bg-white p-6 shadow-sm sm:p-8">
          {enviado ? (
            <div className="text-center">
              <CheckCircle2 className="mx-auto text-status-success" size={40} />
              <p className="mt-4 font-display text-lg font-semibold text-brand-blue">
                ¡Solicitud enviada!
              </p>
              <p className="mt-2 text-sm text-neutral-text/75">
                Nos pondremos en contacto contigo pronto para cotizar según
                el tamaño de tu equipo.
              </p>
            </div>
          ) : (
            <>
              <h2 className="font-display text-xl font-bold text-brand-blue">
                Solicita información
              </h2>
              <p className="mt-1 text-sm text-neutral-text/75">
                Cuéntanos sobre tu empresa y te contactamos con una propuesta.
              </p>

              <form onSubmit={enviar} className="mt-6 grid gap-4">
                <label className="text-sm text-neutral-text">
                  Nombre de la empresa
                  <input
                    type="text"
                    required
                    value={form.nombreEmpresa}
                    onChange={(e) => actualizar("nombreEmpresa", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm text-neutral-text">
                    Persona de contacto
                    <input
                      type="text"
                      required
                      value={form.contacto}
                      onChange={(e) => actualizar("contacto", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="text-sm text-neutral-text">
                    Cargo (opcional)
                    <input
                      type="text"
                      value={form.cargo}
                      onChange={(e) => actualizar("cargo", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
                    />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm text-neutral-text">
                    Teléfono
                    <input
                      type="tel"
                      required
                      value={form.telefono}
                      onChange={(e) => actualizar("telefono", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="text-sm text-neutral-text">
                    Correo
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => actualizar("email", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
                    />
                  </label>
                </div>

                <label className="text-sm text-neutral-text">
                  Cantidad aproximada de estudiantes
                  <input
                    type="number"
                    min={1}
                    value={form.cantidadEstudiantes}
                    onChange={(e) =>
                      actualizar("cantidadEstudiantes", e.target.value)
                    }
                    className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
                  />
                </label>

                <label className="text-sm text-neutral-text">
                  Mensaje (opcional)
                  <textarea
                    rows={3}
                    value={form.mensaje}
                    onChange={(e) => actualizar("mensaje", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
                  />
                </label>

                {error && (
                  <div className="rounded-lg border border-brand-pink bg-brand-pink-light p-3 text-sm text-brand-blue">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={enviando}
                  className="flex items-center justify-center gap-2 rounded-xl bg-brand-pink p-4 font-display font-semibold text-white transition hover:bg-brand-pink/90 disabled:opacity-60"
                >
                  <Send size={18} />
                  {enviando ? "Enviando..." : "Enviar solicitud"}
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    </main>
  );
}