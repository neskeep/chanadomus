# /handoff — Session handoff y prompt para siguiente sesion

Genera handoff limpio para la sesion actual y prepara prompt copy-paste para la siguiente.

## Instrucciones

1. **Actualiza session state:** Escribe `.claude/state/session.md` con:
   - Sesion actual marcada como completada
   - Todo lo logrado (decisiones, archivos creados/modificados, issues resueltos)
   - Issues abiertos o blockers
   - Seccion "siguiente paso" clara y accionable
   - Version actual del proyecto y branch

2. **Genera handoff prompt:** Output en bloque de codigo markdown que el usuario pueda copiar y pegar en la siguiente sesion despues de `/clear`. El prompt debe incluir:
   - Fase/milestone actual
   - Que se completo (1-3 bullets)
   - Que hacer a continuacion (especifico, accionable)
   - Contexto necesario (blockers, decisiones pendientes)
   - Instruccion de leer session.md para contexto completo

3. **Formato:** Output dentro de fenced code block para facil copy-paste.

## Ejemplo de output

```
Lee .claude/state/session.md para contexto completo.

v0.17.0 en branch dev. Siguiente: M4.5 Launch.

Completado:
- Finanzas split en 3 paginas (registrar, reportes, index)
- SSR breadcrumb fix
- Form consistency en todos los modulos

Siguiente sesion:
1. QA final pre-launch con /review
2. Deploy a produccion via Coolify
3. Tag v0.17.0 en main

Entorno: Docker corriendo, `pnpm dev` para verificar.
```

## Reglas

- Maximo 15 lineas — suficiente contexto para retomar, no una novela
- Siempre referenciar session.md como fuente de verdad
- Incluir setup de entorno si Docker/servicios necesitan estar corriendo
- Usar español
- Si la sesion deja trabajo incompleto, ser explicito sobre que falta y por que se detuvo

## Ejecutar

Genera el handoff para la sesion actual.
