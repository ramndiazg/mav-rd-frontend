import { intlLocale, type Locale } from "./i18n";
import type { EstadoUS } from "./estados";

// NUEVO (24/10/2026): tipos que comparten las pantallas de pago y el panel,
// y formateo de montos y fechas. El dinero llega del servidor en CENTAVOS
// enteros de USD; solo aquí se convierte a texto.

// Métodos de pago programados hoy. Para sumar PayPal: añadir "paypal" aquí y
// un componente al mapa de PaymentMethodPicker (ver IMPLEMENTACION.md §5.3).
export const METODOS_CONOCIDOS = [
  "remesa_deposito",
  "remesa_efectivo",
  "paypal",
] as const;
export type MetodoPagoId = (typeof METODOS_CONOCIDOS)[number];

export function esMetodoConocido(valor: unknown): valor is MetodoPagoId {
  return (
    typeof valor === "string" &&
    (METODOS_CONOCIDOS as readonly string[]).includes(valor)
  );
}

export type ViaRemesa = "deposito" | "efectivo";

export type EstadoPago =
  | "creado"
  | "pendiente_verificacion"
  | "pagado"
  | "rechazado"
  | "reembolsado"
  | "disputado";

export type AgenciaUS = {
  id: string;
  nombre: string;
  via: ViaRemesa[];
  notas_es: string;
  notas_en: string;
};

// GET /api/us/config — si el curso está apagado solo llega { activo:false }.
export type ConfigUS = {
  activo: boolean;
  moneda?: string;
  precioCentavos?: number | null;
  metodos?: string[];
  agencias?: AgenciaUS[];
  plazoConfirmacionHoras?: number;
  estadosActivos?: EstadoUS[];
};

export type DestinoDeposito = {
  titular?: string;
  banco?: string;
  numero?: string;
  tipo?: string;
  rnc?: string;
  notas_es?: string;
  notas_en?: string;
};

export type DestinoEfectivo = {
  nombreBeneficiario?: string;
  ciudad?: string;
  notas_es?: string;
  notas_en?: string;
};

// NUEVO (27/10/2026): usuario de PayPal.Me al que se paga (sin "@").
export type DestinoPaypal = {
  usuario?: string;
  notas_es?: string;
  notas_en?: string;
};

// GET /api/us/config/pago — requiere sesión; trae los datos de destino.
export type ConfigPagoUS = ConfigUS & {
  destinoDeposito?: DestinoDeposito;
  destinoEfectivo?: DestinoEfectivo;
  destinoPaypal?: DestinoPaypal;
};

export type RemesaUS = {
  via: ViaRemesa;
  agencia: string;
  numeroControl: string;
  remitente: string;
  montoEnviadoCentavos: number;
  fechaEnvio: string;
  comprobanteUrl: string;
};

// NUEVO (27/10/2026): datos del pago con PayPal (InscripcionUS.pagoExterno).
export type PagoExternoUS = {
  proveedor: string;
  idExterno: string;
  pagador: string;
  montoEnviadoCentavos: number;
  fechaEnvio: string;
  comprobanteUrl: string | null;
};

// GET /api/us/inscripcion/me
export type InscripcionUS = {
  _id: string;
  programa: string;
  estadoUS: EstadoUS;
  montoCentavos: number;
  moneda: string;
  metodoPago: string;
  estadoPago: EstadoPago;
  fechaPago: string | null;
  notaRechazo: string | null;
  remesa: RemesaUS | null;
  pagoExterno?: PagoExternoUS | null;
  createdAt: string;
  updatedAt: string;
};

// Contrato común de los componentes de cada método de pago (los usa
// PaymentMethodPicker). Un método nuevo (p. ej. PayPal) implementa esto:
//  - `asegurarInscripcion(metodo)` crea/reutiliza la inscripción con ese método.
//  - al terminar llama `onCompleto(inscripcion)`; la página decide a dónde ir.
export type MetodoPagoProps = {
  metodo: MetodoPagoId;
  config: ConfigPagoUS;
  precioCentavos: number;
  inscripcionExistente: InscripcionUS | null;
  asegurarInscripcion: (metodo: MetodoPagoId) => Promise<InscripcionUS>;
  onCompleto: (inscripcion: InscripcionUS) => void;
};

export function formatearUSD(centavos: number, locale: Locale): string {
  return new Intl.NumberFormat(intlLocale(locale), {
    style: "currency",
    currency: "USD",
  }).format(centavos / 100);
}

export function formatearFecha(
  valor: string | Date | null | undefined,
  locale: Locale,
  opciones: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
): string {
  if (!valor) return "—";
  const fecha = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "—";
  return new Intl.DateTimeFormat(intlLocale(locale), opciones).format(fecha);
}

// "49", "49.5", "49,50" → centavos; null si no es un monto válido.
export function dolaresACentavos(texto: string): number | null {
  const limpio = texto.trim().replace(",", ".");
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(limpio)) return null;
  return Math.round(Number(limpio) * 100);
}
