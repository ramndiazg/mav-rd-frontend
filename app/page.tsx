import Image from "next/image";
import Link from "next/link";
import {
  Eye,
  Brain,
  ShieldCheck,
  Gauge,
  AlertTriangle,
  Users,
  Car,
  Building2,
  Flag,
} from "lucide-react";

type BloqueContenido = { clave: string; valor: string };

async function obtenerContenidoInicio() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contenido`, {
      cache: "no-store",
    });
    const json = await res.json();
    if (!json.success) return {};

    const mapa: Record<string, string> = {};
    json.data.forEach((b: BloqueContenido) => {
      mapa[b.clave] = b.valor;
    });
    return mapa;
  } catch {
    return {};
  }
}

const sesiones = [
  {
    numero: "01",
    titulo: "Bienvenida y Cultura Vial",
    detalle:
      "Por qué manejar es una responsabilidad con la vida de todos — valores, cultura vial y el factor humano detrás del volante.",
  },
  {
    numero: "02",
    titulo: "Marco Legal y Señalización",
    detalle:
      "La Ley 63-17, las señales de tránsito y los límites que existen para protegerte, no para limitarte.",
  },
  {
    numero: "03",
    titulo: "El Vehículo: Mecánica y Seguridad",
    detalle:
      "Cómo funciona tu vehículo por dentro, sus sistemas de seguridad, y cómo mantenerlo en condiciones seguras.",
  },
  {
    numero: "04",
    titulo: "Técnicas de Conducción",
    detalle:
      "Maniobras, conducción defensiva y cómo reaccionar ante condiciones adversas o emergencias en la vía.",
  },
];

const categorias = [
  {
    valor: "estandar",
    etiqueta: "Categoría 02 — Teoría + práctica",
    nombre: "Vehículos Livianos",
    detalle:
      "El curso completo de Muvo: teoría, práctica de manejo con instructor y diploma. Para quienes manejan un vehiculo por primera vez.",
    imagen: "/inscripcion/teoria-1.jpg",
    href: "#curso-estandar",
    cta: "Ver este curso",
  },
  {
    valor: "motorizados",
    etiqueta: "Categoría 01 — Solo teoría",
    nombre: "Motocicletas",
    detalle:
      "La teoría completa de la Ley 63-17 para conductores de motocicleta, en 4 sesiones con exámenes y diploma.",
    imagen: "/inscripcion/teoria-2.jpg",
    href: "/inscripcion?programa=motorizados",
    cta: "Empezar este curso",
  },
  {
    valor: "pesados",
    etiqueta: "Categoría 03/04 — Solo teoría",
    nombre: "Vehículos Pesados",
    detalle:
      "Para conductores de camiones y trailers — la misma teoría que exige el INTRANT, en 4 sesiones con exámenes y diploma.",
    imagen: "/inscripcion/teoria-3.jpg",
    href: "/inscripcion?programa=pesados",
    cta: "Empezar este curso",
  },
];

// NUEVO (17/09/2026): los 5 pilares del manejo preventivo/defensivo, tal
// como los usa la fundadora en su material de difusión (volante propio) —
// se llevan al home para explicar "por qué Muvo" antes de que la persona
// llegue a comparar planes.
const pilaresPreventivos = [
  { titulo: "Observa", detalle: "Tu entorno, siempre.", icono: Eye },
  { titulo: "Anticipa", detalle: "Los riesgos antes de que ocurran.", icono: Brain },
  {
    titulo: "Mantén distancia",
    detalle: "El espacio que te da tiempo de reaccionar.",
    icono: ShieldCheck,
  },
  {
    titulo: "Controla la velocidad",
    detalle: "Ajustada a la vía, no al reloj.",
    icono: Gauge,
  },
  {
    titulo: "Prepárate",
    detalle: "Para lo inesperado, sin pánico.",
    icono: AlertTriangle,
  },
];

// NUEVO (17/09/2026): misma fuente que pilaresPreventivos — el porqué
// detrás del curso, no solo el qué.
const impacto = [
  { texto: "Conducción responsable", icono: ShieldCheck },
  { texto: "Familias más seguras", icono: Users },
  { texto: "Menos accidentes", icono: Car },
  { texto: "Comunidades más seguras", icono: Building2 },
  { texto: "Un mejor país", icono: Flag },
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
      "Las clases son dinamicas, a nuestro ritmo. Eso cambió todo — pude preguntar lo que en otro lado me daba pena preguntar.",
  },
];

type Plan = {
  codigo: string;
  programa: "estandar" | "motorizados" | "pesados";
  nombre: string;
  precio: number;
  fraseDestacada: string;
  orden: number;
};

// Se pide en cada visita (no se cachea): el precio puede cambiar sin que
// haya un nuevo despliegue del frontend, ya que vive en la base de datos.
async function obtenerPlanes(programa: string = "estandar"): Promise<Plan[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/planes?programa=${programa}`,
      { cache: "no-store" },
    );
    const json = await res.json();
    return json.success ? json.data : [];
  } catch {
    return [];
  }
}

export default async function Home() {
  const [planes, planesMotorizados, planesPesados, contenido] =
    await Promise.all([
      obtenerPlanes("estandar"),
      obtenerPlanes("motorizados"),
      obtenerPlanes("pesados"),
      obtenerContenidoInicio(),
    ]);

  // Un solo arreglo para pintar las tarjetas de Motorizados/Pesados con
  // el mismo map — cada plan ya trae su propio `programa`, así el link
  // "Ver detalles del plan" no necesita distinguirlos a mano.
  const planesOtrosProgramas = [...planesMotorizados, ...planesPesados];

  const heroTitulo =
    contenido.inicio_hero_titulo ||
    "Todos merecen la oportunidad de aprender a manejar con confianza.";

  const heroTexto =
    contenido.inicio_hero_texto ||
    "Muvo RD Vial es una fundación dominicana que enseña a mujeres y jóvenes a conducir con confianza, desde la teoría hasta el examen del INTRANT — presencial, en grupo, y sin prisa.";

  const desdeTexto =
    contenido.inicio_desde_texto ||
    "Fundada por María Díaz en Santo Domingo, con una idea simple: nadie debería quedarse sin aprender a manejar por falta de un espacio seguro y accesible para hacerlo.";

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-blue to-brand-blue-light text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:py-24 lg:grid-cols-2 lg:items-center">
          <div>
            {/* NUEVO (17/09/2026): tagline fija de marca, tomada del
                volante de la fundadora — no viene de /admin/contenido-pagina
                a propósito, es identidad, no copy editable por campaña. */}
            <div className="mb-5">
              <p className="font-display text-lg font-semibold text-brand-yellow sm:text-xl">
                Conduce con inteligencia, protege vidas
              </p>
              {/* <span className="mt-2 block h-1 w-16 rounded-full bg-brand-yellow" /> */}
            </div>

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
                {heroTitulo}
              </h1>
            </div>
            <p className="mt-5 max-w-lg text-white/85">{heroTexto}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/registro"
                className="rounded-full bg-brand-blue px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-blue/90"
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
              Así empezamos
            </p>
            <p className="mt-3 text-lg leading-relaxed text-white">
              {desdeTexto}
            </p>
          </div>
        </div>
      </section>

      <div className="road-divider" />

      {/* NUEVO (17/09/2026): "por qué Muvo", antes de pedirle a nadie que
          compare planes — inspirada en el volante de la fundadora. Único
          bloque de fondo sólido/borde grueso de la página, a propósito:
          es la sección que debe destacarse del resto. */}
      <section className="border-y-8 border-brand-yellow bg-brand-blue py-16 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-bold">
              Manejo preventivo, manejo defensivo
            </h2>
            <p className="mt-3 text-white/80">
              No enseñamos solo a manejar un vehículo — enseñamos a leer la
              vía antes de que pase algo. Esa es la diferencia que buscamos
              en cada sesión.
            </p>
          </div>

          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
            {pilaresPreventivos.map((pilar, indice) => {
              const Icono = pilar.icono;
              const fondoIcono =
                indice % 2 === 0
                  ? "bg-brand-yellow text-brand-blue"
                  : "bg-white text-brand-blue";
              return (
                <div
                  key={pilar.titulo}
                  className="flex flex-col items-center text-center sm:items-start sm:text-left"
                >
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-full ${fondoIcono}`}
                  >
                    <Icono size={26} />
                  </div>
                  <p className="mt-4 font-display text-base font-semibold">
                    {pilar.titulo}
                  </p>
                  <p className="mt-1 text-sm text-white/70">{pilar.detalle}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="road-divider" />

      {/* Testimonios — MOVIDO (17/09/2026) desde el final de la página.
          Prueba social antes de que la persona llegue a comparar planes,
          no después. Versión corta aquí; la lista completa sigue en
          /testimonios. */}
      <section className="bg-brand-blue-light/10">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="font-display text-3xl font-bold text-brand-blue">
            Lo que dicen quienes ya se sentaron al volante
          </h2>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {testimonios.map((testimonio) => (
              <blockquote
                key={testimonio.nombre}
                className="rounded-xl border-2 border-brand-pink bg-white p-6 shadow-sm"
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

      <div className="road-divider" />

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-bold text-brand-blue">
            ¿Qué licencia de conducir necesitas?
          </h2>
          <p className="mt-3 text-neutral-text/80">
            Elige tu categoría. Cada curso tiene su propio contenido, exámenes
            y diploma — ajustado a lo que en verdad vas a manejar.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {categorias.map((categoria) => (
            <div
              key={categoria.valor}
              className="overflow-hidden rounded-xl border border-brand-blue/10 bg-white shadow-sm transition hover:shadow-md"
            >
              <div className="relative h-40 w-full">
                <Image
                  src={categoria.imagen}
                  alt={categoria.nombre}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <p className="font-display text-xs font-semibold uppercase tracking-wide text-brand-pink">
                  {categoria.etiqueta}
                </p>
                <h3 className="mt-1 font-display text-lg font-bold text-brand-blue">
                  {categoria.nombre}
                </h3>
                <p className="mt-2 text-sm text-neutral-text/75">
                  {categoria.detalle}
                </p>
                <Link
                  href={categoria.href}
                  className="mt-5 inline-block rounded-full bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-blue/90"
                >
                  {categoria.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="road-divider" />

      {/* Las sesiones del curso — sí es una secuencia real, por eso se numera */}
      <section id="curso-estandar" className="mx-auto max-w-6xl px-4 py-16">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-bold text-brand-blue">
            Un curso completo, en sesiones, en orden.
          </h2>
          <p className="mt-3 text-neutral-text/80"></p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {sesiones.map((sesion) => (
            <div
              key={sesion.numero}
              className="overflow-hidden rounded-xl border border-brand-blue/10 bg-white shadow-sm"
            >
              {/* Franja tipo señal de tránsito — amarillo de advertencia
                  con el borde inferior en "mamey", el naranja que se usa
                  en las señales de precaución/trabajo en la vía. */}
              <div className="border-b-4 border-brand-mamey bg-brand-yellow px-6 py-3">
                <span className="font-display text-2xl font-bold text-brand-blue">
                  {sesion.numero}
                </span>
              </div>
              <div className="p-6">
                <h3 className="font-display text-lg font-semibold text-brand-blue">
                  {sesion.titulo}
                </h3>
                <p className="mt-2 text-sm text-neutral-text/75">
                  {sesion.detalle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="road-divider" />

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-bold text-brand-blue">
            Sal manejando con confianza. Tú eliges cómo llegar ahí.
          </h2>
          <p className="mt-3 text-neutral-text/80">
            La teoría más completa y detallada, los mejores instructores
            certificados — hacemos la diferencia con nuestra atención
            personalizada en la práctica de manejo. Elige el plan que se ajuste
            a tu ritmo y presupuesto.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {planes.map((plan) => {
            const destacado = plan.codigo === "vip";

            return (
              <div
                key={plan.codigo}
                className={`rounded-xl border-2 bg-white p-6 shadow-sm transition hover:shadow-md ${destacado ? "border-brand-pink" : "border-brand-blue/10"
                  }`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-display text-2xl font-bold text-brand-blue">
                    {plan.nombre}
                  </h3>
                  {destacado && (
                    <span className="shrink-0 rounded-full bg-brand-yellow px-3 py-1 text-xs font-semibold text-brand-blue">
                      Más completo
                    </span>
                  )}
                </div>

                {/* CORREGIDO (17/09/2026): antes se mostraba el precio aquí
                    mismo — se quita a propósito: mostrarlo tan temprano, antes
                    de que la persona conozca el plan, no es lo mejor. El
                    precio real se ve en /inscripcion al elegir el plan. */}
                <p className="mt-3 text-base font-medium text-neutral-text/80">
                  {plan.fraseDestacada}
                </p>

                <Link
                  href={`/inscripcion?programa=estandar&plan=${plan.codigo}`}
                  className="mt-6 inline-block rounded-full bg-brand-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-blue/90"
                >
                  Ver detalles del plan
                </Link>
              </div>
            );
          })}
        </div>

        {planesOtrosProgramas.length > 0 && (
          <div className="mt-10 border-t border-brand-blue/10 pt-10">
            <p className="font-display text-sm font-semibold uppercase tracking-wide text-brand-pink">
              ¿Deseas manejar moto o vehículo pesado? También tenemos tu curso
            </p>

            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              {planesOtrosProgramas.map((plan) => (
                <div
                  key={`${plan.programa}-${plan.codigo}`}
                  className="rounded-xl border-2 border-brand-blue/10 bg-white p-6 shadow-sm transition hover:shadow-md"
                >
                  <h3 className="font-display text-2xl font-bold text-brand-blue">
                    {plan.nombre}
                  </h3>

                  <p className="mt-3 text-base font-medium text-neutral-text/80">
                    {plan.fraseDestacada}
                  </p>

                  <Link
                    href={`/inscripcion?programa=${plan.programa}&plan=${plan.codigo}`}
                    className="mt-6 inline-block rounded-full bg-brand-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-blue/90"
                  >
                    Ver detalles del plan
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <div className="road-divider" />

      {/* Libro de la fundadora */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-8 rounded-2xl border-2 border-brand-pink bg-white p-6 sm:grid-cols-[auto_1fr] sm:items-center sm:p-10">
          <div className="mx-auto flex h-52 w-36 shrink-0 items-center justify-center rounded-lg bg-brand-blue text-center shadow-md sm:mx-0">
            <Image
              src="/libro-maria-diaz.jpg"
              alt="Portada del libro de María Díaz"
              width={144}
              height={208}
              className="h-full w-full rounded-lg object-cover"
            />
          </div>

          <div>
            <p className="font-display text-sm font-semibold uppercase tracking-wide text-brand-pink">
              Escrito por nuestra fundadora
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold text-brand-blue sm:text-3xl">
              Cómo protegerte de un conductor temerario
            </h2>
            <p className="mt-3 text-neutral-text/80">
              María Díaz —auditora y magíster en seguridad vial— convirtió años
              de trabajo en la vía en una guía práctica sobre cómo anticiparte
              al peligro y proteger tu vida y la de los demás. El mismo enfoque
              de conducción preventiva que aprendes en Muvo, ahora en un libro
              para profundizar a tu ritmo.
            </p>
            <p className="mt-3 border-l-4 border-brand-yellow pl-4 text-sm italic text-brand-blue">
              “Más que conductores somos vidas en movimiento, anticiparse y
              protegerse salva vidas…”
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="https://www.amazon.com/dp/B0H85GFK1M"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-brand-blue px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-blue/90"
              >
                Comprar en Amazon
              </a>

              <a
                href="https://www.amazon.com/dp/B0H85CRBR9"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-brand-yellow px-6 py-3 text-sm font-semibold text-brand-blue transition hover:bg-brand-yellow/90"
              >
                Versión Kindle
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Banner hacia el programa escolar (NUEVO 17/09/2026) — misma idea que
          el banner empresarial de abajo, para que /escolar también tenga un
          punto de entrada visible desde la portada. */}
      <section className="bg-brand-mamey">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 py-12 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-white">
              ¿Eres parte de un colegio?
            </h2>
            <p className="mt-2 max-w-xl text-white/85">
              Llevamos el curso de teoría vial a tus estudiantes, organizados
              por grado y sección, con un precio que se ajusta a la cantidad de
              alumnos.
            </p>
          </div>
          <Link
            href="/escolar"
            className="shrink-0 rounded-full bg-brand-yellow px-6 py-3 text-sm font-semibold text-brand-blue transition hover:bg-brand-yellow/90"
          >
            Conoce el programa escolar
          </Link>
        </div>
      </section>

      {/* Banner hacia el programa empresarial */}
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
            className="shrink-0 rounded-full bg-brand-yellow px-6 py-3 text-sm font-semibold text-brand-blue transition hover:bg-brand-yellow/90"
          >
            Conoce el programa empresarial
          </Link>
        </div>
      </section>

      {/* Impacto — NUEVO (17/09/2026), misma fuente que la sección de
          pilares: por qué importa esto más allá del examen del INTRANT. */}
      <section className="bg-white py-14">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-8 sm:grid-cols-5">
            {impacto.map((item) => {
              const Icono = item.icono;
              return (
                <div
                  key={item.texto}
                  className="flex flex-col items-center gap-3 text-center"
                >
                  <Icono size={28} className="text-brand-blue" />
                  <p className="text-sm font-medium text-neutral-text">
                    {item.texto}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* NUEVO (17/09/2026): frase de marca, tal como la usa la fundadora
          en su volante — banner corto, sin recargar. */}
      <section className="bg-brand-yellow">
        <div className="mx-auto max-w-4xl px-4 py-10 text-center">
          <p className="font-display text-xl font-bold text-brand-blue sm:text-2xl">
            Somos embajadores de la educación vial familiar
          </p>
          <span className="mx-auto mt-3 block h-1 w-20 rounded-full bg-brand-blue" />
        </div>
      </section>

      {/* CTA final */}
      <section className="mx-auto max-w-6xl px-4 py-16 text-center">
        <h2 className="font-display text-3xl font-bold text-brand-blue">
          ¿Todo listo para empezar?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-neutral-text/80">
          Crea tu cuenta, elige tu plan y empieza cuando quieras — a tu
          ritmo, sin prisa.
        </p>
        {/* NUEVO (17/09/2026): cierre con el acento manuscrito
            (--font-script, ver globals.css) — la frase del volante de la
            fundadora, único lugar de la página donde se usa esta tipografía. */}
        <p
          style={{ fontFamily: "var(--font-script)" }}
          className="mt-4 text-2xl text-brand-pink"
        >
          Hoy conduces mejor, mañana hay más historias.
        </p>
        <Link
          href="/registro"
          className="mt-6 inline-block rounded-full bg-brand-blue px-8 py-3 text-sm font-semibold text-white transition hover:bg-brand-blue/90"
        >
          Crear cuenta gratis
        </Link>
      </section>
    </>
  );
}