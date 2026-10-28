import type { DocumentoBilingue } from "@/lib/us/legalConfig";

// BORRADOR. Los valores entre [[ ]] son PROPUESTAS que la fundadora debe
// aceptar o cambiar (plazos, quién paga la comisión de la devolución…). Ver
// CURSO_DRIVER_PREP_USA_PAGOS.md §6 (pregunta 5). Lo que el sistema ya hace:
// el reembolso lo registra solo un administrador, cierra el acceso al Curso y
// el dinero se devuelve a mano (envío de dinero o depósito).
export const reembolsos: DocumentoBilingue = {
  es: {
    titulo: "Política de reembolsos",
    resumen:
      "Cuándo y cómo te devolvemos tu dinero. Como pagas con un envío de dinero, la devolución también se hace por envío o depósito.",
    secciones: [
      {
        titulo: "Resumen",
        parrafos: [
          "Queremos que pagues con tranquilidad. Esta política explica en qué casos devolvemos el dinero y cómo se hace. Como los pagos se hacen por envío de dinero, los reembolsos también se hacen por envío o depósito y pueden tardar unos días.",
        ],
      },
      {
        titulo: "Antes de que confirmemos tu pago",
        lista: [
          "Si enviaste dinero pero no podemos confirmar tu pago (por ejemplo, el monto es menor, el recibo no coincide o no se lee bien), te escribimos para que lo corrijas o, si prefieres, para devolverte lo que recibimos.",
          "Si enviaste dinero por error o dos veces, avísanos con el número de control y devolvemos lo que sobre.",
        ],
      },
      {
        titulo: "Después de confirmar tu pago",
        parrafos: [
          "Puedes pedir el reembolso del precio del Curso dentro de los [[7 días]] siguientes a la confirmación de tu pago, siempre que [[no hayas presentado ningún examen]].",
        ],
      },
      {
        titulo: "Otros casos en que reembolsamos",
        lista: [
          "Si hiciste el pago dos veces por el mismo Curso.",
          "Si por un problema nuestro no puedes entrar al Curso y no lo resolvemos en [[15 días]].",
          "Si dejamos de ofrecer el Curso antes de que lo termines: [[reembolso completo del precio pagado]].",
        ],
      },
      {
        titulo: "Lo que no se reembolsa",
        lista: [
          "Las comisiones o cargos que te cobró la agencia, el banco o PayPal por el envío o el pago, y las diferencias de cambio.",
          "No reprobar o aprobar el examen oficial, ni obtener o no la licencia: el Curso no lo garantiza.",
          "Las cuentas cerradas por fraude o por incumplir los términos y condiciones.",
        ],
      },
      {
        titulo: "Cómo pedirlo",
        parrafos: [
          "Escribe a {contacto} con tu nombre, el correo de tu cuenta y el número de control del envío. Te respondemos en [[3 días hábiles]].",
        ],
      },
      {
        titulo: "Cómo y cuándo te devolvemos el dinero",
        parrafos: [
          "Cuando aprobamos el reembolso, enviamos el dinero por el medio que acordemos (envío de dinero o depósito a la cuenta que nos indiques) en un plazo de [[10 días hábiles]]. El reembolso es por el precio del Curso en USD. Los costos de enviar la devolución [[se descuentan del monto reembolsado]]. Si pagaste con PayPal, hacemos el reembolso desde PayPal a la misma cuenta con la que pagaste.",
        ],
      },
      {
        titulo: "Qué pasa con tu acceso",
        parrafos: [
          "Al aprobar el reembolso se cierra tu acceso al Curso. Si más adelante quieres volver, tendrás que inscribirte y pagar de nuevo.",
        ],
      },
      {
        titulo: "Cambios",
        parrafos: [
          "Podemos cambiar esta política para las inscripciones nuevas. Los cambios no afectan a quienes ya pagaron.",
        ],
      },
    ],
  },
  en: {
    titulo: "Refund policy",
    resumen:
      "When and how we return your money. Since you pay with a money transfer, the refund is also made by transfer or deposit.",
    secciones: [
      {
        titulo: "Summary",
        parrafos: [
          "We want you to pay with peace of mind. This policy explains in which cases we return the money and how it is done. Since payments are made by money transfer, refunds are also made by transfer or deposit and may take a few days.",
        ],
      },
      {
        titulo: "Before we confirm your payment",
        lista: [
          "If you sent money but we cannot confirm your payment (for example, the amount is lower, the receipt does not match or is hard to read), we will write to you so you can correct it or, if you prefer, to return what we received.",
          "If you sent money by mistake or twice, let us know with the control number and we will return the excess.",
        ],
      },
      {
        titulo: "After we confirm your payment",
        parrafos: [
          "You can ask for a refund of the Course price within [[7 days]] after your payment is confirmed, as long as [[you have not taken any exam]].",
        ],
      },
      {
        titulo: "Other cases in which we refund",
        lista: [
          "If you paid twice for the same Course.",
          "If because of a problem on our side you cannot access the Course and we do not fix it within [[15 days]].",
          "If we stop offering the Course before you finish it: [[full refund of the price paid]].",
        ],
      },
      {
        titulo: "What is not refunded",
        lista: [
          "Fees or charges the agency, bank or PayPal made you pay for the transfer or payment, and exchange-rate differences.",
          "Failing or passing the official exam, or getting or not getting the license: the Course does not guarantee it.",
          "Accounts closed for fraud or for breaking the terms and conditions.",
        ],
      },
      {
        titulo: "How to ask for it",
        parrafos: [
          "Write to {contacto} with your name, your account email and the control number of the transfer. We reply within [[3 business days]].",
        ],
      },
      {
        titulo: "How and when we return the money",
        parrafos: [
          "Once we approve the refund, we send the money by the means we agree on (money transfer or deposit to the account you tell us) within [[10 business days]]. The refund is for the Course price in USD. The cost of sending the refund is [[deducted from the amount refunded]]. If you paid with PayPal, we refund through PayPal to the same account you paid with.",
        ],
      },
      {
        titulo: "What happens to your access",
        parrafos: [
          "When the refund is approved, your access to the Course is closed. If you want to come back later, you will have to enroll and pay again.",
        ],
      },
      {
        titulo: "Changes",
        parrafos: [
          "We may change this policy for new enrollments. Changes do not affect people who have already paid.",
        ],
      },
    ],
  },
};
