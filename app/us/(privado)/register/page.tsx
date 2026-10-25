"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUsAuth } from "@/contexts/UsAuthContext";
import { useUsLocale } from "@/contexts/UsLocaleContext";
import {
  BotonPrimario,
  Campo,
  CampoPassword,
  MensajeError,
  Selector,
  TarjetaAuth,
} from "@/components/us/FormUI";
import TurnstileWidget, { TURNSTILE_ACTIVO } from "@/components/us/TurnstileWidget";
import { usFetch } from "@/lib/us/api";
import { ESTADOS_US, nombreEstado, esEstadoUS, type EstadoUS } from "@/lib/us/estados";
import type { ConfigUS } from "@/lib/us/pagos";

// NUEVO (24/10/2026): registro de estudiantes de EE. UU.
// Las validaciones del navegador son solo comodidad; el backend repite todas.

const EDAD_MINIMA = 16;

function fechaLimiteNacimiento(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - EDAD_MINIMA);
  return d.toISOString().slice(0, 10);
}

function digitosTelefonoValidos(valor: string): boolean {
  const d = valor.replace(/\D/g, "");
  const diez = d.length === 11 && d.startsWith("1") ? d.slice(1) : d;
  return diez.length === 10 && !/^[01]/.test(diez);
}

type Formulario = {
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  password: string;
  estadoUS: EstadoUS | "";
  ciudad: string;
  fechaNacimiento: string;
  sitioWeb: string; // honeypot
};

const FORM_INICIAL: Formulario = {
  nombre: "",
  apellido: "",
  telefono: "",
  email: "",
  password: "",
  estadoUS: "",
  ciudad: "",
  fechaNacimiento: "",
  sitioWeb: "",
};

export default function RegistroPage() {
  const router = useRouter();
  const { t, locale } = useUsLocale();
  const { usuario, cargando, registro } = useUsAuth();

  const [form, setForm] = useState<Formulario>(FORM_INICIAL);
  const [acepta, setAcepta] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [resetCaptcha, setResetCaptcha] = useState(0);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [revisaCorreo, setRevisaCorreo] = useState(false);
  const [autoLogueado, setAutoLogueado] = useState(false);
  const [estadosActivos, setEstadosActivos] = useState<EstadoUS[]>(ESTADOS_US);
  const [maxNacimiento] = useState(fechaLimiteNacimiento);

  // Estados disponibles según la configuración (si no responde, los 4).
  useEffect(() => {
    let cancelado = false;
    usFetch<ConfigUS>("/us/config", { token: null, locale })
      .then((config) => {
        if (!cancelado && config.estadosActivos?.length) {
          setEstadosActivos(config.estadosActivos.filter(esEstadoUS));
        }
      })
      .catch(() => { });
    return () => {
      cancelado = true;
    };
  }, [locale]);

  // Se navega cuando `usuario` ya está confirmado en el contexto (no justo
  // después de registro(): esa actualización es asíncrona — mismo cuidado que
  // en el registro de RD). Quien ya tenía sesión va a su panel.
  useEffect(() => {
    if (!cargando && usuario) {
      router.replace(autoLogueado ? "/us/enroll" : "/us/dashboard");
    }
  }, [cargando, usuario, autoLogueado, router]);

  function actualizar<K extends keyof Formulario>(campo: K, valor: Formulario[K]) {
    setForm((previo) => ({ ...previo, [campo]: valor }));
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setError("");

    if (form.password.length < 8) return setError(t("err.password_corta"));
    if (!digitosTelefonoValidos(form.telefono)) return setError(t("err.telefono_invalido"));
    if (!form.estadoUS) return setError(t("err.estado_invalido"));
    if (!form.fechaNacimiento || form.fechaNacimiento > maxNacimiento) {
      return setError(t("err.edad_minima"));
    }
    if (!acepta) return setError(t("reg.debeAceptar"));
    if (TURNSTILE_ACTIVO && !captchaToken) return setError(t("reg.captcha"));

    setEnviando(true);
    const resultado = await registro({
      nombre: form.nombre,
      apellido: form.apellido,
      telefono: form.telefono,
      email: form.email,
      password: form.password,
      estadoUS: form.estadoUS,
      ciudad: form.ciudad || undefined,
      fechaNacimiento: form.fechaNacimiento,
      captchaToken,
      sitioWeb: form.sitioWeb,
    });
    setEnviando(false);

    if (!resultado.ok) {
      setError(resultado.mensaje);
      setResetCaptcha((n) => n + 1); // el token ya se gastó
      return;
    }
    if (resultado.autoLogueado) setAutoLogueado(true);
    else setRevisaCorreo(true);
  }

  if (revisaCorreo) {
    return (
      <TarjetaAuth titulo={t("reg.titulo")}>
        <p role="status" className="text-neutral-text">
          {t("reg.revisaCorreo")}
        </p>
      </TarjetaAuth>
    );
  }

  return (
    <TarjetaAuth titulo={t("reg.titulo")} subtitulo={t("reg.sub")}>
      <form onSubmit={enviar} className="flex flex-col gap-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            etiqueta={t("campo.nombre")}
            required
            autoComplete="given-name"
            value={form.nombre}
            onChange={(e) => actualizar("nombre", e.target.value)}
          />
          <Campo
            etiqueta={t("campo.apellido")}
            required
            autoComplete="family-name"
            value={form.apellido}
            onChange={(e) => actualizar("apellido", e.target.value)}
          />
        </div>

        <Campo
          etiqueta={t("campo.telefono")}
          ayuda={t("campo.telefonoAyuda")}
          required
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="(212) 555-0100"
          value={form.telefono}
          onChange={(e) => actualizar("telefono", e.target.value)}
        />

        <Campo
          etiqueta={t("campo.email")}
          required
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(e) => actualizar("email", e.target.value)}
        />

        <CampoPassword
          etiqueta={t("campo.password")}
          ayuda={t("campo.passwordAyuda")}
          required
          minLength={8}
          autoComplete="new-password"
          value={form.password}
          onChange={(e) => actualizar("password", e.target.value)}
        />

        <Selector
          etiqueta={t("campo.estado")}
          required
          value={form.estadoUS}
          onChange={(e) => actualizar("estadoUS", e.target.value as EstadoUS)}
        >
          <option value="" disabled>
            —
          </option>
          {estadosActivos.map((codigo) => (
            <option key={codigo} value={codigo}>
              {nombreEstado(codigo, locale)} ({codigo})
            </option>
          ))}
        </Selector>

        <Campo
          etiqueta={t("campo.ciudad")}
          autoComplete="address-level2"
          maxLength={80}
          value={form.ciudad}
          onChange={(e) => actualizar("ciudad", e.target.value)}
        />

        <Campo
          etiqueta={t("campo.fechaNacimiento")}
          ayuda={t("campo.fechaAyuda")}
          required
          type="date"
          max={maxNacimiento}
          autoComplete="bday"
          value={form.fechaNacimiento}
          onChange={(e) => actualizar("fechaNacimiento", e.target.value)}
        />

        {/* Honeypot: invisible para una persona; un bot simple lo rellena. */}
        <label className="absolute -left-[9999px]" aria-hidden="true">
          Website
          <input
            type="text"
            name="sitioWeb"
            tabIndex={-1}
            autoComplete="off"
            value={form.sitioWeb}
            onChange={(e) => actualizar("sitioWeb", e.target.value)}
          />
        </label>

        <label className="flex items-start gap-3 text-sm text-neutral-text">
          <input
            type="checkbox"
            checked={acepta}
            onChange={(e) => setAcepta(e.target.checked)}
            className="mt-1 size-5 shrink-0 accent-brand-pink"
          />
          <span>
            {t("reg.acepto", { terminos: "\u0001", privacidad: "\u0002" })
              .split(/(\u0001|\u0002)/)
              .map((trozo, i) =>
                trozo === "\u0001" ? (
                  <Link
                    key={i}
                    href="/us/legal/terms"
                    target="_blank"
                    className="text-brand-blue underline"
                  >
                    {t("reg.terminos")}
                  </Link>
                ) : trozo === "\u0002" ? (
                  <Link
                    key={i}
                    href="/us/legal/privacy"
                    target="_blank"
                    className="text-brand-blue underline"
                  >
                    {t("reg.privacidad")}
                  </Link>
                ) : (
                  <span key={i}>{trozo}</span>
                ),
              )}
          </span>
        </label>

        <TurnstileWidget onToken={setCaptchaToken} resetSignal={resetCaptcha} />

        <MensajeError>{error}</MensajeError>

        <BotonPrimario
          type="submit"
          cargando={enviando}
          textoCargando={t("reg.enviando")}
          disabled={TURNSTILE_ACTIVO && !captchaToken}
        >
          {t("reg.enviar")}
        </BotonPrimario>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-text">
        {t("reg.yaTienes")}{" "}
        <Link href="/us/login" className="font-medium text-brand-pink underline">
          {t("nav.entrar")}
        </Link>
      </p>
    </TarjetaAuth>
  );
}