"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useUsLocale } from "@/contexts/UsLocaleContext";
import { BotonPrimario, Campo, MensajeError, TarjetaAuth } from "@/components/us/FormUI";
import { usFetch } from "@/lib/us/api";

// NUEVO (24/10/2026): pide el enlace para cambiar la contraseña. La respuesta
// es la misma exista o no la cuenta (el backend no revela qué correos existen).
export default function OlvidePasswordPage() {
  const { t, locale, mensajeError } = useUsLocale();
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(false);
  const [error, setError] = useState("");

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setError("");
    setEnviando(true);
    try {
      await usFetch("/us/auth/olvide-password", {
        method: "POST",
        body: { email, idioma: locale },
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

  return (
    <TarjetaAuth titulo={t("forgot.titulo")} subtitulo={listo ? undefined : t("forgot.sub")}>
      {listo ? (
        <p role="status" className="text-neutral-text">
          {t("forgot.listo")}
        </p>
      ) : (
        <form onSubmit={enviar} className="flex flex-col gap-4">
          <Campo
            etiqueta={t("campo.email")}
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <MensajeError>{error}</MensajeError>
          <BotonPrimario type="submit" cargando={enviando} textoCargando={t("forgot.enviando")}>
            {t("forgot.enviar")}
          </BotonPrimario>
        </form>
      )}

      <p className="mt-6 text-center text-sm">
        <Link href="/us/login" className="text-brand-blue underline">
          {t("forgot.volver")}
        </Link>
      </p>
    </TarjetaAuth>
  );
}