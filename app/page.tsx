import Image from "next/image";
import Link from "next/link";

// TODO: cuando se confirmen los temas reales de la 4ta sesión, agregar la
// tarjeta "04" aquí. Se dejó el título de la sección sin número explícito
// ("en sesiones, en orden" en vez de "tres sesiones") justamente para que
// no quede desactualizado mientras se decide el contenido nuevo.
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

// El curso teórico es el mismo para todas — la diferencia real entre
// planes está solo en la práctica de manejo (ver detalle de cada uno).
const planes = [
  {
    id: "normal" as const,
    nombre: "Normal",
    destacado: false,
    detalle:
      "Práctica de manejo en grupo, con el acompañamiento de nuestros instructores en cada sesión.",
    caracteristicas: [
      "4 sesiones de teoría",
      "Práctica de manejo en grupo",
      "Preparación para el examen del INTRANT",
      "Diploma al completar el curso",
    ],
  },
  {
    id: "vip" as const,
    nombre: "VIP",
    destacado: true,
    detalle:
      "Práctica de manejo más personalizada, con más tiempo uno a uno junto a tu instructor.",
    caracteristicas: [
      "4 sesiones de teoría",
      "Práctica personalizada, más tiempo con tu instructor",
      "Preparación para el examen del INTRANT",
      "Diploma al completar el curso",
    ],
  },
];

type Precios = { precio_plan_normal: number; precio_plan_vip: number };

function formatearMonto(valor: number) {
  return `RD$${valor.toLocaleString("es-DO")}`;
}

// Se pide en cada visita (no se cachea): el precio puede cambiar sin que
// haya un nuevo despliegue del frontend, ya que vive en la base de datos.
async function obtenerPrecios(): Promise<Precios | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/configuracion`,
      { cache: "no-store" },
    );
    const json = await res.json();
    return json.success ? json.data : null;
  } catch {
    return null;
  }
}

export default async function Home() {
  const precios = await obtenerPrecios();

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-blue to-brand-blue-light text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:py-24 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <Image
                src="/logo-mav-rd.png"
                alt="Muvo RD Vial"
                width={88}
                height={88}
                priority
                className="shrink-0"
              />
              <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl">
                Todos merecen la oportunidad de aprender a manejar con confianza.
              </h1>
            </div>
            <p className="mt-5 max-w-lg text-white/85">
              Muvo RD Vial es una fundación dominicana que enseña a mujeres y
              jóvenes a conducir con confianza, desde la teoría hasta el
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
              nadie debería quedarse sin aprender a manejar por falta de un
              espacio seguro y accesible para hacerlo.
            </p>
          </div>
        </div>
      </section>

      <div className="road-divider" />

      {/* Las sesiones del curso — sí es una secuencia real, por eso se numera */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-bold text-brand-blue">
            Un curso completo, en sesiones, en orden.
          </h2>
          <p className="mt-3 text-neutral-text/80">

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

      {/* NUEVO: Planes y precios */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-bold text-brand-blue">
            Sal manejando con confianza. Tú eliges cómo llegar ahí.
          </h2>
          <p className="mt-3 text-neutral-text/80">
            La teoría más completa y detallada, los mejores instructores
            certificados — hacemos la diferencia con nuestra atención
            personalizada en la práctica de manejo. Elige el plan que se
            ajuste a tu ritmo.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {planes.map((plan) => {
            const precio =
              plan.id === "normal"
                ? precios?.precio_plan_normal
                : precios?.precio_plan_vip;

            return (
              <div
                key={plan.id}
                className={`rounded-xl border p-6 shadow-sm transition hover:shadow-md ${plan.destacado
                  ? "border-brand-pink bg-brand-pink-light/40"
                  : "border-brand-blue/10 bg-white"
                  }`}
              >
                <div className="flex items-baseline justify-between">
                  <h3 className="font-display text-xl font-bold text-brand-blue">
                    Plan {plan.nombre}
                  </h3>
                  {plan.destacado && (
                    <span className="rounded-full bg-brand-pink px-3 py-1 text-xs font-semibold text-white">
                      Más personalizado
                    </span>
                  )}
                </div>

                <p className="mt-3 font-display text-3xl font-bold text-brand-blue">
                  {precio ? formatearMonto(precio) : "Consultar"}
                </p>

                <p className="mt-2 text-sm text-neutral-text/75">
                  {plan.detalle}
                </p>

                <ul className="mt-5 space-y-2 text-sm text-neutral-text/85">
                  {plan.caracteristicas.map((c) => (
                    <li key={c} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-pink" />
                      {c}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/registro"
                  className="mt-6 inline-block rounded-full bg-brand-pink px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-pink/90"
                >
                  Empezar con este plan
                </Link>
              </div>
            );
          })}
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

      {/* NUEVO: Banner hacia el programa empresarial */}
      <section className="bg-brand-blue">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 py-12 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-white">
              ¿Buscas capacitar a tu equipo?
            </h2>
            <p className="mt-2 max-w-xl text-white/80">
              Llevamos educación vial y manejo defensivo a empresas, con un
              plan que se ajusta al tamaño de tu grupo.
            </p>
          </div>
          <Link
            href="/empresas"
            className="shrink-0 rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Conoce el programa empresarial
          </Link>
        </div>
      </section>

      {/* CTA final */}
      <section className="mx-auto max-w-6xl px-4 py-16 text-center">
        <h2 className="font-display text-3xl font-bold text-brand-blue">
          ¿Todo listo para empezar?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-neutral-text/80">

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