import { definir } from "./definir";

// Dashboard, módulos y examen del curso de EE. UU. Los títulos de los 4
// módulos reutilizan las claves land.mod.N.t de la sección `landing`.
export const aula = definir(
  {
    "dash.titulo": "Mi curso",
    "dash.hola": "Hola, {nombre}",
    "dash.estado": "Tu estado: {estado}",
    "dash.progreso": "{n} de {total} módulos aprobados",
    "dash.cargando": "Cargando tu curso…",
    "dash.sinInscripcion.titulo": "Aún no te has inscrito",
    "dash.sinInscripcion.texto": "Inscríbete para abrir los módulos del curso.",
    "dash.sinInscripcion.cta": "Inscribirme",
    "dash.pagoPendiente.texto":
      "Tu pago está en revisión. Cuando lo confirmemos se abre el curso.",
    "dash.pagoPendiente.cta": "Ver el estado de mi pago",
    "dash.pagoRechazado.texto":
      "Tu comprobante fue rechazado. Corrígelo y envíalo de nuevo.",
    "dash.pagoRechazado.cta": "Corregir mi comprobante",
    "dash.sinProgreso":
      "Tu pago está confirmado, pero todavía no vemos tu progreso. Recarga la página en unos minutos.",
    "dash.mod.bloqueado": "Se desbloquea al aprobar el módulo {n}",
    "dash.mod.disponible": "Disponible",
    "dash.mod.aprobado": "Aprobado",
    "dash.mod.empezar": "Empezar",
    "dash.mod.continuar": "Continuar",
    "dash.mod.repasar": "Repasar",
    "dash.mod.examenEn": "Su examen se habilita: {fecha}",
    "dash.completo.titulo": "¡Completaste el curso!",
    "dash.completo.texto":
      "Aprobaste los 4 módulos. Sigue practicando y revisa en el sitio oficial de tu estado los pasos para tu permiso o licencia.",

    "course.volver": "← Volver a mi curso",
    "course.cargando": "Cargando el módulo…",
    "course.bloqueado":
      "Este módulo se desbloquea cuando apruebes el módulo anterior.",
    "course.instruccion":
      "Abre cada material y márcalo como visto. Cuando termines todos, se habilita el examen del módulo.",
    "course.materiales": "Materiales",
    "course.sinMateriales": "Todavía no hay materiales en este módulo.",
    "course.badgeGeneral": "Todos los estados",
    "course.badgeEstado": "Solo {estado}",
    "course.abrirPdf": "Abrir PDF",
    "course.abrirEnlace": "Abrir enlace",
    "course.marcar": "Marcar como visto",
    "course.marcando": "Marcando…",
    "course.visto": "Visto",
    "course.espera": "Ya viste todo el material. Tu examen se habilita en:",
    "course.irExamen": "Ir al examen",
    "course.buscando": "Buscando tu examen…",
    "course.reintentar": "Reintentar el examen",
    "course.preparando": "Preparando…",
    "course.intentos": "Intentos usados: {usados} de {max}",
    "course.ultimaNota": "Última nota: {nota}%",
    "course.sinIntentos":
      "Usaste los {max} intentos de este módulo. Escríbenos para que revisemos tu caso.",
    "course.aprobado": "¡Módulo aprobado!",
    "course.aprobadoTexto": "Puedes repasar los materiales cuando quieras.",
    "course.sigModulo": "Ir al módulo {n}",
    "course.sinExamen":
      "Todavía no tienes un examen disponible. Termina de ver todo el material.",

    "exam.titulo": "Examen del módulo",
    "exam.preparando": "Preparando tu examen…",
    "exam.tiempo": "Tiempo restante",
    "exam.traduccion.ocultar": "Ocultar la traducción al español",
    "exam.traduccion.mostrar": "Mostrar la traducción al español",
    "exam.traduccion.ayuda":
      "Practica leyendo solo en inglés, como en el examen real. En Florida el examen es solo en inglés.",
    "exam.pregunta": "Pregunta {n}",
    "exam.entregar": "Entregar el examen",
    "exam.entregando": "Entregando…",
    "exam.faltan": "Responde las {n} preguntas que faltan",
    "exam.aprobado": "¡Aprobaste!",
    "exam.reprobado": "No alcanzaste el {nota}% necesario.",
    "exam.reprobadoTexto":
      "Repasa los materiales del módulo y vuelve a intentarlo desde la pantalla del módulo.",
    "exam.fueraTiempo":
      "Tu entrega llegó después de que terminara el tiempo del examen.",
    "exam.proxima":
      "Ya puedes estudiar el siguiente módulo. Su examen se habilitará el {fecha} (24 horas después de este resultado).",
    "exam.revision": "Revisión de tus respuestas",
    "exam.correcta": "Correcta",
    "exam.incorrecta": "Incorrecta",
    "exam.tuRespuesta": "Tu respuesta",
    "exam.laCorrecta": "Respuesta correcta",
    "exam.sinRespuesta": "Sin respuesta",
    "exam.volverCurso": "Volver a mi curso",
    "exam.cerrado": "Este examen ya no se puede abrir.",
  },
  {
    "dash.titulo": "My course",
    "dash.hola": "Hi, {nombre}",
    "dash.estado": "Your state: {estado}",
    "dash.progreso": "{n} of {total} modules passed",
    "dash.cargando": "Loading your course…",
    "dash.sinInscripcion.titulo": "You haven't enrolled yet",
    "dash.sinInscripcion.texto": "Enroll to open the course modules.",
    "dash.sinInscripcion.cta": "Enroll now",
    "dash.pagoPendiente.texto":
      "Your payment is under review. The course opens as soon as we confirm it.",
    "dash.pagoPendiente.cta": "See my payment status",
    "dash.pagoRechazado.texto":
      "Your receipt was rejected. Correct it and send it again.",
    "dash.pagoRechazado.cta": "Correct my receipt",
    "dash.sinProgreso":
      "Your payment is confirmed, but we can't see your progress yet. Please reload the page in a few minutes.",
    "dash.mod.bloqueado": "Unlocks when you pass module {n}",
    "dash.mod.disponible": "Available",
    "dash.mod.aprobado": "Passed",
    "dash.mod.empezar": "Start",
    "dash.mod.continuar": "Continue",
    "dash.mod.repasar": "Review",
    "dash.mod.examenEn": "Its exam opens: {fecha}",
    "dash.completo.titulo": "You completed the course!",
    "dash.completo.texto":
      "You passed all 4 modules. Keep practicing and check your state's official website for the steps to get your permit or license.",

    "course.volver": "← Back to my course",
    "course.cargando": "Loading the module…",
    "course.bloqueado":
      "This module unlocks when you pass the previous module.",
    "course.instruccion":
      "Open each material and mark it as viewed. When you finish all of them, the module exam opens.",
    "course.materiales": "Materials",
    "course.sinMateriales": "There are no materials in this module yet.",
    "course.badgeGeneral": "All states",
    "course.badgeEstado": "{estado} only",
    "course.abrirPdf": "Open PDF",
    "course.abrirEnlace": "Open link",
    "course.marcar": "Mark as viewed",
    "course.marcando": "Marking…",
    "course.visto": "Viewed",
    "course.espera": "You viewed everything. Your exam opens in:",
    "course.irExamen": "Go to the exam",
    "course.buscando": "Looking for your exam…",
    "course.reintentar": "Retake the exam",
    "course.preparando": "Preparing…",
    "course.intentos": "Attempts used: {usados} of {max}",
    "course.ultimaNota": "Last score: {nota}%",
    "course.sinIntentos":
      "You used all {max} attempts for this module. Contact us so we can review your case.",
    "course.aprobado": "Module passed!",
    "course.aprobadoTexto": "You can review the materials any time.",
    "course.sigModulo": "Go to module {n}",
    "course.sinExamen":
      "You don't have an exam available yet. Finish viewing all the material.",

    "exam.titulo": "Module exam",
    "exam.preparando": "Preparing your exam…",
    "exam.tiempo": "Time left",
    "exam.traduccion.ocultar": "Hide the Spanish translation",
    "exam.traduccion.mostrar": "Show the Spanish translation",
    "exam.traduccion.ayuda":
      "Practice reading in English only, like the real exam. In Florida the exam is English only.",
    "exam.pregunta": "Question {n}",
    "exam.entregar": "Submit the exam",
    "exam.entregando": "Submitting…",
    "exam.faltan": "Answer the {n} remaining questions",
    "exam.aprobado": "You passed!",
    "exam.reprobado": "You did not reach the required {nota}%.",
    "exam.reprobadoTexto":
      "Review the module materials and try again from the module screen.",
    "exam.fueraTiempo": "Your submission arrived after the exam time was over.",
    "exam.proxima":
      "You can study the next module now. Its exam opens on {fecha} (24 hours after this result).",
    "exam.revision": "Review of your answers",
    "exam.correcta": "Correct",
    "exam.incorrecta": "Incorrect",
    "exam.tuRespuesta": "Your answer",
    "exam.laCorrecta": "Correct answer",
    "exam.sinRespuesta": "No answer",
    "exam.volverCurso": "Back to my course",
    "exam.cerrado": "This exam can no longer be opened.",
  },
);
