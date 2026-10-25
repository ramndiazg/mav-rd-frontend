"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import PaymentMethodPicker from "@/components/us/PaymentMethodPicker";
import RutaProtegidaUS from "@/components/us/RutaProtegidaUS";
import { MensajeError } from "@/components/us/FormUI";
import { useUsAuth } from "@/contexts/UsAuthContext";
import { useUsLocale } from "@/contexts/UsLocaleContext";
import { usFetch } from "@/lib/us/api";
import { esEstadoUS, nombreEstado, type EstadoUS } from "@/lib/us/estados";
import { formatearUSD, type InscripcionUS, type MetodoPagoId } from "@/lib/us/pagos";
import { rutaSegunEstadoPago, useInscripcionUS } from "@/lib/us/useInscripcionUS";

// NUEVO (24/10/2026): paso 2 — método de pago, datos de envío y comprobante.
// Sirve también para REENVIAR un comprobante rechazado (la inscripción se
// reutiliza). Quien ya envió o pagó es redirigido a /us/pending o al panel.
function PayContenido() {
  const router = useRouter();
  const params = useSearchParams();
  const { t, locale } = useUsLocale();
  const { usuario } = useUsAuth();
  const { config, inscripcion, error, cargar } = useInscripcionUS();

  const destino = rutaSegunEstadoPago(inscripcion?.estadoPago);
  useEffect(() => {
    if (destino) router.replace(destino);
  }, [destino, router]);

  if (inscripcion === undefined || destino) {
    return (
      <p role="status" className="mx-auto max-w-md px-4 py-20 text-center text-neutral-text/70">
        {t("pay.cargando")}
      </p>
    );
  }

  // Estado del curso: ?estado= (validado contra los activos) → el de la
  // inscripción → el de la cuenta.
  const activos = config?.estadosActivos ?? [];
  const candidatos = [params.get("estado"), inscripcion?.estadoUS, usuario?.estadoUS];
  const estadoUS: EstadoUS | null =
    candidatos.find((e): e is EstadoUS => esEstadoUS(e) && (activos.length === 0 || activos.includes(e))) ??
    null;

  const precioCentavos = config?.precioCentavos ?? null;

  async function asegurarInscripcion(metodo: MetodoPagoId): Promise<InscripcionUS> {
    try {
      return await usFetch<InscripcionUS>("/us/inscripcion", {
        method: "POST",
        body: { metodoPago: metodo, estadoUS, idioma: locale },
        locale,
      });
    } catch (e) {
      // Ya hay una inscripción en revisión o pagada (otra pestaña, por ejemplo).
      if (e && typeof e === "object" && "code" in e && e.code === "inscripcion_existente") {
        router.replace("/us/pending");
      }
      throw e;
    }
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <h1 className="font-display text-3xl font-semibold text-brand-blue">{t("pay.titulo")}</h1>

      {estadoUS && precioCentavos ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-bg">
          <div>
            <p className="font-semibold text-brand-blue">
              {t("pay.resumen", { estado: nombreEstado(estadoUS, locale) })}
            </p>
            <p className="text-lg font-bold text-neutral-text">
              {t("pay.total", { precio: formatearUSD(precioCentavos, locale) })}
            </p>
          </div>
          <Link href="/us/enroll" className="text-sm font-medium text-brand-blue underline">
            {t("pay.cambiarEstado")}
          </Link>
        </div>
      ) : null}

      {inscripcion?.estadoPago === "rechazado" && (
        <div
          role="alert"
          className="mt-4 flex gap-3 rounded-lg border border-brand-pink/40 bg-brand-pink/5 p-4"
        >
          <AlertTriangle aria-hidden className="mt-0.5 size-5 shrink-0 text-brand-pink" />
          <div className="text-sm text-neutral-text">
            <p className="font-semibold text-brand-pink">{t("pay.rechazado.titulo")}</p>
            {inscripcion.notaRechazo && (
              <p>{t("pay.rechazado.motivo", { motivo: inscripcion.notaRechazo })}</p>
            )}
            <p>{t("pay.rechazado.texto")}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 space-y-2">
          <MensajeError>{error}</MensajeError>
          <button
            type="button"
            onClick={() => void cargar()}
            className="text-sm font-medium text-brand-blue underline"
          >
            {t("comun.reintentar")}
          </button>
        </div>
      )}

      {config && precioCentavos && estadoUS ? (
        <div className="mt-6">
          <PaymentMethodPicker
            config={config}
            precioCentavos={precioCentavos}
            inscripcion={inscripcion}
            asegurarInscripcion={asegurarInscripcion}
            onCompleto={() => router.replace("/us/pending")}
          />
        </div>
      ) : (
        config && (
          <p role="status" className="mt-6 rounded-lg bg-status-warning/15 px-4 py-3 text-neutral-text">
            {!precioCentavos ? t("enroll.sinPrecio") : null}
            {precioCentavos && !estadoUS ? (
              <Link href="/us/enroll" className="font-medium text-brand-blue underline">
                {t("pay.cambiarEstado")}
              </Link>
            ) : null}
          </p>
        )
      )}
    </section>
  );
}

export default function PayPage() {
  return (
    <RutaProtegidaUS requiereCorreo>
      <Suspense fallback={null}>
        <PayContenido />
      </Suspense>
    </RutaProtegidaUS>
  );
}