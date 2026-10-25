"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, ShieldCheck, SignpostBig, MapPinned, ChevronDown } from "lucide-react";
import { useUsAuth } from "@/contexts/UsAuthContext";
import { useUsLocale } from "@/contexts/UsLocaleContext";
import StateCard from "@/components/us/StateCard";
import { usFetch } from "@/lib/us/api";
import { ESTADOS_US, esEstadoUS, type EstadoUS } from "@/lib/us/estados";
import { formatearUSD, type ConfigUS } from "@/lib/us/pagos";
import type { DictKey } from "@/lib/us/dict";

// NUEVO (24/10/2026): landing pública del curso Driver Prep USA.
// El precio y el interruptor "activo" vienen de GET /api/us/config. Si el
// curso está apagado se muestra "muy pronto" y se ocultan los botones de
// registro (la fundadora igual puede probar entrando a /us/register).

const MODULOS: { n: 1 | 2 | 3 | 4; Icono: typeof BookOpen }[] = [
  { n: 1, Icono: BookOpen },
  { n: 2, Icono: SignpostBig },
  { n: 3, Icono: ShieldCheck },
  { n: 4, Icono: MapPinned },
];

const PASOS = [1, 2, 3, 4] as const;
const PREGUNTAS = [1, 2, 3, 4, 5, 6] as const;

const botonRosa =
  "inline-flex min-h-12 items-center justify-center rounded-full bg-brand-pink px-7 text-base font-semibold text-white transition hover:bg-brand-pink/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";
const botonBlanco =
  "inline-flex min-h-12 items-center justify-center rounded-full border border-white/60 px-7 text-base font-semibold text-white transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

export default function UsLandingPage() {
  const { t, locale } = useUsLocale();
  const { usuario } = useUsAuth();
  const [config, setConfig] = useState<ConfigUS | null>(null);

  useEffect(() => {
    let cancelado = false;
    usFetch<ConfigUS>("/us/config", { token: null, locale })
      .then((datos) => {
        if (!cancelado) setConfig(datos);
      })
      .catch(() => {
        // Backend dormido o caído: la landing se muestra igual, sin precio.
      });
    return () => {
      cancelado = true;
    };
  }, [locale]);

  const apagado = config?.activo === false;
  const estados: EstadoUS[] =
    config?.estadosActivos && config.estadosActivos.length
      ? config.estadosActivos.filter(esEstadoUS)
      : ESTADOS_US;
  const precio =
    config?.activo && config.precioCentavos
      ? formatearUSD(config.precioCentavos, locale)
      : null;
  const horas = config?.plazoConfirmacionHoras ?? 24;

  const destinoPrincipal = usuario ? "/us/dashboard" : "/us/register";
  const textoPrincipal = usuario ? t("nav.miCurso") : t("land.hero.cta");

  return (
    <>
      {/* Portada */}
      <section className="bg-brand-blue text-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <p className="inline-block rounded-full bg-white/15 px-3 py-1 text-sm font-medium">
            {t("land.hero.badge")}
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-3xl font-semibold leading-tight sm:text-5xl">
            {t("land.hero.titulo")}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/85">{t("land.hero.sub")}</p>

          {precio && (
            <p className="mt-6 text-2xl font-semibold text-brand-yellow">
              {t("land.hero.precio", { precio })}
            </p>
          )}

          {apagado ? (
            <p
              role="status"
              className="mt-8 inline-block rounded-lg bg-white/15 px-4 py-3 text-base"
            >
              {t("land.hero.proximamente")}
            </p>
          ) : (
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={destinoPrincipal} className={botonRosa}>
                {textoPrincipal}
              </Link>
              <a href="#incluye" className={botonBlanco}>
                {t("land.hero.verCurso")}
              </a>
              {!usuario && (
                <Link href="/us/login" className={botonBlanco}>
                  {t("land.hero.entrar")}
                </Link>
              )}
            </div>
          )}
        </div>
      </section>
      <div className="road-divider" />

      {/* Para quién */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="font-display text-2xl font-semibold text-brand-blue sm:text-3xl">
          {t("land.para.titulo")}
        </h2>
        <ul className="mt-5 grid gap-4 sm:grid-cols-3">
          {(["land.para.1", "land.para.2", "land.para.3"] as const).map((clave) => (
            <li
              key={clave}
              className="rounded-2xl bg-white p-5 text-neutral-text shadow-sm ring-1 ring-neutral-bg"
            >
              {t(clave)}
            </li>
          ))}
        </ul>
      </section>

      {/* Qué incluye */}
      <section id="incluye" className="bg-neutral-bg/60">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="font-display text-2xl font-semibold text-brand-blue sm:text-3xl">
            {t("land.mod.titulo")}
          </h2>
          <p className="mt-2 max-w-2xl text-neutral-text/80">{t("land.mod.sub")}</p>
          <ol className="mt-6 grid gap-4 sm:grid-cols-2">
            {MODULOS.map(({ n, Icono }) => (
              <li key={n} className="flex gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-bg">
                <span
                  aria-hidden
                  className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-blue text-white"
                >
                  <Icono size={22} />
                </span>
                <div>
                  <h3 className="font-semibold text-brand-blue">
                    {t(`land.mod.${n}.t` as DictKey)}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-text/80">
                    {t(`land.mod.${n}.d` as DictKey)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Estados */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="font-display text-2xl font-semibold text-brand-blue sm:text-3xl">
          {t("land.est.titulo")}
        </h2>
        <p className="mt-2 max-w-2xl text-neutral-text/80">{t("land.est.sub")}</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {estados.map((codigo) => (
            <StateCard key={codigo} estado={codigo} />
          ))}
        </div>
        <p className="mt-4 text-sm text-neutral-text/70">{t("land.est.aviso")}</p>
      </section>

      {/* Cómo funciona */}
      <section className="bg-neutral-bg/60">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="font-display text-2xl font-semibold text-brand-blue sm:text-3xl">
            {t("land.como.titulo")}
          </h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PASOS.map((n) => (
              <li key={n} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-bg">
                <span
                  aria-hidden
                  className="flex size-9 items-center justify-center rounded-full bg-brand-pink font-bold text-white"
                >
                  {n}
                </span>
                <h3 className="mt-3 font-semibold text-brand-blue">
                  {t(`land.como.${n}.t` as DictKey)}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-neutral-text/80">
                  {t(`land.como.${n}.d` as DictKey)}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Preguntas frecuentes */}
      <section className="mx-auto max-w-3xl px-4 py-12">
        <h2 className="font-display text-2xl font-semibold text-brand-blue sm:text-3xl">
          {t("land.faq.titulo")}
        </h2>
        <div className="mt-6 divide-y divide-neutral-bg rounded-2xl bg-white shadow-sm ring-1 ring-neutral-bg">
          {PREGUNTAS.map((n) => (
            <details key={n} className="group p-5">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 font-semibold text-brand-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue">
                {t(`land.faq.${n}.q` as DictKey)}
                <ChevronDown
                  aria-hidden
                  size={20}
                  className="shrink-0 transition group-open:rotate-180"
                />
              </summary>
              <p className="mt-2 leading-relaxed text-neutral-text/85">
                {t(`land.faq.${n}.a` as DictKey, { horas })}
                {n === 6 && (
                  <>
                    {" "}
                    <Link href="/us/legal/refunds" className="text-brand-blue underline">
                      {t("land.reembolsos")}
                    </Link>
                    .
                  </>
                )}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* Cierre */}
      {!apagado && (
        <section className="bg-brand-blue text-white">
          <div className="mx-auto max-w-6xl px-4 py-12 text-center">
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">
              {t("land.cta.titulo")}
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-white/85">{t("land.cta.texto")}</p>
            <Link href={destinoPrincipal} className={`${botonRosa} mt-6`}>
              {textoPrincipal}
            </Link>
          </div>
        </section>
      )}
    </>
  );
}