import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-brand-blue text-white/80">
      <div className="road-divider" />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          {/* CORREGIDO (17/09/2026): antes esta columna presentaba a "Mujeres
              al Volante RD" (la fundación) como si fuera la entidad dueña de
              todo el sitio. En realidad Muvo RD Vial es la escuela — la
              fundación solo subsidia UN plan específico (Mujeres al
              Volante), por eso ese plan cuesta menos (solo cubre gastos
              mínimos). Mezclar ambas identidades podía generar problemas
              legales/de representación. */}
          <p className="font-display text-base font-semibold text-white">
            Muvo RD Vial
          </p>
          <p className="mt-2 text-sm leading-relaxed">
            Escuela de formación vial en Santo Domingo, República Dominicana,
            fundada por María Díaz el 25 de noviembre de 2017. El plan Mujeres
            al Volante es subsidiado por la Fundación Mujeres al Volante RD
            — una fundación sin fines de lucro que cubre parte del costo de
            ese plan específico, por eso su tarifa cubre solo los gastos
            mínimos.
          </p>
        </div>

        <div>
          <p className="font-display text-sm font-semibold text-white">
            Enlaces rápidos
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/kit-preparacion" className="hover:text-white">
                Kit de Preparación INTRANT
              </Link>
            </li>
            <li>
              <Link href="/testimonios" className="hover:text-white">
                Testimonios
              </Link>
            </li>
            <li>
              <Link href="/faq" className="hover:text-white">
                Preguntas Frecuentes
              </Link>
            </li>
            <li>
              <Link href="/verificar-diploma" className="hover:text-white">
                Verificar un diploma
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="font-display text-sm font-semibold text-white">
            Cuenta
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/login" className="hover:text-white">
                Iniciar sesión
              </Link>
            </li>
            <li>
              <Link href="/registro" className="hover:text-white">
                Crear cuenta gratis
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/60">
        <p>
          © {new Date().getFullYear()} Muvo RD Vial. Todos los derechos
          reservados.
        </p>
        {/* NUEVO (17/09/2026): crédito del desarrollador, a pedido. */}
        <p className="mt-1">
          Desarrollado por{" "}
          <a
            href="mailto:ramndiaz@gmail.com"
            className="text-white/80 hover:text-white hover:underline"
          >
            Ramón Díaz
          </a>
        </p>
      </div>
    </footer>
  );
}
