import { apiFetch } from "@/lib/api";

type Faq = {
  _id: string;
  pregunta: string;
  respuesta: string;
  orden: number;
  activo: boolean;
};

async function obtenerFaqs(): Promise<{ faqs: Faq[]; error: boolean }> {
  try {
    const faqs = await apiFetch<Faq[]>("/faqs", {
      next: { revalidate: 60 },
    });
    return { faqs: [...faqs].sort((a, b) => a.orden - b.orden), error: false };
  } catch {
    return { faqs: [], error: true };
  }
}

export default async function FaqPage() {
  const { faqs, error } = await obtenerFaqs();

  return (
    <section className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-display text-3xl font-bold text-brand-blue">
        Preguntas Frecuentes
      </h1>
      <p className="mt-3 text-neutral-text/80">
        Si tu duda no está aquí, escríbenos y con gusto te ayudamos.
      </p>

      {error ? (
        <p className="mt-10 rounded-xl bg-brand-pink-light p-6 text-sm text-neutral-text/80">
          No pudimos cargar las preguntas frecuentes en este momento. Si el
          sitio lleva un rato sin visitas, el servidor puede tardar unos
          segundos en despertar — intenta recargar la página en un momento.
        </p>
      ) : faqs.length === 0 ? (
        <p className="mt-10 rounded-xl border border-brand-blue/10 bg-white p-6 text-sm text-neutral-text/70">
          Todavía no hay preguntas frecuentes publicadas. Vuelve a revisar
          pronto.
        </p>
      ) : (
        <div className="mt-10 space-y-3">
          {faqs.map((faq) => (
            <details
              key={faq._id}
              className="group rounded-xl border border-brand-blue/10 bg-white p-5 open:shadow-sm"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between font-display text-base font-semibold text-brand-blue">
                {faq.pregunta}
                <span className="ml-4 text-brand-pink transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-neutral-text/80">
                {faq.respuesta}
              </p>
            </details>
          ))}
        </div>
      )}
    </section>
  );
}