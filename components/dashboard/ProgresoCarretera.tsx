"use client";

type Progreso = {
  sesionActualDesbloqueada: number;
  sesionesAprobadas: number[];
  cursoCompletado: boolean;
};

// Posiciones X fijas dentro del viewBox de 680 — deben coincidir con los
// íconos dibujados más abajo.
const X = { inicio: 39, s1: 166, s2: 282, s3: 398, practica: 514, diploma: 630 };

const COLOR_APROBADA = "#4A7FC9"; // brand-blueLight
const COLOR_PENDIENTE = "#9CA3AF"; // gris neutro
const COLOR_CHECK = "#2F9E44"; // status-success
const COLOR_CARRO = "#D6336C"; // brand-pink

function Libro({ x, aprobada }: { x: number; aprobada: boolean }) {
  const color = aprobada ? COLOR_APROBADA : COLOR_PENDIENTE;
  return (
    <g transform={`translate(${x},70)`}>
      <rect x="-12" y="-10" width="24" height="20" rx="2" fill={color} stroke="#1a1a1a" strokeWidth="1.5" />
      <line x1="0" y1="-10" x2="0" y2="10" stroke="#1a1a1a" strokeWidth="1" />
      {aprobada && (
        <>
          <circle cx="14" cy="-14" r="8" fill={COLOR_CHECK} />
          <path
            d="M9,-14 L13,-10 L20,-19"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
    </g>
  );
}

export default function ProgresoCarretera({
  progreso,
  diplomaListo = false,
}: {
  progreso: Progreso;
  diplomaListo?: boolean;
}) {
  const aprobadas = progreso.sesionesAprobadas.length;
  // Si ya se generó el diploma, el carrito llega hasta el final. Si no,
  // se queda en la última parada según cuántas sesiones lleva aprobadas
  // (0 a 3 → Inicio, Sesión 1, Sesión 2, Práctica).
  const carroX = diplomaListo
    ? X.diploma
    : [X.inicio, X.s1, X.s2, X.practica][Math.min(aprobadas, 3)];
  const colorBandera = diplomaListo ? COLOR_APROBADA : COLOR_PENDIENTE;

  return (
    <div className="mb-8">
      <p className="text-center text-xs font-medium text-brand-blue mb-2">
        {diplomaListo ? "¡Diploma listo!" : `${aprobadas} de 3 sesiones aprobadas`}
      </p>

      <svg viewBox="0 0 680 130" className="w-full h-auto" role="img" aria-label="Progreso del curso">
        {/* Carretera de asfalto */}
        <rect x="20" y="96" width="640" height="30" rx="4" fill="#1a1a1a" />

        {/* Línea central intermitente de principio a fin */}
        <line
          x1="55"
          y1="111"
          x2="615"
          y2="111"
          stroke="#F2C230"
          strokeWidth="2.5"
          strokeDasharray="12 8"
        />
        {/* Zona de no rebasar: línea continua pegada, desde la mitad hasta el final */}
        <line x1="340" y1="106" x2="615" y2="106" stroke="#F2C230" strokeWidth="2" />

        {/* Línea de arrancada (patrón a cuadros) */}
        <rect x="34" y="96" width="10" height="10" fill="#ffffff" />
        <rect x="44" y="106" width="10" height="10" fill="#ffffff" />
        <rect x="34" y="116" width="10" height="10" fill="#ffffff" />
        <rect x="44" y="96" width="10" height="10" fill="#2c2c2a" />
        <rect x="34" y="106" width="10" height="10" fill="#2c2c2a" />
        <rect x="44" y="116" width="10" height="10" fill="#2c2c2a" />

        {/* Libros: Sesión 1, 2, 3 */}
        <Libro x={X.s1} aprobada={progreso.sesionesAprobadas.includes(1)} />
        <Libro x={X.s2} aprobada={progreso.sesionesAprobadas.includes(2)} />
        <Libro x={X.s3} aprobada={progreso.sesionesAprobadas.includes(3)} />

        {/* Guía (práctica en vehículo) — siempre neutro, no se rastrea en la app */}
        <g transform={`translate(${X.practica},70)`}>
          <circle cx="0" cy="-16" r="6" fill={COLOR_PENDIENTE} stroke="#1a1a1a" strokeWidth="1.5" />
          <path
            d="M-9,10 C-9,-2 9,-2 9,10 Z"
            fill={COLOR_PENDIENTE}
            stroke="#1a1a1a"
            strokeWidth="1.5"
          />
        </g>

        {/* Bandera de meta — diploma */}
        <g transform={`translate(${X.diploma},58)`}>
          <line x1="0" y1="0" x2="0" y2="53" stroke="#5f5e5a" strokeWidth="2" />
          <rect x="0" y="0" width="7" height="6" fill="#5f5e5a" />
          <rect x="7" y="0" width="7" height="6" fill={colorBandera} />
          <rect x="14" y="0" width="7" height="6" fill="#5f5e5a" />
          <rect x="0" y="6" width="7" height="6" fill={colorBandera} />
          <rect x="7" y="6" width="7" height="6" fill="#5f5e5a" />
          <rect x="14" y="6" width="7" height="6" fill={colorBandera} />
          <rect x="0" y="12" width="7" height="6" fill="#5f5e5a" />
          <rect x="7" y="12" width="7" height="6" fill={colorBandera} />
          <rect x="14" y="12" width="7" height="6" fill="#5f5e5a" />
          {diplomaListo && (
            <>
              <circle cx="30" cy="-6" r="8" fill={COLOR_CHECK} />
              <path
                d="M25,-6 L29,-2 L36,-11"
                fill="none"
                stroke="#ffffff"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}
        </g>

        {/* Carrito, en la posición actual de la estudiante */}
        <g transform={`translate(${carroX},100)`}>
          <rect x="-22" y="-9" width="44" height="18" rx="8" fill={COLOR_CARRO} />
          <circle cx="-10" cy="11" r="6" fill="#2c2c2a" />
          <circle cx="10" cy="11" r="6" fill="#2c2c2a" />
        </g>
      </svg>

      <div className="flex justify-between text-[10px] sm:text-xs text-neutral-text mt-1 px-1">
        <span>Inicio</span>
        <span>Sesión 1</span>
        <span>Sesión 2</span>
        <span>Sesión 3</span>
        <span>Práctica</span>
        <span>Diploma</span>
      </div>
    </div>
  );
}