"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

const enlaces = [
  { href: "/", label: "Inicio" },
  { href: "/acerca-de-nosotros", label: "Acerca de Nosotros" },
  { href: "/kit-preparacion", label: "Kit de Preparación" },
  { href: "/noticias", label: "Noticias" },
  { href: "/testimonios", label: "Testimonios" },
  { href: "/faq", label: "Preguntas Frecuentes" },
  { href: "/verificar-diploma", label: "Verificar Diploma" },
];

export default function Navbar() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { usuario, cargando, logout } = useAuth();

  // Coordinadora y admin ya tienen su panel construido (Pagos, Aula Virtual,
  // Exámenes) — antes esto mandaba a "/" porque esas rutas no existían todavía.
  const destinoPanel =
    usuario?.rol === "estudiante" ? "/dashboard" : "/panel/pagos";

  return (
    <header className="sticky top-0 z-50 bg-brand-blue text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 whitespace-nowrap">
          <Image
            src="/logo-mav-rd.png"
            alt="Mujeres al Volante RD"
            width={40}
            height={40}
            priority
          />
          <span className="font-display text-lg font-semibold">
            Mujeres al Volante <span className="text-brand-pink-light">RD</span>
          </span>
        </Link>

        {/* Navegación de escritorio */}
        <nav className="hidden items-center gap-5 xl:flex">
          {enlaces.map((enlace) => (
            <Link
              key={enlace.href}
              href={enlace.href}
              className="whitespace-nowrap text-sm text-white/85 transition hover:text-white"
            >
              {enlace.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 xl:flex">
          {!cargando && usuario && (
            <>
              <span className="whitespace-nowrap text-sm text-white/85">
                Hola, {usuario.nombre}
              </span>
              <Link
                href={destinoPanel}
                className="whitespace-nowrap text-sm font-medium text-white/85 transition hover:text-white"
              >
                Mi panel
              </Link>
              <button
                type="button"
                onClick={logout}
                className="whitespace-nowrap rounded-full bg-brand-pink px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-pink/90"
              >
                Cerrar sesión
              </button>
            </>
          )}

          {!cargando && !usuario && (
            <>
              <Link
                href="/login"
                className="whitespace-nowrap text-sm font-medium text-white/85 transition hover:text-white"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/registro"
                className="whitespace-nowrap rounded-full bg-brand-pink px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-pink/90"
              >
                Crear cuenta
              </Link>
            </>
          )}
        </div>

        {/* Botón de menú móvil */}
        <button
          type="button"
          onClick={() => setMenuAbierto((abierto) => !abierto)}
          className="flex flex-col gap-1.5 p-2 xl:hidden"
          aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuAbierto}
        >
          <span
            className={`h-0.5 w-6 bg-white transition ${menuAbierto ? "translate-y-2 rotate-45" : ""}`}
          />
          <span
            className={`h-0.5 w-6 bg-white transition ${menuAbierto ? "opacity-0" : ""}`}
          />
          <span
            className={`h-0.5 w-6 bg-white transition ${menuAbierto ? "-translate-y-2 -rotate-45" : ""}`}
          />
        </button>
      </div>

      {/* Menú móvil desplegable */}
      {menuAbierto && (
        <nav className="flex flex-col gap-1 border-t border-white/10 bg-brand-blue px-4 pb-4 xl:hidden">
          {enlaces.map((enlace) => (
            <Link
              key={enlace.href}
              href={enlace.href}
              onClick={() => setMenuAbierto(false)}
              className="rounded-md px-2 py-2.5 text-sm text-white/85 hover:bg-white/10"
            >
              {enlace.label}
            </Link>
          ))}

          {!cargando && usuario && (
            <div className="mt-2 flex flex-col gap-2 border-t border-white/10 pt-3">
              <span className="px-2 text-sm text-white/85">
                Hola, {usuario.nombre}
              </span>
              <Link
                href={destinoPanel}
                onClick={() => setMenuAbierto(false)}
                className="rounded-md px-2 py-2.5 text-center text-sm font-medium text-white/85 hover:bg-white/10"
              >
                Mi panel
              </Link>
              <button
                type="button"
                onClick={() => {
                  logout();
                  setMenuAbierto(false);
                }}
                className="rounded-full bg-brand-pink px-4 py-2.5 text-center text-sm font-semibold text-white"
              >
                Cerrar sesión
              </button>
            </div>
          )}

          {!cargando && !usuario && (
            <div className="mt-2 flex flex-col gap-2 border-t border-white/10 pt-3">
              <Link
                href="/login"
                onClick={() => setMenuAbierto(false)}
                className="rounded-md px-2 py-2.5 text-center text-sm font-medium text-white/85 hover:bg-white/10"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/registro"
                onClick={() => setMenuAbierto(false)}
                className="rounded-full bg-brand-pink px-4 py-2.5 text-center text-sm font-semibold text-white"
              >
                Crear cuenta
              </Link>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}