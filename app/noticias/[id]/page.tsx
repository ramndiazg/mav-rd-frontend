import Link from "next/link";

type Autor = {
  _id: string;
  nombre: string;
  apellido: string;
};

type Noticia = {
  _id: string;
  titulo: string;
  contenido: string;
  imagenUrl?: string;
  autorId?: Autor;
  likes: string[];
  comentarios: { _id: string }[];
  createdAt: string;
};

const POR_PAGINA = 9;

async function obtenerNoticias(
  pagina: number,
): Promise<{ datos: Noticia[]; totalPaginas: number; error: boolean }> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/noticias?page=${pagina}&limit=${POR_PAGINA}`,
      { next: { revalidate: 60 } },
    );
    const json = await res.json();
    if (!json.success) return { datos: [], totalPaginas: 1, error: true };
    return {
      datos: json.data,
      totalPaginas: json.paginacion?.totalPaginas || 1,
      error: false,
    };
  } catch {
    return { datos: [], totalPaginas: 1, error: true };
  }
}

function resumen(html: string, maxCaracteres = 160) {
  const texto = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return texto.length > maxCaracteres ? texto.slice(0, maxCaracteres) + "..." : texto;
}

function formatearFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString("es-DO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export const metadata = {
  title: "Noticias | Mujeres al Volante RD",
};

export default async function NoticiasPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const paginaActual = Math.max(1, Number(searchParams?.page) || 1);
  const { datos: noticias, totalPaginas, error } = await obtenerNoticias(paginaActual);

  return (
    <main className="bg-neutral-bg min-h-screen px-6 py-16">
      <div className="max-w-5xl mx-auto">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-brand-blue mb-2">
          Noticias
        </h1>
        <p className="text-neutral-text mb-10">
          Novedades, historias y actividades de Mujeres al Volante RD.
        </p>

        {error && (
          <div className="rounded-lg bg-brand-pinkLight border border-brand-pink p-4 text-brand-blue">
            No pudimos cargar las noticias en este momento. Intenta de nuevo en unos minutos.
          </div>
        )}

        {!error && noticias.length === 0 && (
          <div className="rounded-lg bg-white border border-neutral-bg p-8 text-center text-neutral-text">
            Todavia no hay noticias publicadas.
          </div>
        )}

        {!error && noticias.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {noticias.map((n) => (
              <Link
                key={n._id}
                href={`/noticias/${n._id}`}
                className="rounded-xl bg-white overflow-hidden border border-neutral-bg hover:shadow-lg transition-shadow flex flex-col"
              >
                {n.imagenUrl && (
                  <img
                    src={n.imagenUrl}
                    alt={n.titulo}
                    className="w-full h-40 object-cover"
                  />
                )}
                <div className="p-5 flex flex-col flex-1">
                  <p className="text-xs text-brand-pink font-medium mb-1">
                    {formatearFecha(n.createdAt)}
                  </p>
                  <h2 className="font-display font-semibold text-lg text-brand-blue mb-2">
                    {n.titulo}
                  </h2>
                  <p className="text-sm text-neutral-text flex-1">
                    {resumen(n.contenido)}
                  </p>
                  <div className="mt-4 flex items-center gap-4 text-xs text-neutral-text">
                    <span>{n.likes?.length ?? 0} me gusta</span>
                    <span>{n.comentarios?.length ?? 0} comentarios</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!error && totalPaginas > 1 && (
          <nav
            aria-label="Paginación de noticias"
            className="flex items-center justify-center gap-1.5 mt-10 flex-wrap"
          >
            <Link
              href={`/noticias?page=${Math.max(1, paginaActual - 1)}`}
              aria-disabled={paginaActual === 1}
              className={`text-sm px-3 py-1.5 rounded-lg border border-neutral-bg ${paginaActual === 1
                ? "pointer-events-none opacity-40"
                : "hover:border-brand-blueLight"
                }`}
            >
              ← Anterior
            </Link>

            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`/noticias?page=${p}`}
                className={`text-sm px-3 py-1.5 rounded-lg border ${p === paginaActual
                  ? "border-brand-blue bg-brand-blue text-white"
                  : "border-neutral-bg text-neutral-text hover:border-brand-blueLight"
                  }`}
              >
                {p}
              </Link>
            ))}

            <Link
              href={`/noticias?page=${Math.min(totalPaginas, paginaActual + 1)}`}
              aria-disabled={paginaActual === totalPaginas}
              className={`text-sm px-3 py-1.5 rounded-lg border border-neutral-bg ${paginaActual === totalPaginas
                ? "pointer-events-none opacity-40"
                : "hover:border-brand-blueLight"
                }`}
            >
              Siguiente →
            </Link>
          </nav>
        )}
      </div>
    </main>
  );
}