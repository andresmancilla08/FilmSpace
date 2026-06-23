# Arquitectura

**En una frase:** Plataforma de streaming de películas, series y anime para Web y Google TV.

## Stack
- **Framework:** Next.js 15 (App Router), TypeScript.
- **Estilos:** Tailwind CSS + Aceternity UI. **Íconos:** Tabler. **Animación:** Framer Motion.
- **i18n:** next-intl (`messages/`, `src/i18n`). Dark-first.
- **Utils:** clsx + tailwind-merge.

## Mapa de carpetas
- `src/app/` — rutas App Router. `src/components/` — UI (incl. componentes Aceternity).
- `src/context/`, `src/hooks/`, `src/lib/`, `src/types/`. `src/i18n/` + `messages/` — traducciones.

## Flujo de datos
UI → hooks/context → `src/lib` (fuente de datos de catálogo) → render. TODO: documentar el origen real del catálogo (API externa / mock).

## Lo que NO existe
- TODO: confirmar si hay backend/BD. Aún sin Firebase ni base de datos en deps.
