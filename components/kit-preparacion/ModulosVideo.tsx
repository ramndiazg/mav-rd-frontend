"use client";

import { useState } from "react";

type Modulo = {
  numero: number;
  titulo: string;
  youtubeId: string;
};

export default function ModulosVideo({ modulos }: { modulos: Modulo[] }) {
  const [abierto, setAbierto] = useState<number | null>(null);

  return (
    <div className="grid gap-3">
      {modulos.map((m) => {
        const estaAbierto = abierto === m.numero;
        return (
          <div
            key={m.numero}
            className="rounded-lg border border-neutral-bg bg-white overflow-hidden"
          >
            <button
              onClick={() => setAbierto(estaAbierto ? null : m.numero)}
              className="w-full flex items-center gap-4 p-4 text-left hover:bg-brand-pinkLight transition-colors"
              aria-expanded={estaAbierto}
            >
              <img
                src={`https://img.youtube.com/vi/${m.youtubeId}/mqdefault.jpg`}
                alt=""
                className="w-24 h-14 object-cover rounded shrink-0"
                loading="lazy"
              />
              <span className="flex-1 text-sm font-medium text-neutral-text">
                Modulo {m.numero}: {m.titulo}
              </span>
              <span
                className={`text-brand-blue transition-transform ${estaAbierto ? "rotate-180" : ""}`}
              >
                v
              </span>
            </button>

            {estaAbierto && (
              <div className="aspect-video">
                <iframe
                  src={`https://www.youtube.com/embed/${m.youtubeId}?wmode=opaque`}
                  title={`Modulo ${m.numero}: ${m.titulo}`}
                  className="w-full h-full"
                  allowFullScreen
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
