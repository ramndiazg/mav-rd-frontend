"use client";

type Props = {
  paginaActual: number;
  totalPaginas: number;
  onCambiarPagina: (pagina: number) => void;
};

// Componente compartido de paginación — usado en Estudiantes, Noticias
// (panel) y Movimientos contables, para que los 3 se vean y se comporten
// igual en vez de reinventar los botones en cada pantalla.
export default function Paginacion({
  paginaActual,
  totalPaginas,
  onCambiarPagina,
}: Props) {
  if (totalPaginas <= 1) return null;

  // Ventana de máximo 5 números alrededor de la página actual, para que no
  // se desborde en pantallas de teléfono si hay muchas páginas.
  const inicio = Math.max(1, Math.min(paginaActual - 2, totalPaginas - 4));
  const finVentana = Math.min(totalPaginas, inicio + 4);
  const numeros: number[] = [];
  for (let p = Math.max(1, inicio); p <= finVentana; p++) numeros.push(p);

  const botonBase =
    "text-sm px-3 py-1.5 rounded-lg border transition-colors";
  const botonInactivo = `${botonBase} border-neutral-bg text-neutral-text hover:border-brand-blueLight`;
  const botonActivo = `${botonBase} border-brand-blue bg-brand-blue text-white`;

  return (
    <div className="flex items-center justify-center gap-1.5 mt-6 flex-wrap">
      <button
        type="button"
        onClick={() => onCambiarPagina(paginaActual - 1)}
        disabled={paginaActual === 1}
        className={`${botonInactivo} disabled:opacity-40 disabled:hover:border-neutral-bg`}
      >
        ← Anterior
      </button>

      {numeros[0] > 1 && (
        <>
          <button
            type="button"
            onClick={() => onCambiarPagina(1)}
            className={botonInactivo}
          >
            1
          </button>
          {numeros[0] > 2 && <span className="text-neutral-text px-1">…</span>}
        </>
      )}

      {numeros.map((p) => (
        <button
          type="button"
          key={p}
          onClick={() => onCambiarPagina(p)}
          className={p === paginaActual ? botonActivo : botonInactivo}
        >
          {p}
        </button>
      ))}

      {numeros[numeros.length - 1] < totalPaginas && (
        <>
          {numeros[numeros.length - 1] < totalPaginas - 1 && (
            <span className="text-neutral-text px-1">…</span>
          )}
          <button
            type="button"
            onClick={() => onCambiarPagina(totalPaginas)}
            className={botonInactivo}
          >
            {totalPaginas}
          </button>
        </>
      )}

      <button
        type="button"
        onClick={() => onCambiarPagina(paginaActual + 1)}
        disabled={paginaActual === totalPaginas}
        className={`${botonInactivo} disabled:opacity-40 disabled:hover:border-neutral-bg`}
      >
        Siguiente →
      </button>
    </div>
  );
}