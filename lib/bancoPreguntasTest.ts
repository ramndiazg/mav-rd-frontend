// Transcripción exacta de las secciones A-H del "Test de Perfil
// Psicológico y Conductual" en papel. El orden de PREGUNTAS_ESCALA
// importa: el índice de cada pregunta en este array corresponde
// exactamente a la posición en el array `respuestas` que espera el
// backend (ver models/TestPsicologico.js).

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
    titulo: "Autocontrol e impulsividad",
    preguntas: [
      "Cuando otro conductor comete un error, logro mantener la calma.",
      "Antes de realizar una maniobra, pienso en sus posibles consecuencias.",
      "Me cuesta controlar mis reacciones cuando alguien me provoca en el tránsito.",
      "Puedo esperar pacientemente aunque el tránsito esté congestionado.",
      "A veces realizo maniobras sin pensarlas suficientemente.",
      "Cuando estoy molesto/a, puedo continuar conduciendo de manera segura.",
      "Me resulta difícil aceptar que otro vehículo tenga prioridad.",
      "Evito actuar por impulso cuando conduzco.",
    ],
  },
  {
    clave: "B",
    titulo: "Manejo del estrés y las emociones",
    preguntas: [
      "El tráfico intenso aumenta notablemente mi nivel de estrés.",
      "Puedo mantener la concentración aunque esté preocupado/a por asuntos personales.",
      "Cuando estoy bajo presión, tiendo a conducir más rápido.",
      "Puedo reconocer cuándo mis emociones están afectando mi conducción.",
      "Después de una discusión o situación desagradable, puedo recuperar la calma antes de conducir.",
      "Me pongo nervioso/a cuando conduzco en lugares desconocidos.",
      "Sé utilizar estrategias para reducir mi tensión mientras conduzco.",
      "Cuando estoy muy alterado/a, considero detenerme antes de continuar.",
    ],
  },
  {
    clave: "C",
    titulo: "Percepción del riesgo y seguridad",
    preguntas: [
      "Considero importante anticiparme a los errores de otros conductores.",
      "Suelo subestimar los riesgos cuando conozco bien una ruta.",
      "Respeto los límites de velocidad aunque tenga prisa.",
      "Mantengo una distancia de seguridad adecuada.",
      "Considero que algunas normas pueden ignorarse si no hay agentes presentes.",
      "Observo el entorno antes de cambiar de carril o realizar una maniobra.",
      "Entiendo que conducir bien no significa solamente controlar el vehículo.",
      "Prefiero llegar tarde antes que asumir un riesgo innecesario.",
    ],
  },
  {
    clave: "D",
    titulo: "Atención, concentración y toma de decisiones",
    preguntas: [
      "Puedo mantener la atención durante períodos prolongados.",
      "Me distraigo fácilmente con el teléfono, conversaciones u otros estímulos.",
      "Reviso espejos y entorno antes de realizar maniobras.",
      "Cuando hay muchas cosas sucediendo a la vez, me cuesta decidir qué hacer.",
      "Puedo seguir instrucciones mientras mantengo la atención en el tránsito.",
      "Si no estoy seguro/a de una maniobra, prefiero detenerme y evaluar.",
      "Suelo conducir pensando en otras cosas y pierdo detalles del entorno.",
      "Puedo identificar rápidamente situaciones que requieren mayor precaución.",
    ],
  },
  {
    clave: "E",
    titulo: "Actitud, responsabilidad y respeto a las normas",
    preguntas: [
      "Considero que la seguridad de los demás es también mi responsabilidad.",
      "Cumplo las normas aunque nadie esté supervisando.",
      "Cuando tengo prisa, puedo justificar exceder la velocidad.",
      "Reconozco mis errores al conducir y procuro corregirlos.",
      "Evito conducir bajo condiciones que puedan afectar mi capacidad para hacerlo de forma segura.",
      "Considero que tener experiencia me permite asumir más riesgos.",
      "Respeto a peatones, ciclistas, motociclistas y demás usuarios de la vía.",
      "Estoy dispuesto/a a modificar hábitos de conducción inseguros.",
    ],
  },
  {
    clave: "F",
    titulo: "Confianza y autopercepción",
    preguntas: [
      "Me siento seguro/a de mis capacidades al volante.",
      "A veces mi exceso de confianza me lleva a asumir riesgos.",
      "Puedo reconocer cuándo una situación supera mi nivel de experiencia.",
      "Acepto las correcciones de un instructor sin sentir que cuestionan mi capacidad.",
      "El miedo a equivocarme puede bloquearme durante una maniobra.",
      "Estoy dispuesto/a a practicar nuevamente una habilidad que todavía no domino.",
      "Me considero capaz de aprender de manera progresiva y responsable.",
      "Prefiero aparentar que sé conducir antes que admitir que necesito ayuda.",
    ],
  },
  {
    clave: "G",
    titulo: "Presión social y conducta en el tránsito",
    preguntas: [
      "Si otros conductores me presionan, puedo mantener mi decisión segura.",
      "He acelerado porque otros vehículos me estaban siguiendo de cerca.",
      "Puedo ignorar provocaciones, bocinas o gestos de otros conductores.",
      "Me preocupa demasiado lo que otros conductores piensen de mi manera de conducir.",
      "No siento necesidad de competir con otros vehículos.",
      "Puedo decir que no cuando alguien me pide realizar una maniobra insegura.",
    ],
  },
];

// Aplanado — el índice en este array es exactamente el índice esperado
// en `respuestas` por el backend. 8+8+8+8+8+8+6 = 54.
export const PREGUNTAS_ESCALA: string[] = SECCIONES.flatMap((s) => s.preguntas);

export const PREGUNTAS_REFLEXION: string[] = [
  "¿Qué es lo que más le preocupa al momento de conducir?",
  "¿Qué situación de tránsito considera más difícil para usted?",
  "¿Qué cree que necesita mejorar como conductor/a?",
  "¿Ha tenido algún incidente, accidente o situación de riesgo que considere importante comentar? (No es necesario describir información legal o sensible.)",
  "¿Qué espera lograr al finalizar su formación en Muvo RD Vial?",
];

export const TEXTO_CONSENTIMIENTO =
  "Este cuestionario no constituye un diagnóstico psicológico, psiquiátrico ni una certificación de aptitud para conducir. Su finalidad es identificar factores que puedan orientar tu formación y tu práctica. Responde con sinceridad — no hay respuestas correctas o incorrectas. Tus respuestas son confidenciales y solo las puede ver tu coordinadora.";
