import { apiFetch } from "@/lib/api";

type Testimonio = {
  _id: string;
  nombre: string;
  texto: string;
  fotoUrl?: string;
  orden: number;
  activo: boolean;
};

async function obtenerTestimonios(): Promise<{
  testimonios: Testimonio[];
  error: boolean;
}> {
  try {
    const testimonios = await apiFetch<Testimonio[]>("/testimonios", {
      next: { revalidate: 60 },
    });
    return {
      testimonios: [...testimonios].sort((a, b) => a.orden - b.orden),
      error: false,
    };
  } catch {
    return { testimonios: [], error: true };
  }
}

function Iniciales({ nombre }: { nombre: string }) {
  const iniciales = nombre
    .split(" ")
    .map((parte) => parte[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-blue font-display text-sm font-semibold text-white">
      {iniciales}
    </div>
  );
}

export default async function TestimoniosPage() {
  const { testimonios, error } = await obtenerTestimonios();

  return (
    <section className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="font-display text-3xl font-bold text-brand-blue">
        Testimonios
      </h1>
      <p className="mt-3 max-w-2xl text-neutral-text/80">
        Historias reales de mujeres que decidieron aprender a manejar con
        nosotras.
      </p>

      {error ? (
        <p className="mt-10 rounded-xl bg-brand-pink-light p-6 text-sm text-neutral-text/80">
          No pudimos cargar los testimonios en este momento. Si el sitio
          lleva un rato sin visitas, el servidor puede tardar unos segundos
          en despertar — intenta recargar la página en un momento.
        </p>
      ) : testimonios.length === 0 ? (
        <p className="mt-10 rounded-xl border border-brand-blue/10 bg-white p-6 text-sm text-neutral-text/70">
          Todavía no hay testimonios publicados. Vuelve a revisar pronto.
        </p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {testimonios.map((testimonio) => (
            <blockquote
              key={testimonio._id}
              className="flex gap-4 rounded-xl border border-brand-blue/10 bg-white p-6 shadow-sm"
            >
              {testimonio.fotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={testimonio.fotoUrl}
                  alt={testimonio.nombre}
                  className="h-12 w-12 shrink-0 rounded-full object-cover"
                />
              ) : (
                <Iniciales nombre={testimonio.nombre} />
              )}
              <div>
                <p className="text-neutral-text/85">&quot;{testimonio.texto}&quot;</p>
                <footer className="mt-3 font-display text-sm font-semibold text-brand-blue">
                  — {testimonio.nombre}
                </footer>
              </div>
            </blockquote>
          ))}
        </div>
      )}
    </section>
  );
}