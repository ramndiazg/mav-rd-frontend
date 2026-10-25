import { definir } from "./definir";

// Registro, inicio de sesión, verificación de correo y recuperación de
// contraseña de /us.
export const cuenta = definir(
  {
    "campo.nombre": "Nombre",
    "campo.apellido": "Apellido",
    "campo.telefono": "Teléfono (EE. UU.)",
    "campo.telefonoAyuda": "10 dígitos, por ejemplo (212) 555-0100.",
    "campo.email": "Correo electrónico",
    "campo.password": "Contraseña",
    "campo.passwordAyuda": "Mínimo 8 caracteres.",
    "campo.passwordNueva": "Nueva contraseña",
    "campo.passwordConfirmar": "Repite la nueva contraseña",
    "campo.estado": "Tu estado",
    "campo.ciudad": "Ciudad (opcional)",
    "campo.fechaNacimiento": "Fecha de nacimiento",
    "campo.fechaAyuda": "Debes tener al menos 16 años.",
    "campo.mostrar": "Mostrar contraseña",
    "campo.ocultar": "Ocultar contraseña",
    "campo.requerido": "Obligatorio",

    "reg.titulo": "Crea tu cuenta",
    "reg.sub": "Es gratis. Solo pagas cuando decidas inscribirte al curso.",
    "reg.acepto": "Acepto los {terminos} y la {privacidad}.",
    "reg.terminos": "términos y condiciones",
    "reg.privacidad": "política de privacidad",
    "reg.debeAceptar":
      "Debes aceptar los términos y la política de privacidad.",
    "reg.enviar": "Crear cuenta",
    "reg.enviando": "Creando cuenta…",
    "reg.yaTienes": "¿Ya tienes cuenta?",
    "reg.revisaCorreo":
      "Revisa tu correo: te enviamos un enlace para verificar tu cuenta.",
    "reg.captcha": "Completa la verificación de seguridad para continuar.",

    "login.titulo": "Inicia sesión",
    "login.sub": "Entra a tu cuenta del curso Driver Prep USA.",
    "login.enviar": "Entrar",
    "login.enviando": "Entrando…",
    "login.olvide": "¿Olvidaste tu contraseña?",
    "login.noTienes": "¿Aún no tienes cuenta?",

    "verify.titulo": "Verificación de correo",
    "verify.verificando": "Verificando tu correo…",
    "verify.ok": "¡Listo! Tu correo quedó verificado.",
    "verify.okSub": "Ya puedes continuar con tu inscripción.",
    "verify.error": "No pudimos verificar tu correo.",
    "verify.errorSub":
      "El enlace puede haber vencido. Inicia sesión y pide uno nuevo desde tu cuenta.",
    "verify.sinToken":
      "Falta el enlace de verificación. Abre el enlace que te enviamos por correo.",
    "verify.continuar": "Continuar con mi inscripción",
    "verify.irLogin": "Iniciar sesión",

    "forgot.titulo": "Recupera tu contraseña",
    "forgot.sub":
      "Escribe tu correo y te enviamos un enlace para crear una nueva.",
    "forgot.enviar": "Enviar enlace",
    "forgot.enviando": "Enviando…",
    "forgot.listo":
      "Si ese correo tiene una cuenta, te enviamos un enlace. Revisa también tu carpeta de spam.",
    "forgot.volver": "Volver a iniciar sesión",

    "reset.titulo": "Crea una nueva contraseña",
    "reset.enviar": "Guardar contraseña",
    "reset.enviando": "Guardando…",
    "reset.noCoinciden": "Las contraseñas no coinciden.",
    "reset.listo": "Tu contraseña fue cambiada. Ya puedes iniciar sesión.",
    "reset.sinToken":
      "Falta el enlace para cambiar la contraseña. Pide uno nuevo.",
    "reset.pedirOtro": "Pedir un enlace nuevo",
  },
  {
    "campo.nombre": "First name",
    "campo.apellido": "Last name",
    "campo.telefono": "Phone (U.S.)",
    "campo.telefonoAyuda": "10 digits, for example (212) 555-0100.",
    "campo.email": "Email",
    "campo.password": "Password",
    "campo.passwordAyuda": "At least 8 characters.",
    "campo.passwordNueva": "New password",
    "campo.passwordConfirmar": "Repeat the new password",
    "campo.estado": "Your state",
    "campo.ciudad": "City (optional)",
    "campo.fechaNacimiento": "Date of birth",
    "campo.fechaAyuda": "You must be at least 16 years old.",
    "campo.mostrar": "Show password",
    "campo.ocultar": "Hide password",
    "campo.requerido": "Required",

    "reg.titulo": "Create your account",
    "reg.sub":
      "It's free. You only pay when you decide to enroll in the course.",
    "reg.acepto": "I accept the {terminos} and the {privacidad}.",
    "reg.terminos": "terms and conditions",
    "reg.privacidad": "privacy policy",
    "reg.debeAceptar": "You must accept the terms and the privacy policy.",
    "reg.enviar": "Create account",
    "reg.enviando": "Creating account…",
    "reg.yaTienes": "Already have an account?",
    "reg.revisaCorreo":
      "Check your email: we sent you a link to verify your account.",
    "reg.captcha": "Complete the security check to continue.",

    "login.titulo": "Log in",
    "login.sub": "Sign in to your Driver Prep USA account.",
    "login.enviar": "Log in",
    "login.enviando": "Logging in…",
    "login.olvide": "Forgot your password?",
    "login.noTienes": "Don't have an account yet?",

    "verify.titulo": "Email verification",
    "verify.verificando": "Verifying your email…",
    "verify.ok": "Done! Your email is verified.",
    "verify.okSub": "You can now continue with your enrollment.",
    "verify.error": "We could not verify your email.",
    "verify.errorSub":
      "The link may have expired. Log in and request a new one from your account.",
    "verify.sinToken":
      "The verification link is missing. Open the link we emailed you.",
    "verify.continuar": "Continue with my enrollment",
    "verify.irLogin": "Log in",

    "forgot.titulo": "Recover your password",
    "forgot.sub":
      "Enter your email and we will send you a link to create a new one.",
    "forgot.enviar": "Send link",
    "forgot.enviando": "Sending…",
    "forgot.listo":
      "If that email has an account, we sent you a link. Also check your spam folder.",
    "forgot.volver": "Back to log in",

    "reset.titulo": "Create a new password",
    "reset.enviar": "Save password",
    "reset.enviando": "Saving…",
    "reset.noCoinciden": "The passwords do not match.",
    "reset.listo": "Your password was changed. You can now log in.",
    "reset.sinToken": "The password reset link is missing. Request a new one.",
    "reset.pedirOtro": "Request a new link",
  },
);
