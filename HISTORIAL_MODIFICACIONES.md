# Historial de modificaciones — Muvo RD Vial

> Registro breve por sesión. El estado actual y detallado del sistema vive en
> ARQUITECTURA_BACKEND.md, ARQUITECTURA_FRONTEND.md y DATABASE.md, este
> archivo es solo un changelog, no la fuente de verdad de cómo funciona nada.

## 03/08/2026 — Análisis de funcionalidades futuras

- Sesión de brainstorm sobre hacia dónde crecer la app, en tres direcciones
  posibles: escuela virtual genérica (catálogo de cursos, no solo manejo),
  escuela de choferes (cerrar la brecha de la práctica, que hoy vive 100%
  fuera del sistema — sin agenda, sin instructor/vehículo asignado, sin
  checklist), y página de contenido (categorías, buscador, newsletter,
  "me gusta" por comentario). Se sumó una cuarta idea no planteada
  originalmente: página de donaciones, reusando el patrón de pago con
  voucher que ya existe para inscripciones.
- Idea del foro/preguntas por sesión: descartada por ahora a propósito —
  la app aún no entra en producción con estudiantes reales, y no se sabe
  todavía si las alumnas van a interactuar con contenido más allá del
  curso. Se deja para una segunda etapa, después de validar con las
  primeras estudiantes reales.
- De las cuatro direcciones, la brecha de la práctica (escuela de
  choferes) quedó identificada como la más natural de cerrar a futuro —
  es la única parte del flujo completo "aprender a manejar" que hoy no
  vive en el sistema. No se empezó a construir nada de esto todavía, solo
  quedó el análisis.

## 01-03/08/2026 — Rediseño de ProgresoCarretera + cierre de pendientes cortos

- **Barra de progreso**: rediseño completo de
  components/dashboard/ProgresoCarretera.tsx — antes era estática, ahora
  tiene el tramo recorrido de la carretera pintado de color (el camino
  mismo muestra el avance), el carrito se desliza con transición suave en
  vez de saltar, mensaje motivacional debajo del contador que cambia según
  la etapa, y un destello de celebración cuando el diploma queda listo
  (único momento llamativo del componente, a propósito). Todo respeta
  prefers-reduced-motion. dashboard/page.tsx también ganó íconos por
  estado en las tarjetas de sesión y una entrada escalonada al cargar.
  Antes de construirlo se probó una demo interactiva simplificada fuera
  del código real, para validar la ubicación y el tono de los mensajes
  antes de tocar el componente de verdad.
- **Cuenta bancaria en inscripción**: confirmada correcta (Banco Popular
  Dominicano y Banco De Reservas). Se le agregó un botón "Copiar" por
  cuenta en app/inscripcion/page.tsx, con feedback visual de "Copiado".
  Se quitó el comentario TODO viejo, ya resuelto.
- **FRONTEND_URL en Render**: confirmado apuntando a
  https://muvo-rd.vercel.app.
- **Token del bot de Telegram**: regenerado (el original había quedado
  expuesto en texto plano durante la configuración) y actualizado en
  Render.
- Se evaluó automatizar un recordatorio de backup desde el panel de admin
  (mismo patrón que el de balance mensual) — se decidió no hacerlo, el
  backup se queda 100% manual (ver también la entrada del 31/07/2026).

## 31/07/2026 — Backup manual redundante (Docker local + Dropbox cifrado)

- Se armó un mecanismo de backup manual, fuera de Atlas por completo, para
  cubrir que el cluster es M0 (gratis) y Atlas no ofrece ningún backup
  automático en ese tier.
- Dos scripts, `backup-config.bat` (secretos, nunca se sube a git) y
  `backup-muvo.bat`, viven localmente en la PC de Ramon (Windows), fuera
  del repo, y se corren manualmente con doble clic cuando Ramon lo decide
  (ej. al recibir un aviso de Telegram de un voucher nuevo).
- Flujo del script: `mongodump` desde Atlas con un usuario de Atlas de
  solo lectura (`backup_readonly`, rol `readAnyDatabase@admin` — funciona
  pero es más amplio de lo necesario ya que el cluster es compartido;
  quedó pendiente afinarlo a un rol Read específico sobre `mav_rd`) →
  restaura a un MongoDB local en Docker (`mongodb://localhost:27018/mav_rd`,
  contenedor `mavrd-backup-db`, red `mavrd-backup-net`) → cifra el dump
  con 7-Zip y contraseña → copia el `.7z` cifrado a una carpeta local
  sincronizada con Dropbox → limpia backups locales viejos dejando los
  últimos 5.
- Imagen de Docker fijada a `mongo:8.0` (no `mongo:7` ni `mongo:8`
  genérico) para que coincida con la versión real de Atlas (`8.0.29`) y
  evitar advertencias de cross-version restore que podrían corromper la
  restauración. **Revisar este tag si Atlas sube de versión mayor.**
- Probado de punta a punta: dump real, restore de 179 documentos sin
  fallos, cifrado y copia a Dropbox exitosos.
- Decisión tomada: se queda 100% manual, sin botón ni automatización desde
  el panel de admin. Se evaluó un recordatorio automático (mismo patrón
  que el de balance mensual: marcador en Configuracion + aviso por
  Telegram al abrir la app) y se descartó por ahora a propósito — Render
  no puede ejecutar nada en la PC de Ramon de todas formas, así que la
  automatización real solo hubiera cubierto el recordatorio, no el backup
  en sí.

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

### Bloqueado hasta la próxima reunión con la fundadora

Todo lo que depende de ella queda detenido a propósito hasta esa reunión:

- **Prioridad #1**: comprar el dominio en Vercel (ella paga la
  suscripción) y verificarlo en Resend — sigue siendo el bloqueante real
  para que cualquier correo le llegue a una estudiante que no sea la
  cuenta con la que se registró Resend. Manual paso a paso ya entregado
  a Ramon para cuando se retome.
- Terminar Telegram para el celular de la fundadora (sacar su `chat_id`
  y agregarlo en el panel de Notificaciones). Manual paso a paso ya
  entregado.

### Cerrado desde la última actualización

- ~~Regenerar el token del bot de Telegram~~ — hecho, actualizado en Render.
- ~~Confirmar que FRONTEND_URL en Render apunta a muvo-rd.vercel.app~~ — confirmado.
- ~~Confirmar cuenta bancaria real en app/inscripcion/page.tsx~~ — confirmada, y se le agregó botón de copiar.
- ~~Barra de progreso "muy sencilla"~~ — rediseñada con animaciones, ver entrada 01-03/08/2026.

### Decisiones ya cerradas (sin cambios)

- Pasarela de pago automática (Azul): no se hará.
- Limpieza de datos de prueba en Mongo: pospuesta a propósito.
- /verificar-diploma: pública a propósito.
- Kit de Preparación y Contacto: contenido estático por ahora.
- Seguridad/confiabilidad (rate limiting, CORS dinámico, Sentry, tests): al final.
- Recordatorio/botón de backup automatizado desde el panel de admin:
  evaluado, descartado por ahora — el backup se mantiene 100% manual.
- Foro/preguntas por sesión: pospuesto a una segunda etapa, después de
  validar con las primeras estudiantes reales (ver entrada 03/08/2026).

### Mejoras menores sin empezar

- "Me gusta" en comentarios individuales de noticias.
- Afinar el rol del usuario `backup_readonly` en Atlas de
  `readAnyDatabase@admin` a un rol Read específico sobre `mav_rd` (mínimo
  privilegio, no urgente ya que es de solo lectura de todas formas).

### Ideas a futuro (solo análisis, nada construido)

- Cerrar la brecha de la práctica en vehículo (agenda, instructor/vehículo,
  checklist de habilidades) — la dirección más natural a seguir según el
  análisis del 03/08/2026.
- Catálogo de cursos genérico (expandir más allá del curso de manejo).
- Mejoras al sitio de noticias: categorías, buscador, newsletter.
- Página de donaciones, reusando el patrón de pago con voucher existente.
