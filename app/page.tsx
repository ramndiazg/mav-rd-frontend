import Image from "next/image";
import Link from "next/link";

// NUEVO (10/09/2026): el hero y la tarjeta de la derecha ya se podían
// editar desde /admin/contenido-pagina (claves inicio_hero_titulo,
// inicio_hero_texto, inicio_desde_texto — se ven guardadas en Mongo si
// se revisa la colección ContenidoPagina), pero esta página nunca las
// leía: el texto de abajo estaba puesto directo en el JSX como
// placeholder, así que cualquier cambio guardado en el dashboard nunca
// se reflejaba aquí. Mismo bug que ya se había resuelto en
// acerca-de-nosotros/page.tsx (que sí lee /api/contenido) — se replica
// exactamente ese patrón: fetch sin caché, con el texto de siempre como
// fallback si el backend no responde o la clave no existe todavía.
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

// Las 4 sesiones/módulos reales del curso (actualizado 16/08/2026 — antes
// tenía 3 tarjetas con títulos viejos que ya no correspondían a los 4
// módulos de contenido reales que se cargaron en la plataforma).
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

// --- Planes (migración 06/09/2026) ---
// Antes había 2 planes hardcodeados aquí mismo (normal/vip), con el precio
// como único dato que venía del backend (Configuracion). Ahora los 3 planes
// —incluyendo nombre, frase destacada y destacado/no destacado— vienen
// completos de GET /api/planes, para no tener que tocar este archivo cada
// vez que cambie un precio o se agregue/edite un plan.
type Plan = {
  codigo: "fundacion" | "normal" | "vip";
  nombre: string;
  precio: number;
  fraseDestacada: string;
  orden: number;
};

function formatearMonto(valor: number) {
  return `RD$${valor.toLocaleString("es-DO")}`;
}

// Se pide en cada visita (no se cachea): el precio puede cambiar sin que
// haya un nuevo despliegue del frontend, ya que vive en la base de datos.
async function obtenerPlanes(): Promise<Plan[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/planes`, {
      cache: "no-store",
    });
    const json = await res.json();
    return json.success ? json.data : [];
  } catch {
    return [];
  }
}

export default async function Home() {
  const [planes, contenido] = await Promise.all([
    obtenerPlanes(),
    obtenerContenidoInicio(),
  ]);

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
            <p className="mt-5 max-w-lg text-white/85">
              {heroTexto}
            </p>
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
              {/* CAMBIO (10/09/2026): decía "Desde 2017", que sin más
                  contexto no se entendía ni en la página ni en el
                  dashboard de contenido (¿desde 2017 qué?). Es la
                  etiqueta fija de la tarjeta, no viene de /api/contenido
                  (solo el párrafo de abajo es editable) — mismo patrón
                  que los títulos fijos "Misión"/"Visión"/"Valores" en
                  acerca-de-nosotros/page.tsx. */}
              Así empezamos
            </p>
            <p className="mt-3 text-lg leading-relaxed text-white">
              {desdeTexto}
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
              <div className="bg-brand-yellow px-6 py-3 border-b-4 border-brand-mamey">
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

      {/* Planes y precios — resumen. El detalle completo (sesiones de
          práctica, costo de combustible por sesión, características de
          VIP) vive en /inscripcion, no aquí. */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-bold text-brand-blue">
            Sal manejando con confianza. Tú eliges cómo llegar ahí.
          </h2>
          <p className="mt-3 text-neutral-text/80">
            La teoría más completa y detallada, los mejores instructores
            certificados — hacemos la diferencia con nuestra atención
            personalizada en la práctica de manejo. Elige el plan que se
            ajuste a tu ritmo y presupuesto.
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
                  <h3 className="font-display text-xl font-bold text-brand-blue">
                    {plan.nombre}
                  </h3>
                  {destacado && (
                    <span className="shrink-0 rounded-full bg-brand-yellow px-3 py-1 text-xs font-semibold text-brand-blue">
                      Más completo
                    </span>
                  )}
                </div>

                <p className="mt-3 font-display text-3xl font-bold text-brand-blue">
                  {formatearMonto(plan.precio)}
                </p>

                <p className="mt-2 text-sm text-neutral-text/75">
                  {plan.fraseDestacada}
                </p>

                <Link
                  href="/inscripcion"
                  className="mt-6 inline-block rounded-full bg-brand-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-blue/90"
                >
                  Ver detalles del plan
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      <div className="road-divider" />

      {/* Promoción del libro de la fundadora — colocado después de Planes
          (refuerza autoridad justo cuando se evalúa el curso) y antes de
          Testimonios, sin competir con el CTA de inscripción. */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-8 rounded-2xl border-2 border-brand-pink bg-white p-6 sm:grid-cols-[auto_1fr] sm:items-center sm:p-10">
          {/* Portada — reemplazar /libro-maria-diaz.jpg por la portada real
              cuando la tengas (súbela a public/ con ese nombre, o cambia
              la ruta aquí). Mientras tanto queda este marcador visual. */}
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
              María Díaz —auditora y magíster en seguridad vial— convirtió
              años de trabajo en la vía en una guía práctica sobre cómo
              anticiparte al peligro y proteger tu vida y la de los demás.
              El mismo enfoque de conducción preventiva que aprendes en
              Muvo, ahora en un libro para profundizar a tu ritmo.
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

      <div className="road-divider" />

      {/* Testimonios */}
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

      {/* CTA final */}
      <section className="mx-auto max-w-6xl px-4 py-16 text-center">
        <h2 className="font-display text-3xl font-bold text-brand-blue">
          ¿Todo listo para empezar?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-neutral-text/80"></p>
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