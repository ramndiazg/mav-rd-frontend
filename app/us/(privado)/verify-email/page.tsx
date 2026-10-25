"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useUsAuth } from "@/contexts/UsAuthContext";
import { useUsLocale } from "@/contexts/UsLocaleContext";
import { TarjetaAuth } from "@/components/us/FormUI";
import { usFetch } from "@/lib/us/api";

// NUEVO (24/10/2026): destino del enlace del correo de verificación.
// El enlace es de un solo uso, así que la llamada se hace UNA vez (en
// desarrollo React monta dos veces y una segunda llamada fallaría).
function VerificarContenido() {
  const params = useSearchParams();
  const token = params.get("token");
  const { t, locale, mensajeError } = useUsLocale();
  const { usuario, notificarEmailVerificado } = useUsAuth();

  const [estado, setEstado] = useState<"verificando" | "ok" | "error">(
    token ? "verificando" : "error",
  );
  const [detalle, setDetalle] = useState(token ? "" : t("verify.sinToken"));
  const yaIntentado = useRef(false);

  useEffect(() => {
    if (!token || yaIntentado.current) return;
    yaIntentado.current = true;

    usFetch(`/us/auth/verificar-email?token=${encodeURIComponent(token)}`, {
      token: null,
      locale,
    })
      .then(() => {
        setEstado("ok");
        notificarEmailVerificado(); // refresca esta pestaña y avisa a las otras
      })
      .catch((error) => {
        setDetalle(mensajeError(error));
        setEstado("error");
      });
  }, [token, locale, mensajeError, notificarEmailVerificado]);

  return (
    <TarjetaAuth titulo={t("verify.titulo")}>
      <div role="status" aria-live="polite" className="text-center">
        {estado === "verificando" && (
          <>
            <Loader2 aria-hidden className="mx-auto size-10 animate-spin text-brand-blue" />
            <p className="mt-3 text-neutral-text">{t("verify.verificando")}</p>
          </>
        )}

        {estado === "ok" && (
          <>
            <CheckCircle2 aria-hidden className="mx-auto size-12 text-status-success" />
            <p className="mt-3 text-lg font-semibold text-neutral-text">{t("verify.ok")}</p>
            <p className="mt-1 text-sm text-neutral-text/80">{t("verify.okSub")}</p>
            <Link
              href={usuario ? "/us/enroll" : "/us/login?next=/us/enroll"}
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-brand-pink px-6 font-semibold text-white hover:bg-brand-pink/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
            >
              {usuario ? t("verify.continuar") : t("verify.irLogin")}
            </Link>
          </>
        )}

        {estado === "error" && (
          <>
            <XCircle aria-hidden className="mx-auto size-12 text-brand-pink" />
            <p className="mt-3 text-lg font-semibold text-neutral-text">{t("verify.error")}</p>
            <p className="mt-1 text-sm text-neutral-text/80">
              {detalle || t("verify.errorSub")}
            </p>
            <Link
              href="/us/login"
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full border border-brand-blue px-6 font-semibold text-brand-blue hover:bg-brand-blue/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
            >
              {t("verify.irLogin")}
            </Link>
          </>
        )}
      </div>
    </TarjetaAuth>
  );
}

export default function VerificarPage() {
  return (
    <Suspense fallback={null}>
      <VerificarContenido />
    </Suspense>
  );
}