import type { DocumentoBilingue } from "@/lib/us/legalConfig";

// BORRADOR sujeto a revisión legal. Los textos entre [[ ]] son decisiones o
// datos pendientes (ver lib/us/legalConfig.ts).
export const terminos: DocumentoBilingue = {
  es: {
    titulo: "Términos y condiciones",
    resumen:
      "Reglas para usar el sitio y el curso Driver Prep USA. Léelas antes de crear tu cuenta o pagar.",
    secciones: [
      {
        titulo: "Quiénes somos y qué aceptas",
        parrafos: [
          "Estos términos regulan el uso del sitio y del curso «Driver Prep USA» (el «Curso»), ofrecido por {entidad} («nosotros»). Al crear una cuenta, inscribirte o usar el Curso, aceptas estos términos y la Política de privacidad. Si no estás de acuerdo, no uses el servicio.",
        ],
      },
      {
        titulo: "Qué es el Curso y qué no es",
        lista: [
          "Es formación complementaria de preparación para el examen de conocimientos de la licencia de manejo, dirigida a personas hispanas en Nueva York, Nueva Jersey, Florida y Massachusetts.",
          "No es un curso oficial del estado, no reemplaza ningún curso o requisito que tu estado exija, y no estamos afiliados a ningún DMV, MVC, RMV, FLHSMV ni a otra autoridad.",
          "No garantizamos que apruebes el examen ni que obtengas un permiso o una licencia.",
          "Los datos del examen (cantidad de preguntas, puntaje, idiomas, requisitos) cambian con el tiempo. Son una referencia: confírmalos siempre en el sitio oficial de tu estado.",
          "No damos asesoría legal ni migratoria. Los requisitos para obtener una licencia, incluidos los documentos, dependen de cada estado.",
        ],
      },
      {
        titulo: "Quién puede usar el Curso",
        lista: [
          "Debes tener al menos 16 años.",
          "Si eres menor de 18 años, declaras que tu madre, padre o tutor conoce y acepta estos términos y el pago del Curso. [[!Confirmar esta cláusula con asesoría legal.]]",
          "Debes darnos información verdadera y mantenerla al día.",
        ],
      },
      {
        titulo: "Tu cuenta",
        lista: [
          "Cada persona puede tener una sola cuenta, que es personal e intransferible.",
          "Eres responsable de guardar tu contraseña y de lo que ocurra con tu cuenta. Si sospechas que alguien más entró, cambia tu contraseña y avísanos.",
          "Podemos suspender o cerrar una cuenta si detectamos fraude, uso indebido o incumplimiento de estos términos.",
        ],
      },
      {
        titulo: "Precio y forma de pago",
        parrafos: [
          "El precio del Curso se muestra en dólares estadounidenses (USD) antes de que pagues. Es un pago único.",
        ],
        lista: [
          "El pago se hace con un envío de dinero desde EE. UU. (depósito a una cuenta bancaria o retiro en efectivo en República Dominicana) usando la aplicación o agencia de envíos que prefieras. No te pedimos datos de tarjeta.",
          "El monto enviado debe ser igual o mayor que el precio del Curso, sin contar la comisión. La comisión de la agencia la pagas tú y va aparte del precio.",
          "Después subes la foto del recibo y los datos del envío. Verificamos el pago de forma manual y te avisamos por correo cuando lo confirmemos o si hay algún problema. El plazo estimado que ves en pantalla es una referencia, no una garantía.",
          "Podemos rechazar un comprobante ilegible, con datos que no coinciden o por un monto menor. Podrás corregirlo y enviarlo de nuevo.",
          "El Curso se abre cuando confirmamos tu pago. No somos responsables de retrasos, comisiones, tasas de cambio ni errores de las agencias de envío o de los bancos.",
        ],
      },
      {
        titulo: "Cómo funciona el Curso",
        lista: [
          "El Curso tiene 4 módulos con material de estudio y un examen al final de cada uno.",
          "Para pasar al siguiente módulo debes aprobar el examen del anterior. Se aprueba con 70 % o más.",
          "Tienes hasta 3 intentos por módulo y cada examen tiene un tiempo límite que se indica en pantalla.",
          "Después de aprobar un módulo puedes estudiar el siguiente de inmediato, pero su examen se habilita 24 horas más tarde.",
        ],
      },
      {
        titulo: "Uso permitido y propiedad intelectual",
        parrafos: [
          "Los materiales, textos, preguntas y diseño del Curso son de {entidad} o de quienes nos los licencian. Te damos permiso de usarlos de forma personal y no comercial mientras tengas acceso al Curso.",
          "No está permitido:",
        ],
        lista: [
          "copiar, compartir, publicar o revender los materiales o las preguntas de los exámenes;",
          "compartir tu cuenta o tus claves con otras personas;",
          "subir recibos falsos, alterados o que no sean tuyos, o intentar engañar el sistema de pagos;",
          "usar programas automáticos, evadir los límites de tiempo o de intentos de los exámenes, o intentar entrar a cuentas ajenas;",
          "atacar, sobrecargar o intentar dañar el sitio.",
        ],
        cierre: [
          "Si incumples estas reglas podemos cerrar tu cuenta sin devolver el pago y, cuando corresponda, informar a las autoridades.",
        ],
      },
      {
        titulo: "Disponibilidad y cambios en el Curso",
        parrafos: [
          "Las normas de tránsito y los exámenes cambian, así que podemos actualizar el contenido en cualquier momento. También podemos modificar o suspender el servicio por mantenimiento o por razones técnicas.",
          "Si dejamos de ofrecer el Curso antes de que lo termines, te avisaremos y te aplicaremos lo previsto en la Política de reembolsos.",
        ],
      },
      {
        titulo: "Reembolsos",
        parrafos: [
          "Los reembolsos se rigen por la Política de reembolsos, que forma parte de estos términos.",
        ],
      },
      {
        titulo: "Limitación de responsabilidad",
        parrafos: [
          "El sitio y el Curso se ofrecen «tal como están». En la medida en que la ley lo permita, no somos responsables del resultado de tus exámenes oficiales, de las decisiones de las autoridades, de pérdidas indirectas ni de interrupciones del servicio. Nuestra responsabilidad total por cualquier reclamo se limita al precio que pagaste por el Curso. Nada de esto limita derechos que la ley no permita limitar.",
        ],
      },
      {
        titulo: "Ley aplicable y reclamos",
        parrafos: [
          "[[Estos términos se rigen por las leyes de la República Dominicana y las controversias se someten a los tribunales competentes de Santo Domingo.]] [[!Confirmar con asesoría legal, incluidas las leyes de protección al consumidor que puedan aplicar en el estado de la estudiante.]]",
          "Antes de iniciar un reclamo formal, escríbenos para intentar resolverlo: {contacto}.",
        ],
      },
      {
        titulo: "Cambios en estos términos y contacto",
        parrafos: [
          "Podemos actualizar estos términos. Publicaremos la nueva versión con su fecha y, si el cambio es importante, te avisaremos por correo. Si sigues usando el Curso después del cambio, lo aceptas.",
          "Contacto: {contacto}.",
        ],
      },
    ],
  },
  en: {
    titulo: "Terms and conditions",
    resumen:
      "Rules for using the site and the Driver Prep USA course. Please read them before you create an account or pay.",
    secciones: [
      {
        titulo: "Who we are and what you accept",
        parrafos: [
          "These terms govern the use of the site and the “Driver Prep USA” course (the “Course”), offered by {entidad} (“we”). By creating an account, enrolling or using the Course, you accept these terms and the Privacy policy. If you do not agree, do not use the service.",
        ],
      },
      {
        titulo: "What the Course is and what it is not",
        lista: [
          "It is complementary prep training for the knowledge exam of the driver’s license, aimed at Hispanic people in New York, New Jersey, Florida and Massachusetts.",
          "It is not an official state course, it does not replace any course or requirement your state imposes, and we are not affiliated with any DMV, MVC, RMV, FLHSMV or other authority.",
          "We do not guarantee that you will pass the exam or obtain a permit or license.",
          "Exam details (number of questions, passing score, languages, requirements) change over time. They are a reference: always confirm them on your state’s official website.",
          "We do not give legal or immigration advice. The requirements to obtain a license, including documents, depend on each state.",
        ],
      },
      {
        titulo: "Who can use the Course",
        lista: [
          "You must be at least 16 years old.",
          "If you are under 18, you declare that your mother, father or guardian knows and accepts these terms and the payment for the Course. [[!Confirm this clause with legal counsel.]]",
          "You must give us truthful information and keep it up to date.",
        ],
      },
      {
        titulo: "Your account",
        lista: [
          "Each person may have only one account, which is personal and non-transferable.",
          "You are responsible for keeping your password safe and for what happens in your account. If you suspect someone else got in, change your password and let us know.",
          "We may suspend or close an account if we detect fraud, misuse or a breach of these terms.",
        ],
      },
      {
        titulo: "Price and payment",
        parrafos: [
          "The price of the Course is shown in U.S. dollars (USD) before you pay. It is a one-time payment.",
        ],
        lista: [
          "Payment is made with a money transfer from the U.S. (deposit to a bank account or cash pickup in the Dominican Republic) using the app or agency you prefer. We do not ask for card details.",
          "The amount sent must be equal to or greater than the price of the Course, not counting the fee. The agency’s fee is paid by you and is separate from the price.",
          "Then you upload the photo of the receipt and the transfer details. We verify the payment manually and email you when we confirm it or if there is a problem. The estimated time you see on screen is a reference, not a guarantee.",
          "We may reject a receipt that is unreadable, has details that do not match, or is for a lower amount. You will be able to correct it and send it again.",
          "The Course opens when we confirm your payment. We are not responsible for delays, fees, exchange rates or errors of the transfer agencies or banks.",
        ],
      },
      {
        titulo: "How the Course works",
        lista: [
          "The Course has 4 modules with study material and an exam at the end of each one.",
          "To move on to the next module you must pass the exam of the previous one. The passing score is 70% or higher.",
          "You have up to 3 attempts per module and each exam has a time limit shown on screen.",
          "After you pass a module you can study the next one right away, but its exam opens 24 hours later.",
        ],
      },
      {
        titulo: "Permitted use and intellectual property",
        parrafos: [
          "The materials, texts, questions and design of the Course belong to {entidad} or to those who license them to us. We give you permission to use them for personal, non-commercial purposes while you have access to the Course.",
          "It is not allowed to:",
        ],
        lista: [
          "copy, share, publish or resell the materials or the exam questions;",
          "share your account or your passwords with other people;",
          "upload fake or altered receipts, or receipts that are not yours, or try to trick the payment system;",
          "use automated programs, get around the time or attempt limits of the exams, or try to access other people’s accounts;",
          "attack, overload or try to damage the site.",
        ],
        cierre: [
          "If you break these rules we may close your account without refunding the payment and, where appropriate, report it to the authorities.",
        ],
      },
      {
        titulo: "Availability and changes to the Course",
        parrafos: [
          "Traffic rules and exams change, so we may update the content at any time. We may also modify or suspend the service for maintenance or technical reasons.",
          "If we stop offering the Course before you finish it, we will tell you and apply what the Refund policy provides.",
        ],
      },
      {
        titulo: "Refunds",
        parrafos: [
          "Refunds are governed by the Refund policy, which is part of these terms.",
        ],
      },
      {
        titulo: "Limitation of liability",
        parrafos: [
          "The site and the Course are provided “as is.” To the extent the law allows, we are not responsible for the result of your official exams, for decisions of the authorities, for indirect losses or for interruptions of the service. Our total liability for any claim is limited to the price you paid for the Course. None of this limits rights that the law does not allow to be limited.",
        ],
      },
      {
        titulo: "Governing law and claims",
        parrafos: [
          "[[These terms are governed by the laws of the Dominican Republic and disputes are submitted to the competent courts of Santo Domingo.]] [[!Confirm with legal counsel, including any consumer protection laws that may apply in the student’s state.]]",
          "Before starting a formal claim, please write to us to try to resolve it: {contacto}.",
        ],
      },
      {
        titulo: "Changes to these terms and contact",
        parrafos: [
          "We may update these terms. We will publish the new version with its date and, if the change is important, we will notify you by email. If you keep using the Course after the change, you accept it.",
          "Contact: {contacto}.",
        ],
      },
    ],
  },
};
