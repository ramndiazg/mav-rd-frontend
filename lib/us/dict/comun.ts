import { definir } from "./definir";

// Textos comunes de todo /us: cabecera, pie, selector de idioma, guardas de
// ruta y errores del servidor (un texto por cada `code` de respuestasUS.js).
export const comun = definir(
  {
    "brand.nombre": "Muvo RD Vial",
    "brand.curso": "Driver Prep USA",

    "nav.saltar": "Saltar al contenido",
    "nav.curso": "El curso",
    "nav.entrar": "Iniciar sesión",
    "nav.crearCuenta": "Crear cuenta",
    "nav.miCurso": "Mi curso",
    "nav.salir": "Cerrar sesión",
    "nav.hola": "Hola, {nombre}",
    "nav.abrirMenu": "Abrir menú",
    "nav.cerrarMenu": "Cerrar menú",
    "nav.principal": "Navegación principal",

    "lang.etiqueta": "Idioma / Language",
    "lang.es": "Español",
    "lang.en": "English",
    "lang.cambiarA": "Cambiar el idioma a {idioma}",

    "footer.aviso":
      "Formación complementaria de preparación. No es un curso oficial del estado, no reemplaza los cursos que tu estado exija y no garantiza aprobar el examen. No estamos afiliados a ningún DMV.",
    "footer.terminos": "Términos y condiciones",
    "footer.privacidad": "Política de privacidad",
    "footer.reembolsos": "Política de reembolsos",
    "footer.sitioRD": "Sitio de República Dominicana",
    "footer.derechos": "© {anio} Muvo RD Vial. Todos los derechos reservados.",
    "footer.legal": "Información legal",

    "comun.cargando": "Cargando…",
    "comun.reintentar": "Reintentar",
    "comun.volver": "Volver",
    "comun.continuar": "Continuar",

    "guard.cargando": "Verificando tu sesión…",
    "guard.correo.titulo": "Verifica tu correo para continuar",
    "guard.correo.texto":
      "Te enviamos un enlace a {email}. Ábrelo y vuelve aquí: esta pantalla se actualiza sola.",
    "guard.correo.reenviar": "Reenviar el correo",
    "guard.correo.enviado": "Listo, te enviamos un correo nuevo.",

    "err.generico": "Ocurrió un error. Intenta de nuevo.",
    "err.red":
      "No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.",
    "err.sesionExpirada": "Tu sesión venció. Inicia sesión de nuevo.",
    "err.limite":
      "Demasiados intentos. Espera unos minutos e intenta de nuevo.",

    "err.datos_invalidos": "Revisa los datos del formulario.",
    "err.correo_invalido": "El correo no es válido.",
    "err.password_corta": "La contraseña debe tener al menos 8 caracteres.",
    "err.telefono_invalido": "El teléfono debe ser de EE. UU. (10 dígitos).",
    "err.estado_invalido": "Ese estado no está disponible todavía.",
    "err.edad_minima": "Debes tener al menos 16 años.",
    "err.captcha_fallido":
      "No pudimos verificar que eres una persona. Intenta de nuevo.",
    "err.no_se_pudo_crear":
      "No se pudo crear la cuenta con esos datos. Verifica la información e intenta de nuevo.",
    "err.token_invalido": "El enlace es inválido o ya expiró.",
    "err.credenciales_invalidas": "Correo o contraseña incorrectos.",
    "err.cuenta_desactivada": "Esta cuenta está desactivada.",
    "err.cuenta_no_us": "Esta cuenta no pertenece al curso de EE. UU.",
    "err.correo_no_verificado": "Debes verificar tu correo antes de continuar.",
    "err.correo_ya_verificado": "Tu correo ya está verificado.",
    "err.precio_no_configurado":
      "El curso todavía no está disponible para inscripción.",
    "err.metodo_invalido": "Ese método de pago no está disponible.",
    "err.inscripcion_existente": "Ya tienes una inscripción activa.",
    "err.inscripcion_no_encontrada": "No encontramos tu inscripción.",
    "err.estado_pago_invalido":
      "Esta inscripción no admite esa acción en su estado actual.",
    "err.agencia_invalida":
      "Elige una agencia o app válida para ese tipo de envío.",
    "err.control_invalido": "El número de control no es válido.",
    "err.remitente_invalido": "Escribe el nombre de quien envió el dinero.",
    "err.monto_invalido": "El monto enviado no es válido.",
    "err.monto_menor":
      "El monto enviado (sin la comisión) es menor que el precio del curso.",
    "err.fecha_invalida": "La fecha del envío no es válida.",
    "err.comprobante_invalido": "Sube la foto del recibo antes de enviar.",
    "err.ref_duplicada":
      "Ese número de control ya fue registrado con esa agencia.",
    "err.motivo_requerido": "Escribe el motivo.",
    "err.monto_recibido_invalido": "Escribe los pesos (RD$) que recibiste.",
    "err.config_clave_invalida": "Esa clave de configuración no existe.",
    "err.config_valor_invalido":
      "El valor no es válido para esa configuración.",
    "err.config_incompleta":
      "No se puede activar el curso: falta el precio o un método de pago activo.",
    "err.progreso_conflicto":
      "Esta estudiante ya tiene progreso en otro programa; no se puede confirmar.",
    "err.proveedor_no_disponible": "Ruta no encontrada.",
    "err.material_no_encontrado": "Material no encontrado.",
    "err.sin_acceso": "Todavía no tienes acceso a este contenido.",
    "err.curso_sin_pago": "Necesitas un pago confirmado para entrar al curso.",
    "err.no_encontrado": "No encontrado.",
    "err.error_interno": "Ocurrió un error. Intenta de nuevo.",
  },
  {
    "brand.nombre": "Muvo RD Vial",
    "brand.curso": "Driver Prep USA",

    "nav.saltar": "Skip to content",
    "nav.curso": "The course",
    "nav.entrar": "Log in",
    "nav.crearCuenta": "Sign up",
    "nav.miCurso": "My course",
    "nav.salir": "Log out",
    "nav.hola": "Hi, {nombre}",
    "nav.abrirMenu": "Open menu",
    "nav.cerrarMenu": "Close menu",
    "nav.principal": "Main navigation",

    "lang.etiqueta": "Idioma / Language",
    "lang.es": "Español",
    "lang.en": "English",
    "lang.cambiarA": "Change the language to {idioma}",

    "footer.aviso":
      "Complementary prep training. This is not an official state course, it does not replace any course your state requires, and it does not guarantee you will pass the exam. We are not affiliated with any DMV.",
    "footer.terminos": "Terms and conditions",
    "footer.privacidad": "Privacy policy",
    "footer.reembolsos": "Refund policy",
    "footer.sitioRD": "Dominican Republic site",
    "footer.derechos": "© {anio} Muvo RD Vial. All rights reserved.",
    "footer.legal": "Legal information",

    "comun.cargando": "Loading…",
    "comun.reintentar": "Try again",
    "comun.volver": "Back",
    "comun.continuar": "Continue",

    "guard.cargando": "Checking your session…",
    "guard.correo.titulo": "Verify your email to continue",
    "guard.correo.texto":
      "We sent a link to {email}. Open it and come back here: this screen updates by itself.",
    "guard.correo.reenviar": "Resend the email",
    "guard.correo.enviado": "Done, we sent you a new email.",

    "err.generico": "Something went wrong. Please try again.",
    "err.red":
      "We could not reach the server. Check your connection and try again.",
    "err.sesionExpirada": "Your session expired. Please log in again.",
    "err.limite": "Too many attempts. Please wait a few minutes and try again.",

    "err.datos_invalidos": "Please check the form fields.",
    "err.correo_invalido": "The email address is not valid.",
    "err.password_corta": "The password must be at least 8 characters.",
    "err.telefono_invalido":
      "The phone number must be a US number (10 digits).",
    "err.estado_invalido": "That state is not available yet.",
    "err.edad_minima": "You must be at least 16 years old.",
    "err.captcha_fallido":
      "We could not verify that you are a person. Please try again.",
    "err.no_se_pudo_crear":
      "We could not create the account with that information. Please check it and try again.",
    "err.token_invalido": "The link is invalid or has expired.",
    "err.credenciales_invalidas": "Incorrect email or password.",
    "err.cuenta_desactivada": "This account is disabled.",
    "err.cuenta_no_us": "This account does not belong to the US course.",
    "err.correo_no_verificado": "You must verify your email before continuing.",
    "err.correo_ya_verificado": "Your email is already verified.",
    "err.precio_no_configurado": "The course is not open for enrollment yet.",
    "err.metodo_invalido": "That payment method is not available.",
    "err.inscripcion_existente": "You already have an active enrollment.",
    "err.inscripcion_no_encontrada": "We could not find your enrollment.",
    "err.estado_pago_invalido":
      "This enrollment does not allow that action in its current state.",
    "err.agencia_invalida":
      "Choose a valid agency or app for that type of transfer.",
    "err.control_invalido": "The control number is not valid.",
    "err.remitente_invalido":
      "Enter the name of the person who sent the money.",
    "err.monto_invalido": "The amount sent is not valid.",
    "err.monto_menor":
      "The amount sent (not counting the fee) is less than the course price.",
    "err.fecha_invalida": "The transfer date is not valid.",
    "err.comprobante_invalido":
      "Upload the photo of your receipt before submitting.",
    "err.ref_duplicada":
      "That control number was already registered with that agency.",
    "err.motivo_requerido": "Enter the reason.",
    "err.monto_recibido_invalido":
      "Enter the amount received in Dominican pesos (RD$).",
    "err.config_clave_invalida": "That configuration key does not exist.",
    "err.config_valor_invalido": "The value is not valid for that setting.",
    "err.config_incompleta":
      "The course cannot be activated: the price or an active payment method is missing.",
    "err.progreso_conflicto":
      "This student already has progress in another program; it cannot be confirmed.",
    "err.proveedor_no_disponible": "Route not found.",
    "err.material_no_encontrado": "Material not found.",
    "err.sin_acceso": "You do not have access to this content yet.",
    "err.curso_sin_pago": "You need a confirmed payment to access the course.",
    "err.no_encontrado": "Not found.",
    "err.error_interno": "Something went wrong. Please try again.",
  },
);
