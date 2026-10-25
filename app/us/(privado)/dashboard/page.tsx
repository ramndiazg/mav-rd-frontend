"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Lock, PlayCircle } from "lucide-react";
import RutaProtegidaUS from "@/components/us/RutaProtegidaUS";
import { MensajeError } from "@/components/us/FormUI";
import { useUsAuth } from "@/contexts/UsAuthContext";
import { useUsLocale } from "@/contexts/UsLocaleContext";
import { ApiErrorUS, usFetch } from "@/lib/us/api";
import {
  TOTAL_MODULOS,
  examenDisponibleEn,
  type ProgresoUS,
} from "@/lib/us/aula";
import type { DictKey } from "@/lib/us/dict";
import { nombreEstado } from "@/lib/us/estados";
import { formatearFecha } from "@/lib/us/pagos";
import { useInscripcionUS } from "@/lib/us/useInscripcionUS";
import { useAhora } from "@/lib/us/useAhora";

// NUEVO (24/10/2026): panel de la estudiante. Según el estado del pago muestra
// la inscripción pendiente o los 4 módulos con su estado (bloqueado, disponible
// o aprobado). Los títulos salen del diccionario (land.mod.N.t); el detalle de
// cada módulo se carga en /us/course/N.

const MODULOS = [1, 2, 3, 4] as const;

const enlaceBoton =
  "inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue";

function DashboardContenido() {
  const { t, locale, mensajeError } = useUsLocale();
  const { usuario } = useUsAuth();
  const { inscripcion, error: errorInscripcion } = useInscripcionUS();

  const [progreso, setProgreso] = useState<ProgresoUS | null>(null);
  const [errorProgreso, setErrorProgreso] = useState("");
  const [cargandoProgreso, setCargandoProgreso] = useState(false);

  const pagado = inscripcion?.estadoPago === "pagado";

  // El progreso existe solo después de confirmar el pago.
  useEffect(() => {
    if (!pagado) return;
    let cancelado = false;

    async function traer() {
      setCargandoProgreso(true);
      try {
        const datos = await usFetch<ProgresoUS>("/progreso/me", { locale, cache: "no-store" });
        if (!cancelado) setProgreso(datos);
      } catch (error) {
        if (cancelado) return;
        // 404 = pago confirmado pero sin progreso todavía: mensaje propio.
        if (error instanceof ApiErrorUS && error.status === 404) setErrorProgreso(t("dash.sinProgreso"));
        else setErrorProgreso(mensajeError(error));
      } finally {
        if (!cancelado) setCargandoProgreso(false);
      }
    }

    void traer();
    return () => {
      cancelado = true;
    };
  }, [pagado, locale, mensajeError, t]);

  const ahora = useAhora(!!progreso, 60000);

  if (inscripcion === undefined || (pagado && !progreso && !errorProgreso) || cargandoProgreso) {
    return (
      <p role="status" className="mx-auto max-w-md px-4 py-20 text-center text-neutral-text/70">
        {t("dash.cargando")}
      </p>
    );
  }

  const estadoPago = inscripcion?.estadoPago;
  const aprobadas = progreso?.sesionesAprobadas.length ?? 0;

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <h1 className="font-display text-3xl font-semibold text-brand-blue">
        {t("dash.hola", { nombre: usuario?.nombre ?? "" })}
      </h1>
      {usuario?.estadoUS && (
        <p className="mt-1 text-neutral-text/80">
          {t("dash.estado", { estado: nombreEstado(usuario.estadoUS, locale) })}
        </p>
      )}

      {errorInscripcion && <div className="mt-4"><MensajeError>{errorInscripcion}</MensajeError></div>}

      {/* Sin curso abierto: lo que falta para empezar */}
      {(inscripcion === null || estadoPago === "creado") && (
        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-bg">
          <h2 className="font-semibold text-brand-blue">{t("dash.sinInscripcion.titulo")}</h2>
          <p className="mt-1 text-neutral-text">{t("dash.sinInscripcion.texto")}</p>
          <Link href="/us/enroll" className={`${enlaceBoton} mt-4 bg-brand-pink text-white hover:bg-brand-pink/90`}>
            {t("dash.sinInscripcion.cta")}
          </Link>
        </div>
      )}

      {estadoPago === "pendiente_verificacion" && (
        <div role="status" className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-bg">
          <p className="text-neutral-text">{t("dash.pagoPendiente.texto")}</p>
          <Link href="/us/pending" className={`${enlaceBoton} mt-4 border border-brand-blue text-brand-blue hover:bg-brand-blue/5`}>
            {t("dash.pagoPendiente.cta")}
          </Link>
        </div>
      )}

      {estadoPago === "rechazado" && (
        <div role="alert" className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-brand-pink/40">
          <p className="text-neutral-text">{t("dash.pagoRechazado.texto")}</p>
          <Link href="/us/pay" className={`${enlaceBoton} mt-4 bg-brand-pink text-white hover:bg-brand-pink/90`}>
            {t("dash.pagoRechazado.cta")}
          </Link>
        </div>
      )}

      {errorProgreso && <div className="mt-6"><MensajeError>{errorProgreso}</MensajeError></div>}

      {/* Curso abierto */}
      {progreso && (
        <>
          <div className="mt-8">
            <p className="font-medium text-neutral-text">
              {t("dash.progreso", { n: aprobadas, total: TOTAL_MODULOS })}
            </p>
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={TOTAL_MODULOS}
              aria-valuenow={aprobadas}
              aria-label={t("dash.progreso", { n: aprobadas, total: TOTAL_MODULOS })}
              className="mt-2 h-3 overflow-hidden rounded-full bg-neutral-bg"
            >
              <div
                className="h-full rounded-full bg-status-success transition-all"
                style={{ width: `${(aprobadas / TOTAL_MODULOS) * 100}%` }}
              />
            </div>
          </div>

          {progreso.cursoCompletado && (
            <div role="status" className="mt-6 rounded-2xl bg-status-success/10 p-5 ring-1 ring-status-success/30">
              <p className="flex items-center gap-2 font-display text-xl font-semibold text-brand-blue">
                <CheckCircle2 aria-hidden className="text-status-success" />
                {t("dash.completo.titulo")}
              </p>
              <p className="mt-2 text-neutral-text">{t("dash.completo.texto")}</p>
            </div>
          )}

          <ol className="mt-6 space-y-3">
            {MODULOS.map((n) => {
              const aprobado = progreso.sesionesAprobadas.includes(n);
              const bloqueado = n > progreso.sesionActualDesbloqueada;
              const espera = !aprobado && !bloqueado ? examenDisponibleEn(progreso, n) : null;
              const esperaActiva = !!espera && ahora !== null && espera.getTime() > ahora;

              const Icono = aprobado ? CheckCircle2 : bloqueado ? Lock : PlayCircle;
              const etiqueta = aprobado
                ? t("dash.mod.aprobado")
                : bloqueado
                  ? t("dash.mod.bloqueado", { n: n - 1 })
                  : t("dash.mod.disponible");
              const accion = aprobado
                ? t("dash.mod.repasar")
                : progreso.contenidosVistos.length > 0
                  ? t("dash.mod.continuar")
                  : t("dash.mod.empezar");

              return (
                <li
                  key={n}
                  className={`flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ${aprobado ? "ring-status-success/40" : "ring-neutral-bg"
                    }`}
                >
                  <Icono
                    aria-hidden
                    size={28}
                    className={`shrink-0 ${aprobado ? "text-status-success" : bloqueado ? "text-neutral-text/40" : "text-brand-blue"}`}
                  />
                  <div className="min-w-0 flex-1">
                    <h2 className={`font-semibold ${bloqueado ? "text-neutral-text/60" : "text-brand-blue"}`}>
                      {t(`land.mod.${n}.t` as DictKey)}
                    </h2>
                    <p className="text-sm text-neutral-text/80">{etiqueta}</p>
                    {esperaActiva && espera && (
                      <p className="mt-1 text-sm text-neutral-text/80">
                        {t("dash.mod.examenEn", {
                          fecha: formatearFecha(espera, locale, { dateStyle: "medium", timeStyle: "short" }),
                        })}
                      </p>
                    )}
                  </div>
                  {!bloqueado && (
                    <Link
                      href={`/us/course/${n}`}
                      className={`${enlaceBoton} shrink-0 ${aprobado ? "border border-brand-blue text-brand-blue hover:bg-brand-blue/5" : "bg-brand-pink text-white hover:bg-brand-pink/90"}`}
                    >
                      {accion}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </>
      )}
    </section>
  );
}

export default function DashboardPage() {
  return (
    <RutaProtegidaUS requiereCorreo>
      <DashboardContenido />
    </RutaProtegidaUS>
  );
}