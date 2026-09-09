// 14 preguntas del cuestionario informativo de Escolar — ver
// ESPECIFICACION_PROGRAMAS_NUEVOS.md sección 2. El texto exacto de las
// preguntas es una PROPUESTA de Claude siguiendo los 5 ejes y cantidades
// ya acordados con la fundadora (4+3+3+2 de escala, 2 abiertas) — el
// wording literal todavía no fue confirmado por ella, revisar antes de
// usar con estudiantes reales. Además sigue pendiente la revisión legal
// (Ley 172-13) mencionada en la especificación.
//
// El índice de cada pregunta en PREGUNTAS_ESCALA corresponde exactamente
// a la posición esperada en `respuestas` por el backend (ver
// models/InformacionComplementariaEscolar.js). 4+3+3+2 = 12.

export const ESCALA_LIKERT = [
  { valor: 1, etiqueta: "Nunca" },
  { valor: 2, etiqueta: "Casi nunca" },
  { valor: 3, etiqueta: "A veces" },
  { valor: 4, etiqueta: "Casi siempre" },
  { valor: 5, etiqueta: "Siempre" },
];

export type Seccion = {
  clave: string;
  titulo: string;
  preguntas: string[];
};

export const SECCIONES: Seccion[] = [
  {
    clave: "A",
    titulo: "Conocimiento previo de educación vial",
    preguntas: [
      "Puedo identificar correctamente las señales de tránsito más comunes.",
      "Entiendo qué significan las líneas y marcas pintadas en la calle.",
      "He recibido antes alguna charla o clase sobre seguridad vial.",
      "Conozco los pasos correctos para cruzar la calle de forma segura.",
    ],
  },
  {
    clave: "B",
    titulo: "Experiencia práctica como peatón/pasajero/ciclista",
    preguntas: [
      "Camino o uso transporte público para ir y volver del colegio.",
      "He andado en bicicleta o motor en una calle con tráfico real.",
      "Un adulto me ha explicado cómo y por qué usar el cinturón de seguridad.",
    ],
  },
  {
    clave: "C",
    titulo: "Logística de aprendizaje",
    preguntas: [
      "Prefiero aprender viendo un video antes que leyendo un texto.",
      "Tengo acceso a internet y a un dispositivo (celular, tablet o computadora) en mi casa.",
      "Me concentro mejor en la mañana que en la noche.",
    ],
  },
  {
    clave: "D",
    titulo: "Contexto de manejo en el hogar",
    preguntas: [
      "En mi casa hay un carro o motor que se usa regularmente.",
      "Planeo aprender a manejar cuando sea mayor de edad.",
    ],
  },
];

// Aplanado — el índice en este array es exactamente el índice esperado
// en `respuestas` por el backend. 4+3+3+2 = 12.
export const PREGUNTAS_ESCALA: string[] = SECCIONES.flatMap((s) => s.preguntas);

export const PREGUNTAS_REFLEXION: string[] = [
  "¿Qué te gustaría aprender en este curso?",
  "¿Cómo prefieres que te avisemos cuando tengas un examen disponible?",
];

// Deliberadamente sin el framing de "test psicológico" ni mención de
// confidencialidad clínica — es un cuestionario informativo, no una
// evaluación conductual (ver ESPECIFICACION_PROGRAMAS_NUEVOS.md sección 2).
export const TEXTO_CONSENTIMIENTO =
  "Este cuestionario nos ayuda a conocer tu experiencia previa antes de empezar el curso. No es una evaluación ni tiene respuestas correctas o incorrectas — responde con sinceridad. Tus respuestas solo las puede ver tu coordinadora.";
