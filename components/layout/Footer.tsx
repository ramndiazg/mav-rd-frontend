import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-brand-blue text-white/80">
      <div className="road-divider" />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        {/* CORREGIDO (17/09/2026): Muvo y la Fundación estaban mezcladas en
            un solo párrafo, lo que hacía parecer que la fundación era dueña
            de todo el sitio. Se separan en dos bloques propios: Muvo como
            la escuela, la Fundación como entidad aparte que respalda un
            plan específico. */}
        <div>
          <p className="font-display text-base font-semibold text-white">
            Muvo RD Vial
          </p>
          <p className="mt-2 text-sm leading-relaxed">
            Escuela de formación vial en Santo Domingo, República Dominicana,
            fundada por María Díaz el 25 de noviembre de 2017. Formamos
            conductoras y conductores seguros, con cursos teóricos y
            prácticos alineados a la Ley 63-17 y al INTRANT.
          </p>
        </div>

        <div>
          <p className="font-display text-base font-semibold text-white">
            Fundación Mujeres al Volante RD
          </p>
          <p className="mt-2 text-sm leading-relaxed">
            Fundación sin fines de lucro, subsidiaria del plan Mujeres al
            Volante — nuestro aporte a la comunidad para que aprender a
            manejar nunca sea una barrera.
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
