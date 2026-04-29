# Roadmap: Rediseno UI Global

> **Referencia de estilo**: Login page (`app/pages/login.vue` + `app/layouts/auth.vue`)
> **Principios**: Sin redundancia, sin card wrappers innecesarios, spacing generoso, sin animaciones gratuitas, grid centering
> **Comando obligatorio**: `/design` ANTES de cada componente/pagina

## Estado

| Ola | Estado | Descripcion |
|-----|--------|-------------|
| 0 | DONE | Login page + auth layout |
| 1 | DONE | Esqueleto estructural (layout) — 5/5 done |
| 2 | DONE | Componentes compartidos — 8 polished, 2 dead code removed |
| 3 | DONE | Dashboards por rol — rediseño profundo, no tabs, layout moderno |
| 4 | DONE | Listados y CRUD — 4.1 Admin + 4.2 Propietario + 4.3 Vigilancia/Conserje + 4.4 Mi-Chana |
| 5 | DONE | Paginas especiales + polish pass |

---

## Ola 1: Esqueleto Estructural (Layout)

Impacta TODAS las paginas. Atacar uno por uno con `/design`.

| # | Componente | Archivo | Estado |
|---|-----------|---------|--------|
| 1.1 | Sidebar | `app/components/layout/AppSidebar.vue` | DONE |
| 1.2 | Topbar | `app/components/layout/AppTopbar.vue` | DONE |
| 1.3 | Bottom Nav | `app/components/layout/AppBottomNav.vue` | DONE |
| 1.4 | Layout Default | `app/layouts/default.vue` | DONE |
| 1.5 | User Menu | `app/components/layout/UserMenu.vue` | DONE |

### Notas por componente:

### Notas de lo completado:

**1.1 Sidebar** — DONE
- Header: logo expanded + isotipo collapsed (sin link, no-interactive)
- SidebarTrigger oficial para collapse, toggle expand en footer (solo desktop collapsed)
- Altura fija `h-[68px]` alineada con topbar, `border-b` coherente
- Mobile: sidebar drawer ya no se usa, reemplazado por Sheet "Más" en bottom nav

**1.2 Topbar** — DONE
- Altura fija `h-[68px]` alineada con sidebar header
- Tipografia: titulo `text-base`, descripcion `text-xs`
- Breadcrumbs mantenidos, portal `#topbar-actions` intacto

**1.3 Bottom Nav** — DONE (cambio radical)
- 4 items esenciales + botón "Más" que abre Sheet bottom
- Sheet: user profile card + items agrupados por sección (como sidebar) + logout
- iOS safe area con `pb-[env(safe-area-inset-bottom)]`
- Auto-cierre al navegar

**1.4 Layout Default** — DONE
- Mobile header: isotipo `:height="24"` + titulo + PanicButton + notificaciones
- Sin SidebarTrigger en mobile (reemplazado por bottom nav Sheet)

**1.5 User Menu** — DONE
- Eliminada variante `topbar` (código muerto — no usada en ningún componente)
- Eliminada prop `variant` — componente ahora es sidebar-only
- Reducido de 98 a 49 líneas (~50% menos)
- Nombre con `truncate` para sidebar collapsed, chevron con `text-muted-foreground`
- Tilde en "Cerrar sesión" corregido

---

## Ola 2: Componentes Compartidos — DONE

### Cambios realizados:

**Eliminados (código muerto, 0 usos):**
- `FormField.vue` — nunca referenciado en ninguna página
- `TopbarSelect.vue` — nunca referenciado en ninguna página

**Polished:**
- **StatCard** — `tabular-nums` en valor numérico (consistencia con design system)
- **EmptyState** — padding `p-8` → `p-10` (elderly), título `font-medium` → `font-semibold`, spacing `space-y-1`
- **ErrorAlert** — padding `p-4` → `px-3 py-2.5`, icon `size-5` → `size-4`, gap `3` → `2.5` (alineado con card standard)
- **TopbarFilters** — eliminados `!` overrides en PopoverContent (`!w-56 !gap-0 !p-0 !shadow-md !ring-border` → `w-56 p-0`)

**Sin cambios (ya alineados):**
- TopbarSearch, TopbarFilterGroup, ListSkeleton, PanicButton — bien estructurados, consistentes con design system

---

## Ola 3: Dashboards por Rol — DONE

### Cambios realizados:

**3.1 Admin** — Rediseño profundo:
- Eliminados tabs (Resumen/Finanzas/Actividad) → todo visible en una página
- Greeting personal + fecha
- Hero financiero: 3 StatCards + card de cobranza con Progress bar
- Charts 2-col: finanzas + accesos (con badge "X hoy")
- Incidents chart con dots inline (abiertas/en progreso)
- Card "Actividad del condominio": next meeting + 4 community stats con iconos

**3.2 Propietario** — Mejoras:
- Next meeting usa Card con icon bg (no border-l-4)
- Quick actions con iconos en color primary
- Spacing generoso `space-y-8`

**3.3 Vigilancia** — Mejoras:
- Hero "Accesos Hoy" mantenido (funciona bien)
- Stats en `grid-cols-3` (no 2)
- Quick actions con iconos primary, más padding
- Next meeting como Card limpio

**3.4 Conserje** — Mejoras:
- Stats inline (no via StatCard array computed)
- Quick actions con iconos primary
- Next meeting como Card limpio
- Spacing generoso

---

## Ola 4: Listados y CRUD

### Sub-ola 4.1: Admin — DONE

| # | Pagina | Cambios | Estado |
|---|--------|---------|--------|
| 4.1.1 | `admin/unidades/index.vue` | ErrorAlert, EmptyState, cards compactas | DONE |
| 4.1.2 | `admin/incidencias.vue` | StatCard, ErrorAlert, EmptyState, ListSkeleton, ListPagination, mobile 2-row | DONE |
| 4.1.3 | `admin/personal/index.vue` | ErrorAlert, EmptyState, ListSkeleton, mobile 2-row + acciones inline | DONE |
| 4.1.4 | `admin/cartelera/index.vue` | StatCard, mobile 2-row + acciones inline | DONE |
| 4.1.5 | `admin/finanzas.vue` | StatCard, ErrorAlert, EmptyState, ListSkeleton, ListPagination, file input | DONE |
| 4.1.6 | `admin/votaciones/index.vue` | StatCard, mobile 2-row + acciones inline | DONE |
| 4.1.7 | `admin/proveedores/index.vue` | StatCard, ErrorAlert, EmptyState, ListSkeleton, ListPagination, Dialog→Sheet, compact suggestions | DONE |
| 4.1.8 | `admin/reuniones/index.vue` | StatCard, mobile 2-row + acciones inline | DONE |
| 4.1.9 | `admin/unidades/[id].vue` | EmptyState, ListSkeleton, mobile 2-row members+vehicles | DONE |

**Patron establecido**: Stats→StatCard, inline error→ErrorAlert, inline empty→EmptyState, inline skeleton→ListSkeleton, inline pagination→ListPagination, mobile cards `px-3 py-2.5` 2-row, acciones ghost `h-6 px-2 text-[11px]`, colores→design tokens

### Sub-ola 4.2: Propietario — DONE

| # | Pagina | Cambios | Estado |
|---|--------|---------|--------|
| 4.2.1 | `propietario/estado-cuenta.vue` | ErrorAlert, EmptyState, ListSkeleton, hero cleanup, compact 2-row movements | DONE |
| 4.2.2 | `propietario/mis-visitas.vue` | ErrorAlert, EmptyState, ListSkeleton, compact 2-row QR cards | DONE |
| 4.2.3 | `propietario/nueva-visita.vue` | ErrorAlert, Card wrapper p-4, import cleanup | DONE |
| 4.2.4 | `propietario/incidencias/index.vue` | ErrorAlert, EmptyState, ListSkeleton, ListPagination, compact 2-row, Sheet detalle | DONE |
| 4.2.5 | `propietario/incidencias/nueva.vue` | Card wrapper p-4, field spacing, required markers, Separator removed | DONE |
| 4.2.6 | `propietario/informes.vue` | ErrorAlert, EmptyState, ListSkeleton, ListPagination, compact 2-row, inline PDF ghost button | DONE |
### Sub-ola 4.3: Vigilancia + Conserje — DONE

| # | Pagina | Cambios | Estado |
|---|--------|---------|--------|
| 4.3.1 | `vigilancia/residentes/index.vue` | Ya usaba shared components — SIN CAMBIOS | DONE (previo) |
| 4.3.2 | `vigilancia/residentes/[id].vue` | Compact padding, removed owner bg anti-pattern, size-10 avatars | DONE |
| 4.3.3 | `vigilancia/accesos.vue` | Golden reference — SIN CAMBIOS | DONE (previo) |
| 4.3.4 | `vigilancia/escanear.vue` | Pagina especial — SKIP a Ola 5 | SKIP |
| 4.3.5 | `conserje/nueva-entrada.vue` | ErrorAlert, Card wrapper, removed border-l-4, h-12 inputs, brand colors | DONE |
### Sub-ola 4.4: Mi-Chana — DONE

| # | Pagina | Cambios | Estado |
|---|--------|---------|--------|
| 4.4.1 | `mi-chana/cartelera/index.vue` | Compact padding, hover:bg-muted/50, space-y-2 | DONE |
| 4.4.2 | `mi-chana/votaciones/index.vue` | Removed border-primary/30 anti-pattern, space-y-2 | DONE |
| 4.4.3 | `mi-chana/proveedores/index.vue` | ErrorAlert, EmptyState, ListSkeleton, ListPagination, hover fix | DONE |
| 4.4.4 | `mi-chana/proveedores/[id].vue` | ErrorAlert, EmptyState for reviews | DONE |
| 4.4.5 | `mi-chana/reuniones/index.vue` | ErrorAlert, ListSkeleton, EmptyState, space-y-2 | DONE |
| 4.4.6 | `mi-chana/notificaciones.vue` | ErrorAlert in-card consistency | DONE |
| 4.4.7 | `mi-chana/chat/index.vue` | ErrorAlert, EmptyState dynamic | DONE |
| 4.4.8 | `mi-chana/chat/[roomId].vue` | Pagina especial — SKIP a Ola 5 | SKIP |

---

## Ola 5: Paginas Especiales — DONE

### Cambios realizados:

**5.1 QR Scanner** (`vigilancia/escanear.vue`) — DONE
- 7 fixes: rounded-2xl/xl → rounded-lg, ring-4 → ring-2, corner brackets rounded-tl-lg
- `<style>` tag eliminado, @keyframes scan movido a main.css
- Button "Escanear otro" alineado a shadcn defaults

**5.2 Chat Room** (`mi-chana/chat/[roomId].vue`) — DONE
- Own message bubbles: rounded-2xl rounded-br-md → rounded-lg rounded-br-sm
- Others' bubbles: rounded-2xl rounded-bl-md → rounded-lg rounded-bl-sm
- Skeleton bubbles: rounded-2xl → rounded-lg

**5.3 Chat Index** (`mi-chana/chat/index.vue`) — DONE (polish pass)
- 2x rounded-xl → rounded-lg (room list + skeleton container)

**5.4 Votaciones y Acceso QR** — N/A
- Votaciones ya alineada en Ola 4.4
- No existe pagina acceso/[token] (acceso es via webhook externo)

### Polish Pass Cross-Page
- Grep completo: 0 rounded-2xl/3xl/4xl residuales en app/
- 0 ring-4 residuales
- 0 `<style>` tags en componentes app/
- 0 border-l-4 anti-patterns en cards (solo viewfinder brackets en escanear = OK)

---

## Workflow por Componente

1. `/design <descripcion del componente>` — pre-carga contexto + reglas UI
2. Explorar estado actual del componente
3. Disenar mejora alineada al estilo login (referencia)
4. Implementar con agente `nuxt-ui`
5. Verificar visualmente con Playwright
6. Marcar como DONE en este roadmap
