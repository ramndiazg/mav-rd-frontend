import { definir } from "./definir";

// Inscripción y pago (enroll, pay, pending) del curso de EE. UU.
export const pago = definir(
  {
    "enroll.titulo": "Elige tu estado",
    "enroll.sub":
      "Recibirás los materiales generales y los de tu estado. Puedes cambiarlo hasta que pagues.",
    "enroll.precio": "Precio del curso: {precio} (pago único)",
    "enroll.continuar": "Continuar al pago",
    "enroll.sinPrecio":
      "El curso todavía no está disponible para inscripción. Vuelve pronto.",
    "enroll.cargando": "Cargando…",

    "pago.estado.creado": "Sin enviar",
    "pago.estado.pendiente_verificacion": "En revisión",
    "pago.estado.pagado": "Pagado",
    "pago.estado.rechazado": "Rechazado",
    "pago.estado.reembolsado": "Reembolsado",
    "pago.estado.disputado": "En disputa",

    "pay.titulo": "Paga tu inscripción",
    "pay.resumen": "Driver Prep USA — {estado}",
    "pay.total": "Total del curso: {precio}",
    "pay.cargando": "Cargando los datos de pago…",
    "pay.cambiarEstado": "Cambiar de estado",
    "pay.rechazado.titulo": "Tu comprobante fue rechazado",
    "pay.rechazado.motivo": "Motivo: {motivo}",
    "pay.rechazado.texto": "Corrige los datos y envíalo de nuevo.",

    "pay.metodo.titulo": "¿Cómo vas a pagar?",
    "pay.metodo.remesa_deposito": "Depósito a cuenta bancaria",
    "pay.metodo.remesa_deposito.desc":
      "Envías dinero desde EE. UU. y llega directo a la cuenta bancaria de la fundación en República Dominicana.",
    "pay.metodo.remesa_efectivo": "Retiro en efectivo",
    "pay.metodo.remesa_efectivo.desc":
      "Envías dinero a nombre de la persona que cobra en efectivo en una agencia de República Dominicana.",
    "pay.metodo.recomendado": "Recomendado",
    "pay.metodo.ninguno":
      "Por ahora no hay métodos de pago disponibles. Vuelve más tarde.",

    "pay.paso1": "1. Envía el dinero",
    "pay.paso2": "2. Cuéntanos del envío",
    "pay.deposito.instr":
      "En la app o agencia de envíos que prefieras, elige «depósito a cuenta bancaria» e ingresa estos datos:",
    "pay.efectivo.instr":
      "En la app o agencia de envíos que prefieras, elige «retiro en efectivo» y envía a nombre de esta persona:",
    "pay.agenciasLista": "Puedes usar: {agencias}.",
    "pay.destino.titular": "Titular de la cuenta",
    "pay.destino.banco": "Banco",
    "pay.destino.numero": "Número de cuenta",
    "pay.destino.tipo": "Tipo de cuenta",
    "pay.destino.rnc": "RNC",
    "pay.destino.beneficiario":
      "Nombre de quien cobra (como aparece en su cédula)",
    "pay.destino.ciudad": "Ciudad donde cobra",
    "pay.destino.pendiente":
      "Los datos de envío todavía no están disponibles. Vuelve más tarde.",
    "pay.copiar": "Copiar",
    "pay.copiado": "Copiado",
    "pay.copiarDato": "Copiar {dato}",

    "pay.regla.titulo": "Importante sobre el monto",
    "pay.regla.texto":
      "El monto enviado debe ser de {precio} o más, sin contar la comisión. La comisión de la agencia la pagas tú y va aparte. Ejemplo: si la agencia cobra $3.00, pagarás {total} en total y el recibo debe mostrar «monto enviado {precio}» y «comisión $3.00».",

    "pay.agencia": "App o agencia que usaste",
    "pay.agencia.elegir": "Elige una opción",
    "pay.agencia.ninguna":
      "No hay agencias disponibles para este método. Prueba con el otro método.",
    "pay.f.control": "Número de control o referencia",
    "pay.f.controlAyuda": "Aparece en el recibo del envío.",
    "pay.f.remitente": "Nombre de quien envió el dinero",
    "pay.f.monto": "Monto enviado (USD, sin la comisión)",
    "pay.f.fecha": "Fecha del envío",
    "pay.f.recibo": "Foto del recibo",
    "pay.f.reciboAyuda":
      "Debe verse el monto, el número de control, el nombre de quien envía y la fecha. La foto se reduce sola; máximo 5 MB.",
    "pay.f.elegirFoto": "Elegir o tomar foto",
    "pay.f.cambiarFoto": "Cambiar foto",
    "pay.f.vistaPrevia": "Vista previa del recibo",

    "pay.err.archivo": "Elige una imagen del recibo (JPG o PNG).",
    "pay.err.archivoGrande": "La imagen es demasiado grande (máximo 5 MB).",
    "pay.err.subida": "No pudimos subir la foto. Intenta de nuevo.",
    "pay.err.agenciaVacia": "Elige la app o agencia que usaste.",
    "pay.err.controlCorto":
      "Escribe el número de control tal como aparece en el recibo (letras y números).",

    "pay.enviar": "Enviar comprobante",
    "pay.fase.preparando": "Preparando la foto…",
    "pay.fase.creando": "Preparando tu inscripción…",
    "pay.fase.subiendo": "Subiendo la foto…",
    "pay.fase.registrando": "Registrando tu pago…",

    "pend.titulo": "Estamos revisando tu pago",
    "pend.texto":
      "Recibimos tu comprobante. Te avisamos por correo en cuanto lo confirmemos; el plazo estimado es de {horas} horas.",
    "pend.actualiza": "Esta pantalla se actualiza sola.",
    "pend.detalle": "Lo que enviaste",
    "pend.agencia": "Agencia",
    "pend.control": "Número de control",
    "pend.monto": "Monto enviado",
    "pend.fecha": "Fecha del envío",
    "pend.verRecibo": "Ver el recibo que enviaste",
    "pend.pagado.titulo": "¡Pago confirmado!",
    "pend.pagado.texto": "Tu curso ya está abierto. ¡Mucho éxito!",
    "pend.irCurso": "Ir a mi curso",
    "pend.corregir": "Corregir y reenviar",
    "pend.reembolsado":
      "Tu inscripción fue reembolsada y el acceso al curso está cerrado.",
    "pend.disputado":
      "Tu pago está en revisión especial. Te contactaremos por correo.",
    "pend.estado": "Estado del pago",
    "pend.volverPago": "Ir a pagar",

    "pay.metodo.paypal": "PayPal",
    "pay.metodo.paypal.desc":
      "Pagas desde PayPal con un enlace que ya trae el monto. Luego nos dices el ID de la transacción y lo confirmamos.",
    "pay.pp.paso1": "1. Paga en PayPal",
    "pay.pp.instr1":
      "Toca el botón: se abre PayPal con el monto ya escrito ({precio}).",
    "pay.pp.instr2":
      "Elige «Bienes y servicios» (Goods and services), no «Familiares y amigos».",
    "pay.pp.instr3":
      "Al terminar, copia el ID de transacción que aparece en el recibo de PayPal o en el correo que te envía.",
    "pay.pp.boton": "Pagar {precio} con PayPal",
    "pay.pp.abre":
      "Se abre en una pestaña nueva; cuando termines, vuelve aquí.",
    "pay.pp.buscar": "También puedes buscar a @{usuario} en la app de PayPal.",
    "pay.pp.noDisponible":
      "PayPal todavía no está disponible. Elige otro método.",
    "pay.pp.id": "ID de transacción de PayPal",
    "pay.pp.idAyuda":
      "Son letras y números (por ejemplo, 5AB12345CD678901E). Lo encuentras en el recibo y en el correo de PayPal.",
    "pay.pp.pagador":
      "Nombre o correo de la cuenta de PayPal con la que pagaste",
    "pay.pp.monto": "Monto pagado (USD)",
    "pay.pp.fecha": "Fecha del pago",
    "pay.pp.captura": "Captura del recibo de PayPal (opcional)",
    "pay.pp.capturaAyuda":
      "Ayuda a confirmar más rápido. La foto se reduce sola; máximo 5 MB.",
    "pend.pp.metodo": "Método",
    "pend.pp.id": "ID de transacción",
    "pend.pp.pagador": "Pagaste con",
    "pend.pp.verCaptura": "Ver la captura que enviaste",
  },
  {
    "enroll.titulo": "Choose your state",
    "enroll.sub":
      "You will get the general materials plus your state's. You can change it until you pay.",
    "enroll.precio": "Course price: {precio} (one-time payment)",
    "enroll.continuar": "Continue to payment",
    "enroll.sinPrecio":
      "The course is not open for enrollment yet. Please check back soon.",
    "enroll.cargando": "Loading…",

    "pago.estado.creado": "Not sent",
    "pago.estado.pendiente_verificacion": "Under review",
    "pago.estado.pagado": "Paid",
    "pago.estado.rechazado": "Rejected",
    "pago.estado.reembolsado": "Refunded",
    "pago.estado.disputado": "In dispute",

    "pay.titulo": "Pay for your enrollment",
    "pay.resumen": "Driver Prep USA — {estado}",
    "pay.total": "Course total: {precio}",
    "pay.cargando": "Loading payment details…",
    "pay.cambiarEstado": "Change state",
    "pay.rechazado.titulo": "Your receipt was rejected",
    "pay.rechazado.motivo": "Reason: {motivo}",
    "pay.rechazado.texto": "Correct the details and send it again.",

    "pay.metodo.titulo": "How will you pay?",
    "pay.metodo.remesa_deposito": "Bank account deposit",
    "pay.metodo.remesa_deposito.desc":
      "You send money from the U.S. and it goes straight into the foundation's bank account in the Dominican Republic.",
    "pay.metodo.remesa_efectivo": "Cash pickup",
    "pay.metodo.remesa_efectivo.desc":
      "You send money in the name of the person who collects cash at an agency in the Dominican Republic.",
    "pay.metodo.recomendado": "Recommended",
    "pay.metodo.ninguno":
      "There are no payment methods available right now. Please check back later.",

    "pay.paso1": "1. Send the money",
    "pay.paso2": "2. Tell us about the transfer",
    "pay.deposito.instr":
      "In the money transfer app or agency you prefer, choose “bank account deposit” and enter these details:",
    "pay.efectivo.instr":
      "In the money transfer app or agency you prefer, choose “cash pickup” and send it in this person's name:",
    "pay.agenciasLista": "You can use: {agencias}.",
    "pay.destino.titular": "Account holder",
    "pay.destino.banco": "Bank",
    "pay.destino.numero": "Account number",
    "pay.destino.tipo": "Account type",
    "pay.destino.rnc": "RNC (tax ID)",
    "pay.destino.beneficiario":
      "Name of the person collecting (as on their ID)",
    "pay.destino.ciudad": "City where they collect",
    "pay.destino.pendiente":
      "The transfer details are not available yet. Please check back later.",
    "pay.copiar": "Copy",
    "pay.copiado": "Copied",
    "pay.copiarDato": "Copy {dato}",

    "pay.regla.titulo": "Important about the amount",
    "pay.regla.texto":
      "The amount sent must be {precio} or more, not counting the fee. The agency's fee is paid by you and is separate. Example: if the agency charges $3.00, you will pay {total} in total and the receipt must show “amount sent {precio}” and “fee $3.00”.",

    "pay.agencia": "App or agency you used",
    "pay.agencia.elegir": "Choose an option",
    "pay.agencia.ninguna":
      "There are no agencies available for this method. Try the other method.",
    "pay.f.control": "Control or reference number",
    "pay.f.controlAyuda": "It appears on the transfer receipt.",
    "pay.f.remitente": "Name of the person who sent the money",
    "pay.f.monto": "Amount sent (USD, not counting the fee)",
    "pay.f.fecha": "Date of the transfer",
    "pay.f.recibo": "Photo of the receipt",
    "pay.f.reciboAyuda":
      "It must show the amount, the control number, the sender's name and the date. The photo is shrunk automatically; 5 MB maximum.",
    "pay.f.elegirFoto": "Choose or take a photo",
    "pay.f.cambiarFoto": "Change photo",
    "pay.f.vistaPrevia": "Receipt preview",

    "pay.err.archivo": "Choose an image of the receipt (JPG or PNG).",
    "pay.err.archivoGrande": "The image is too large (5 MB maximum).",
    "pay.err.subida": "We could not upload the photo. Please try again.",
    "pay.err.agenciaVacia": "Choose the app or agency you used.",
    "pay.err.controlCorto":
      "Enter the control number exactly as it appears on the receipt (letters and numbers).",

    "pay.enviar": "Send receipt",
    "pay.fase.preparando": "Preparing the photo…",
    "pay.fase.creando": "Preparing your enrollment…",
    "pay.fase.subiendo": "Uploading the photo…",
    "pay.fase.registrando": "Recording your payment…",

    "pend.titulo": "We are reviewing your payment",
    "pend.texto":
      "We received your receipt. We will email you as soon as we confirm it; the estimated time is {horas} hours.",
    "pend.actualiza": "This screen updates by itself.",
    "pend.detalle": "What you sent",
    "pend.agencia": "Agency",
    "pend.control": "Control number",
    "pend.monto": "Amount sent",
    "pend.fecha": "Transfer date",
    "pend.verRecibo": "View the receipt you sent",
    "pend.pagado.titulo": "Payment confirmed!",
    "pend.pagado.texto": "Your course is now open. Good luck!",
    "pend.irCurso": "Go to my course",
    "pend.corregir": "Correct and send again",
    "pend.reembolsado":
      "Your enrollment was refunded and access to the course is closed.",
    "pend.disputado":
      "Your payment is under special review. We will contact you by email.",
    "pend.estado": "Payment status",
    "pend.volverPago": "Go to payment",

    "pay.metodo.paypal": "PayPal",
    "pay.metodo.paypal.desc":
      "You pay from PayPal with a link that already has the amount. Then you tell us the transaction ID and we confirm it.",
    "pay.pp.paso1": "1. Pay on PayPal",
    "pay.pp.instr1":
      "Tap the button: PayPal opens with the amount already filled in ({precio}).",
    "pay.pp.instr2": "Choose “Goods and services”, not “Friends and family”.",
    "pay.pp.instr3":
      "When you finish, copy the transaction ID shown on the PayPal receipt or in the email PayPal sends you.",
    "pay.pp.boton": "Pay {precio} with PayPal",
    "pay.pp.abre": "It opens in a new tab; when you finish, come back here.",
    "pay.pp.buscar": "You can also search for @{usuario} in the PayPal app.",
    "pay.pp.noDisponible":
      "PayPal is not available yet. Choose another method.",
    "pay.pp.id": "PayPal transaction ID",
    "pay.pp.idAyuda":
      "Letters and numbers (for example, 5AB12345CD678901E). You can find it on the receipt and in the PayPal email.",
    "pay.pp.pagador": "Name or email of the PayPal account you paid with",
    "pay.pp.monto": "Amount paid (USD)",
    "pay.pp.fecha": "Payment date",
    "pay.pp.captura": "Screenshot of the PayPal receipt (optional)",
    "pay.pp.capturaAyuda":
      "It helps us confirm faster. The photo is shrunk automatically; 5 MB maximum.",
    "pend.pp.metodo": "Method",
    "pend.pp.id": "Transaction ID",
    "pend.pp.pagador": "You paid with",
    "pend.pp.verCaptura": "View the screenshot you sent",
  },
);
