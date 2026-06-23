# Convenciones

## Estilo
- TypeScript + ESLint (eslint-config-next). Tailwind; `cn()` con clsx + tailwind-merge.

## Patrones que SÍ usamos
- **Diseño único (REGLA GLOBAL):** cada pantalla rompe con patrones Netflix/Disney+. Layouts asimétricos, gradientes dramáticos, cinematográfico. Nunca streaming "tradicional".
- **Google TV:** UI a 10 pies, navegación por D-pad. Responsive web también.
- Animaciones rápidas (timing ≤150ms, stagger ≤20ms). Dark-first.
- Validar toda UI con el equipo visual.

## Patrones PROHIBIDOS
- Layouts genéricos tipo Netflix. Strings hardcodeados (usar next-intl `messages/`).

## Tests
- TODO: sin suite documentada.

## Commits
- Commit tras cada ajuste.
