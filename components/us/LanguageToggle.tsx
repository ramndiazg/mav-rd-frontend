"use client";

import { useUsLocale } from "@/contexts/UsLocaleContext";
import { LOCALES, type Locale } from "@/lib/us/i18n";

// NUEVO (24/10/2026): selector ES | EN. Va en la cabecera de TODAS las
// páginas de /us. Accesible con teclado (botones reales con aria-pressed) y
// con etiqueta bilingüe, para que se entienda aunque la interfaz esté en el
// otro idioma.
export default function LanguageToggle({ className = "" }: { className?: string }) {
  const { locale, setLocale, t } = useUsLocale();

  return (
    <div
      role="group"
      aria-label={t("lang.etiqueta")}
      className={`inline-flex overflow-hidden rounded-full border border-white/40 text-sm font-semibold ${className}`}
    >
      {LOCALES.map((codigo: Locale) => {
        const activo = codigo === locale;
        const otroIdioma = t(codigo === "es" ? "lang.es" : "lang.en");
        return (
          <button
            key={codigo}
            type="button"
            lang={codigo}
            aria-pressed={activo}
            aria-label={t("lang.cambiarA", { idioma: otroIdioma })}
            onClick={() => setLocale(codigo)}
            className={`min-h-9 min-w-11 px-3 uppercase transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${activo
              ? "bg-white text-brand-blue"
              : "bg-transparent text-white hover:bg-white/15"
              }`}
          >
            {codigo}
          </button>
        );
      })}
    </div>
  );
}