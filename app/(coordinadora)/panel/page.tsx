"use client";

import { useEffect, useState } from "react";
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
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type Tarjeta = {
  href: string;
  titulo: string;
  descripcion: string;
  Icono: LucideIcon;
};

const MODULOS_CURSO: Tarjeta[] = [
  { href: "/panel/pagos", titulo: "Pagos", descripcion: "Confirmar inscripciones y pagos", Icono: Wallet },
  { href: "/panel/estudiantes", titulo: "Estudiantes", descripcion: "Ver y gestionar estudiantes", Icono: Users },
  { href: "/panel/aula-virtual", titulo: "Aula virtual", descripcion: "Contenido de las sesiones", Icono: GraduationCap },
  { href: "/panel/examenes", titulo: "Exámenes", descripcion: "Bancos de preguntas", Icono: ClipboardCheck },
  { href: "/panel/diplomas", titulo: "Diplomas", descripcion: "Generar y verificar diplomas", Icono: Award },
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
              className={`relative rounded-xl border p-5 hover:shadow-lg transition-shadow ${acento ? "bg-brand-pinkLight border-brand-pink" : "bg-white border-neutral-bg"
                }`}
            >
              {conteo > 0 && (
                <span className="absolute -top-2 -right-2 min-w-[22px] h-[22px] px-1 rounded-full bg-brand-pink text-white text-[11px] font-semibold flex items-center justify-center">
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

export default function PanelInicioPage() {
  const { usuario, token } = useAuth();
  const esAdmin = usuario?.rol === "admin";
  const [pendientesPago, setPendientesPago] = useState(0);

  useEffect(() => {
    if (!token) return;
    let cancelado = false;

    (async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/inscripciones?estadoPago=pendiente_verificacion`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const json = await res.json();
        if (!cancelado && json.success) {
          setPendientesPago(json.data.length);
        }
      } catch {
        // Si falla, simplemente no se muestra el badge — no es crítico
        // para el resto de la pantalla de tarjetas.
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [token]);

  return (
    <div>
      <GrupoTarjetas
        titulo="Gestión del curso"
        tarjetas={MODULOS_CURSO}
        badges={{ "/panel/pagos": pendientesPago }}
      />
      <GrupoTarjetas titulo="Contenido público" tarjetas={MODULOS_CONTENIDO} />
      {esAdmin && (
        <GrupoTarjetas titulo="Solo fundadora" tarjetas={MODULOS_ADMIN} acento />
      )}
    </div>
  );
}