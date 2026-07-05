import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-brand-blue text-white/80">
      <div className="road-divider" />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="font-display text-base font-semibold text-white">
            Mujeres al Volante RD
          </p>
          <p className="mt-2 text-sm leading-relaxed">
            Fundación sin fines de lucro fundada el 25 de noviembre de 2017
            por María Díaz, en Santo Domingo, República Dominicana.
            Formamos a mujeres para que conduzcan con confianza y seguridad.
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
        © {new Date().getFullYear()} Mujeres al Volante RD. Todos los
        derechos reservados.
      </div>
    </footer>
  );
}
