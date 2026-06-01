# Estado de Sesion — ChanaDomus

## Ultima Sesion
- **Fecha**: 2026-06-01
- **Sesion #**: 62
- **Branch**: `main`
- **Commit**: `0eff191` — feat(reuniones): structured minutes
- **Estado**: Completada

## Completado Sesion 62

### Reuniones — UX overhaul completo

#### Cards compactos (propietario)
- `/mi-chana/reuniones/index.vue` — Cards de 2 filas (patron golden de accesos): titulo + badge tipo + hora en fila 1, meta inline con separadores en fila 2
- Cards clickeables con NuxtLink al detalle, hover state `bg-muted/50`

#### Pagina de detalle (propietario) — NUEVA
- `/mi-chana/reuniones/[id].vue` — Vista read-only con: header + badges, info card (fecha, hora, ubicacion, link), agenda como lista numerada, minuta estructurada (quorum, asistentes badges, puntos tratados con notas, acuerdos numerados, observaciones)

#### Minuta estructurada (admin)
- Schema: 3 columnas jsonb (`agenda_items`, `minutes_attendees_data`, `minutes_agreements_list`) + 5 columnas text legacy + `minutes_quorum` boolean
- Migraciones: 0047 (displayOrder), 0048 (minutes text), 0049 (minutes jsonb)
- Admin crear: agenda como list builder (input + agregar, items numerados, removibles)
- Admin editar: asistentes via popover multi-select de usuarios del tenant, quorum switch, puntos tratados = textarea por cada punto de agenda, acuerdos como list builder, observaciones textarea
- 4 APIs actualizadas (GET list, GET detail, POST, PATCH)

#### Otros cambios incluidos en el commit
- displayOrder y reorder en cartelera, votaciones, normativas, reuniones
- Delete endpoint para pases vehiculares
- Pass generation endpoints para miembros y vehiculos

### Verificacion
- `vue-tsc --noEmit` → 0 errores
- Pre-commit hooks pasaron (ESLint)

## Proxima sesion — Chat: prioridad de mensajes

### Problema
- Chats nuevos o con mensajes nuevos NO suben al tope de la lista
- Las conversaciones tienen orden estatico (por fecha de creacion)
- Los grupos tambien tienen posicion fija
- Debe funcionar como WhatsApp: ultimo mensaje recibido/enviado = primera posicion

### Investigar
- Estructura actual del chat (rooms, messages, grupos)
- Query de listado de rooms y su ORDER BY
- Como agregar `lastMessageAt` o similar para ordenar por actividad

## Issues abiertos
- Fechas typo en 2 registros (El Molino, Samsara) — sesion 58
- Flamboyant R-013 saldo extraordinaria -$3,000 revision manual — sesion 58

## DB local
- Docker `chanadomus-db-1` con dump de produccion
- Usuarios demo con password `Yolo2026!`:
  - admin@chanadomus.com (admin)
  - propietario@chanadomus.com (propietario, Rancho Demo)
  - conserje@chanadomus.com (conserje, Guayacan I via staff)
  - vigilante@chanadomus.com (vigilancia)
