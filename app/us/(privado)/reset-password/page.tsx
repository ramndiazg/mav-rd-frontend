"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useUsLocale } from "@/contexts/UsLocaleContext";
import { BotonPrimario, CampoPassword, MensajeError, TarjetaAuth } from "@/components/us/FormUI";
import { usFetch } from "@/lib/us/api";

// NUEVO (24/10/2026): destino del enlace del correo de recuperación.
function ResetContenido() {
  const params = useSearchParams();
  const token = params.get("token");
  const { t, locale, mensajeError } = useUsLocale();

  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setError("");
    if (password.length < 8) return setError(t("err.password_corta"));
    if (password !== confirmar) return setError(t("reset.noCoinciden"));

    setEnviando(true);
    try {
      await usFetch("/us/auth/restablecer-password", {
        method: "POST",
        body: { token, passwordNueva: password, idioma: locale },
        locale,
        token: null,
      });
      setListo(true);
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setEnviando(false);
    }
  }

  if (!token) {
    return (
      <TarjetaAuth titulo={t("reset.titulo")}>
        <MensajeError>{t("reset.sinToken")}</MensajeError>
        <p className="mt-6 text-center text-sm">
          <Link href="/us/forgot-password" className="text-brand-blue underline">
            {t("reset.pedirOtro")}
          </Link>
        </p>
      </TarjetaAuth>
    );
  }

  if (listo) {
    return (
      <TarjetaAuth titulo={t("reset.titulo")}>
        <p role="status" className="text-neutral-text">
          {t("reset.listo")}
        </p>
        <Link
          href="/us/login"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-brand-pink px-6 font-semibold text-white hover:bg-brand-pink/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
        >
          {t("nav.entrar")}
        </Link>
      </TarjetaAuth>
    );
  }

  return (
    <TarjetaAuth titulo={t("reset.titulo")}>
      <form onSubmit={enviar} className="flex flex-col gap-4">
        <CampoPassword
          etiqueta={t("campo.passwordNueva")}
          ayuda={t("campo.passwordAyuda")}
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <CampoPassword
          etiqueta={t("campo.passwordConfirmar")}
          required
          minLength={8}
          autoComplete="new-password"
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
        />
        <MensajeError>{error}</MensajeError>
        <BotonPrimario type="submit" cargando={enviando} textoCargando={t("reset.enviando")}>
          {t("reset.enviar")}
        </BotonPrimario>
      </form>
    </TarjetaAuth>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetContenido />
    </Suspense>
  );
}