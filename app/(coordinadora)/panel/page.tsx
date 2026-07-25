"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

type Tarjeta = {
  href: string;
  titulo: string;
  descripcion: string;
};

const MODULOS_CURSO: Tarjeta[] = [
  { href: "/panel/pagos", titulo: "Pagos", descripcion: "Confirmar inscripciones y pagos" },
  { href: "/panel/estudiantes", titulo: "Estudiantes", descripcion: "Ver y gestionar estudiantes" },
  { href: "/panel/aula-virtual", titulo: "Aula virtual", descripcion: "Contenido de las sesiones" },
  { href: "/panel/examenes", titulo: "Exámenes", descripcion: "Bancos de preguntas" },
  { href: "/panel/diplomas", titulo: "Diplomas", descripcion: "Generar y verificar diplomas" },
];

const MODULOS_CONTENIDO: Tarjeta[] = [
  { href: "/panel/noticias", titulo: "Noticias", descripcion: "Publicaciones y comentarios" },
  { href: "/panel/testimonios", titulo: "Testimonios", descripcion: "Historias de estudiantes" },
  { href: "/panel/faq", titulo: "FAQ", descripcion: "Preguntas frecuentes" },
];

const MODULOS_ADMIN: Tarjeta[] = [
  { href: "/admin/contabilidad", titulo: "Contabilidad", descripcion: "Movimientos y balances" },
  { href: "/admin/contenido-pagina", titulo: "Contenido de página", descripcion: "Textos e imágenes del sitio" },
];

function GrupoTarjetas({
  titulo,
  tarjetas,
  acento = false,
}: {
  titulo: string;
  tarjetas: Tarjeta[];
  acento?: boolean;
}) {
  return (
    <div className="mb-8">
      <p className={`text-sm font-medium mb-3 ${acento ? "text-brand-pink" : "text-neutral-text"}`}>
        {titulo}
      </p>
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {tarjetas.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`rounded-xl border p-5 hover:shadow-lg transition-shadow ${acento ? "bg-brand-pinkLight border-brand-pink" : "bg-white border-neutral-bg"
              }`}
          >
            <p className="font-display font-semibold text-brand-blue">{t.titulo}</p>
            <p className="text-xs text-neutral-text mt-1">{t.descripcion}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function PanelInicioPage() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === "admin";

  return (
    <div>
      <GrupoTarjetas titulo="Gestión del curso" tarjetas={MODULOS_CURSO} />
      <GrupoTarjetas titulo="Contenido público" tarjetas={MODULOS_CONTENIDO} />
      {esAdmin && (
        <GrupoTarjetas titulo="Solo fundadora" tarjetas={MODULOS_ADMIN} acento />
      )}
    </div>
  );
}