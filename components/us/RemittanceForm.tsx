"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import Image from "next/image";
import { Camera, Check, Copy } from "lucide-react";
import AgencySelector from "@/components/us/AgencySelector";
import { BotonPrimario, Campo, MensajeError } from "@/components/us/FormUI";
import { useUsLocale } from "@/contexts/UsLocaleContext";
import { ApiErrorUS, usFetch } from "@/lib/us/api";
import { MAX_BYTES_IMAGEN, esImagen, prepararImagen } from "@/lib/us/imagen";
import {
  dolaresACentavos,
  formatearUSD,
  type InscripcionUS,
  type MetodoPagoProps,
  type ViaRemesa,
} from "@/lib/us/pagos";

// NUEVO (24/10/2026): formulario del comprobante de un envío de dinero, para
// los dos métodos de remesa (depósito a cuenta y retiro en efectivo). Hace TODO
// el trabajo de red de su método (crear inscripción → subir foto → registrar
// el pago) para que la página no sepa nada de remesas: ver MetodoPagoProps.

type Campo_ = "agencia" | "control" | "remitente" | "monto" | "fecha" | "archivo";

const CAMPO_POR_CODIGO: Record<string, Campo_> = {
  agencia_invalida: "agencia",
  control_invalido: "control",
  ref_duplicada: "control",
  remitente_invalido: "remitente",
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

function hace(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return fechaLocal(d);
}

// Dato del destino con botón "copiar" (la gente lo pega en la app de envíos).
function DatoCopiable({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  const { t } = useUsLocale();
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(valor);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sin permiso de portapapeles: la persona puede seleccionar y copiar el texto.
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-neutral-bg/60 px-4 py-3">
      <div className="min-w-0">
        <p className="text-xs text-neutral-text/70">{etiqueta}</p>
        <p className="break-words font-semibold text-neutral-text">{valor}</p>
      </div>
      <button
        type="button"
        onClick={copiar}
        aria-label={t("pay.copiarDato", { dato: etiqueta })}
        className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full border border-brand-blue px-3 text-sm font-medium text-brand-blue hover:bg-brand-blue/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
      >
        {copiado ? <Check aria-hidden size={16} /> : <Copy aria-hidden size={16} />}
        <span aria-live="polite">{copiado ? t("pay.copiado") : t("pay.copiar")}</span>
      </button>
    </div>
  );
}

export default function RemittanceForm({
  metodo,
  config,
  precioCentavos,
  inscripcionExistente,
  asegurarInscripcion,
  onCompleto,
}: MetodoPagoProps) {
  const { t, locale, mensajeError } = useUsLocale();
  const via: ViaRemesa = metodo === "remesa_deposito" ? "deposito" : "efectivo";
  const previa = inscripcionExistente?.remesa ?? null;

  const [agencia, setAgencia] = useState(previa?.agencia ?? "");
  const [control, setControl] = useState(previa?.numeroControl ?? "");
  const [remitente, setRemitente] = useState(previa?.remitente ?? "");
  const [monto, setMonto] = useState(((previa?.montoEnviadoCentavos ?? precioCentavos) / 100).toFixed(2));
  const [fecha, setFecha] = useState(() => fechaLocal(new Date()));
  const [foto, setFoto] = useState<{ archivo: File; url: string } | null>(null);
  const [preparando, setPreparando] = useState(false);
  const [fase, setFase] = useState<"idle" | "creando" | "subiendo" | "registrando">("idle");
  const [errores, setErrores] = useState<Partial<Record<Campo_, string>>>({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const subida = useRef<{ archivo: File; url: string } | null>(null); // evita re-subir la misma foto
  const urlVistaPrevia = useRef<string | null>(null);

  // Libera la vista previa al salir.
  useEffect(
    () => () => {
      if (urlVistaPrevia.current) URL.revokeObjectURL(urlVistaPrevia.current);
    },
    [],
  );

  const [maxFecha] = useState(() => fechaLocal(new Date()));
  const [minFecha] = useState(() => hace(DIAS_MAX_ANTIGUEDAD));

  const agenciasVia = (config.agencias ?? []).filter((a) => a.via.includes(via));
  const destino = via === "deposito" ? config.destinoDeposito : config.destinoEfectivo;
  const nota = destino ? (locale === "en" ? destino.notas_en : destino.notas_es) : "";

  const datosDestino: { etiqueta: string; valor: string }[] =
    via === "deposito"
      ? [
        { etiqueta: t("pay.destino.titular"), valor: config.destinoDeposito?.titular ?? "" },
        { etiqueta: t("pay.destino.banco"), valor: config.destinoDeposito?.banco ?? "" },
        { etiqueta: t("pay.destino.numero"), valor: config.destinoDeposito?.numero ?? "" },
        { etiqueta: t("pay.destino.tipo"), valor: config.destinoDeposito?.tipo ?? "" },
        { etiqueta: t("pay.destino.rnc"), valor: config.destinoDeposito?.rnc ?? "" },
      ].filter((d) => d.valor)
      : [
        {
          etiqueta: t("pay.destino.beneficiario"),
          valor: config.destinoEfectivo?.nombreBeneficiario ?? "",
        },
        { etiqueta: t("pay.destino.ciudad"), valor: config.destinoEfectivo?.ciudad ?? "" },
      ].filter((d) => d.valor);

  const ocupado = fase !== "idle" || preparando;

  async function elegirFoto(evento: ChangeEvent<HTMLInputElement>) {
    const elegido = evento.target.files?.[0];
    evento.target.value = ""; // permite elegir de nuevo la misma foto
    if (!elegido) return;

    setErrores((e) => ({ ...e, archivo: undefined }));
    if (!esImagen(elegido)) {
      return setErrores((e) => ({ ...e, archivo: t("pay.err.archivo") }));
    }

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
    if (!agencia) nuevos.agencia = t("pay.err.agenciaVacia");
    if (!/^[A-Za-z0-9-]{4,40}$/.test(control.replace(/\s+/g, ""))) {
      nuevos.control = t("pay.err.controlCorto");
    }
    if (remitente.trim().length < 3) nuevos.remitente = t("err.remitente_invalido");

    const centavos = dolaresACentavos(monto);
    if (centavos === null || centavos <= 0) nuevos.monto = t("err.monto_invalido");
    else if (centavos < precioCentavos) nuevos.monto = t("err.monto_menor");

    if (!fecha || fecha > maxFecha || fecha < minFecha) nuevos.fecha = t("err.fecha_invalida");
    if (!foto) nuevos.archivo = t("err.comprobante_invalido");
    return nuevos;
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setErrorGeneral("");
    const nuevos = validar();
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0 || !foto) return;

    try {
      setFase("creando");
      const inscripcion = await asegurarInscripcion(metodo);

      // La foto se sube una sola vez aunque haya que reintentar el registro.
      let urlComprobante: string;
      if (subida.current && subida.current.archivo === foto.archivo) {
        urlComprobante = subida.current.url;
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
          urlComprobante = subido.url;
          subida.current = { archivo: foto.archivo, url: urlComprobante };
        } catch {
          setErrorGeneral(t("pay.err.subida"));
          return;
        }
      }

      setFase("registrando");
      const resultado = await usFetch<InscripcionUS>(`/us/inscripcion/${inscripcion._id}/pago`, {
        method: "POST",
        body: {
          agencia,
          numeroControl: control,
          remitente: remitente.trim(),
          montoEnviado: monto.trim().replace(",", "."),
          fechaEnvio: fecha,
          comprobanteUrl: urlComprobante,
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

  const total = formatearUSD(precioCentavos + 300, locale);
  const precio = formatearUSD(precioCentavos, locale);
  const textoFase =
    preparando
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
      {/* Paso 1: a dónde enviar */}
      <section aria-labelledby="paso1" className="space-y-3">
        <h3 id="paso1" className="font-display text-lg font-semibold text-brand-blue">
          {t("pay.paso1")}
        </h3>
        <p className="text-neutral-text">
          {via === "deposito" ? t("pay.deposito.instr") : t("pay.efectivo.instr")}
        </p>
        {datosDestino.length > 0 ? (
          <div className="space-y-2">
            {datosDestino.map((d) => (
              <DatoCopiable key={d.etiqueta} etiqueta={d.etiqueta} valor={d.valor} />
            ))}
          </div>
        ) : (
          <p role="status" className="rounded-lg bg-status-warning/15 px-4 py-3 text-sm text-neutral-text">
            {t("pay.destino.pendiente")}
          </p>
        )}
        {nota && <p className="text-sm text-neutral-text/80">{nota}</p>}
        {agenciasVia.length > 0 && (
          <p className="text-sm text-neutral-text/80">
            {t("pay.agenciasLista", { agencias: agenciasVia.map((a) => a.nombre).join(", ") })}
          </p>
        )}

        <div className="rounded-lg border-l-4 border-brand-yellow bg-brand-yellow-light px-4 py-3">
          <p className="font-semibold text-neutral-text">{t("pay.regla.titulo")}</p>
          <p className="mt-1 text-sm text-neutral-text">
            {t("pay.regla.texto", { precio, total })}
          </p>
        </div>
      </section>

      {/* Paso 2: datos del recibo */}
      <form onSubmit={enviar} noValidate aria-labelledby="paso2" className="space-y-4">
        <h3 id="paso2" className="font-display text-lg font-semibold text-brand-blue">
          {t("pay.paso2")}
        </h3>

        <AgencySelector
          agencias={config.agencias ?? []}
          via={via}
          valor={agencia}
          onChange={setAgencia}
          error={errores.agencia}
        />

        <Campo
          etiqueta={t("pay.f.control")}
          ayuda={t("pay.f.controlAyuda")}
          error={errores.control}
          required
          autoCapitalize="characters"
          autoComplete="off"
          maxLength={40}
          value={control}
          onChange={(e) => setControl(e.target.value)}
        />

        <Campo
          etiqueta={t("pay.f.remitente")}
          error={errores.remitente}
          required
          autoComplete="name"
          maxLength={100}
          value={remitente}
          onChange={(e) => setRemitente(e.target.value)}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            etiqueta={t("pay.f.monto")}
            error={errores.monto}
            required
            inputMode="decimal"
            autoComplete="off"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
          />
          <Campo
            etiqueta={t("pay.f.fecha")}
            error={errores.fecha}
            required
            type="date"
            min={minFecha}
            max={maxFecha}
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </div>

        {/* Foto del recibo */}
        <div>
          <span className="mb-1 block text-sm font-medium text-neutral-text">
            {t("pay.f.recibo")}
          </span>
          <input
            id="foto-recibo"
            type="file"
            accept="image/*"
            className="peer sr-only"
            onChange={elegirFoto}
            aria-describedby="ayuda-recibo"
          />
          <label
            htmlFor="foto-recibo"
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-brand-blue px-5 font-medium text-brand-blue hover:bg-brand-blue/5 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-blue"
          >
            <Camera aria-hidden size={18} />
            {foto ? t("pay.f.cambiarFoto") : t("pay.f.elegirFoto")}
          </label>
          <p id="ayuda-recibo" className="mt-1 text-xs text-neutral-text/70">
            {t("pay.f.reciboAyuda")}
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

        <BotonPrimario type="submit" disabled={ocupado} className="w-full sm:w-auto">
          {t("pay.enviar")}
        </BotonPrimario>
      </form>
    </div>
  );
}