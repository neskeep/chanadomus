# Skills de UI/UX — Guia de Uso

## Workflow Obligatorio

El flujo para cualquier trabajo de UI sigue este orden:

1. **Diagnosticar** — `/critique` o `/audit` para evaluar estado actual
2. **Disenar** — `frontend-design` para generar el diseno del componente/pagina
3. **Implementar** — Agente `nuxt-ui` para codificar
4. **Pulir** — `/polish` como paso final antes de ship

## Skills de Diseno (Pre-implementacion)

| Skill | Cuando usar | Obligatorio |
|-------|-------------|-------------|
| `frontend-design` | ANTES de crear cualquier componente, pagina o layout | Si, siempre |
| `shadcn` | Buscar, agregar o gestionar componentes shadcn-vue | Si, para componentes |

## Skills Impeccable (Evaluacion y Refinamiento)

### `/critique` — Evaluacion UX completa
- **Cuando**: Al inicio de una fase de UX/UI para diagnosticar problemas
- **Que hace**: Nielsen's 10 heuristics (score 0-40), deteccion de anti-patterns AI, personas, cognitive load
- **Output**: Reporte con Design Health Score + Priority Issues P0-P3
- **Nota**: Lanza 2 assessments independientes (LLM + detector automatizado)

### `/audit` — Auditoria tecnica de calidad
- **Cuando**: Para verificar accesibilidad, performance, responsive, theming, anti-patterns
- **Que hace**: Score 0-20 en 5 dimensiones tecnicas, findings por severidad P0-P3
- **Output**: Audit Health Score + findings detallados con ubicacion en codigo
- **Diferencia con critique**: `/critique` evalua diseno/UX, `/audit` evalua implementacion tecnica

### `/polish` — Paso final pre-ship
- **Cuando**: SIEMPRE como ultimo paso despues de implementar cambios de UI
- **Que hace**: Alineacion pixel-perfect, spacing consistente, estados de interaccion, tipografia, contraste
- **Output**: Correcciones directas al codigo
- **Regla**: NUNCA pulir codigo que no esta funcionalmente completo

### `/animate` — Microinteracciones y motion
- **Cuando**: Para agregar animaciones con proposito (feedback, transiciones, delight)
- **Que hace**: Entrance animations, micro-interactions, state transitions, scroll effects
- **Reglas tecnicas**: Solo `transform` + `opacity` (GPU), easing `ease-out-quart/quint/expo`, NUNCA bounce/elastic
- **Obligatorio**: Respetar `prefers-reduced-motion`

### `/adapt` — Adaptacion responsive
- **Cuando**: Para optimizar vistas en diferentes dispositivos/contextos
- **Que hace**: Breakpoints, layouts fluidos, touch targets 44x44px, navegacion adaptativa
- **Contexto ChanaDomus**: PWA mobile-first, priorizar 375px-428px, luego tablet, luego desktop

### `/clarify` — Mejora de UX copy
- **Cuando**: Para mejorar textos de interfaz, errores, labels, empty states
- **Que hace**: Reescribe copy ambiguo, jargon tecnico, mensajes de error poco claros
- **Contexto ChanaDomus**: Audiencia no-tecnica (propietarios de condominio), espanol, tono profesional pero cercano

## Skills de Revision Post-implementacion

| Skill | Cuando usar |
|-------|-------------|
| `ui-ux-pro-max` | Revision general de UX post-implementacion |

## Reglas de Uso

1. **Nunca implementar UI sin diagnostico previo** — Correr `/critique` o `/audit` antes de cambiar codigo visual
2. **Siempre terminar con `/polish`** — Es el paso final obligatorio despues de cualquier cambio de UI
3. **`/animate` con proposito** — Cada animacion necesita una razon. No animar por decoracion
4. **`/adapt` = mobile-first** — Siempre empezar por mobile (375px), escalar hacia arriba
5. **`/clarify` para copy** — Todo texto visible al usuario debe pasar por clarify si hay dudas de claridad
6. **Re-run despues de fixes** — Correr `/critique` o `/audit` de nuevo para verificar mejora en score
