# Branding — ChanaDomus

## Identidad

- **Nombre**: ChanaDomus
- **Dominio**: chanadomus.com
- **Descripcion**: PWA de gestion condominial para Ranchos de Chana

## Brand Personality

- **3 palabras**: Confiable, moderna, accesible
- **Voz**: Profesional pero cercana. Nunca fria ni corporativa. Nunca infantil.
- **Meta emocional**: Simplicidad y control — "tengo todo a la mano sin complicaciones"
- **Tono**: Claro, directo, amable. Español neutro latinoamericano.

## Paleta de Colores (OKLCH)

### Core tokens (CSS variables en main.css)
- **Primary**: oklch(0.738 0.123 193.5) — teal #19C2C0
- **Secondary**: oklch(0.708 0.176 50.5) — orange #F47A1F (identidad de marca)
- **Accent**: oklch(0.959 0.024 193.8) — soft teal #E0F7F6
- **Destructive**: oklch(0.611 0.207 25.8) — error #E53B3B
- **Muted**: oklch(0.936 0.014 191.7) — neutral teal-tinted
- **Background**: oklch(0.973 0.004 198.1) — #F3F7F7 (tinte teal sutil)
- **Foreground**: oklch(0.276 0.023 248.7) — #1F2933

### Brand shades (variables --brand-*)
- **Primary 800**: #12A7A5 (hover, emphasis)
- **Primary 700**: #0E8F8D (dark variant)
- **Secondary 700**: #D96512 (hover orange)

### Status colors (variables --status-*)
- **Success**: #38B075 | **Warning**: #F5A842 | **Error**: #E53B3B | **Info**: #3A86FF

### Icon backgrounds (variables --icon-bg-*)
- **Teal**: #E0F7F7 | **Orange**: #FFF4E5 | **Yellow**: #FFF9E1

## Tipografia

- **Font**: Plus Jakarta Sans (Google Fonts)
- **Weights**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
- **Body minimo**: 16px (personas mayores)
- **Preferido**: 18-20px para texto principal

## Logo

- **Componentes**: `AppLogo.vue` (logo completo), `AppIsotipo.vue` (isotipo SVG)
- **Isotipo sizing**: Usa prop `:height` (no class `size-X` — SVG style inline overrride Tailwind)
- **Composable**: `useColorMap()` centraliza mapeo de colores de marca

## Direccion Estetica

- **Visual**: Clean SaaS property management — layouts espaciosos, jerarquia clara, sombras suaves
- **Referencia**: HOMEAGENT Dashboard (Dribbble) — metric cards con iconos, charts con colores de marca, generous spacing
- **Theme**: Light mode unicamente (usuarios mayores, uso diurno)
- **Anti-references**: NO glassmorphism, NO gradient text, NO "AI generated" aesthetic, NO interfaces grises/institucionales

## Reglas de Uso

1. **Colores solo via tokens** — Nunca `text-[#hex]`, nunca colores Tailwind genericos (`text-red-500`). Usar tokens: `text-primary`, `bg-destructive`, etc.
2. **Zero elementos nativos** — Todo input interactivo usa shadcn-vue. Nunca `<select>`, `<input type="date">`, `alert()`, `confirm()`.
3. **Isotipo con :height** — `<AppIsotipo :height="32" />`, no clases de tamaño.
