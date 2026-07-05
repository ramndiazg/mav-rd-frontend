import Link from "next/link";

const sesiones = [
  {
    numero: "01",
    titulo: "Ley de Tránsito",
    detalle:
      "Las reglas de la Ley 63-17, señales de tránsito y por qué existen — no para memorizar, sino para entender la calle.",
  },
  {
    numero: "02",
    titulo: "Manejo defensivo",
    detalle:
      "Cómo anticipar el peligro antes de que ocurra: distancia, puntos ciegos, y decisiones bajo presión.",
  },
  {
    numero: "03",
    titulo: "Práctica y examen INTRANT",
    detalle:
      "Todo lo que necesitas saber para llegar segura al examen del INTRANT, sin sorpresas.",
  },
];

const testimonios = [
  {
    nombre: "Rosa M.",
    texto:
      "Tenía 40 años y nunca me había subido a un volante sola. Aquí entendí que el miedo no era mío, era de nunca haber tenido quién me explicara con paciencia.",
  },
  {
    nombre: "Yolanda P.",
    texto:
      "Las clases son entre mujeres, a nuestro ritmo. Eso cambió todo — pude preguntar lo que en otro lado me daba pena preguntar.",
  },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-blue to-brand-blue-light text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:py-24 lg:grid-cols-2 lg:items-center">
          <div>
            <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl">
              Detrás de cada mujer que conduce, hay una que decidió aprender.
            </h1>
            <p className="mt-5 max-w-lg text-white/85">
              Mujeres al Volante RD es una fundación dominicana que enseña a
              mujeres a conducir con confianza, desde la teoría hasta el
              examen del INTRANT — presencial, en grupo, y sin prisa.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/registro"
                className="rounded-full bg-brand-pink px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-pink/90"
              >
                Crear cuenta gratis
              </Link>
              <Link
                href="/kit-preparacion"
                className="rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Ver kit de preparación
              </Link>
            </div>
          </div>

          <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm sm:p-8">
            <p className="font-display text-sm font-semibold uppercase tracking-wide text-brand-pink-light">
              Desde 2017
            </p>
            <p className="mt-3 text-lg leading-relaxed text-white">
              Fundada por María Díaz en Santo Domingo, con una idea simple:
              ninguna mujer debería quedarse sin aprender a manejar por falta
              de un espacio hecho para ella.
            </p>
          </div>
        </div>
      </section>

      <div className="road-divider" />

      {/* Las 3 sesiones — sí es una secuencia real, por eso se numera */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-bold text-brand-blue">
            Un curso, tres sesiones, en orden.
          </h2>
          <p className="mt-3 text-neutral-text/80">
            Cada sesión se desbloquea presencialmente, junto a tu grupo.
            No puedes saltarte pasos — y eso es intencional.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {sesiones.map((sesion) => (
            <div
              key={sesion.numero}
              className="rounded-xl border border-brand-blue/10 bg-white p-6 shadow-sm"
            >
              <span className="font-display text-3xl font-bold text-brand-pink">
                {sesion.numero}
              </span>
              <h3 className="mt-3 font-display text-lg font-semibold text-brand-blue">
                {sesion.titulo}
              </h3>
              <p className="mt-2 text-sm text-neutral-text/75">
                {sesion.detalle}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="road-divider" />

      {/* Testimonios */}
      <section className="bg-brand-pink-light">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="font-display text-3xl font-bold text-brand-blue">
            Lo que dicen quienes ya se sentaron al volante
          </h2>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {testimonios.map((testimonio) => (
              <blockquote
                key={testimonio.nombre}
                className="rounded-xl bg-white p-6 shadow-sm"
              >
                <p className="text-neutral-text/85">“{testimonio.texto}”</p>
                <footer className="mt-4 font-display text-sm font-semibold text-brand-blue">
                  — {testimonio.nombre}
                </footer>
              </blockquote>
            ))}
          </div>

          <div className="mt-8">
            <Link
              href="/testimonios"
              className="text-sm font-semibold text-brand-blue hover:underline"
            >
              Ver todos los testimonios →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="mx-auto max-w-6xl px-4 py-16 text-center">
        <h2 className="font-display text-3xl font-bold text-brand-blue">
          ¿Lista para empezar?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-neutral-text/80">
          El registro es gratis. Pagas tu inscripción en efectivo cuando
          confirmes tu lugar con una coordinadora.
        </p>
        <Link
          href="/registro"
          className="mt-6 inline-block rounded-full bg-brand-pink px-8 py-3 text-sm font-semibold text-white transition hover:bg-brand-pink/90"
        >
          Crear cuenta gratis
        </Link>
      </section>
    </>
  );
}
