"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useUsAuth } from "@/contexts/UsAuthContext";
import { useUsLocale } from "@/contexts/UsLocaleContext";
import LanguageToggle from "@/components/us/LanguageToggle";

// NUEVO (24/10/2026): cabecera de /us/*. Reemplaza al Navbar de RD, que se
// oculta en estas rutas (ver components/layout/Navbar.tsx).
export default function UsHeader() {
  const { t } = useUsLocale();
  const { usuario, cargando, logout } = useUsAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const cerrar = () => setMenuAbierto(false);

  const enlaceBase =
    "whitespace-nowrap text-sm font-medium text-white/90 transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";
  const botonPrincipal =
    "inline-flex min-h-10 items-center justify-center whitespace-nowrap rounded-full bg-brand-pink px-4 text-sm font-semibold text-white transition hover:bg-brand-pink/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

  const acciones = (
    <>
      <Link href="/us" onClick={cerrar} className={enlaceBase}>
        {t("nav.curso")}
      </Link>
      {!cargando && usuario && (
        <>
          <Link href="/us/dashboard" onClick={cerrar} className={enlaceBase}>
            {t("nav.miCurso")}
          </Link>
          <button
            type="button"
            onClick={() => {
              cerrar();
              logout();
            }}
            className={enlaceBase}
          >
            {t("nav.salir")}
          </button>
        </>
      )}
      {!cargando && !usuario && (
        <>
          <Link href="/us/login" onClick={cerrar} className={enlaceBase}>
            {t("nav.entrar")}
          </Link>
          <Link href="/us/register" onClick={cerrar} className={botonPrincipal}>
            {t("nav.crearCuenta")}
          </Link>
        </>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-50 bg-brand-blue text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link
          href="/us"
          className="flex shrink-0 items-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <Image
            src="/logo-mav-rd.png"
            alt=""
            width={40}
            height={40}
            priority
          />
          <span className="flex flex-col leading-tight">
            <span className="font-display text-base font-semibold sm:text-lg">
              Muvo <span className="text-brand-pink-light">RD Vial</span>
            </span>
            <span className="text-[11px] font-normal text-white/75">
              {t("brand.curso")}
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <nav
            aria-label={t("nav.principal")}
            className="hidden items-center gap-4 md:flex"
          >
            {acciones}
          </nav>

          <LanguageToggle />

          <button
            type="button"
            aria-expanded={menuAbierto}
            aria-controls="menu-us"
            aria-label={menuAbierto ? t("nav.cerrarMenu") : t("nav.abrirMenu")}
            onClick={() => setMenuAbierto((abierto) => !abierto)}
            className="inline-flex size-10 items-center justify-center rounded-full text-white hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:hidden"
          >
            {menuAbierto ? <X aria-hidden size={22} /> : <Menu aria-hidden size={22} />}
          </button>
        </div>
      </div>

      {menuAbierto && (
        <nav
          id="menu-us"
          aria-label={t("nav.principal")}
          className="flex flex-col items-start gap-4 border-t border-white/15 bg-brand-blue px-4 py-4 md:hidden"
        >
          {acciones}
        </nav>
      )}
    </header>
  );
}