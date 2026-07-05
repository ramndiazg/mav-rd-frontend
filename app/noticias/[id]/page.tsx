import { notFound } from "next/navigation";
import NoticiaAcciones from "@/components/noticias/NoticiaAcciones";
import CompartirBotones from "@/components/noticias/CompartirBotones";

type Comentario = {
  _id: string;
  userId?: { _id: string; nombre: string; apellido: string };
  texto: string;
  fecha: string;
};

type Noticia = {
  _id: string;
  titulo: string;
  contenido: string;
  imagenUrl?: string;
  videoEmbedUrl?: string;
  autorId?: { _id: string; nombre: string; apellido: string };
  likes: string[];
  comentarios: Comentario[];
  createdAt: string;
};

async function obtenerNoticia(id: string): Promise<Noticia | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/noticias/${id}`, {
      next: { revalidate: 60 },
    });
    const json = await res.json();
    if (!json.success) return null;
    return json.data;
  } catch {
    return null;
  }
}

function formatearFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString("es-DO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function NoticiaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const noticia = await obtenerNoticia(id);

  if (!noticia) {
    notFound();
  }

  return (
    <main className="bg-neutral-bg min-h-screen px-6 py-16">
      <article className="max-w-2xl mx-auto bg-white rounded-xl overflow-hidden">
        {noticia.imagenUrl && (
          <img
            src={noticia.imagenUrl}
            alt={noticia.titulo}
            className="w-full h-64 object-cover"
          />
        )}

        <div className="p-6 md:p-10">
          <p className="text-xs text-brand-pink font-medium mb-2">
            {formatearFecha(noticia.createdAt)}
            {noticia.autorId && ` - ${noticia.autorId.nombre} ${noticia.autorId.apellido}`}
          </p>

          <h1 className="font-display text-2xl md:text-3xl font-bold text-brand-blue mb-6">
            {noticia.titulo}
          </h1>

          <div
            className="prose prose-neutral max-w-none mb-6"
            dangerouslySetInnerHTML={{ __html: noticia.contenido }}
          />

          {noticia.videoEmbedUrl && (
            <div className="aspect-video mb-6">
              <iframe
                src={noticia.videoEmbedUrl}
                title={noticia.titulo}
                className="w-full h-full rounded-lg"
                allowFullScreen
              />
            </div>
          )}

          <CompartirBotones titulo={noticia.titulo} />

          <div className="road-divider my-8"></div>

          <NoticiaAcciones
            noticiaId={noticia._id}
            totalLikesInicial={noticia.likes?.length ?? 0}
            comentariosIniciales={noticia.comentarios ?? []}
          />
        </div>
      </article>
    </main>
  );
}
