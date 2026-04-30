# ChanaDomus — Permisos por Rol

## Roles del Sistema

| Rol | Descripción |
|-----|-------------|
| **admin** | Control total del sistema |
| **propietario** | Residente/dueño, vinculado a una unidad |
| **conserje** | Personal operativo, accesos y lectura privilegiada |
| **vigilancia** | Guardia de seguridad, accesos y alertas |

---

## Accesos / QR

| Operación | admin | propietario | conserje | vigilancia |
|-----------|:-----:|:-----------:|:--------:|:----------:|
| Generar QR de visita | ✅ | ✅ | ❌ | ❌ |
| Ver mis QR codes | ✅ | ✅ | ❌ | ❌ |
| Validar/escanear QR | ✅ | ✅ | ✅ | ✅ |
| Ver log de accesos | ✅ | ❌ | ✅ | ✅ |
| Registrar entrada manual | ✅ | ❌ | ✅ | ✅ |
| Registrar salida | ✅ | ❌ | ✅ | ✅ |

## Finanzas

| Operación | admin | propietario | conserje | vigilancia |
|-----------|:-----:|:-----------:|:--------:|:----------:|
| Ver resumen todas las unidades | ✅ | ❌ | ❌ | ❌ |
| Registrar cargo/abono | ✅ | ❌ | ❌ | ❌ |
| Ver estado de cuenta propio | ✅* | ✅ | ❌ | ❌ |
| Ver lista de informes PDF | ✅ | ✅ | ❌ | ❌ |
| Subir informe PDF | ✅ | ❌ | ❌ | ❌ |
| Descargar informe PDF | ✅ | ✅ | ✅ | ✅ |

> *\*Admin necesita unitId asignado para ver estado de cuenta propio*

## Incidencias

| Operación | admin | propietario | conserje | vigilancia |
|-----------|:-----:|:-----------:|:--------:|:----------:|
| Ver lista (todas) | ✅ | solo propias | ✅ | ✅ |
| Ver detalle | ✅ | solo propias | ✅ | ✅ |
| Crear incidencia | ❌ | ✅ | ❌ | ❌ |
| Cambiar estatus | ✅ | ❌ | ❌ | ❌ |

## Personal / Fichas

| Operación | admin | propietario | conserje | vigilancia |
|-----------|:-----:|:-----------:|:--------:|:----------:|
| CRUD staff | ✅ | ❌ | ❌ | ❌ |
| Ver miembros de unidad | ✅ | ✅ | ✅ | ✅ |
| CRUD miembros | ✅ | ❌ | ❌ | ❌ |
| Ver vehículos | ✅ | ✅ | ✅ | ✅ |
| CRUD vehículos | ✅ | ❌ | ❌ | ❌ |

## Chat

| Sala | admin | propietario | conserje | vigilancia |
|------|:-----:|:-----------:|:--------:|:----------:|
| General | ✅ | ✅ | ✅ | ✅ |
| Unidad | ✅ | su unidad | ❌ | ❌ |
| Vigilancia | ✅ | ❌ | ✅ | ✅ |
| Admin | ✅ | ❌ | ❌ | ❌ |

## Cartelera / Anuncios

| Operación | admin | propietario | conserje | vigilancia |
|-----------|:-----:|:-----------:|:--------:|:----------:|
| Ver publicados | ✅ | ✅ | ✅ | ✅ |
| Ver borradores | ✅ | ❌ | ✅ | ❌ |
| Crear/Editar/Eliminar | ✅ | ❌ | ❌ | ❌ |

## Votaciones

| Operación | admin | propietario | conserje | vigilancia |
|-----------|:-----:|:-----------:|:--------:|:----------:|
| Ver activas/cerradas | ✅ | ✅ | ✅ | ✅ |
| Ver borradores | ✅ | ❌ | ✅ | ❌ |
| Crear/Editar/Eliminar | ✅ | ❌ | ❌ | ❌ |
| Votar | ❌ | ✅ (1 por unidad) | ❌ | ❌ |

## Proveedores

| Operación | admin | propietario | conserje | vigilancia |
|-----------|:-----:|:-----------:|:--------:|:----------:|
| Ver activos | ✅ | ✅ | ✅ | ✅ |
| Ver pendientes/inactivos | ✅ | ❌ | ✅ | ❌ |
| Crear directo (activo) | ✅ | ❌ | ✅ | ❌ |
| Sugerir (pendiente) | ❌ | ✅ | ❌ | ❌ |
| Editar | ✅ | ❌ | ✅ | ❌ |
| Eliminar | ✅ | ❌ | ❌ | ❌ |
| Dejar reseña | ❌ | ✅ | ❌ | ❌ |

## Reuniones

| Operación | admin | propietario | conserje | vigilancia |
|-----------|:-----:|:-----------:|:--------:|:----------:|
| Ver reuniones | ✅ | ✅ | ✅ | ✅ |
| Crear/Editar/Eliminar | ✅ | ❌ | ❌ | ❌ |

## Dashboard

| Operación | admin | propietario | conserje | vigilancia |
|-----------|:-----:|:-----------:|:--------:|:----------:|
| Ver stats y trends | ✅ | ✅ | ✅ | ✅ |
| Exportar CSV/PDF | ✅ | ❌ | ❌ | ❌ |

## Push / Notificaciones

| Operación | admin | propietario | conserje | vigilancia |
|-----------|:-----:|:-----------:|:--------:|:----------:|
| Suscribirse / preferencias | ✅ | ✅ | ✅ | ✅ |
| Botón de pánico | ✅ | ✅ | ✅ | ✅ |

### Destino de notificaciones automáticas

| Evento | Se notifica a |
|--------|---------------|
| Nueva incidencia reportada | admin |
| Cambio de estatus de incidencia | reportador |
| Sugerencia de proveedor | admin |
| Botón de pánico | vigilancia |
| Nuevo anuncio publicado | todos |
| Nueva votación activa/cerrada | todos |
| Nueva reunión programada | todos |

---

## Observaciones

1. **Dashboard stats** no filtra por rol — propietario ve métricas como `unitsInDebt` y `totalUnits` que podrían considerarse información de admin.
2. **Descarga de informes PDF** solo verifica tenant, no rol — cualquier usuario con el filename podría descargarlo.
3. **Conserje y vigilancia** pueden leer incidencias a nivel API aunque no tienen ruta de UI para acceder a ellas.
