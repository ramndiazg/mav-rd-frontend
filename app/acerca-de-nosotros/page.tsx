type BloqueContenido = { clave: string; valor: string };

async function obtenerContenido() {
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
    // Si el backend no responde, la página igual se muestra con los
    // placeholders de abajo en vez de romperse por completo.
    return {};
  }
}

export default async function AcercaDeNosotrosPage() {
  const contenido = await obtenerContenido();

  const historia =
    contenido.acerca_de_historia ||
    "[Placeholder] Mujeres al Volante RD nació el 25 de noviembre de 2017 en Santo Domingo, de la mano de María Díaz, con la meta de cerrar una brecha muy concreta: muchas mujeres dominicanas llegaban a la adultez sin haber aprendido a conducir, no por falta de interés, sino por falta de un espacio pensado para ellas — a su ritmo, sin presión, y entre mujeres.";

  const fundadora =
    contenido.acerca_de_fundadora ||
    "[Placeholder] Biografía breve de la fundadora — trayectoria, motivación personal para crear la fundación, y visión a futuro. Reemplazar con el texto real y una foto oficial en alta resolución.";

  const frase = contenido.acerca_de_frase;

  return (
    <>
      <section className="bg-brand-blue text-white">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <h1 className="font-display text-3xl font-bold sm:text-4xl">
            Acerca de Mujeres al Volante RD
          </h1>
          <p className="mt-4 text-white/85">
            Una fundación, una fundadora, y una idea simple: aprender a
            manejar no debería depender de tener quién te enseñe con
            paciencia.
          </p>
        </div>
      </section>

      <div className="road-divider" />

      {/* Nuestra historia — ahora viene de GET /api/contenido (clave: acerca_de_historia) */}
      <section className="mx-auto max-w-3xl px-4 py-16">
        <h2 className="font-display text-2xl font-bold text-brand-blue">
          Nuestra historia
        </h2>
        <div className="mt-4 space-y-4 text-neutral-text/80">
          <p>{historia}</p>
        </div>
      </section>

      {frase && (
        <section className="bg-neutral-bg">
          <div className="mx-auto max-w-2xl px-4 py-12 text-center">
            <p className="font-display text-xl italic text-brand-blue">
              &ldquo;{frase}&rdquo;
            </p>
          </div>
        </section>
      )}

      {/* Fundadora — ahora viene de GET /api/contenido (clave: acerca_de_fundadora) */}
      <section className="bg-brand-pink-light">
        <div className="mx-auto grid max-w-4xl gap-8 px-4 py-16 sm:grid-cols-[200px_1fr] sm:items-start">
          <div className="aspect-square w-full max-w-[200px] rounded-2xl bg-brand-blue/10" />
          <div>
            <p className="font-display text-sm font-semibold uppercase tracking-wide text-brand-pink">
              Fundadora
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold text-brand-blue">
              María Díaz
            </h2>
            <p className="mt-3 text-neutral-text/80">{fundadora}</p>
          </div>
        </div>
      </section>

      <div className="road-divider" />

      {/* Misión y visión — TODAVÍA NO conectadas a contenidoPagina, porque no
          hay claves sembradas para esto. Si se quiere que la fundadora también
          las edite, hay que crear los bloques "mision" y "vision" desde el
          panel (botón "+ Nuevo bloque de contenido") y luego cablear esta
          sección igual que las de arriba. */}
      <section className="mx-auto max-w-4xl px-4 py-16">
        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <h2 className="font-display text-xl font-bold text-brand-blue">
              Misión
            </h2>
            <p className="mt-3 text-neutral-text/80">
              Enseñar a mujeres dominicanas a conducir con
              confianza y seguridad, a través de un curso teórico-práctico
              accesible, presencial y sin costo de inscripción hasta la
              confirmación del pago en efectivo.
            </p>
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-brand-blue">
              Visión
            </h2>
            <p className="mt-3 text-neutral-text/80">
              Ser la referencia dominicana de educación vial
              para mujeres, expandiendo el programa a más provincias del
              país.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}