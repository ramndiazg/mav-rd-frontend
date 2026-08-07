# Historial de modificaciones — Muvo RD Vial

> Registro breve por sesión. El estado actual y detallado del sistema vive en
> ARQUITECTURA_BACKEND.md, ARQUITECTURA_FRONTEND.md y DATABASE.md, este
> archivo es solo un changelog, no la fuente de verdad de cómo funciona nada.

## 06-07/08/2026 — Diploma compartible, ampliación a 4 sesiones, audiencia inclusiva, purga de datos de prueba

### Diploma compartible en redes sociales — construido de principio a fin

Empezó como el pendiente #1 de la sesión anterior ("diseñado, sin
construir"). Primera versión: ícono de volante dibujado en canvas,
degradado azul/rosa, código de diploma visible. Feedback del usuario tras
verla: no se parecía a la marca real, faltaba el logo, y no había ningún
link para que contactos interesados llegaran a la app.

Se pidió el logo real (`public/logo-mav-rd.png` — azul marino `#08244B`,
dorado `#F8CB1A`, rojo `#D11523`) y se iteró el diseño con mockups en
vivo antes de tocar código (usando el visualizador de la conversación,
no archivos reales) hasta cerrar: foto real de fondo (buscada y elegida
de Unsplash, licencia libre — `person driving car during daytime` de
Stephan Mahlke — descargada a `public/diploma-compartir.jpg` porque el
`<canvas>` necesita imágenes del mismo origen o `toBlob()` falla en
silencio por contaminación CORS), logo real superpuesto, sin código de
diploma en la imagen (se decidió que ese dato se quede solo en la
tarjeta del PDF), mensaje motivador enmarcado como oportunidad, y un
bloque con QR + link a la página de inicio. Se agregó la dependencia
`qrcode` (+ `@types/qrcode`) para generar el QR 100% en el navegador.

Colores: se probó una paleta tomada directo del logo (azul marino/
dorado/rojo) pero se descartó — el degradado azul/rosa de marca que ya
se había mostrado antes gustó más, así que se mantuvo para el fondo,
reservando los colores del logo solo para el logo mismo.

Pendiente: agregar una sección "Lo que aprendiste" con los temas reales
del curso — se dejó fuera porque los 4 temas todavía no están definidos
(ver más abajo).

### Ampliación de 3 a 4 sesiones

El usuario preguntó qué tan difícil sería este cambio y dónde afectaría,
antes de tocar nada — se hizo un análisis archivo por archivo (10 en
total, backend y frontend) antes de escribir código.

Hallazgo principal: casi toda la lógica de negocio (`intentarDesbloquear`
en `examenController.js`, `ContenidoSesion`, `ProgresoEstudiante`,
`contenidoSesionController.js`, rutas dinámicas `aula-virtual/[sesion]` y
`examen/[intentoId]`) ya estaba escrita de forma genérica, sin el número
3 quemado. Los cambios reales quedaron acotados a 4 lugares:

1. `models/Sesion.js`: `numero` tenía `max: 3` a nivel de esquema de
   Mongoose — el verdadero candado del sistema, hubiera rechazado
   cualquier intento de crear una Sesión 4 sin importar que el resto del
   código ya generalizara bien. Cambiado a `max: 4`.
2. `intentoExamenController.js`, dentro de `entregarIntento`: tres
   números `3` quemados (avance de teoría, corte de "próxima sesión con
   espera", umbral de `cursoCompletado`) — cambiados a `4`.
3. `components/dashboard/ProgresoCarretera.tsx`: rediseño de 6 a 7
   paradas (se agregó Sesión 4), posiciones recalculadas manteniendo
   Inicio y Diploma en los mismos extremos para no tocar la carretera
   base; mismo patrón de "salto visual" que ya existía con la Sesión 3
   (el carrito no pausa en la última sesión de teoría, salta directo a
   Práctica).
4. `app/dashboard/page.tsx`: `SESIONES = [1,2,3,4]` + corrección de copy.

### Audiencia ampliada: el curso ya no es solo para mujeres

Decisión de negocio comunicada a mitad de la sesión: el curso pasa a
incluir adolescentes de ambos sexos, además de mujeres. Se aplicó
lenguaje neutral a todo lo que se tocó de aquí en adelante (instrucción
explícita del usuario: cambiar donde se toque, no hacer una pasada
retroactiva de todo el sitio en este momento).

Archivos corregidos: `app/page.tsx` (inicio — nombre actualizado a "Muvo
RD Vial", título principal y CTA sin adjetivos de género, "tres
sesiones" generalizado a "en sesiones" para no quedar desactualizado),
`kit-preparacion/page.tsx` (metadata title + "ya estarás lista" → "ya
tendrás lo necesario"), `inscripcion/page.tsx` ("embajadoras" →
"embajadores", coincidiendo con el logo real; "otras estudiantes" →
"tus compañeros de curso"; "el chofer" → "quien te instruye"). Los
testimonios existentes (Rosa M., Yolanda P.) se dejaron intactos a
propósito — son citas reales, reescribirlas cambiaría lo que esas
personas realmente dijeron.

Confirmado sin cambios necesarios: `aula-virtual/[sesion]/page.tsx`,
`examen/[intentoId]/page.tsx`, `faq/page.tsx`.

Pendiente: `testimonios/page.tsx`, `registro/page.tsx` (sin revisar
todavía), y las fotos de `public/inscripcion/` (probablemente muestran
solo mujeres, de clases anteriores al cambio de audiencia — reemplazo es
trabajo de contenido, no de código).

### Purga completa de datos de prueba

Ya estaba planeada de antes ("pospuesta hasta que la app esté lista para
producción", con instrucción de hacerse por terminal, nunca desde la
UI). Se aprovechó este momento porque, con el cambio a 4 sesiones, había
que reorganizar y recargar contenido real de todas formas.

Se construyó `scripts/purgarDatosPrueba.js` (dry-run por defecto,
requiere `--confirmar` + escribir `BORRAR` a mano) en vez de un
`deleteMany` genérico. Alcance confirmado con el usuario antes de
escribirlo: sobrevive únicamente `maria@test.com` (admin); se borran
todos los demás usuarios (estudiante y coordinadora, sin excepción),
todas las `Sesion` (con sus exámenes, para reconstruir desde cero según
el material real que hay que clasificar), y en cascada `Examen`,
`ContenidoSesion`, `IntentoExamen`, `ProgresoEstudiante`, `Inscripcion`,
`Diploma`.

Corrido en modo real el 06/08/2026. Conteos purgados: 17 usuarios, 3
sesiones, 15 exámenes, 22 contenidos de sesión, 30 intentos de examen,
11 progresos de estudiante, 13 inscripciones, 6 diplomas — ver
DATABASE.md para el detalle completo.

### Hueco descubierto: no existe forma de crear sesiones desde el panel

Al purgar y quedarse con 0 sesiones, se descubrió que
`sesionController.js` nunca tuvo un endpoint `POST /sesiones` — solo
`GET` (listar), `GET /:numero` (para la estudiante) y `PATCH /:numero`
(editar una que ya existe). Las 3 sesiones originales se habían creado
directo en Atlas, a mano. Esto explicaba tres síntomas reportados por el
usuario a la vez: "Sesión no encontrada" al entrar como estudiante nueva,
el botón de "agregar contenido" que no aparecía en el panel, y el examen
que "se creaba" pero sin dónde asignarlo (en realidad nunca se guardaba:
`sesionId` quedaba `null` porque no había pestañas de sesión que
seleccionar, y el mensaje de validación del formulario era engañoso —
decía "completa los campos" incluso con todo lleno).

Solución adoptada: `scripts/crearSesionesIniciales.js` (mismo patrón
dry-run + `--confirmar`) en vez de construir el endpoint — es una
operación de una sola vez. Creado pero **todavía sin ejecutar** al cierre
de esta sesión de trabajo.

También quedó anotado, pero pospuesto a propósito: el panel de
coordinadora tampoco tiene un formulario para _renombrar_ una sesión
(el backend sí lo permite vía `PATCH /sesiones/:numero`, el frontend no
tiene pantalla que lo use) — se retoma cuando haga falta.

### Pendiente real, en orden, para la próxima sesión

1. Correr `scripts/crearSesionesIniciales.js --confirmar`.
2. Definir los 4 temas del curso con la fundadora.
3. Clasificar y organizar el material real disponible por tema.
4. Crear las 4 `Sesion` con títulos finales (renombrar las provisionales).
5. Subir `ContenidoSesion` y crear versiones de `Examen` para cada una.
6. Probar de punta a punta con una cuenta de estudiante nueva.
7. Agregar la sección "Lo que aprendiste" al diploma compartible una vez
   estén los temas.
8. Revisar lenguaje de género pendiente en `testimonios` y `registro`.

## Corrección pendiente de documentación (detectada, no resuelta)

Al pasar el archivo de diploma en la sesión del 04/08/2026 se reveló que
vive en `app/(estudiante)/diploma/page.tsx`, no en `app/diploma/page.tsx`
como estaba documentado (ver ARQUITECTURA_FRONTEND.md, sección de
estructura de carpetas). Existe un grupo de ruta `(estudiante)` no
documentado hasta ahora. **Pendiente confirmar** si `dashboard`,
`aula-virtual`, `examen`, `inscripcion` y `perfil/cambiar-password`
también viven bajo ese mismo grupo o si `diploma` es la excepción —
corregir ARQUITECTURA_FRONTEND.md con la estructura real la próxima vez
que se toque cualquiera de esas páginas.

## 04/08/2026 — Cierre del anexo: exámenes/contenido desactivables + pestañas de estudiantes

- Se cerró el anexo de continuidad que había quedado pendiente de una
  sesión anterior (purga de usuarios de prueba + soft delete/versionado +
  panel de estudiantes menos cargado con el tiempo). Decisión tomada por
  Ramon: la pestaña **Graduadas** se queda **separada** de **Inactivas**
  (se descartó la idea de una pestaña "Historial" combinada).
- Confirmado por revisión de código real (no había que asumir nada):
  `Examen` y `ContenidoSesion` **ya tenían** soporte completo de
  `activo`/soft delete desde antes de esta sesión — no hizo falta tocar
  ningún modelo ni controlador de esos dos. `eliminarExamen` y
  `eliminarContenido` ya eran soft delete puro (nunca borran físico), y
  ambos listados ya separaban lo que ve la estudiante (`activo: true`) de
  lo que administra el panel (todo, incluidos inactivos).
- **Backend nuevo — `GET /api/diplomas`** (`listarTodos` en
  `diplomaController.js`): coordinadora/admin, devuelve todos los diplomas
  generados. Mismo patrón que ya se usaba con `GET /inscripciones` para
  cruzar estados en el frontend.
- **Backend — `usuarioController.js`:** `listarUsuarios` gana el query
  param `conDiploma` (true/false), que filtra a nivel de base de datos
  cruzando contra la colección `Diploma` — necesario para que la
  paginación (`totalPaginas`/`totalDocumentos`) salga exacta en cada
  pestaña del panel, en vez de resolverse en el frontend después de traer
  los datos.
- **Frontend — `panel/estudiantes/page.tsx` rediseñado** con 3 pestañas
  (Activas / Graduadas / Inactivas) y botón de Archivar/Reactivar cuenta
  en el detalle de cada estudiante (usa el `PATCH /usuarios/:id/estado`
  que ya existía desde antes, sin cambios de backend para eso).
- **Fix de React (2 rondas):** el patrón de carga inicial disparaba el
  warning nuevo `react-hooks/set-state-in-effect`. Se resolvió moviendo
  `cargarLista` a `useCallback([token])` (identidad estable entre
  renders) y dejando que el `useEffect` de carga dependa de
  `[token, pestana, cargarLista]` directamente, sin resetear estado
  (`setPagina`) de forma manual dentro del cuerpo del efecto — el reseteo
  de página/búsqueda ahora vive en `cambiarPestana()`, que es un
  manejador de evento, no un efecto.
- Subido a Render (backend) y Vercel (frontend) y probado — funcionando.
- El anexo de continuidad que traía todo este análisis ya puede borrarse
  — todo lo aplicable quedó integrado aquí y en ARQUITECTURA_BACKEND.md /
  ARQUITECTURA_FRONTEND.md.
- **Corrección de un error propio:** en esta misma sesión Claude había
  listado por error "badge de pendientes por verificar en la tarjeta de
  Pagos" como pendiente — ya estaba resuelto desde el 26/07/2026 (ver esa
  entrada más abajo), fue un dato tomado de una lista de pendientes vieja
  del propio historial que ya había sido reemplazada. Corregido, sin
  impacto en código.
- **Brainstorm de la próxima funcionalidad grande:** se evaluaron 4 ideas
  (diploma compartible, recordatorio de examen disponible, pedir
  testimonio automático al graduarse, recordatorio de pago
  pendiente/rechazado). Decisión de Ramon: diploma compartible es la
  prioridad inmediata (ver sección de arriba, "Próxima sesión"). Los
  recordatorios de examen disponible y de pago pendiente/rechazado
  interesan pero **solo por correo** (no Telegram, porque no se hace
  activación de Telegram por estudiante) — quedan como ideas a futuro,
  sin diseñar todavía, con una duda de diseño abierta y sin resolver: sin
  cron real (Render se duerme en el tier free), falta decidir un
  disparador confiable para ambos, ya que a diferencia del recordatorio
  de balance mensual (que un admin dispara sin querer al abrir el panel
  seguido), nadie abre la app justo cuando se cumple el plazo de una
  estudiante específica. Pedir testimonio automático se descartó — solo
  se necesitan algunos testimonios, no automatizar la captura.

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

## Pendientes abiertos (reemplaza cualquier lista anterior de esta sección)

### Prioridad #1 — bloqueado hasta la próxima reunión con la fundadora

- **Verificar un dominio propio en Resend** — sin esto, ningún correo
  dirigido a una estudiante real llega (verificación, confirmación/rechazo
  de pago, recuperación de contraseña). Manual paso a paso ya entregado a
  Ramon para cuando se retome. Ella compra el dominio en su cuenta de
  Vercel.
- Terminar Telegram para el celular de la fundadora (sacar su `chat_id` y
  agregarlo en el panel de Notificaciones). Manual paso a paso ya
  entregado.

### Próxima funcionalidad a construir (sin bloqueo, lista para empezar)

- **Diploma compartible en redes sociales** — ver sección al inicio de
  este documento, diseño completo y acordado, solo falta escribir el
  código.

### Corrección de documentación pendiente (sin bloqueo)

- Confirmar y corregir la estructura real de rutas del estudiante en
  ARQUITECTURA_FRONTEND.md — ver sección al inicio de este documento
  ("Corrección pendiente de documentación").

### Ideas a futuro sin diseñar (interesan, pero sin resolver el disparador)

- Recordatorio por correo cuando el examen ya está disponible (pasaron las
  24h de espera).
- Recordatorio por correo de voucher pendiente_verificacion/rechazado sin
  seguimiento después de varios días.
- Ambas comparten la misma duda sin resolver: sin cron real (Render se
  duerme en el tier free), falta decidir un disparador confiable — a
  diferencia del recordatorio de balance mensual, nadie abre la app justo
  cuando se cumple el plazo de una estudiante específica en particular.

### Decisiones ya tomadas (cerradas, dejadas aquí solo como registro)

- Pasarela de pago automática (Azul): NO se hará. Cerrado.
- Limpieza de datos de prueba en Mongo: se pospone a propósito. La purga
  deberá incluir en cascada Inscripcion, IntentoExamen,
  ProgresoEstudiante, Diploma (ya hay 6 diplomas de prueba, confirmado en
  el backup del 31/07/2026) y MovimientoContable de pagos de prueba
  confirmados — no solo el User. Cómo identificar cuáles son de prueba:
  sin definir todavía, revisar juntos cuando llegue el momento.
- /verificar-diploma: se queda pública (ya no está en el navbar).
- Kit de Preparación y Contacto: se quedan como contenido estático por ahora.
- Seguridad/confiabilidad (rate limiting, CORS dinámico, Sentry, tests):
  al final, cuando la app esté más madura.
- Foro/preguntas por sesión: pospuesto a una segunda etapa, después de
  validar con las primeras estudiantes reales.
- Pedir testimonio automáticamente al graduarse: descartado — solo se
  necesitan algunos testimonios, no vale la pena automatizar la captura.
- Recordatorio/botón de backup automatizado desde el panel de admin:
  evaluado, descartado — el backup se mantiene 100% manual.

### Mejoras menores sin empezar

- "Me gusta" en comentarios individuales de noticias.
- Afinar el rol del usuario `backup_readonly` en Atlas de
  `readAnyDatabase@admin` a un rol Read específico sobre `mav_rd` (mínimo
  privilegio, no urgente ya que es de solo lectura de todas formas).

### Ya resuelto (para no volver a preguntarlo)

- Badge de conteo de "pendientes por verificar" en la tarjeta "Pagos" del
  panel — implementado desde el 26/07/2026.
- Panel de estudiantes "que iba a crecer indefinidamente" — resuelto con
  las 3 pestañas (Activas/Graduadas/Inactivas) + archivar cuenta, ver
  entrada 04/08/2026.
- Examen/ContenidoSesion desactivables — confirmado que ya lo soportaban
  ambos desde antes, ver entrada 04/08/2026.
