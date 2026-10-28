"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import Image from "next/image";
import { Camera, ExternalLink } from "lucide-react";
import { BotonPrimario, Campo, MensajeError } from "@/components/us/FormUI";
import { useUsLocale } from "@/contexts/UsLocaleContext";
import { ApiErrorUS, usFetch } from "@/lib/us/api";
import { MAX_BYTES_IMAGEN, esImagen, prepararImagen } from "@/lib/us/imagen";
import {
  dolaresACentavos,
  formatearUSD,
  type InscripcionUS,
  type MetodoPagoProps,
} from "@/lib/us/pagos";

// NUEVO (27/10/2026): pago con PayPal por enlace PayPal.Me + verificación
// MANUAL. La estudiante paga en PayPal (el enlace ya lleva el monto) y aquí
// escribe el ID de la transacción; la coordinadora lo busca en la actividad de
// PayPal y confirma. No usa la API de PayPal. Cumple MetodoPagoProps, así que
// PaymentMethodPicker lo trata igual que a los demás métodos.

type Campo_ = "id" | "pagador" | "monto" | "fecha" | "archivo";

const CAMPO_POR_CODIGO: Record<string, Campo_> = {
  transaccion_invalida: "id",
  ref_duplicada: "id",
  remitente_invalido: "pagador",
  monto_invalido: "monto",
  monto_menor: "monto",
  fecha_invalida: "fecha",
  comprobante_invalido: "archivo",
};

const DIAS_MAX_ANTIGUEDAD = 45;

function fechaLocal(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

export default function PayPalForm({
  metodo,
  config,
  precioCentavos,
  inscripcionExistente,
  asegurarInscripcion,
  onCompleto,
}: MetodoPagoProps) {
  const { t, locale, mensajeError } = useUsLocale();
  const usuarioPayPal = config.destinoPaypal?.usuario?.replace(/^@/, "") ?? "";
  const nota = locale === "en" ? config.destinoPaypal?.notas_en : config.destinoPaypal?.notas_es;
  const previo = inscripcionExistente?.pagoExterno ?? null;
  const precio = formatearUSD(precioCentavos, locale);

  const [idTransaccion, setIdTransaccion] = useState(previo?.idExterno ?? "");
  const [pagador, setPagador] = useState(previo?.pagador ?? "");
  const [monto, setMonto] = useState(((previo?.montoEnviadoCentavos ?? precioCentavos) / 100).toFixed(2));
  const [fecha, setFecha] = useState(() => fechaLocal(new Date()));
  const [foto, setFoto] = useState<{ archivo: File; url: string } | null>(null);
  const [preparando, setPreparando] = useState(false);
  const [fase, setFase] = useState<"idle" | "creando" | "subiendo" | "registrando">("idle");
  const [errores, setErrores] = useState<Partial<Record<Campo_, string>>>({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const subida = useRef<{ archivo: File; url: string } | null>(null);
  const urlVistaPrevia = useRef<string | null>(null);
  const [maxFecha] = useState(() => fechaLocal(new Date()));
  const [minFecha] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - DIAS_MAX_ANTIGUEDAD);
    return fechaLocal(d);
  });

  useEffect(
    () => () => {
      if (urlVistaPrevia.current) URL.revokeObjectURL(urlVistaPrevia.current);
    },
    [],
  );

  const enlace = usuarioPayPal
    ? `https://www.paypal.com/paypalme/${encodeURIComponent(usuarioPayPal)}/${(precioCentavos / 100).toFixed(2)}USD`
    : "";
  const ocupado = fase !== "idle" || preparando;

  async function elegirFoto(evento: ChangeEvent<HTMLInputElement>) {
    const elegido = evento.target.files?.[0];
    evento.target.value = "";
    if (!elegido) return;
    setErrores((e) => ({ ...e, archivo: undefined }));
    if (!esImagen(elegido)) return setErrores((e) => ({ ...e, archivo: t("pay.err.archivo") }));

    setPreparando(true);
    const listo = await prepararImagen(elegido);
    setPreparando(false);
    if (listo.size > MAX_BYTES_IMAGEN) {
      return setErrores((e) => ({ ...e, archivo: t("pay.err.archivoGrande") }));
    }
    if (urlVistaPrevia.current) URL.revokeObjectURL(urlVistaPrevia.current);
    const url = URL.createObjectURL(listo);
    urlVistaPrevia.current = url;
    setFoto({ archivo: listo, url });
  }

  function validar(): Partial<Record<Campo_, string>> {
    const nuevos: Partial<Record<Campo_, string>> = {};
    if (!/^[A-Za-z0-9]{10,25}$/.test(idTransaccion.replace(/[\s-]+/g, ""))) {
      nuevos.id = t("err.transaccion_invalida");
    }
    if (pagador.trim().length < 3) nuevos.pagador = t("err.remitente_invalido");
    const centavos = dolaresACentavos(monto);
    if (centavos === null || centavos <= 0) nuevos.monto = t("err.monto_invalido");
    else if (centavos < precioCentavos) nuevos.monto = t("err.monto_menor");
    if (!fecha || fecha > maxFecha || fecha < minFecha) nuevos.fecha = t("err.fecha_invalida");
    return nuevos;
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setErrorGeneral("");
    const nuevos = validar();
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;

    try {
      setFase("creando");
      const inscripcion = await asegurarInscripcion(metodo);

      // La captura es opcional. Si hay, se sube una sola vez aunque se reintente.
      let urlCaptura: string | undefined;
      if (foto) {
        if (subida.current && subida.current.archivo === foto.archivo) {
          urlCaptura = subida.current.url;
        } else {
          setFase("subiendo");
          try {
            const formulario = new FormData();
            formulario.append("imagen", foto.archivo);
            const subido = await usFetch<{ url: string }>("/uploads/imagen", {
              method: "POST",
              body: formulario,
              locale,
            });
            urlCaptura = subido.url;
            subida.current = { archivo: foto.archivo, url: subido.url };
          } catch {
            setErrorGeneral(t("pay.err.subida"));
            return;
          }
        }
      }

      setFase("registrando");
      const resultado = await usFetch<InscripcionUS>(`/us/inscripcion/${inscripcion._id}/pago`, {
        method: "POST",
        body: {
          idTransaccion,
          pagador: pagador.trim(),
          montoEnviado: monto.trim().replace(",", "."),
          fechaEnvio: fecha,
          ...(urlCaptura ? { comprobanteUrl: urlCaptura } : {}),
          idioma: locale,
        },
        locale,
      });
      onCompleto(resultado);
    } catch (error) {
      const mensaje = mensajeError(error);
      const campo = error instanceof ApiErrorUS && error.code ? CAMPO_POR_CODIGO[error.code] : undefined;
      if (campo) setErrores((e) => ({ ...e, [campo]: mensaje }));
      else setErrorGeneral(mensaje);
    } finally {
      setFase("idle");
    }
  }

  const textoFase = preparando
    ? t("pay.fase.preparando")
    : fase === "creando"
      ? t("pay.fase.creando")
      : fase === "subiendo"
        ? t("pay.fase.subiendo")
        : fase === "registrando"
          ? t("pay.fase.registrando")
          : "";

  return (
    <div className="space-y-6">
      <section aria-labelledby="pp-paso1" className="space-y-3">
        <h3 id="pp-paso1" className="font-display text-lg font-semibold text-brand-blue">
          {t("pay.pp.paso1")}
        </h3>
        {enlace ? (
          <>
            <ol className="list-decimal space-y-1 pl-5 text-neutral-text">
              <li>{t("pay.pp.instr1", { precio })}</li>
              <li>{t("pay.pp.instr2")}</li>
              <li>{t("pay.pp.instr3")}</li>
            </ol>
            <a
              href={enlace}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand-blue px-6 font-semibold text-white hover:bg-brand-blue/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
            >
              {t("pay.pp.boton", { precio })}
              <ExternalLink aria-hidden size={16} />
            </a>
            <p className="text-sm text-neutral-text/80">
              {t("pay.pp.abre")} {t("pay.pp.buscar", { usuario: usuarioPayPal })}
            </p>
            {nota && <p className="text-sm text-neutral-text/80">{nota}</p>}
          </>
        ) : (
          <p role="status" className="rounded-lg bg-status-warning/15 px-4 py-3 text-sm text-neutral-text">
            {t("pay.pp.noDisponible")}
          </p>
        )}
      </section>

      <form onSubmit={enviar} noValidate aria-labelledby="pp-paso2" className="space-y-4">
        <h3 id="pp-paso2" className="font-display text-lg font-semibold text-brand-blue">
          {t("pay.paso2")}
        </h3>

        <Campo
          etiqueta={t("pay.pp.id")}
          ayuda={t("pay.pp.idAyuda")}
          error={errores.id}
          required
          autoCapitalize="characters"
          autoComplete="off"
          maxLength={40}
          value={idTransaccion}
          onChange={(e) => setIdTransaccion(e.target.value)}
        />

        <Campo
          etiqueta={t("pay.pp.pagador")}
          error={errores.pagador}
          required
          autoComplete="off"
          maxLength={100}
          value={pagador}
          onChange={(e) => setPagador(e.target.value)}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            etiqueta={t("pay.pp.monto")}
            error={errores.monto}
            required
            inputMode="decimal"
            autoComplete="off"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
          />
          <Campo
            etiqueta={t("pay.pp.fecha")}
            error={errores.fecha}
            required
            type="date"
            min={minFecha}
            max={maxFecha}
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </div>

        <div>
          <span className="mb-1 block text-sm font-medium text-neutral-text">{t("pay.pp.captura")}</span>
          <input
            id="foto-paypal"
            type="file"
            accept="image/*"
            className="peer sr-only"
            onChange={elegirFoto}
            aria-describedby="ayuda-captura"
          />
          <label
            htmlFor="foto-paypal"
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-brand-blue px-5 font-medium text-brand-blue hover:bg-brand-blue/5 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-blue"
          >
            <Camera aria-hidden size={18} />
            {foto ? t("pay.f.cambiarFoto") : t("pay.f.elegirFoto")}
          </label>
          <p id="ayuda-captura" className="mt-1 text-xs text-neutral-text/70">
            {t("pay.pp.capturaAyuda")}
          </p>
          {errores.archivo && (
            <p role="alert" className="mt-1 text-sm text-brand-pink">
              {errores.archivo}
            </p>
          )}
          {foto && (
            <Image
              src={foto.url}
              alt={t("pay.f.vistaPrevia")}
              width={320}
              height={240}
              unoptimized
              className="mt-3 h-auto max-h-60 w-auto max-w-full rounded-lg border border-neutral-bg object-contain"
            />
          )}
        </div>

        <MensajeError>{errorGeneral}</MensajeError>
        <p role="status" aria-live="polite" className="min-h-5 text-sm text-neutral-text/80">
          {textoFase}
        </p>

        <BotonPrimario type="submit" disabled={ocupado || !enlace} className="w-full sm:w-auto">
          {t("pay.enviar")}
        </BotonPrimario>
      </form>
    </div>
  );
}