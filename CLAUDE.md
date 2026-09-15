# PetroilSA — guía para trabajar en este repo

Ver también [README.md](README.md) para la estructura de carpetas de `assets/`.

## Identidad visual oficial (marca)

**Tipografía principal:** Poppins (cargada vía Google Fonts en `assets/css/base.css`, pesos 300–800).

**Colores corporativos del logotipo:**
- En positivo: azul claro `#3499CC` · azul oscuro `#080C41`
- En negativo (sobre fondos oscuros): blanco `#FBFEFF` · gris `#BEBEBE`

**Secundarios:**
- Azul petróleo `#154772`
- Verde institucional `#1D5949`
- Verde lima energético `#C7F547`
- Azul cielo `#359ACC`
- Blanco puro `#FFFFFF`

**Migración de paleta (2026-09-14):** todo el sitio usa ya SOLO estos 8 colores. `assets/css/base.css` tiene los 8 como `--brand-*` (única fuente de verdad — `--brand-navy`, `--brand-blue`, `--brand-petrol`, `--brand-green`, `--brand-lime`, `--brand-sky`, `--brand-white`, `--brand-gray`). Los nombres históricos que ya usan cientos de reglas en todo el proyecto (`--navy`, `--navy-deep`, `--teal`, `--teal-light`, `--amber`, `--mist`, y también `--route-*`) siguen existiendo tal cual — **no los renombres, cascan solos** — pero ahora son alias `var(--brand-*)` en vez de colores inventados. Antes de esta migración: `--navy` era `#0A2A43`, `--teal` era un turquesa `#0F8C82` y `--amber` un naranja `#E8871E`, ninguno de los 3 en el manual — por eso index/productos/quienes-somos se sentían "de sitios distintos" al navegar entre ellos. `--steel`/`--ink`/`--line`/`--white` NO se tocaron: son neutros de UI (texto, bordes), no decisiones de marca.

Excepción deliberada: **`--warn:#E8871E`** (mismo naranja de antes) se reservó para avisos/precauciones/ejemplos — cajas de seguridad en fichas técnicas, el badge "Dato de ejemplo", banners "página de ejemplo", disclaimers del chat. Ninguno de los 8 colores oficiales lee como "advertencia", así que ahí sí se mantiene un color fuera de manual a propósito. Si agregas un aviso/precaución nuevo, usa `var(--warn)`, no `var(--amber)` (ese ya es verde lima, de marca/CTA).

`portal-clientes/portal-clientes.html` y `herramientas/astm-d1500-color-tool.html` quedaron **fuera** de esta migración a propósito: son páginas autocontenidas que ni siquiera cargan `base.css` (tienen su propio `<style>`/`:root`) — un prototipo de dashboard y una herramienta de laboratorio (colorímetro ASTM D1500) con lenguaje visual propio, no parte de la navegación principal.

## Patrones a respetar

- **Nunca pases una imagen de fondo con un `url()` relativo por una custom property** (`style="--hero-img:url('assets/img/x.jpg')"` + `background-image:var(--hero-img)` en un CSS). El `url()` se resuelve respecto a la hoja CSS (`assets/css/`), no al HTML, así que la foto da 404 y solo se ve el color de fondo. Ya no queda ningún caso de esto en el sitio (arreglado en `article.css` + 7 páginas — ver abajo) — si vuelves a necesitar una foto de fondo, usa el patrón `.page-hero-bg` (ver siguiente punto) o `.pb-bg` de `productos.css`: un `<img>` real con `object-fit:cover` y el degradado en un `::after`, nunca una custom property con `url()`.
- Para comprobar cómo se ve algo de verdad, renderiza con Edge headless (`msedge --headless=new --user-data-dir=<carpeta propia> --window-size=1440,4400 --screenshot=out.png file:///...`) y mira la imagen. El `--user-data-dir` propio es necesario si Edge ya está abierto.

- **`.page-hero`** (fondo oscuro con imagen/gradiente) se define en `assets/css/article.css`. Cualquier página que use `class="page-hero"` (o una variante como `.pds-hero`/`.qs-hero`) DEBE cargar `article.css`, o el hero pierde el fondo oscuro y el texto queda en el color de tinta por defecto (ilegible). Ya se corrigió este olvido en las 15 páginas de `fichas-tecnicas/` y en `nosotros/quienes-somos.html` — no lo vuelvas a omitir en páginas nuevas.
  - El degradado vive en la custom property `--ph-gradient` (definida en `.page-hero`, heredada por sus descendientes). Páginas SIN foto (fichas técnicas) solo necesitan `class="page-hero"` — el degradado se ve solo. Páginas CON foto agregan, como primer hijo del `<section>`, `<div class="page-hero-bg" aria-hidden="true"><img src="..." alt="" loading="eager" fetchpriority="high" decoding="async"></div>` — el `::after` de `.page-hero-bg` reutiliza el mismo `--ph-gradient`, así que la foto y el degradado siempre coinciden.
  - El degradado (`--ph-gradient` en `article.css`, y el de `.qs-hero-media::after` en `quienes-somos.css`) usa `--navy`/`--teal`/`--teal-light` (que, tras la migración de paleta de arriba, ya valen azul oscuro/petróleo/cielo — 100% oficiales). Si agregas un hero nuevo, reutiliza esos mismos tokens en vez de inventar una paleta local — ya pasó 4 veces antes de esta migración (`--route-*` en `base.css`, `--pb-*` en `productos.css`, `--ib-*` en `quienes-somos.css`, y los rgba() sueltos en media docena de hojas de estilo más).
- El enlace "Productos" del navbar/footer/breadcrumbs en TODAS las páginas apunta a `productos.html` (catálogo completo, en la raíz del sitio) — ya no a `index.html#productos`. El index conserva una sección `#productos` recortada (solo algunos productos destacados) con un botón "Ver todo el portafolio" hacia `productos.html`.
- Las tarjetas de producto (`.product-card` / `.products-grid`) muestran una imagen estática y, si existe, un video que se revela en hover/focus (`assets/js/home.js`). Hay DOS diseños con los mismos nombres de clase, a propósito, para compartir esa lógica de video: el del index (`assets/css/home.css`) y el del catálogo (`assets/css/productos.css`, que no carga home.css). Productos "en desarrollo" (sin foto ni video reales) usan `assets/img/en-desarrollo.png` como cover fijo — es la solución intencional para que no se vean en blanco, no un placeholder pendiente de arreglar.
- `productos.html` sigue usando sus propios tokens `--pb-*` (definidos en `.prod-page`, `assets/css/productos.css`) por legibilidad semántica del código, pero desde la migración de paleta son simples alias de `var(--brand-*)` — ya no una paleta aparte. Sigue sin usar `.btn-primary`/`.btn-outline` de `base.css` ahí (son componentes con su propio estilo, pensados para el resto del sitio) — usa los `--pb-*` locales.
- Ojo con las fotos: `Petroil_fotosplanta_46/48/60.jpg` son fauna (loros, un pájaro, una iguana), no planta industrial. Las fotos industriales reales utilizables como fondo son `Petroil_fotosplanta_29.jpg`, `noticias/euro-vi-petroil-50-10-refineria.jpg`, `noticias/euro6-refineria-petroil.jpg` y `noticias/embajada-eeuu-recorrido-planta.jpg`. Las `quienes-somos/ruta-*.png` son miniaturas (~230px), no sirven de fondo.
