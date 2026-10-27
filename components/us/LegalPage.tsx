"use client";

import { Fragment } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { useUsLocale } from "@/contexts/UsLocaleContext";
import { formatearFecha } from "@/lib/us/pagos";
import {
  LEGAL_ACTUALIZADO,
  LEGAL_EN_REVISION,
  resolverMarcadores,
  type DocumentoBilingue,
  type TipoLegal,
} from "@/lib/us/legalConfig";
import { terminos } from "@/lib/us/legal/terms";
import { privacidad } from "@/lib/us/legal/privacy";
import { reembolsos } from "@/lib/us/legal/refunds";
import type { DictKey } from "@/lib/us/dict";

// NUEVO (24/10/2026): muestra uno de los tres documentos legales en el idioma
// activo. [[ valor ]] = decisión pendiente (resaltada en borrador; texto normal
// al lanzar). [[! nota ]] = nota interna (resaltada en borrador; se omite al lanzar).

const DOCUMENTOS: Record<TipoLegal, { doc: DocumentoBilingue; ruta: string; clave: DictKey }> = {
  terms: { doc: terminos, ruta: "/us/legal/terms", clave: "footer.terminos" },
  privacy: { doc: privacidad, ruta: "/us/legal/privacy", clave: "footer.privacidad" },
  refunds: { doc: reembolsos, ruta: "/us/legal/refunds", clave: "footer.reembolsos" },
};

function Texto({ texto }: { texto: string }) {
  const partes = resolverMarcadores(texto).split(/(\[\[[^\]]+\]\])/g);
  return (
    <>
      {partes.map((parte, i) => {
        if (!parte.startsWith("[[")) return <Fragment key={i}>{parte}</Fragment>;

        // [[! nota ]]: nota interna para la revisión; no se publica.
        if (parte.startsWith("[[!")) {
          return LEGAL_EN_REVISION ? (
            <mark key={i} className="rounded bg-brand-pink/15 px-1 text-neutral-text">
              {parte.slice(3, -2)}
            </mark>
          ) : null;
        }

        const interior = parte.slice(2, -2);
        return LEGAL_EN_REVISION ? (
          <mark key={i} className="rounded bg-brand-yellow-light px-1 text-neutral-text">
            {interior}
          </mark>
        ) : (
          <Fragment key={i}>{interior}</Fragment>
        );
      })}
    </>
  );
}

export default function LegalPage({ tipo }: { tipo: TipoLegal }) {
  const { t, locale } = useUsLocale();
  const { doc } = DOCUMENTOS[tipo];
  const contenido = doc[locale];
  const otros = (Object.keys(DOCUMENTOS) as TipoLegal[]).filter((k) => k !== tipo);

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <h1 className="font-display text-3xl font-semibold text-brand-blue">{contenido.titulo}</h1>
      <p className="mt-2 text-neutral-text/80">{contenido.resumen}</p>
      <p className="mt-1 text-sm text-neutral-text/70">
        {t("legal.actualizado", {
          fecha: formatearFecha(`${LEGAL_ACTUALIZADO}T12:00:00Z`, locale, {
            dateStyle: "long",
            timeZone: "UTC",
          }),
        })}
      </p>

      {LEGAL_EN_REVISION && (
        <div role="note" className="mt-5 flex gap-3 rounded-lg border-l-4 border-brand-yellow bg-brand-yellow-light p-4">
          <AlertTriangle aria-hidden className="mt-0.5 size-5 shrink-0 text-neutral-text" />
          <div className="text-sm text-neutral-text">
            <p className="font-semibold">{t("legal.borrador.titulo")}</p>
            <p>{t("legal.borrador.texto")}</p>
          </div>
        </div>
      )}

      <nav aria-label={t("legal.indice")} className="mt-6 rounded-xl bg-white p-4 ring-1 ring-neutral-bg">
        <p className="text-sm font-semibold text-brand-blue">{t("legal.indice")}</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
          {contenido.secciones.map((s, i) => (
            <li key={i}>
              <a href={`#seccion-${i + 1}`} className="text-brand-blue underline-offset-2 hover:underline">
                {s.titulo}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-8 space-y-8">
        {contenido.secciones.map((s, i) => (
          <section key={i} id={`seccion-${i + 1}`} className="scroll-mt-24">
            <h2 className="font-display text-xl font-semibold text-brand-blue">
              {i + 1}. {s.titulo}
            </h2>
            {s.parrafos?.map((p, j) => (
              <p key={j} className="mt-2 leading-relaxed text-neutral-text">
                <Texto texto={p} />
              </p>
            ))}
            {s.lista && (
              <ul className="mt-2 list-disc space-y-2 pl-6 leading-relaxed text-neutral-text">
                {s.lista.map((item, j) => (
                  <li key={j}>
                    <Texto texto={item} />
                  </li>
                ))}
              </ul>
            )}
            {s.cierre?.map((p, j) => (
              <p key={j} className="mt-2 leading-relaxed text-neutral-text">
                <Texto texto={p} />
              </p>
            ))}
          </section>
        ))}
      </div>

      <div className="mt-12 border-t border-neutral-bg pt-6">
        <p className="text-sm font-semibold text-brand-blue">{t("legal.otros")}</p>
        <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {otros.map((k) => (
            <li key={k}>
              <Link href={DOCUMENTOS[k].ruta} className="text-brand-blue underline">
                {t(DOCUMENTOS[k].clave)}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/us" className="text-brand-blue underline">
              {t("legal.volver")}
            </Link>
          </li>
        </ul>
      </div>
    </article>
  );
}