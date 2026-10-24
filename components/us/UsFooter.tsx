"use client";

import Link from "next/link";
import { useUsLocale } from "@/contexts/UsLocaleContext";

// NUEVO (24/10/2026): pie de /us/*. El aviso "no oficial" aparece SIEMPRE
// (estudio §3.4): la formación es complementaria y no promete aprobar.
export default function UsFooter() {
  const { t } = useUsLocale();

  const enlace =
    "text-sm text-white/80 underline-offset-2 hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

  return (
    <footer className="bg-brand-blue text-white/80">
      <div className="road-divider" />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <p className="max-w-3xl text-sm leading-relaxed">{t("footer.aviso")}</p>

        <nav aria-label={t("footer.legal")} className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/us/legal/terms" className={enlace}>
            {t("footer.terminos")}
          </Link>
          <Link href="/us/legal/privacy" className={enlace}>
            {t("footer.privacidad")}
          </Link>
          <Link href="/us/legal/refunds" className={enlace}>
            {t("footer.reembolsos")}
          </Link>
          <Link href="/" className={enlace}>
            {t("footer.sitioRD")}
          </Link>
        </nav>

        <p className="mt-5 text-xs text-white/60">
          {t("footer.derechos", { anio: new Date().getFullYear() })}
        </p>
      </div>
    </footer>
  );
}