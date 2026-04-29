# Roadmap: Rediseno UI Global

> **Referencia de estilo**: Login page (`app/pages/login.vue` + `app/layouts/auth.vue`)
> **Principios**: Sin redundancia, sin card wrappers innecesarios, spacing generoso, sin animaciones gratuitas, grid centering
> **Comando obligatorio**: `/design` ANTES de cada componente/pagina

## Estado

| Ola | Estado | Descripcion |
|-----|--------|-------------|
| 0 | DONE | Login page + auth layout |
| 1 | PENDING | Esqueleto estructural (layout) |
| 2 | PENDING | Componentes compartidos |
| 3 | PENDING | Dashboards por rol |
| 4 | PENDING | Listados y CRUD |
| 5 | PENDING | Paginas especiales |

---

## Ola 1: Esqueleto Estructural (Layout)

Impacta TODAS las paginas. Atacar uno por uno con `/design`.

| # | Componente | Archivo | Estado |
|---|-----------|---------|--------|
| 1.1 | Sidebar | `app/components/layout/AppSidebar.vue` | PENDING |
| 1.2 | Topbar | `app/components/layout/AppTopbar.vue` | PENDING |
| 1.3 | Bottom Nav | `app/components/layout/AppBottomNav.vue` | PENDING |
| 1.4 | Layout Default | `app/layouts/default.vue` | PENDING |
| 1.5 | User Menu | `app/components/layout/UserMenu.vue` | PENDING |

### Notas por componente:

**1.1 Sidebar** (77 lineas)
- Logo/Isotipo switcher segun estado collapsed/expanded
- Nav groups dinamicos desde `useNavigation().groups`
- User menu en footer
- Oportunidades: limpiar spacing, verificar uso de tokens de color, mejorar hover states

**1.2 Topbar** (38 lineas)
- Breadcrumbs + fallback titulo
- Portal `#topbar-actions` para acciones dinamicas
- Oportunidades: spacing, tipografia, separacion visual

**1.3 Bottom Nav** (21 lineas)
- Fixed bottom, mobile-only
- Icons size-6 + labels text-xs
- Oportunidades: touch targets (>48px), spacing, active state

**1.4 Layout Default** (44 lineas)
- SidebarProvider wrapper
- Mobile header (12px) + content area + bottom nav spacer
- Oportunidades: padding consistency, scroll behavior, mobile header

**1.5 User Menu** (99 lineas)
- Dos variantes: sidebar (large) y topbar (icon)
- Avatar con iniciales + dropdown
- Oportunidades: unificar variantes, limpiar spacing

---

## Ola 2: Componentes Compartidos

Building blocks que se repiten en multiples paginas.

| # | Componente | Archivo | Usado en |
|---|-----------|---------|----------|
| 2.1 | StatCard | `app/components/StatCard.vue` | 4 dashboards |
| 2.2 | EmptyState | `app/components/EmptyState.vue` | Listados sin datos |
| 2.3 | ErrorAlert | `app/components/ErrorAlert.vue` | Forms con errores |
| 2.4 | FormField | `app/components/FormField.vue` | Todos los formularios |
| 2.5 | TopbarSearch | `app/components/TopbarSearch.vue` | Listados con busqueda |
| 2.6 | TopbarFilters | `app/components/TopbarFilters.vue` | Listados con filtros |
| 2.7 | TopbarSelect | `app/components/TopbarSelect.vue` | Listados con selects |
| 2.8 | TopbarFilterGroup | `app/components/TopbarFilterGroup.vue` | Chips de filtro |
| 2.9 | ListSkeleton | `app/components/ListSkeleton.vue` | Loading states |
| 2.10 | PanicButton | `app/components/PanicButton.vue` | Boton de emergencia |

---

## Ola 3: Dashboards por Rol

| # | Pagina | Archivo |
|---|--------|---------|
| 3.1 | Dashboard Admin | `app/pages/admin/index.vue` |
| 3.2 | Dashboard Propietario | `app/pages/propietario/index.vue` |
| 3.3 | Dashboard Vigilancia | `app/pages/vigilancia/index.vue` |
| 3.4 | Dashboard Conserje | `app/pages/conserje/index.vue` |

---

## Ola 4: Listados y CRUD

Por modulo — definir al llegar a esta ola.

---

## Ola 5: Paginas Especiales

- QR Scanner (`vigilancia/escanear.vue`)
- Chat (`mi-chana/chat/`)
- Votaciones en vivo (`mi-chana/votaciones/`)
- Acceso QR (`acceso/[token].vue`)

---

## Workflow por Componente

1. `/design <descripcion del componente>` — pre-carga contexto + reglas UI
2. Explorar estado actual del componente
3. Disenar mejora alineada al estilo login (referencia)
4. Implementar con agente `nuxt-ui`
5. Verificar visualmente con Playwright
6. Marcar como DONE en este roadmap
