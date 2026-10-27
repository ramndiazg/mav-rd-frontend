"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Wallet,
  Users,
  GraduationCap,
  ClipboardCheck,
  Award,
  Newspaper,
  Heart,
  HelpCircle,
  Landmark,
  FileEdit,
  BellRing,
  Bot,
  ClipboardList,
  Car,
  Send,
  DollarSign,
  Building2,
  School,
  MapPin,
  LifeBuoy,
  Inbox,
  Globe,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRevalidar } from "@/hooks/useRevalidar";

type Tarjeta = {
  href: string;
  titulo: string;
  descripcion: string;
  Icono: LucideIcon;
};

const MODULOS_CURSO: Tarjeta[] = [
  { href: "/panel/pagos", titulo: "Pagos", descripcion: "Confirmar inscripciones y pagos", Icono: Wallet },
  // NUEVO (24/10/2026): curso Driver Prep USA (envíos de dinero desde EE. UU.)
  { href: "/panel/pagos-us", titulo: "Pagos EE. UU.", descripcion: "Comprobantes de envíos de dinero del curso Driver Prep USA", Icono: Globe },
  { href: "/panel/estudiantes", titulo: "Estudiantes", descripcion: "Ver y gestionar estudiantes", Icono: Users },
  { href: "/panel/aula-virtual", titulo: "Aula virtual", descripcion: "Contenido de las sesiones", Icono: GraduationCap },
  { href: "/panel/examenes", titulo: "Exámenes", descripcion: "Bancos de preguntas", Icono: ClipboardCheck },
  { href: "/panel/diplomas", titulo: "Diplomas", descripcion: "Generar y verificar diplomas", Icono: Award },
  { href: "/panel/test-psicologico", titulo: "Perfil conductual", descripcion: "Cuestionario previo al curso", Icono: ClipboardList },
  // NUEVO (11/09/2026) — antes no existía ninguna pantalla para ver estas
  // respuestas, aunque el backend ya las guardaba correctamente (ver
  // HISTORIAL_MODIFICACIONES.md).
  { href: "/panel/cuestionario-escolar", titulo: "Cuestionario Escolar", descripcion: "Respuestas de estudiantes de colegios", Icono: School },
  // NUEVO (09/09/2026)
  { href: "/panel/grupos", titulo: "Grupos", descripcion: "Colegios y empresas inscritos en bloque", Icono: Building2 },
  // NUEVO: incidencias/errores/dudas reportadas por estudiantes
  { href: "/panel/soporte", titulo: "Soporte", descripcion: "Incidencias y dudas reportadas por estudiantes", Icono: LifeBuoy },
  // NUEVO (22/10/2026): leads de los formularios de /empresas y /escolar
  { href: "/panel/solicitudes", titulo: "Solicitudes", descripcion: "Empresas y colegios que piden información", Icono: Inbox },
];

const MODULOS_CONTENIDO: Tarjeta[] = [
  { href: "/panel/noticias", titulo: "Noticias", descripcion: "Publicaciones y comentarios", Icono: Newspaper },
  { href: "/panel/testimonios", titulo: "Testimonios", descripcion: "Historias de estudiantes", Icono: Heart },
  { href: "/panel/faq", titulo: "FAQ", descripcion: "Preguntas frecuentes", Icono: HelpCircle },
];

const MODULOS_ADMIN: Tarjeta[] = [
  { href: "/admin/contabilidad", titulo: "Contabilidad", descripcion: "Movimientos y balances", Icono: Landmark },
  { href: "/admin/contenido-pagina", titulo: "Contenido de página", descripcion: "Textos e imágenes del sitio", Icono: FileEdit },
  { href: "/admin/notificaciones", titulo: "Notificaciones", descripcion: "Quién recibe avisos de pagos nuevos", Icono: BellRing },
  { href: "/admin/choferes", titulo: "Choferes", descripcion: "Instructores de práctica y choferes recomendados (camión y montacargas)", Icono: Car },
  { href: "/admin/notificaciones-practica", titulo: "Notif. de práctica", descripcion: "Quién recibe avisos cuando una estudiante termina la teoría", Icono: Send },
  { href: "/admin/asistente", titulo: "Asistente", descripcion: "Pregúntale por cifras reales de la app", Icono: Bot },
  // NUEVO (07/09/2026)
  { href: "/admin/planes", titulo: "Planes y precios", descripcion: "Editar precios, nombres y detalles de cada plan", Icono: DollarSign },
  // NUEVO (13/09/2026) — ver ANALISIS_COBERTURA_PRACTICA.md
  { href: "/admin/cobertura-practica", titulo: "Cobertura de práctica", descripcion: "Municipios donde ofrecemos práctica de manejo presencial", Icono: MapPin },
  // NUEVO: por tipo de reporte, si se avisa por correo/Telegram al llegar uno nuevo
  { href: "/admin/notificaciones-reportes", titulo: "Notif. de reportes", descripcion: "Qué tipos de reporte avisan por correo/Telegram", Icono: LifeBuoy },
];

function GrupoTarjetas({
  titulo,
  tarjetas,
  acento = false,
  badges = {},
}: {
  titulo: string;
  tarjetas: Tarjeta[];
  acento?: boolean;
  badges?: Record<string, number>;
}) {
  return (
    <div className="mb-8">
      <p className={`text-sm font-medium mb-3 ${acento ? "text-brand-pink" : "text-neutral-text"}`}>
        {titulo}
      </p>
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {tarjetas.map(({ href, titulo: tituloTarjeta, descripcion, Icono }) => {
          const conteo = badges[href] || 0;
          return (
            <Link
              key={href}
              href={href}
              className={`relative rounded-xl border p-5 hover:shadow-lg transition-shadow ${acento ? "bg-brand-pink-light border-brand-pink" : "bg-white border-neutral-bg"
                }`}
            >
              {conteo > 0 && (
                <span
                  title={`${conteo} por atender`}
                  className="absolute -top-2 -right-2 min-w-[22px] h-[22px] px-1 rounded-full bg-brand-pink text-white text-[11px] font-semibold flex items-center justify-center"
                >
                  {conteo > 99 ? "99+" : conteo}
                </span>
              )}
              <Icono className={acento ? "text-brand-pink" : "text-brand-blue"} size={24} />
              <p className="font-display font-semibold text-brand-blue mt-2">{tituloTarjeta}</p>
              <p className="text-xs text-neutral-text mt-1">{descripcion}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// NUEVO (21/10/2026): contadores de "cosas por hacer" que el backend calcula
// en GET /api/panel/pendientes (ver panelController.js para el criterio de
// cada uno). Antes solo Pagos y Soporte tenían aviso, y para contarlos se
// descargaban las listas completas.
type Pendientes = {
  pagos: number;
  soporte: number;
  diplomas: number;
  grupos: number;
  solicitudes: number;
  contabilidad: number;
};

export default function PanelInicioPage() {
  const { usuario, token } = useAuth();
  const esAdmin = usuario?.rol === "admin";
  const [pendientes, setPendientes] = useState<Pendientes | null>(null);
  // NUEVO (24/10/2026): pagos de EE. UU. por verificar (otro modelo y otro
  // endpoint que los pagos de RD, por eso no viene en /panel/pendientes).
  const [pagosUS, setPagosUS] = useState(0);

  const cargarPendientes = useCallback(async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/panel/pendientes`,
        { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
      );
      const json = await res.json();
      if (json.success) setPendientes(json.data);
    } catch {
      // No es crítico para el resto de la pantalla de tarjetas: si falla
      // por red se conservan los avisos que ya estaban.
    }

    // Pagos de EE. UU. por verificar (limite=1: solo interesa el total).
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/us/admin/inscripciones?estadoPago=pendiente_verificacion&limite=1`,
        { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
      );
      const json = await res.json();
      if (json.success) setPagosUS(json.data.total ?? 0);
    } catch {
      // igual que arriba: no es crítico
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    queueMicrotask(() => {
      void cargarPendientes();
    });
  }, [token, cargarPendientes]);

  // Los avisos se ponen al día solos: al volver a la pestaña y cada 60 s
  // con la pestaña visible (así un pago o reporte nuevo aparece sin recargar).
  useRevalidar(cargarPendientes, { activo: !!token, intervaloMs: 60000 });

  return (
    <div>
      <GrupoTarjetas
        titulo="Gestión del curso"
        tarjetas={MODULOS_CURSO}
        badges={{
          "/panel/pagos": pendientes?.pagos ?? 0,
          "/panel/pagos-us": pagosUS,
          "/panel/soporte": pendientes?.soporte ?? 0,
          "/panel/diplomas": pendientes?.diplomas ?? 0,
          "/panel/grupos": pendientes?.grupos ?? 0,
          "/panel/solicitudes": pendientes?.solicitudes ?? 0,
        }}
      />
      <GrupoTarjetas titulo="Contenido público" tarjetas={MODULOS_CONTENIDO} />
      {esAdmin && (
        <GrupoTarjetas
          titulo="Solo fundadora"
          tarjetas={MODULOS_ADMIN}
          acento
          badges={{ "/admin/contabilidad": pendientes?.contabilidad ?? 0 }}
        />
      )}
    </div>
  );
}