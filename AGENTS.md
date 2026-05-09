# Guía para agentes de IA — UTEC Carpool

## Next.js 15 — diferencias clave

Esta versión tiene breaking changes. Leer `node_modules/next/dist/docs/` antes de escribir código. Respetar los deprecation warnings.

## Convenciones del proyecto

### Supabase
- Todas las queries usan `(supabase.from("tabla") as any)` — los tipos generados no están habilitados aún.
- Cliente servidor: `createClient` desde `@/lib/supabase/server`.
- Cliente browser: `createClient` desde `@/lib/supabase/client`.

### Tailwind CSS 4
- Sin `tailwind.config.ts`. Los tokens están en `app/globals.css` bajo `@theme`.
- Colores: `--primary: #00BFFF`, `--secondary: #FBBC06`, `--dark: #23201f`, `--surface: #e1eeff`.
- Sidebar: `bg-[#0f1c2e]`. Fondo de página: `bg-[#f0f4f9]`. Cards: `bg-white shadow-sm rounded-2xl`.
- Fuente de headings: clase `font-heading` (Bitter).

### Componentes UI
- `Input`, `DropdownSelect`, `FileUpload` en `components/ui/` — usar siempre estos, nunca elementos nativos sin estilo.
- `DropdownSelect` reemplaza a `<select>` nativo — soporta click-outside y Escape para cerrar.

### Mapas
- Cualquier componente con Leaflet/React-Leaflet: `dynamic(() => import(...), { ssr: false })` obligatorio.
- `MapPicker.tsx` — permite al usuario elegir su ubicación con búsqueda Nominatim.
- `RouteMap.tsx` — muestra ruta OSRM del conductor + marcador de bajada del pasajero.
- Punto fijo UTEC: `lat=-12.1219`, `lng=-77.0282` (Barranco, Lima).

### Idioma
- Todo el texto visible al usuario en español neutro. Sin voseo ni regionalismos.

### Rutas de la app
| Ruta | Tipo | Descripción |
|---|---|---|
| `/` | Server | Landing page |
| `/auth/login` | Client | Login con Supabase |
| `/auth/register` | Client | Registro |
| `/onboarding` | Client | Flujo de 4 pasos (rol, perfil, ubicación, horarios) |
| `/dashboard` | Server | Home post-login |
| `/buscar` | Client | Buscar viajes disponibles |
| `/publicar` | Client | Publicar viaje (conductores) |
| `/viajes` | Client | Solicitudes y viajes activos |
| `/perfil` | Client | Editar perfil, horarios, verificación |
| `/conductor/verificacion` | Client | Formulario de verificación |

### DB — tablas principales
`profiles`, `schedules`, `trips`, `trip_requests`, `locations`, `driver_profiles`

`trips` tiene `allows_detour boolean` para indicar si el conductor acepta desvíos.
`trip_requests` tiene `dropoff_lat`, `dropoff_lng`, `dropoff_address` para el punto de bajada del pasajero.
