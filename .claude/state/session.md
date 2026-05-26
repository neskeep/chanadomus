# Estado de Sesion — ChanaDomus

## Ultima Sesion
- **Fecha**: 2026-05-26
- **Sesion #**: 57
- **Branch**: dev
- **Estado**: Completada — handoff por contexto agotado (91%)

## Completado Sesion 57

### Permisos de perfil
- Solo admin y propietario pueden editar nombre, telefono y avatar
- Todos los roles pueden ver su perfil y cambiar contraseña
- Backend: guards 403 en `profile.patch.ts` y `avatar.post.ts`
- Frontend: `canEditProfile` computed oculta form y boton avatar

### QR para todos los usuarios
- Schema: `resident_passes.unitId` ahora nullable (migracion 0045)
- `incidents.unitId` tambien nullable (migracion 0044)
- Backend: `getUnitIdForPass` retorna `string | null`, endpoints sin restriccion de rol
- `qr/validate.post.ts`: leftJoin con units para passes sin unidad
- Backfill: 105 passes creados en dev, 3 en produccion (2 vigilantes + 1 admin)
- Tipos: `ResidentPassResponse.unitId` y `unitNumber` nullable

### Mobile: acceso a perfil
- `AppBottomNav.vue`: fila de usuario en Sheet "Mas" es ahora NuxtLink a `/mi-chana/perfil`

### Fix: editar usuario conserje
- `GET /api/admin/users`: COALESCE con `.as()` para resolver unitId desde tabla `staff`
- El boton "Guardar Cambios" ahora se habilita correctamente para conserjes

### Produccion
- Registros financieros borrados (9 registros) — inicio en cero para el cliente
- 3 deploys a Coolify via dispatch directo de `ApplicationDeploymentJob`
- Migraciones 0044 y 0045 aplicadas en produccion

## Pendiente
- Distinguir Ranchos (74) vs Parcelas (43) en el card de Unidades del panel de finanzas
- Verificar que Coolify no sobreescriba volumen uploads en deploys

## Entorno
- Docker corriendo en VPS 207.246.116.220
- Branch dev, todo commiteado y mergeado a main
- Password de test: Yolo2026!
- Deploy: via tinker → ApplicationDeploymentJob dispatch
