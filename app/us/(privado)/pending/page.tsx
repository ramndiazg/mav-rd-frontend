"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Clock, Undo2 } from "lucide-react";
import RutaProtegidaUS from "@/components/us/RutaProtegidaUS";
import { useUsLocale } from "@/contexts/UsLocaleContext";
import { useRevalidar } from "@/hooks/useRevalidar";
import { formatearFecha, formatearUSD, type EstadoPago } from "@/lib/us/pagos";
import { useInscripcionUS } from "@/lib/us/useInscripcionUS";
import type { DictKey } from "@/lib/us/dict";

// NUEVO (24/10/2026): estado del pago. Mientras está en revisión se consulta
// cada 30 s (y al volver a la pestaña); al confirmarse, la pantalla cambia sola.
// El estado se comunica con ícono + texto, nunca solo con color.

const botonPrimario =
  "mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-brand-pink px-6 font-semibold text-white hover:bg-brand-pink/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue";

function PendingContenido() {
  const router = useRouter();
  const { t, locale } = useUsLocale();
  const { config, inscripcion, recargarInscripcion } = useInscripcionUS();

  const estado: EstadoPago | undefined = inscripcion?.estadoPago;

  // Sin inscripción, o sin comprobante enviado: aquí no hay nada que ver.
  const sinNadaQueVer = inscripcion === null || estado === "creado";
  useEffect(() => {
    if (sinNadaQueVer) router.replace("/us/enroll");
  }, [sinNadaQueVer, router]);

  useRevalidar(recargarInscripcion, {
    activo: estado === "pendiente_verificacion",
    intervaloMs: 30000,
    minEntreEventosMs: 10000,
  });

  if (inscripcion === undefined || sinNadaQueVer || !inscripcion || !estado) {
    return (
      <p role="status" className="mx-auto max-w-md px-4 py-20 text-center text-neutral-text/70">
        {t("pay.cargando")}
      </p>
    );
  }

  const remesa = inscripcion.remesa;
  const paypal = inscripcion.pagoExterno?.proveedor === "paypal" ? inscripcion.pagoExterno : null;
  const horas = config?.plazoConfirmacionHoras ?? 24;

  return (
    <section className="mx-auto max-w-xl px-4 py-10 sm:py-14">
      <p className="text-sm text-neutral-text/70">
        {t("pend.estado")}:{" "}
        <strong className="text-neutral-text">{t(`pago.estado.${estado}` as DictKey)}</strong>
      </p>

      {estado === "pendiente_verificacion" && (
        <div role="status" aria-live="polite">
          <Clock aria-hidden className="mt-4 size-12 text-brand-blue" />
          <h1 className="mt-3 font-display text-3xl font-semibold text-brand-blue">
            {t("pend.titulo")}
          </h1>
          <p className="mt-2 text-neutral-text">{t("pend.texto", { horas })}</p>
          <p className="mt-1 text-sm text-neutral-text/70">{t("pend.actualiza")}</p>
        </div>
      )}

      {estado === "pagado" && (
        <div role="status">
          <CheckCircle2 aria-hidden className="mt-4 size-12 text-status-success" />
          <h1 className="mt-3 font-display text-3xl font-semibold text-brand-blue">
            {t("pend.pagado.titulo")}
          </h1>
          <p className="mt-2 text-neutral-text">{t("pend.pagado.texto")}</p>
          <Link href="/us/dashboard" className={botonPrimario}>
            {t("pend.irCurso")}
          </Link>
        </div>
      )}

      {estado === "rechazado" && (
        <div role="alert">
          <AlertTriangle aria-hidden className="mt-4 size-12 text-brand-pink" />
          <h1 className="mt-3 font-display text-3xl font-semibold text-brand-blue">
            {t("pay.rechazado.titulo")}
          </h1>
          {inscripcion.notaRechazo && (
            <p className="mt-2 text-neutral-text">
              {t("pay.rechazado.motivo", { motivo: inscripcion.notaRechazo })}
            </p>
          )}
          <p className="mt-1 text-neutral-text">{t("pay.rechazado.texto")}</p>
          <Link href="/us/pay" className={botonPrimario}>
            {t("pend.corregir")}
          </Link>
        </div>
      )}

      {(estado === "reembolsado" || estado === "disputado") && (
        <div role="status">
          <Undo2 aria-hidden className="mt-4 size-12 text-brand-blue" />
          <p className="mt-3 text-lg text-neutral-text">
            {estado === "reembolsado" ? t("pend.reembolsado") : t("pend.disputado")}
          </p>
        </div>
      )}

      {remesa && estado !== "rechazado" && (
        <div className="mt-8 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-bg">
          <h2 className="font-semibold text-brand-blue">{t("pend.detalle")}</h2>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-neutral-text/70">{t("pend.agencia")}</dt>
            <dd className="text-neutral-text">
              {config?.agencias?.find((a) => a.id === remesa.agencia)?.nombre ?? remesa.agencia}
            </dd>
            <dt className="text-neutral-text/70">{t("pend.control")}</dt>
            <dd className="break-all text-neutral-text">{remesa.numeroControl}</dd>
            <dt className="text-neutral-text/70">{t("pend.monto")}</dt>
            <dd className="text-neutral-text">
              {formatearUSD(remesa.montoEnviadoCentavos, locale)}
            </dd>
            <dt className="text-neutral-text/70">{t("pend.fecha")}</dt>
            <dd className="text-neutral-text">
              {formatearFecha(remesa.fechaEnvio, locale, { dateStyle: "medium", timeZone: "UTC" })}
            </dd>
          </dl>
          <a
            href={remesa.comprobanteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block text-sm font-medium text-brand-blue underline"
          >
            {t("pend.verRecibo")}
          </a>
        </div>
      )}

      {paypal && estado !== "rechazado" && (
        <div className="mt-8 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-bg">
          <h2 className="font-semibold text-brand-blue">{t("pend.detalle")}</h2>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-neutral-text/70">{t("pend.pp.metodo")}</dt>
            <dd className="text-neutral-text">PayPal</dd>
            <dt className="text-neutral-text/70">{t("pend.pp.id")}</dt>
            <dd className="break-all text-neutral-text">{paypal.idExterno}</dd>
            <dt className="text-neutral-text/70">{t("pend.pp.pagador")}</dt>
            <dd className="break-all text-neutral-text">{paypal.pagador}</dd>
            <dt className="text-neutral-text/70">{t("pend.monto")}</dt>
            <dd className="text-neutral-text">{formatearUSD(paypal.montoEnviadoCentavos, locale)}</dd>
            <dt className="text-neutral-text/70">{t("pend.fecha")}</dt>
            <dd className="text-neutral-text">
              {formatearFecha(paypal.fechaEnvio, locale, { dateStyle: "medium", timeZone: "UTC" })}
            </dd>
          </dl>
          {paypal.comprobanteUrl && (
            <a
              href={paypal.comprobanteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-sm font-medium text-brand-blue underline"
            >
              {t("pend.pp.verCaptura")}
            </a>
          )}
        </div>
      )}
    </section>
  );
}

export default function PendingPage() {
  return (
    <RutaProtegidaUS requiereCorreo>
      <PendingContenido />
    </RutaProtegidaUS>
  );
}