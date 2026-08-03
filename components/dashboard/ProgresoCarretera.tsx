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

function mensajeMotivacional(progreso: Progreso, diplomaListo: boolean) {
  const aprobadas = progreso.sesionesAprobadas.length;
  if (diplomaListo) return "¡Completaste el curso! Tu diploma ya está listo.";
  if (progreso.cursoCompletado) return "Teoría completa — ahora toca la práctica en carretera.";
  if (aprobadas === 0) return "La Sesión 1 ya te está esperando.";
  if (aprobadas === 1) return "Vas bien — la Sesión 2 ya está disponible.";
  return "Última sesión de teoría — ya casi terminas.";
}

function Libro({ x, aprobada }: { x: number; aprobada: boolean }) {
  const color = aprobada ? COLOR_APROBADA : COLOR_PENDIENTE;
  return (
    <g transform={`translate(${x},70)`}>
      <rect
        x="-12"
        y="-10"
        width="24"
        height="20"
        rx="2"
        fill={color}
        stroke="#1a1a1a"
        strokeWidth="1.5"
        filter="url(#sombraSuave)"
      />
      <line x1="0" y1="-10" x2="0" y2="10" stroke="#1a1a1a" strokeWidth="1" />
      {aprobada && (
        <g className="check-pop" style={{ transformOrigin: "14px -14px" }}>
          <circle cx="14" cy="-14" r="8" fill={COLOR_CHECK} />
          <path
            d="M9,-14 L13,-10 L20,-19"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
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
  const mensaje = mensajeMotivacional(progreso, diplomaListo);

  return (
    <div className="mb-8">
      <p className="text-center text-xs font-medium text-brand-blue mb-1">
        {diplomaListo ? "¡Diploma listo!" : `${aprobadas} de 3 sesiones aprobadas`}
      </p>
      <p
        key={mensaje}
        className="mensaje-motivacional text-center text-sm font-medium text-brand-pink mb-3"
      >
        {mensaje}
      </p>

      <svg viewBox="0 0 680 130" className="w-full h-auto" role="img" aria-label="Progreso del curso">
        <defs>
          <linearGradient id="asfalto" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2c2c2c" />
            <stop offset="100%" stopColor="#141414" />
          </linearGradient>
          <linearGradient id="carroDegradado" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e85585" />
            <stop offset="100%" stopColor={COLOR_CARRO} />
          </linearGradient>
          <filter id="sombraSuave" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="1.2" floodOpacity="0.25" />
          </filter>
          <filter id="sombraCarro" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Sombra ambiental de la carretera */}
        <rect x="20" y="99" width="640" height="30" rx="4" fill="#000000" opacity="0.12" />
        {/* Carretera de asfalto */}
        <rect x="20" y="96" width="640" height="30" rx="4" fill="url(#asfalto)" />

        {/* Línea central: base punteada (todo el trayecto) */}
        <line
          x1="55"
          y1="111"
          x2="615"
          y2="111"
          stroke="#5a5a58"
          strokeWidth="2.5"
          strokeDasharray="12 8"
        />
        {/* Línea central: tramo recorrido, sólida y de color — el camino mismo muestra el avance */}
        <line
          x1="55"
          y1="111"
          x2={carroX}
          y2="111"
          stroke={COLOR_CARRO}
          strokeWidth="3"
          strokeLinecap="round"
          className="progreso-linea"
        />
        {/* Zona de no rebasar: línea continua pegada, desde la mitad hasta el final */}
        <line x1="340" y1="106" x2="615" y2="106" stroke="#F2C230" strokeWidth="2" opacity="0.6" />

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
        <g transform={`translate(${X.practica},70)`} filter="url(#sombraSuave)">
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
          <g className="bandera-flutter">
            <rect x="0" y="0" width="7" height="6" fill="#5f5e5a" />
            <rect x="7" y="0" width="7" height="6" fill={colorBandera} />
            <rect x="14" y="0" width="7" height="6" fill="#5f5e5a" />
            <rect x="0" y="6" width="7" height="6" fill={colorBandera} />
            <rect x="7" y="6" width="7" height="6" fill="#5f5e5a" />
            <rect x="14" y="6" width="7" height="6" fill={colorBandera} />
            <rect x="0" y="12" width="7" height="6" fill="#5f5e5a" />
            <rect x="7" y="12" width="7" height="6" fill={colorBandera} />
            <rect x="14" y="12" width="7" height="6" fill="#5f5e5a" />
          </g>
          {diplomaListo && (
            <>
              <g className="check-pop" style={{ transformOrigin: "30px -6px" }}>
                <circle cx="30" cy="-6" r="8" fill={COLOR_CHECK} />
                <path
                  d="M25,-6 L29,-2 L36,-11"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
              {/* Destello de celebración — único momento de "boldness" del componente */}
              {[
                { tx: -22, ty: -20 },
                { tx: 4, ty: -28 },
                { tx: 26, ty: -14 },
                { tx: -14, ty: 6 },
                { tx: 18, ty: 10 },
              ].map((p, i) => (
                <circle
                  key={i}
                  className="sparkle"
                  cx="7"
                  cy="6"
                  r="2.5"
                  fill={i % 2 === 0 ? "#F2C230" : COLOR_CARRO}
                  style={{ "--tx": `${p.tx}px`, "--ty": `${p.ty}px` } as React.CSSProperties}
                />
              ))}
            </>
          )}
        </g>

        {/* Carrito, en la posición actual de la estudiante */}
        <g
          className="carrito-grupo"
          style={{ transform: `translate(${carroX}px, 100px)` }}
        >
          <ellipse cx="0" cy="15" rx="20" ry="3" fill="#000000" opacity="0.15" />
          <g className="carrito-idle">
            <rect
              x="-22"
              y="-9"
              width="44"
              height="18"
              rx="8"
              fill="url(#carroDegradado)"
              filter="url(#sombraCarro)"
            />
            <rect x="-13" y="-5" width="12" height="7" rx="2" fill="#fbe4ec" opacity="0.85" />
            <circle cx="-10" cy="11" r="6" fill="#2c2c2a" />
            <circle cx="10" cy="11" r="6" fill="#2c2c2a" />
            <circle cx="-10" cy="11" r="2" fill="#6b6b6b" />
            <circle cx="10" cy="11" r="2" fill="#6b6b6b" />
          </g>
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