# Historial de modificaciones — Muvo RD Vial

> Registro breve por sesión. El estado actual y detallado del sistema vive en
> ARQUITECTURA_BACKEND.md, ARQUITECTURA_FRONTEND.md y DATABASE.md, este
> archivo es solo un changelog, no la fuente de verdad de cómo funciona nada.

## 26/07/2026 — Barra de progreso ilustrada + fix de detección de diploma

- Nueva components/dashboard/ProgresoCarretera.tsx: camino horizontal con
  asfalto negro, línea central intermitente + zona de no rebasar, línea de
  arrancada, libros con check por examen aprobado, parada de práctica
  (siempre neutra, no se rastrea), y bandera de meta que se pinta de color
  cuando el diploma ya existe.
- Se exploraron 3 conceptos visuales distintos antes de decidir (autopista
  horizontal, camino serpenteante vertical, y la versión final horizontal
  compacta con detalles reales de carretera).
- Fix real encontrado por Ramon: el carrito se quedaba parado en "Práctica"
  aunque el diploma ya estuviera generado, porque dashboard/page.tsx nunca
  consultaba GET /diplomas/me. Se corrigió: ahora, cuando
  progreso.cursoCompletado es true, también se pregunta por el diploma y se
  le pasa ese dato al componente (diplomaListo).

## 25-26/07/2026 — Sistema de notificaciones (email + Telegram) + verificación

- Nueva colección/CRUD destinatariosNotificacion (admin), con avisos por
  Resend y Telegram Bot API cuando llega un voucher nuevo.
- Plantilla de correo compartida con logo + colores de marca en
  utils/notificaciones.js, extendida a 5 correos distintos: verificación de
  cuenta, pago confirmado, pago rechazado (con motivo), diploma listo, y
  recuperación de contraseña.
- Verificación de email al registrarse (emailVerificado, con link válido
  24h) — no bloquea el login, solo bloquea POST /inscripciones/mia.
- Recuperación de contraseña completa (olvide-password / restablecer-password).
- Rediseño de generarBalancePDF() (tarjetas de totales + tabla de
  categorías) y fix de la descarga sin extensión .pdf en Contabilidad,
  aplicando el mismo patrón que ya funcionaba en diplomas.
- Recordatorio automático de balance mensual pendiente: sin cron (Render se
  duerme en el tier free), se revisa cada vez que un admin abre la app
  (GET /auth/perfil), con un marcador en Configuracion para no repetir el
  aviso sobre el mismo mes.
- **Bug de build en Vercel:** app/verificar-email/page.tsx usaba
  useSearchParams() sin <Suspense>, lo que hace fallar next build al
  pre-renderizar. Corregido, y se aplicó <Suspense> desde el inicio en
  restablecer-password/page.tsx para no repetir el error.
- **Hallazgo crítico (prioridad #1 actual):** Resend con el dominio de
  pruebas (onboarding@resend.dev) solo permite enviar al correo del dueño
  de la cuenta de Resend — confirmado en el log real de Resend (403 en
  todos los envíos a otras direcciones). Hoy ningún correo dirigido a una
  estudiante real llega. Requiere comprar y verificar un dominio propio en
  Resend antes de invitar estudiantes reales. Telegram no tiene esta
  restricción y funciona bien para avisos internos.

## 25/07/2026 — Auto-inscripción con voucher + reorganización de documentación

- Nuevo flujo de auto-inscripción: la estudiante elige plan, sube su propio
  comprobante de depósito/transferencia sin que la coordinadora tenga que
  crear nada primero. Backend: Inscripcion gana 4 campos + 2 estados nuevos
  (pendiente_verificacion, rechazado); nuevos endpoints POST /inscripciones/mia
  y PATCH /:id/rechazar-pago. Frontend: app/inscripcion/page.tsx (con
  contenido de marketing y fotos reales del curso), dashboard/page.tsx
  maneja los 4 estados de pago, panel/pagos/page.tsx tiene cola de
  verificación con comprobante visible.
- Fix: POST /api/uploads/imagen estaba restringido a coordinadora/admin, se
  agregó el rol estudiante.
- Precios de planes actualizados en configuracion: Normal RD$1,000, VIP RD$7,000.
- Se consolidaron los 6 documentos de contexto en 4 (esta reorganización).
- Análisis de factibilidad de pasarela de pago en RD entregado. Decisión
  final tomada por la fundadora: NO se implementará Azul por ahora, la
  transferencia manual con auto-inscripción ya resuelve la necesidad real.

## 24-25/07/2026 — Panel de administración a tarjetas

- app/(coordinadora)/panel/page.tsx: pantalla de tarjetas con íconos
  (lucide-react) agrupadas en "Gestión del curso", "Contenido público" y
  "Solo fundadora" (solo admin). Reemplaza la barra de pills que existía antes.
- panel/layout.tsx y admin/layout.tsx simplificados a solo header + link volver.
- Se actualizó Next.js de 16.2.10 a 16.2.11 (parche), resolviendo 3 de 4
  vulnerabilidades high de npm audit. Queda pendiente 1 (brace-expansion vía
  ESLint), requiere salto de versión mayor, no urgente.

## 22-23/07/2026 — Open Graph + bug crítico de detalle de noticia

- Open Graph completo: metadataBase/openGraph/twitter, og-image.png,
  generateMetadata dinámico en noticias/[id]/page.tsx. Verificado en
  Facebook/WhatsApp.
- Bug encontrado: la sesión de paginación anterior había pegado por error
  el código del listado encima del detalle de noticia — se recuperó desde
  git y se restauró.
- Análisis de factibilidad de pasarela de pago en RD entregado (ver arriba,
  decisión final tomada el 25/07).

## 22/07/2026 — Sesión larga: correcciones + paginación

- Firma del diploma, rebranding a "Muvo RD Vial", fix de embeds de YouTube,
  correctas/incorrectas por pregunta en el examen, progreso automático entre
  sesiones con espera de 24h entre exámenes, logo circular + favicon nuevos,
  incidente de dominio en Vercel resuelto.
- Paginación implementada en Estudiantes, Noticias y Movimientos contables.

## Antes del 22/07/2026 — Construcción inicial (backend + frontend)

Ver ARQUITECTURA_BACKEND.md y ARQUITECTURA_FRONTEND.md para el resultado
final de esta etapa. Resumen: autenticación JWT sin cookies, 3 roles,
flujo completo de inscripción -> pago -> 3 sesiones con contenido y examen
-> diploma con descarga firmada desde Cloudinary, panel de coordinadora/
admin con CRUD de noticias/testimonios/FAQ/contenido de página/contabilidad.

---

## Pendientes abiertos (no resueltos, de cualquier sesión)

### Prioridad #1

- **Verificar un dominio propio en Resend** — sin esto, ningún correo
  dirigido a una estudiante real llega (verificación, confirmación/rechazo
  de pago, recuperación de contraseña). Pendiente de decisión/compra por
  parte de la fundadora.

### Decisiones ya tomadas (cerradas, dejadas aquí solo como registro)

- Pasarela de pago automática (Azul): NO se hará. Cerrado.
- Limpieza de datos de prueba en Mongo: se pospone a propósito, se
  retomará más adelante.
- /verificar-diploma: se queda pública (ya no está en el navbar).
- Kit de Preparación y Contacto: se quedan como contenido estático por ahora.
- Seguridad/confiabilidad (rate limiting, CORS dinámico, Sentry, tests):
  al final, cuando la app esté más madura.

### Mejoras menores sin empezar

- Badge con el conteo de "pendientes por verificar" en la tarjeta "Pagos" del panel.
- "Me gusta" en comentarios individuales de noticias.
- Confirmar que el número de cuenta bancaria real en app/inscripcion/page.tsx
  quedó bien colocado (Ramon lo puso directamente, pendiente de que Claude
  vea el archivo para confirmarlo formalmente).

## 26/07/2026 (continuación) — Migración de Vercel + notificaciones Telegram + badge de conteo

- El frontend ahora se despliega en una cuenta de Vercel de la fundadora
  (correo propio, para que ella pueda comprar el dominio con su tarjeta sin
  involucrar a Ramon). **Nueva URL de producción: `https://muvo-rd.vercel.app/`**
  — reemplaza a `mav-rd-vial.vercel.app`. Recordar actualizar `FRONTEND_URL`
  en Render si no se hizo ya, y verificar que quedó bien propagado.
- Se completó la configuración de Telegram para el celular de Ramón: bot
  creado con BotFather, token obtenido, `chat_id` (`781494260`) agregado
  como destinatario en el panel de Notificaciones, y probado con éxito.
- **Pendiente:** repetir el mismo proceso de Telegram para el celular de la
  fundadora (ella necesita escribirle al bot y sacar su propio `chat_id` —
  es distinto al de Ramón — y agregarlo como segundo destinatario).
- **Pendiente/recomendado:** el token del bot de Telegram quedó escrito en
  texto plano durante esta sesión de configuración — vale la pena
  regenerarlo con BotFather (`/mybots` → seleccionar el bot → API Token →
  Revoke current token) y actualizar `TELEGRAM_BOT_TOKEN` en Render con el
  nuevo, para invalidar el que quedó expuesto.
- Se implementó el badge de conteo pendiente en la tarjeta "Pagos" del
  panel (`app/(coordinadora)/panel/page.tsx`) — círculo con número que
  muestra cuántos vouchers están en `pendiente_verificacion`, reusando el
  endpoint `GET /inscripciones?estadoPago=pendiente_verificacion` que ya
  existía. Sin backend nuevo.

## Pendientes abiertos actualizados (reemplaza la lista anterior de esta sección)

### Prioridad #1

- Verificar un dominio propio en Resend — sigue siendo el bloqueante real
  para que cualquier correo le llegue a una estudiante que no sea la cuenta
  con la que se registró Resend. Ahora que el proyecto vive en la cuenta de
  Vercel de la fundadora, tiene sentido que el dominio (si se compra) se
  gestione también desde ahí.

### Pendiente corto, ya identificado

- Terminar Telegram para el celular de la fundadora (ver arriba).
- Regenerar el token del bot de Telegram por seguridad (ver arriba).
- Confirmar que `FRONTEND_URL` en Render apunta a `https://muvo-rd.vercel.app`.

### Decisiones ya cerradas (sin cambios)

- Pasarela de pago automática (Azul): no se hará.
- Limpieza de datos de prueba en Mongo: pospuesta a propósito.
- /verificar-diploma: pública a propósito.
- Kit de Preparación y Contacto: contenido estático por ahora.
- Seguridad/confiabilidad (rate limiting, CORS dinámico, Sentry, tests): al final.

### Mejoras menores sin empezar

- "Me gusta" en comentarios individuales de noticias.
