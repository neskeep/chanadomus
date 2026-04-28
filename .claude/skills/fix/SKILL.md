---
name: fix
description: Workflow estructurado para bug fixing con diagnostico obligatorio y auto-verificacion. Usa /fix <descripcion del bug>.
---

# Bug Fix Estructurado — ChanaDomus

## Workflow obligatorio: DIAGNOSE → FIX → VERIFY

### Fase 1: DIAGNOSE (antes de tocar codigo)

1. Leer el error completo (mensaje, stack trace, consola)
2. Identificar los archivos y lineas exactas involucradas
3. Verificar assumptions: datos correctos? API devuelve lo esperado? Props correctas?
4. **Declarar el root cause explicitamente** antes de proceder

NO pasar a Fase 2 sin haber completado el diagnostico.

### Fase 2: FIX (cambio minimo)

1. Aplicar el cambio minimo que resuelve el root cause
2. Cero refactoring adicional — no tocar codigo que no esta roto
3. Cero "while I'm here" improvements
4. Solo los archivos estrictamente necesarios

Seleccion de agente:
- Bug de UI (renderizado, layout, estilos, componentes) → agente `nuxt-ui`
- Bug de logica (API, datos, composables, server routes, auth) → agente `nuxt-logic`

### Fase 3: VERIFY (auto-verificacion)

1. Ejecutar `pnpm build` — verificar que no hay errores de TypeScript ni compilacion
2. Levantar dev server (`pnpm dev`) y navegar a la pagina afectada
3. Verificar que no hay errores en consola del navegador
4. Verificar que no hay hydration mismatches

Si la verificacion falla o el fix genera un nuevo error → **volver a Fase 1 DIAGNOSE**. No parchar encima del parche.

## Reglas

- **Nunca fix sin diagnostico** — Entender antes de actuar
- **Nunca retry ciego** — Si falla, re-diagnosticar, no repetir lo mismo
- **Commit atomico** — Solo el fix, formato: `fix: <descripcion concisa>`
- **No crear problemas nuevos** — Si el fix introduce hydration errors, errores de consola o rompe el build, no esta terminado

## Bug a resolver

$ARGUMENTS
