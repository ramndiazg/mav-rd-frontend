import type { DocumentoBilingue } from "@/lib/us/legalConfig";

// BORRADOR sujeto a revisión legal. Describe lo que el sistema HACE hoy
// (cuenta, comprobantes en Cloudinary, correos con Resend, captcha Turnstile,
// sesión y preferencias en el almacenamiento local, sin analítica ni
// publicidad). Si cambia el sistema, hay que actualizar este texto.
export const privacidad: DocumentoBilingue = {
  es: {
    titulo: "Política de privacidad",
    resumen:
      "Qué datos recopilamos en el curso Driver Prep USA, para qué los usamos y qué derechos tienes.",
    secciones: [
      {
        titulo: "Quién es responsable",
        parrafos: [
          "{entidad} es responsable de los datos personales que se recopilan en el sitio del Curso (las páginas que empiezan por /us). Contacto: {contacto}.",
        ],
      },
      {
        titulo: "Qué datos recopilamos",
        lista: [
          "Cuenta: nombre, apellido, teléfono, correo electrónico, fecha de nacimiento, estado, ciudad (opcional) e idioma. La contraseña se guarda cifrada; nosotros no podemos verla.",
          "Pago: los datos del envío de dinero (agencia o app, número de control, nombre de quien envió, monto y fecha) y la foto del recibo que subes. Sube solo el recibo: no debe mostrar datos que no sean del envío.",
          "Uso del Curso: los materiales que marcas como vistos, tus intentos de examen, respuestas y notas.",
          "Datos técnicos: dirección IP, tipo de dispositivo y navegador, y el resultado de la verificación anti-robots, para proteger el sitio.",
        ],
        cierre: [
          "No te pedimos número de Seguro Social, documento de identidad, estatus migratorio ni datos de tarjetas.",
        ],
      },
      {
        titulo: "Para qué usamos tus datos",
        lista: [
          "Crear y administrar tu cuenta.",
          "Verificar tu pago y registrar en nuestra contabilidad el monto recibido.",
          "Darte acceso al Curso y guardar tu avance.",
          "Enviarte correos: verificación de la cuenta, recuperación de contraseña, estado de tu pago y avisos importantes del servicio.",
          "Proteger el sitio y prevenir fraudes y abusos.",
          "Cumplir obligaciones legales y contables.",
          "Mejorar el Curso con estadísticas agregadas, sin identificarte.",
        ],
        cierre: ["No vendemos tus datos ni los usamos para publicidad."],
      },
      {
        titulo: "Con quién los compartimos",
        lista: [
          "Personal autorizado de {entidad} (coordinación y administración), que revisa los pagos y atiende consultas.",
          "Proveedores que nos prestan servicios técnicos: alojamiento y base de datos, envío de correos (Resend), almacenamiento de imágenes y archivos (Cloudinary) y verificación anti-robots (Cloudflare Turnstile). Solo usan los datos para prestarnos ese servicio.",
          "Autoridades, cuando una ley o una orden válida lo exija.",
        ],
        cierre: [
          "Las agencias de envío y los bancos que uses para pagar tienen sus propias políticas de privacidad; no controlamos cómo tratan tus datos.",
        ],
      },
      {
        titulo: "Dónde se tratan",
        parrafos: [
          "Tus datos se procesan en servidores y por proveedores que pueden estar en EE. UU., en República Dominicana o en otros países. Procuramos usar proveedores con medidas de seguridad adecuadas.",
        ],
      },
      {
        titulo: "Cuánto tiempo los guardamos",
        parrafos: [
          "Guardamos tus datos mientras tu cuenta esté activa y el tiempo necesario para cumplir obligaciones legales y contables, como los registros de pagos. Si nos pides borrar tu cuenta, eliminamos o anonimizamos lo que no estemos obligados a conservar. [[!Definir con contabilidad y asesoría legal el plazo de conservación de los registros de pago y escribirlo aquí.]]",
        ],
      },
      {
        titulo: "Tus derechos",
        parrafos: [
          "Según la ley que corresponda, puedes pedirnos acceder a tus datos, corregirlos, borrarlos u oponerte a ciertos usos. Escríbenos a {contacto}. Podemos pedirte que verifiques tu identidad y te responderemos en un plazo razonable.",
        ],
      },
      {
        titulo: "Seguridad",
        parrafos: [
          "Usamos conexión cifrada (HTTPS), guardamos las contraseñas cifradas y limitamos quién puede ver los comprobantes. Ningún sistema es 100 % seguro: protege tu contraseña y avísanos si sospechas un acceso no autorizado.",
        ],
      },
      {
        titulo: "Almacenamiento en tu navegador",
        parrafos: [
          "Usamos el almacenamiento local de tu navegador para mantener tu sesión iniciada y recordar tu idioma y tus preferencias del examen. En estas páginas no usamos cookies de publicidad ni herramientas de analítica. El servicio de verificación anti-robots (Cloudflare Turnstile) puede usar sus propias tecnologías según su política.",
        ],
      },
      {
        titulo: "Menores de edad",
        parrafos: [
          "El Curso es para personas de 16 años o más. Si eres menor de 18, úsalo con el permiso de tu madre, padre o tutor. Si crees que se registró una persona menor de 16 años, escríbenos y borraremos la cuenta.",
        ],
      },
      {
        titulo: "Cambios en esta política",
        parrafos: [
          "Podemos actualizar esta política. Publicaremos la nueva versión con su fecha y, si el cambio es importante, te avisaremos por correo.",
        ],
      },
    ],
  },
  en: {
    titulo: "Privacy policy",
    resumen:
      "What data we collect in the Driver Prep USA course, what we use it for, and what rights you have.",
    secciones: [
      {
        titulo: "Who is responsible",
        parrafos: [
          "{entidad} is responsible for the personal data collected on the Course site (the pages that start with /us). Contact: {contacto}.",
        ],
      },
      {
        titulo: "What data we collect",
        lista: [
          "Account: first name, last name, phone, email, date of birth, state, city (optional) and language. Your password is stored encrypted; we cannot see it.",
          "Payment: the money transfer details (agency or app, control number, sender’s name, amount and date) and the photo of the receipt you upload. Upload only the receipt: it should not show information that is not about the transfer.",
          "Course use: the materials you mark as viewed, your exam attempts, answers and scores.",
          "Technical data: IP address, device and browser type, and the result of the anti-bot check, to protect the site.",
        ],
        cierre: [
          "We do not ask for your Social Security number, ID document, immigration status or card details.",
        ],
      },
      {
        titulo: "What we use your data for",
        lista: [
          "To create and manage your account.",
          "To verify your payment and record the amount received in our accounting.",
          "To give you access to the Course and save your progress.",
          "To send you emails: account verification, password recovery, payment status and important service notices.",
          "To protect the site and prevent fraud and abuse.",
          "To meet legal and accounting obligations.",
          "To improve the Course with aggregate statistics that do not identify you.",
        ],
        cierre: ["We do not sell your data or use it for advertising."],
      },
      {
        titulo: "Who we share it with",
        lista: [
          "Authorized staff of {entidad} (coordination and administration), who review payments and answer questions.",
          "Providers that give us technical services: hosting and database, email delivery (Resend), image and file storage (Cloudinary) and anti-bot verification (Cloudflare Turnstile). They only use the data to provide that service to us.",
          "Authorities, when a law or a valid order requires it.",
        ],
        cierre: [
          "The transfer agencies and banks you use to pay have their own privacy policies; we do not control how they handle your data.",
        ],
      },
      {
        titulo: "Where it is processed",
        parrafos: [
          "Your data is processed on servers and by providers that may be in the U.S., the Dominican Republic or other countries. We try to use providers with adequate security measures.",
        ],
      },
      {
        titulo: "How long we keep it",
        parrafos: [
          "We keep your data while your account is active and for as long as needed to meet legal and accounting obligations, such as payment records. If you ask us to delete your account, we delete or anonymize whatever we are not required to keep. [[!Define with accounting and legal counsel the retention period for payment records and write it here.]]",
        ],
      },
      {
        titulo: "Your rights",
        parrafos: [
          "Depending on the law that applies, you can ask us to access your data, correct it, delete it or object to certain uses. Write to us at {contacto}. We may ask you to verify your identity and we will reply within a reasonable time.",
        ],
      },
      {
        titulo: "Security",
        parrafos: [
          "We use an encrypted connection (HTTPS), we store passwords encrypted and we limit who can see the receipts. No system is 100% secure: protect your password and tell us if you suspect unauthorized access.",
        ],
      },
      {
        titulo: "Storage in your browser",
        parrafos: [
          "We use your browser’s local storage to keep you signed in and to remember your language and your exam preferences. On these pages we do not use advertising cookies or analytics tools. The anti-bot verification service (Cloudflare Turnstile) may use its own technologies according to its policy.",
        ],
      },
      {
        titulo: "Minors",
        parrafos: [
          "The Course is for people 16 or older. If you are under 18, use it with the permission of your mother, father or guardian. If you believe someone under 16 registered, write to us and we will delete the account.",
        ],
      },
      {
        titulo: "Changes to this policy",
        parrafos: [
          "We may update this policy. We will publish the new version with its date and, if the change is important, we will notify you by email.",
        ],
      },
    ],
  },
};
