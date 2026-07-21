"use client";

export default function CompartirBotones({ titulo }: { titulo: string }) {
  function compartir(destino: "facebook" | "whatsapp" | "x") {
    const url = window.location.href;
    const texto = encodeURIComponent(titulo);
    const enlaces = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      whatsapp: `https://wa.me/?text=${texto}%20${encodeURIComponent(url)}`,
      x: `https://twitter.com/intent/tweet?text=${texto}&url=${encodeURIComponent(url)}`,
    };
    window.open(enlaces[destino], "_blank", "noopener,noreferrer");
  }

  async function compartirNativo() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: titulo, url });
      } catch {
        // La usuaria cancelo el dialogo de compartir, no hacemos nada aqui.
      }
    } else {
      await navigator.clipboard.writeText(url);
      alert("Link copiado al portapapeles");
    }
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="text-sm text-neutral-text">Compartir:</span>
      <button
        onClick={() => compartir("facebook")}
        className="text-sm px-3 py-1.5 rounded-full bg-neutral-bg hover:bg-brand-pinkLight transition-colors"
      >
        Facebook
      </button>
      <button
        onClick={() => compartir("whatsapp")}
        className="text-sm px-3 py-1.5 rounded-full bg-neutral-bg hover:bg-brand-pinkLight transition-colors"
      >
        WhatsApp
      </button>
      <button
        onClick={() => compartir("x")}
        className="text-sm px-3 py-1.5 rounded-full bg-neutral-bg hover:bg-brand-pinkLight transition-colors"
      >
        X
      </button>
      <button
        onClick={compartirNativo}
        className="text-sm px-3 py-1.5 rounded-full bg-brand-blue text-white hover:opacity-90 transition-opacity"
      >
        Otra app
      </button>
    </div>
  );
}
