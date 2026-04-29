---
name: review
description: QA visual y funcional post-implementacion usando Playwright MCP. Usa /review <pagina o feature implementada>.
---

# QA Visual y Funcional — ChanaDomus

## 1. Lee antes de revisar

- `.claude/context/design-system.md` — Patrones UI esperados, card standards, text sizes

## 2. Workflow de QA

### Paso 1: Identificar que revisar

Ejecutar `git diff --name-only` para listar archivos modificados. Determinar las paginas/rutas afectadas.

### Paso 2: Preparar entorno

Verificar que el dev server esta corriendo. Si no, levantar con `pnpm dev`.

### Paso 3: Navegar y verificar con Playwright MCP

Para cada pagina afectada:

1. Navegar a la ruta con Playwright MCP
2. Verificar que la pagina renderiza correctamente (no pantalla en blanco, no errores visibles)
3. Revisar la consola del navegador — reportar cualquier error o warning
4. Verificar que no hay hydration mismatches
5. Tomar screenshot de la pagina

### Paso 4: Verificacion visual

Comparar contra los patrones de `design-system.md`:
- Cards siguen el patron compacto (2 filas max, acciones inline)
- Text sizes correctos (text-[11px] meta, text-sm contenido, text-base titulos)
- Sin bordes coloreados en cards, sin fondos de estado
- Layout coherente con el resto de la app

### Paso 5: Reportar

Formato del reporte:
- **Pagina revisada**: ruta
- **Renderizado**: OK / FAIL (detalle)
- **Consola**: limpia / errores encontrados (listar)
- **Hydration**: OK / mismatches (listar)
- **Visual**: OK / issues (listar)
- **Screenshot**: adjunto

## 3. Que revisar

$ARGUMENTS
