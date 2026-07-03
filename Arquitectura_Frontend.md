# Arquitectura del Frontend — `mav-rd-frontend`

**Stack:** Next.js (App Router) + Tailwind CSS + despliegue en Vercel

## Estructura de carpetas

```
mav-rd-frontend/
├── app/
│   ├── (publico)/
│   │   ├── page.tsx                    # Inicio
│   │   ├── acerca-de-nosotros/page.tsx
│   │   ├── kit-preparacion/page.tsx    # videos + libro + link INTRANT
│   │   ├── noticias/page.tsx
│   │   ├── noticias/[id]/page.tsx
│   │   ├── testimonios/page.tsx
│   │   ├── faq/page.tsx
│   │   └── verificar-diploma/page.tsx
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── registro/page.tsx
│   ├── (estudiante)/
│   │   ├── dashboard/page.tsx
│   │   ├── aula-virtual/[sesion]/page.tsx
│   │   ├── examen/[intentoId]/page.tsx
│   │   └── diploma/page.tsx
│   ├── (coordinadora)/
│   │   ├── panel/page.tsx
│   │   ├── panel/pagos/page.tsx
│   │   ├── panel/aula-virtual/page.tsx   # desbloquear exámenes
│   │   ├── panel/diplomas/page.tsx
│   │   ├── panel/noticias/page.tsx
│   │   ├── panel/testimonios/page.tsx
│   │   └── panel/faq/page.tsx
│   ├── (admin)/
│   │   └── admin/contabilidad/page.tsx
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                 # botones, cards, inputs (design system propio)
│   ├── layout/              # Navbar, Footer, Sidebar de panel
│   ├── noticias/
│   ├── aula-virtual/
│   └── contabilidad/
├── lib/
│   ├── api.ts               # cliente fetch hacia el backend
│   ├── auth.ts               # helpers de sesión/JWT
│   └── constants.ts
├── public/
│   └── logo.svg
├── tailwind.config.ts        # tokens de color de marca
├── .env.local.example
├── package.json
└── README.md
```

## Tokens de color (Tailwind config)

```js
colors: {
  brand: {
    blue: '#1B3A6B',
    blueLight: '#4A7FC9',
    pink: '#D6336C',
    pinkLight: '#FBE4EC',
  },
  neutral: {
    bg: '#F7F8FA',
    text: '#1F2937',
  },
  status: {
    success: '#2F9E44',
    warning: '#F0A500',
  }
}
```

Tipografía: `Poppins` (títulos) importada de Google Fonts, `Inter` (cuerpo).

## Rutas protegidas por rol

- Middleware de Next.js (`middleware.ts`) verifica el JWT (guardado en cookie
  httpOnly) y redirige según rol:
  - Sin sesión → `/login`
  - `estudiante` sin pago confirmado → dashboard con aviso, sin acceso a aula-virtual
  - `coordinadora` → acceso a `(coordinadora)`
  - `admin` → acceso a `(coordinadora)` + `(admin)`

## Variables de entorno (`.env.local.example`)

```
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

## Notas de diseño (ver frontend-design para dirección visual completa)

- Estilo institucional pero cálido: no plano/genérico, usar la paleta rosa+azul de
  forma intencional (azul para estructura/confianza, rosa para acentos y CTAs).
- Botones de compartir en noticias: Facebook, WhatsApp, X + Web Share API nativo
  (fallback en desktop: copiar link).
- Mobile-first: la mayoría de las estudiantes probablemente acceden desde el celular.

## Testing antes de cada commit importante

- `npm run build` local sin errores antes de hacer push.
- Probar flujo completo en local contra el backend local: registro → login →
  (simular pago confirmado) → aula virtual → examen → diploma.
- Verificar responsive en móvil (Chrome DevTools) antes de desplegar a Vercel.
