"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, School, Mail, Phone, MessageCircle, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRevalidar } from "@/hooks/useRevalidar";

// NUEVO (22/10/2026): seguimiento de las solicitudes de información que
// llegan por los formularios públicos de /empresas y /escolar. Antes se
// guardaban en la base de datos pero ninguna pantalla las mostraba.

type TipoSolicitud = "empresa" | "colegio";

type Solicitud = {
  _id: string;
  tipo: TipoSolicitud;
  nombre: string;
  contacto: string;
  cargo: string | null;
  telefono: string;
  email: string;
  cantidadEstudiantes: number | null;
  mensaje: string | null;
  contactado: boolean;
  createdAt: string;
};

type FiltroTipo = "todas" | TipoSolicitud;
type FiltroEstado = "por_contactar" | "contactadas" | "todas";

const ETIQUETA_TIPO: Record<TipoSolicitud, string> = {
  empresa: "Empresa",
  colegio: "Colegio",
};

// Enlace de WhatsApp a partir de un teléfono escrito a mano (809-555-1234,
// (829) 555 1234, +1 849...). Los números dominicanos son de 10 dígitos y
// llevan el código de país 1. Si el número no parece completo, no se ofrece
// el enlace para no mandar al usuario a un chat equivocado.
function enlaceWhatsApp(telefono: string): string | null {
  const digitos = telefono.replace(/\D/g, "");
  if (digitos.length === 10) return `https://wa.me/1${digitos}`;
  if (digitos.length === 11 && digitos.startsWith("1"))
    return `https://wa.me/${digitos}`;
  return null;
}

export default function PanelSolicitudesPage() {
  const { token } = useAuth();

  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>("todas");
  const [filtroEstado, setFiltroEstado] =
    useState<FiltroEstado>("por_contactar");
  const [procesandoId, setProcesandoId] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/solicitudes`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const json = await res.json();
      if (json.success) {
        setSolicitudes(json.data);
        setError(null);
      } else {
        setError(json.error || "No se pudieron cargar las solicitudes.");
      }
    } catch {
      // Si ya hay datos en pantalla se conservan; el error solo se muestra
      // si no hay nada que enseñar.
      setError("No se pudieron cargar las solicitudes. Revisa tu conexión.");
    } finally {
      setCargando(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    queueMicrotask(() => {
      void cargar();
    });
  }, [token, cargar]);

  // Llegan solicitudes nuevas sin recargar: al volver a la pestaña y cada
  // 60 s con la pestaña visible. Se pausa mientras se guarda un cambio, para
  // que una respuesta vieja no pise el estado recién marcado.
  useRevalidar(cargar, {
    activo: !!token && procesandoId === null,
    intervaloMs: 60000,
  });

  async function marcarContactado(solicitud: Solicitud, contactado: boolean) {
    setProcesandoId(solicitud._id);
    setError(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/solicitudes/${solicitud.tipo}/${solicitud._id}/contactado`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ contactado }),
        },
      );
      const json = await res.json();
      if (json.success) {
        setSolicitudes((prev) =>
          prev.map((s) => (s._id === json.data._id ? json.data : s)),
        );
      } else {
        setError(json.error || "No se pudo guardar el cambio.");
      }
    } catch {
      setError("No se pudo guardar el cambio. Revisa tu conexión.");
    } finally {
      setProcesandoId(null);
    }
  }

  // Cuántas faltan por contactar de cada tipo (se muestra en los filtros).
  const pendientes = useMemo(() => {
    const porContactar = solicitudes.filter((s) => !s.contactado);
    return {
      todas: porContactar.length,
      empresa: porContactar.filter((s) => s.tipo === "empresa").length,
      colegio: porContactar.filter((s) => s.tipo === "colegio").length,
    };
  }, [solicitudes]);

  const visibles = useMemo(
    () =>
      solicitudes.filter((s) => {
        if (filtroTipo !== "todas" && s.tipo !== filtroTipo) return false;
        if (filtroEstado === "por_contactar" && s.contactado) return false;
        if (filtroEstado === "contactadas" && !s.contactado) return false;
        return true;
      }),
    [solicitudes, filtroTipo, filtroEstado],
  );

  const FILTROS_TIPO: { valor: FiltroTipo; etiqueta: string; pendientes: number }[] = [
    { valor: "todas", etiqueta: "Todas", pendientes: pendientes.todas },
    { valor: "empresa", etiqueta: "Empresas", pendientes: pendientes.empresa },
    { valor: "colegio", etiqueta: "Colegios", pendientes: pendientes.colegio },
  ];

  const FILTROS_ESTADO: { valor: FiltroEstado; etiqueta: string }[] = [
    { valor: "por_contactar", etiqueta: "Por contactar" },
    { valor: "contactadas", etiqueta: "Contactadas" },
    { valor: "todas", etiqueta: "Todas" },
  ];

  function chip(activo: boolean) {
    return `text-xs font-medium px-3 py-1.5 rounded-full ${activo
      ? "bg-brand-blue text-white"
      : "bg-white border border-neutral-bg text-neutral-text"
      }`;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="font-display text-2xl font-bold text-brand-blue mb-1">
        Solicitudes de información
      </h2>
      <p className="text-sm text-neutral-text mb-6">
        Empresas y colegios que pidieron información desde los formularios de
        la página. Márcalas como contactadas cuando les des seguimiento.
      </p>

      <div className="flex flex-wrap gap-2 mb-3">
        {FILTROS_TIPO.map((f) => (
          <button
            key={f.valor}
            onClick={() => setFiltroTipo(f.valor)}
            className={chip(filtroTipo === f.valor)}
          >
            {f.etiqueta}
            {f.pendientes > 0 && ` (${f.pendientes})`}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTROS_ESTADO.map((f) => (
          <button
            key={f.valor}
            onClick={() => setFiltroEstado(f.valor)}
            className={chip(filtroEstado === f.valor)}
          >
            {f.etiqueta}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-sm text-brand-pink mb-4" role="alert">
          {error}
        </p>
      )}

      {cargando && <p className="text-sm text-neutral-text">Cargando...</p>}

      {!cargando && !error && visibles.length === 0 && (
        <p className="text-sm text-neutral-text">
          {filtroEstado === "por_contactar"
            ? "No hay solicitudes por contactar. ¡Todo al día!"
            : "No hay solicitudes con este filtro."}
        </p>
      )}

      <div className="flex flex-col gap-3">
        {visibles.map((s) => {
          const whatsapp = enlaceWhatsApp(s.telefono);
          const Icono = s.tipo === "empresa" ? Building2 : School;
          return (
            <div
              key={s._id}
              className="rounded-xl bg-white border border-neutral-bg p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <Icono size={20} className="text-brand-blue shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-display font-semibold text-brand-blue break-words">
                      {s.nombre}
                    </p>
                    <p className="text-xs text-neutral-text">
                      {ETIQUETA_TIPO[s.tipo]} ·{" "}
                      {new Date(s.createdAt).toLocaleDateString("es-DO")}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-[11px] font-medium px-2 py-1 rounded-full whitespace-nowrap shrink-0 ${s.contactado
                    ? "bg-status-success/10 text-status-success"
                    : "bg-status-warning/10 text-status-warning"
                    }`}
                >
                  {s.contactado ? "Contactada" : "Por contactar"}
                </span>
              </div>

              <div className="mt-3 text-sm text-neutral-text flex flex-col gap-1.5">
                <p>
                  <span className="font-medium">{s.contacto}</span>
                  {s.cargo && ` — ${s.cargo}`}
                </p>
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <a
                    href={`tel:${s.telefono.replace(/[^\d+]/g, "")}`}
                    className="inline-flex items-center gap-1 hover:text-brand-blue"
                  >
                    <Phone size={14} /> {s.telefono}
                  </a>
                  {whatsapp && (
                    <a
                      href={whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-status-success hover:underline"
                    >
                      <MessageCircle size={14} /> WhatsApp
                    </a>
                  )}
                </p>
                <p>
                  <a
                    href={`mailto:${s.email}`}
                    className="inline-flex items-center gap-1 hover:text-brand-blue break-all"
                  >
                    <Mail size={14} /> {s.email}
                  </a>
                </p>
                {s.cantidadEstudiantes !== null && (
                  <p className="inline-flex items-center gap-1">
                    <Users size={14} /> Aprox. {s.cantidadEstudiantes}{" "}
                    {s.tipo === "colegio" ? "estudiantes" : "personas"}
                  </p>
                )}
              </div>

              {s.mensaje && (
                <div className="mt-3 rounded-lg bg-neutral-bg p-3">
                  <p className="text-sm text-neutral-text whitespace-pre-wrap break-words">
                    {s.mensaje}
                  </p>
                </div>
              )}

              <div className="mt-4">
                <button
                  onClick={() => marcarContactado(s, !s.contactado)}
                  disabled={procesandoId === s._id}
                  className={
                    s.contactado
                      ? "text-xs font-medium px-3 py-1.5 rounded-full bg-neutral-bg text-neutral-text hover:bg-brand-pink-light disabled:opacity-60"
                      : "text-xs font-medium px-3 py-1.5 rounded-full bg-status-success/10 text-status-success hover:bg-status-success/20 disabled:opacity-60"
                  }
                >
                  {procesandoId === s._id
                    ? "Guardando..."
                    : s.contactado
                      ? "Volver a marcar por contactar"
                      : "Marcar como contactada"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}