"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import { useUsLocale } from "@/contexts/UsLocaleContext";

// NUEVO (24/10/2026): captcha de Cloudflare Turnstile, el MISMO que usa el
// registro de RD (variable NEXT_PUBLIC_TURNSTILE_SITE_KEY). Sin esa variable
// (desarrollo local) no se muestra nada y el backend tampoco lo exige.
//
// Un token de Turnstile sirve UNA sola vez: si el envío falla, el formulario
// debe subir `resetSignal` para pedir uno nuevo.

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
export const TURNSTILE_ACTIVO = !!SITE_KEY;

type VentanaTurnstile = Window & {
  turnstile?: { reset: () => void };
  onTurnstileUS?: (token: string) => void;
  onTurnstileUSVencido?: () => void;
};

export default function TurnstileWidget({
  onToken,
  resetSignal = 0,
}: {
  onToken: (token: string) => void;
  resetSignal?: number;
}) {
  const { locale } = useUsLocale();
  const alToken = useRef(onToken);

  useEffect(() => {
    alToken.current = onToken;
  }, [onToken]);

  // El widget llama a estas funciones globales (data-callback).
  useEffect(() => {
    const w = window as VentanaTurnstile;
    w.onTurnstileUS = (token) => alToken.current(token);
    w.onTurnstileUSVencido = () => alToken.current("");
    return () => {
      delete w.onTurnstileUS;
      delete w.onTurnstileUSVencido;
    };
  }, []);

  useEffect(() => {
    if (resetSignal > 0) {
      (window as VentanaTurnstile).turnstile?.reset();
      alToken.current("");
    }
  }, [resetSignal]);

  if (!SITE_KEY) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
      />
      <div
        className="cf-turnstile"
        data-sitekey={SITE_KEY}
        data-callback="onTurnstileUS"
        data-expired-callback="onTurnstileUSVencido"
        data-language={locale}
      />
    </>
  );
}