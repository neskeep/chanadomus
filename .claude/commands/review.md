# /review — QA con Playwright

Ejecuta revision de calidad usando Playwright MCP para verificar funcionalidad.

## Instrucciones

1. **Lee antes de revisar:**
   - `.claude/context/design-system.md` — Patrones UI esperados, card standards, text sizes

2. **Identifica que revisar:**
   Ejecutar `git diff --name-only` para listar archivos modificados. Determinar las paginas/rutas afectadas.

3. **Prepara entorno:**
   Verificar que el dev server esta corriendo. Si no, levantar con `pnpm dev`.

4. **Navega y verifica con Playwright MCP:**
   Para cada pagina afectada:
   - Navegar a la ruta
   - Verificar renderizado correcto (no pantalla en blanco, no errores visibles)
   - Revisar consola del navegador — reportar errores o warnings
   - Verificar que no hay hydration mismatches
   - Tomar screenshot en `.playwright-mcp/`

5. **Verificacion visual:**
   Comparar contra patrones de `design-system.md`:
   - Cards siguen patron compacto (2 filas max, acciones inline)
   - Text sizes correctos (text-[11px] meta, text-sm contenido, text-base titulos)
   - Sin bordes coloreados en cards, sin fondos de estado
   - Layout coherente con el resto de la app

6. **Reporte:**
   - **Pagina revisada**: ruta
   - **Renderizado**: OK / FAIL (detalle)
   - **Consola**: limpia / errores (listar)
   - **Hydration**: OK / mismatches (listar)
   - **Visual**: OK / issues (listar)
   - **Screenshot**: adjunto

## Que revisar

$ARGUMENTS
