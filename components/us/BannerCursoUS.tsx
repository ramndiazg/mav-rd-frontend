"use client";

import { useState } from "react";
import Image from "next/image";

// NUEVO (28/10/2026): banner de la tarjeta de Driver Prep USA en el Home.
// Muestra la imagen del curso (public/inscripcion/teoria-6.jpg, junto a las
// de los demás cursos). Si el archivo no existe o no carga (por ejemplo, tiene
// otro nombre), se dibuja un banner de reserva con CSS en vez de dejar una
// imagen rota. Es un componente cliente solo para poder reaccionar al error.
export default function BannerCursoUS({ src, alt }: { src: string; alt: string }) {
  const [fallo, setFallo] = useState(false);

  if (!fallo) {
    return (
      <div className="relative h-40 w-full">
        <Image
          src={src}
          alt={alt}
          fill
          // Igual que las demás tarjetas: anclada a la izquierda para que el
          // recorte se coma el margen "seguro" de la derecha.
          className="object-cover object-left"
          onError={() => setFallo(true)}
        />
      </div>
    );
  }

  return (
    <div className="flex h-40 w-full flex-col justify-between bg-gradient-to-br from-brand-blue to-brand-blue-light p-5 text-white">
      <p className="font-display text-sm font-semibold text-brand-yellow">🇺🇸 Para hispanos en EE. UU.</p>
      <div>
        <p className="font-display text-2xl font-bold">{alt}</p>
        <p className="mt-2 flex gap-2 text-xs font-semibold">
          {["NY", "NJ", "FL", "MA"].map((estado) => (
            <span key={estado} className="rounded bg-white/20 px-1.5 py-0.5">
              {estado}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}