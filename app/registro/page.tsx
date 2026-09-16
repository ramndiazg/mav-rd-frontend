"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import { useAuth } from "@/contexts/AuthContext";

const PROVINCIAS = [
  "Azua",
  "Bahoruco",
  "Barahona",
  "Dajabon",
  "Distrito Nacional",
  "Duarte",
  "Elias Pina",
  "El Seibo",
  "Espaillat",
  "Hato Mayor",
  "Hermanas Mirabal",
  "Independencia",
  "La Altagracia",
  "La Romana",
  "La Vega",
  "Maria Trinidad Sanchez",
  "Monsenor Nouel",
  "Monte Cristi",
  "Monte Plata",
  "Pedernales",
  "Peravia",
  "Puerto Plata",
  "Samana",
  "San Cristobal",
  "San Jose de Ocoa",
  "San Juan",
  "San Pedro de Macoris",
  "Sanchez Ramirez",
  "Santiago",
  "Santiago Rodriguez",
  "Santo Domingo",
  "Valverde",
];

type FormularioRegistro = {
  nombre: string;
  apellido: string;
  cedula: string;
  telefono: string;
  email: string;
  password: string;
  provincia: string;
  // NUEVO (13/09/2026): ver ANALISIS_COBERTURA_PRACTICA.md — determina
  // más adelante si a la estudiante le aplica la práctica de manejo
  // presencial en /inscripcion.
  municipio: string;
  fechaNacimiento: string;
  // NUEVO (10/09/2026): honeypot — ver ARQUITECTURA_BACKEND.md.
  sitioWeb: string;
};

const FORM_INICIAL: FormularioRegistro = {
  nombre: "",
  apellido: "",
  cedula: "",
  telefono: "",
  email: "",
  password: "",
  provincia: "",
  municipio: "",
  fechaNacimiento: "",
  sitioWeb: "",
};

// NUEVO (13/09/2026): dato de referencia provincia→municipios, para el
// <select> encadenado de abajo — ver ANALISIS_COBERTURA_PRACTICA.md,
// "Diseño de datos", punto 1. Se trae del backend (fuente única,
// src/data/municipiosRD.js) en vez de duplicarlo aquí.
type ProvinciaConMunicipios = { provincia: string; municipios: string[] };

// NUEVO (10/09/2026): si no hay site key configurada (ej. desarrollo
// local), el widget de Turnstile simplemente no se renderiza y el
// registro sigue funcionando sin captchaToken — el backend hace lo mismo
// (verificarCaptcha deja pasar si TURNSTILE_SECRET_KEY no está puesta).
// En producción (Render/Vercel) esta variable SIEMPRE debe estar puesta.
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

function RegistroContenido() {
  const { registro, usuario } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // NUEVO (13/09/2026): mismo propósito que en /login — si alguien llegó
  // aquí desde una ruta protegida (ej. /inscripcion?programa=motorizados
  // vía RutaProtegida → /login → "Registrate" → aquí), no perder ese
  // destino tras crear la cuenta. Se valida que empiece con "/" para no
  // abrir un redirect a un dominio externo.
  const redirectParam = searchParams.get("redirect");
  const redirectSeguro =
    redirectParam && redirectParam.startsWith("/") ? redirectParam : null;

  const [form, setForm] = useState<FormularioRegistro>(FORM_INICIAL);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");

  // NUEVO (13/09/2026): provincia→municipios para el <select> en cascada.
  const [provinciasConMunicipios, setProvinciasConMunicipios] = useState<
    ProvinciaConMunicipios[]
  >([]);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/ubicaciones/provincias-municipios`,
        );
        const json = await res.json();
        if (!cancelado && json.success) {
          setProvinciasConMunicipios(json.data);
        }
      } catch {
        // si falla, el <select> de municipio simplemente queda vacío — la
        // persona puede recargar la página para reintentar.
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  const municipiosDeProvincia =
    provinciasConMunicipios.find((p) => p.provincia === form.provincia)
      ?.municipios ?? [];
  // NUEVO (13/09/2026): ver el mismo campo en /login — cuando el registro
  // deja a la persona auto-logueada, no navegamos justo después de
  // registro() (esa actualización de `usuario` en el contexto es
  // asíncrona); esperamos a que este flag confirme que sí fue
  // autoLogueado y dejamos que el useEffect de abajo navegue una vez
  // `usuario` ya esté confirmado.
  const [autoLogueado, setAutoLogueado] = useState(false);

  // El widget de Turnstile llama a esta función global cuando la persona
  // resuelve el challenge (data-callback="onTurnstileSuccess" en el div
  // de abajo) — así el token entra al estado de React sin necesitar una
  // librería aparte solo para esto.
  useEffect(() => {
    (window as unknown as { onTurnstileSuccess?: (t: string) => void }).onTurnstileSuccess =
      (token: string) => setCaptchaToken(token);
    return () => {
      delete (window as unknown as { onTurnstileSuccess?: (t: string) => void })
        .onTurnstileSuccess;
    };
  }, []);

  // CORREGIDO (13/09/2026): misma carrera que en /login — navegar justo
  // dentro de manejarSubmit, en el mismo instante en que registro()
  // acababa de llamar a setUsuario, podía hacer que RutaProtegida en
  // /dashboard viera `usuario: null` por un instante y rebotara de
  // vuelta. Ahora se espera a que `usuario` del contexto quede
  // confirmado antes de navegar.
  useEffect(() => {
    if (!autoLogueado || !usuario) return;
    router.push(redirectSeguro || "/dashboard");
  }, [autoLogueado, usuario, redirectSeguro, router]);

  function actualizar(campo: keyof FormularioRegistro, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function manejarSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setEnviando(true);

    const resultado = await registro({ ...form, captchaToken });

    setEnviando(false);

    if (!resultado.ok) {
      setError(resultado.error || "No se pudo crear la cuenta.");
      return;
    }

    if (resultado.autoLogueado) {
      setAutoLogueado(true);
    } else {
      router.push(
        redirectSeguro
          ? `/login?redirect=${encodeURIComponent(redirectSeguro)}`
          : "/login",
      );
    }
  }

  return (
    <main className="bg-neutral-bg min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md bg-white rounded-xl p-8">
        <h1 className="font-display text-2xl font-bold text-brand-blue mb-1 text-center">
          Crear cuenta
        </h1>
        <p className="text-sm text-neutral-text text-center mb-8">
          Registrate para inscribirte en el curso.
        </p>

        <form onSubmit={manejarSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-neutral-text mb-1">
                Nombre
              </label>
              <input
                required
                value={form.nombre}
                onChange={(e) => actualizar("nombre", e.target.value)}
                className="w-full rounded-lg border border-neutral-bg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-text mb-1">
                Apellido
              </label>
              <input
                required
                value={form.apellido}
                onChange={(e) => actualizar("apellido", e.target.value)}
                className="w-full rounded-lg border border-neutral-bg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-neutral-text mb-1">
              Cedula
            </label>
            <input
              required
              placeholder="000-0000000-0"
              value={form.cedula}
              onChange={(e) => actualizar("cedula", e.target.value)}
              className="w-full rounded-lg border border-neutral-bg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          <div>
            <label className="block text-sm text-neutral-text mb-1">
              Telefono
            </label>
            <input
              required
              type="tel"
              value={form.telefono}
              onChange={(e) => actualizar("telefono", e.target.value)}
              className="w-full rounded-lg border border-neutral-bg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          <div>
            <label className="block text-sm text-neutral-text mb-1">
              Correo
            </label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => actualizar("email", e.target.value)}
              className="w-full rounded-lg border border-neutral-bg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          <div>
            <label className="block text-sm text-neutral-text mb-1">
              Contrasena
            </label>
            <input
              required
              type="password"
              minLength={8}
              value={form.password}
              onChange={(e) => actualizar("password", e.target.value)}
              className="w-full rounded-lg border border-neutral-bg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          <div>
            <label className="block text-sm text-neutral-text mb-1">
              Provincia
            </label>
            <select
              required
              value={form.provincia}
              onChange={(e) => {
                // NUEVO (13/09/2026): al cambiar de provincia, el
                // municipio elegido antes ya no aplica — se limpia para
                // no dejar guardado un municipio de otra provincia.
                setForm((prev) => ({
                  ...prev,
                  provincia: e.target.value,
                  municipio: "",
                }));
              }}
              className="w-full rounded-lg border border-neutral-bg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
            >
              <option value="" disabled>
                Selecciona tu provincia
              </option>
              {PROVINCIAS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-neutral-text mb-1">
              Municipio
            </label>
            <select
              required
              disabled={!form.provincia}
              value={form.municipio}
              onChange={(e) => actualizar("municipio", e.target.value)}
              className="w-full rounded-lg border border-neutral-bg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue disabled:opacity-60"
            >
              <option value="" disabled>
                {form.provincia
                  ? "Selecciona tu municipio"
                  : "Primero elige tu provincia"}
              </option>
              {municipiosDeProvincia.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-neutral-text mb-1">
              Fecha de nacimiento
            </label>
            <input
              required
              type="date"
              value={form.fechaNacimiento}
              onChange={(e) => actualizar("fechaNacimiento", e.target.value)}
              className="w-full rounded-lg border border-neutral-bg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          {/* NUEVO (10/09/2026): honeypot — invisible para una persona
              real, un bot simple que no ejecuta CSS lo rellena igual. */}
          <label className="absolute -left-[9999px]" aria-hidden="true">
            Sitio web
            <input
              type="text"
              name="sitioWeb"
              tabIndex={-1}
              autoComplete="off"
              value={form.sitioWeb}
              onChange={(e) => actualizar("sitioWeb", e.target.value)}
            />
          </label>

          {error && <p className="text-sm text-brand-pink">{error}</p>}

          {TURNSTILE_SITE_KEY && (
            <>
              <Script
                src="https://challenges.cloudflare.com/turnstile/v0/api.js"
                strategy="afterInteractive"
              />
              <div
                className="cf-turnstile"
                data-sitekey={TURNSTILE_SITE_KEY}
                data-callback="onTurnstileSuccess"
              />
            </>
          )}

          <button
            type="submit"
            disabled={enviando || (!!TURNSTILE_SITE_KEY && !captchaToken)}
            className="mt-2 bg-brand-pink text-white py-2.5 rounded-full font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {enviando ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        <p className="text-sm text-neutral-text text-center mt-6">
          Ya tienes cuenta?{" "}
          <Link
            href={
              redirectSeguro
                ? `/login?redirect=${encodeURIComponent(redirectSeguro)}`
                : "/login"
            }
            className="text-brand-pink underline"
          >
            Inicia sesion
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function RegistroPage() {
  return (
    <Suspense fallback={null}>
      <RegistroContenido />
    </Suspense>
  );
}