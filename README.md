# UTEC Carpool

Plataforma de carpooling exclusiva para estudiantes de UTEC (Barranco, Lima). Conecta conductores y pasajeros que comparten rutas hacia o desde el campus.

## Stack

- **Next.js 15** — App Router, Server & Client Components
- **Supabase** — Auth, PostgreSQL, Storage
- **Tailwind CSS 4** — Config via `globals.css` (@theme, sin `tailwind.config.ts`)
- **Leaflet + React-Leaflet** — Mapas (siempre con `dynamic(() => import(...), { ssr: false })`)
- **OSRM** — Routing de rutas (API pública, sin key)
- **Nominatim** — Geocoding inverso (API pública, sin key)
- **NextAuth** — Solo para OAuth de Google Calendar

## Setup local

```bash
git clone git@github.com:kaloslazo/utec-carpool.git
cd utec-carpool
npm install
cp env.example .env.local
# Completar .env.local con las credenciales reales
npm run dev
```

## Variables de entorno

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto en Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key de Supabase |
| `GOOGLE_CALENDAR_CLIENT_ID` | OAuth client ID de Google |
| `GOOGLE_CALENDAR_CLIENT_SECRET` | OAuth client secret de Google |
| `NEXTAUTH_SECRET` | String aleatorio de 32+ caracteres |
| `NEXTAUTH_URL` | `http://localhost:3000` (local) o URL de Vercel (prod) |

## Base de datos

La migración inicial está en `supabase/migrations/001_initial_schema.sql`.

Después de aplicarla, correr también:

```sql
ALTER TABLE trips ADD COLUMN IF NOT EXISTS allows_detour boolean DEFAULT false;
ALTER TABLE trip_requests ADD COLUMN IF NOT EXISTS dropoff_lat float8;
ALTER TABLE trip_requests ADD COLUMN IF NOT EXISTS dropoff_lng float8;
ALTER TABLE trip_requests ADD COLUMN IF NOT EXISTS dropoff_address text;
```

## Estructura del proyecto

```
app/
├── auth/           # Login y registro
├── onboarding/     # Flujo de 4 pasos al registrarse
├── dashboard/      # Home post-login (Server Component)
├── buscar/         # Buscar viajes disponibles
├── publicar/       # Publicar viaje (solo conductores)
├── viajes/         # Historial y solicitudes
├── perfil/         # Editar perfil y horarios
└── conductor/
    └── verificacion/ # Formulario de verificación de conductor

components/
├── ui/             # Input, Select, FileUpload, DropdownSelect
├── onboarding/     # Steps 1–4 + StepIndicator
├── dashboard/      # DashboardShell (layout con sidebar)
├── MapPicker.tsx   # Mapa interactivo para elegir ubicación
└── RouteMap.tsx    # Mapa de ruta conductor → UTEC con drop-off

lib/
├── supabase/       # createClient (server y client), types
├── constants.ts    # CAREERS, DAYS_OF_WEEK, URLs de OSM/Nominatim
├── matching.ts     # Lógica de matching conductor-pasajero
└── google-calendar.ts
```

## Convenciones

- **Supabase queries**: siempre castear con `(supabase.from("tabla") as any)` — los tipos generados no están configurados aún.
- **Colores**: `--primary: #00BFFF`, `--secondary: #FBBC06`, sidebar: `#0f1c2e`, página: `bg-[#f0f4f9]`.
- **Fuente de headings**: `font-heading` (Bitter).
- **Mapas**: cualquier componente con Leaflet usa `dynamic(..., { ssr: false })`.
- **Español neutro**: sin voseo ni regionalismos argentinos.
- **Punto fijo UTEC**: `lat=-12.1219`, `lng=-77.0282` (Barranco).
