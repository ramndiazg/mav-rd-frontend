"use client";

type Progreso = {
  sesionActualDesbloqueada: number;
  sesionesAprobadas: number[];
  cursoCompletado: boolean;
  practicaAprobada: boolean; // NUEVO (05/09/2026)
};

// Posiciones con las 7 paradas (flujo estándar, con práctica)
const X_CON_PRACTICA = {
  inicio: 39,
  s1: 138,
  s2: 236,
  s3: 335,
  s4: 433,
  practica: 532,
  diploma: 630,
};

// NUEVO (08/09/2026): posiciones con 6 paradas (Escolar/Empresarial, sin
// práctica) — mismo rango total (39 a 630), espaciado recalculado para que
// la pista se vea completa y pareja, en vez de dejar un hueco donde iría
// la guía de práctica.
const X_SIN_PRACTICA = {
  inicio: 39,
  s1: 157,
  s2: 276,
  s3: 394,
  s4: 512,
  diploma: 630,
};

const COLOR_APROBADA = "#4A7FC9";
const COLOR_PENDIENTE = "#9CA3AF";
const COLOR_CHECK = "#2F9E44";
const COLOR_CARRO = "#D6336C";

function mensajeMotivacional(
  progreso: Progreso,
  diplomaListo: boolean,
  requierePractica: boolean,
) {
  const aprobadas = progreso.sesionesAprobadas.length;
  if (diplomaListo) return "¡Completaste el curso! Tu diploma ya está listo.";

  if (progreso.cursoCompletado) {
    // NUEVO (08/09/2026): estudiantes sin práctica (Escolar/Empresarial)
    // nunca dependen de practicaAprobada — su diploma es un paso
    // administrativo directo tras completar la teoría.
    if (!requierePractica) {
      return "¡Completaste toda la teoría! Tu diploma está en camino.";
    }
    // NUEVO (05/09/2026): distingue "esperando que la contacten" de
    // "ya aprobado, diploma en camino" dentro de la etapa de práctica.
    if (progreso.practicaAprobada) {
      return "Tu instructor aprobó tu práctica — tu diploma está en camino.";
    }
    return "Teoría completa — contacta a tu instructor para la práctica en carretera.";
  }
  if (aprobadas === 0) return "La Sesión 1 ya te está esperando.";
  if (aprobadas === 1) return "Vas bien — la Sesión 2 ya está disponible.";
  if (aprobadas === 2) return "Vas bien — la Sesión 3 ya está disponible.";
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
  requierePractica = true, // NUEVO (08/09/2026): false para estudiantes de Grupo (Escolar/Empresarial)
}: {
  progreso: Progreso;
  diplomaListo?: boolean;
  requierePractica?: boolean;
}) {
  const aprobadas = progreso.sesionesAprobadas.length;
  const X = requierePractica ? X_CON_PRACTICA : X_SIN_PRACTICA;

  // Puntos intermedios de la carretera para el carrito: con práctica hay 5
  // paradas antes del diploma (inicio + 4 sesiones + práctica); sin
  // práctica solo 4 (inicio + 4 sesiones), y el carro pasa directo al
  // diploma en cuanto cursoCompletado es true.
  const puntosCarro = requierePractica
    ? [X.inicio, X.s1, X.s2, X.s3, X.s4, (X as typeof X_CON_PRACTICA).practica]
    : [X.inicio, X.s1, X.s2, X.s3, X.s4];

  const carroX = diplomaListo
    ? X.diploma
    : puntosCarro[Math.min(aprobadas, puntosCarro.length - 1)];

  const colorBandera = diplomaListo ? COLOR_APROBADA : COLOR_PENDIENTE;
  const mensaje = mensajeMotivacional(progreso, diplomaListo, requierePractica);

  return (
    <div className="mb-8">
      <p className="text-center text-xs font-medium text-brand-blue mb-1">
        {diplomaListo ? "¡Diploma listo!" : `${aprobadas} de 4 sesiones aprobadas`}
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

        <rect x="20" y="99" width="640" height="30" rx="4" fill="#000000" opacity="0.12" />
        <rect x="20" y="96" width="640" height="30" rx="4" fill="url(#asfalto)" />

        <line
          x1="55"
          y1="111"
          x2="615"
          y2="111"
          stroke="#5a5a58"
          strokeWidth="2.5"
          strokeDasharray="12 8"
        />
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
        <line x1="340" y1="106" x2="615" y2="106" stroke="#F2C230" strokeWidth="2" opacity="0.6" />

        <rect x="34" y="96" width="10" height="10" fill="#ffffff" />
        <rect x="44" y="106" width="10" height="10" fill="#ffffff" />
        <rect x="34" y="116" width="10" height="10" fill="#ffffff" />
        <rect x="44" y="96" width="10" height="10" fill="#2c2c2a" />
        <rect x="34" y="106" width="10" height="10" fill="#2c2c2a" />
        <rect x="44" y="116" width="10" height="10" fill="#2c2c2a" />

        <Libro x={X.s1} aprobada={progreso.sesionesAprobadas.includes(1)} />
        <Libro x={X.s2} aprobada={progreso.sesionesAprobadas.includes(2)} />
        <Libro x={X.s3} aprobada={progreso.sesionesAprobadas.includes(3)} />
        <Libro x={X.s4} aprobada={progreso.sesionesAprobadas.includes(4)} />

        {/* Guía (práctica) — NUEVO (08/09/2026): se omite por completo para
            estudiantes sin práctica (Escolar/Empresarial), en vez de
            mostrarse vacía/pendiente para siempre */}
        {requierePractica && (
          <g
            transform={`translate(${(X as typeof X_CON_PRACTICA).practica},70)`}
            filter="url(#sombraSuave)"
          >
            <circle
              cx="0"
              cy="-16"
              r="6"
              fill={progreso.practicaAprobada ? COLOR_APROBADA : COLOR_PENDIENTE}
              stroke="#1a1a1a"
              strokeWidth="1.5"
            />
            <path
              d="M-9,10 C-9,-2 9,-2 9,10 Z"
              fill={progreso.practicaAprobada ? COLOR_APROBADA : COLOR_PENDIENTE}
              stroke="#1a1a1a"
              strokeWidth="1.5"
            />
            {progreso.practicaAprobada && (
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
        )}

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
            <rect x="14" y="12" width="7" height="6" fill={colorBandera} />
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
        <span>Sesión 4</span>
        {requierePractica && <span>Práctica</span>}
        <span>Diploma</span>
      </div>
    </div>
  );
}