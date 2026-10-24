"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MailCheck } from "lucide-react";
import { useUsAuth } from "@/contexts/UsAuthContext";
import { useUsLocale } from "@/contexts/UsLocaleContext";
import { usFetch } from "@/lib/us/api";

// NUEVO (24/10/2026): guarda de las pantallas privadas de /us (inscripción,
// pago, aula…).
//  - Sin sesión → /us/login?next=<ruta actual>.
//  - `requiereCorreo`: si el correo no está verificado, en vez de la
//    pantalla muestra el aviso con "reenviar" (la sesión se refresca sola
//    al verificar, ver UsAuthContext).
export default function RutaProtegidaUS({
  children,
  requiereCorreo = false,
}: {
  children: ReactNode;
  requiereCorreo?: boolean;
}) {
  const { usuario, cargando } = useUsAuth();
  const { t, locale, mensajeError } = useUsLocale();
  const router = useRouter();
  const pathname = usePathname();

  const [reenvio, setReenvio] = useState<"idle" | "enviando" | "ok" | "error">("idle");
  const [errorReenvio, setErrorReenvio] = useState("");

  useEffect(() => {
    if (!cargando && !usuario) {
      router.replace(`/us/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [cargando, usuario, router, pathname]);

  if (cargando || !usuario) {
    return (
      <div role="status" className="mx-auto max-w-md px-4 py-20 text-center text-neutral-text/70">
        {t("guard.cargando")}
      </div>
    );
  }

  if (requiereCorreo && !usuario.emailVerificado) {
    async function reenviar() {
      setReenvio("enviando");
      setErrorReenvio("");
      try {
        await usFetch("/us/auth/reenviar-verificacion", { method: "POST", locale });
        setReenvio("ok");
      } catch (error) {
        setErrorReenvio(mensajeError(error));
        setReenvio("error");
      }
    }

    return (
      <section className="mx-auto max-w-md px-4 py-16 text-center">
        <MailCheck aria-hidden className="mx-auto size-12 text-brand-blue" />
        <h1 className="mt-4 text-2xl font-semibold text-brand-blue">
          {t("guard.correo.titulo")}
        </h1>
        <p className="mt-3 text-neutral-text/80">
          {t("guard.correo.texto", { email: usuario.email })}
        </p>
        <button
          type="button"
          onClick={reenviar}
          disabled={reenvio === "enviando"}
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-brand-pink px-6 font-semibold text-white transition hover:bg-brand-pink/90 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
        >
          {t("guard.correo.reenviar")}
        </button>
        <p role="status" className="mt-3 min-h-6 text-sm">
          {reenvio === "ok" && (
            <span className="text-status-success">{t("guard.correo.enviado")}</span>
          )}
          {reenvio === "error" && <span className="text-brand-pink">{errorReenvio}</span>}
        </p>
      </section>
    );
  }

  return <>{children}</>;
}