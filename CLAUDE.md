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

Estos hex oficiales ya existen como variables CSS en `assets/css/base.css` bajo el prefijo `--route-*` (`--route-navy`, `--route-blue`, `--route-green`, `--route-lime`, `--route-sky`, `--route-white-neg`, `--route-gray-neg`), originalmente pensadas para el navbar. El resto del sitio usa una paleta operativa distinta (`--navy`, `--teal`, `--amber`, etc.) ya establecida en todo el proyecto — no la reemplaces sin que te lo pidan; para trabajo nuevo, prioriza los hex oficiales de marca cuando tenga sentido.

## Patrones a respetar

- **Nunca pases una imagen de fondo con un `url()` relativo por una custom property** (`style="--hero-img:url('assets/img/x.jpg')"` + `background-image:var(--hero-img)` en un CSS). El `url()` se resuelve respecto a la hoja CSS (`assets/css/`), no al HTML, así que la foto da 404 y solo se ve el color de fondo. Ya no queda ningún caso de esto en el sitio (arreglado en `article.css` + 7 páginas — ver abajo) — si vuelves a necesitar una foto de fondo, usa el patrón `.page-hero-bg` (ver siguiente punto) o `.pb-bg` de `productos.css`: un `<img>` real con `object-fit:cover` y el degradado en un `::after`, nunca una custom property con `url()`.
- Para comprobar cómo se ve algo de verdad, renderiza con Edge headless (`msedge --headless=new --user-data-dir=<carpeta propia> --window-size=1440,4400 --screenshot=out.png file:///...`) y mira la imagen. El `--user-data-dir` propio es necesario si Edge ya está abierto.

- **`.page-hero`** (fondo oscuro con imagen/gradiente) se define en `assets/css/article.css`. Cualquier página que use `class="page-hero"` (o una variante como `.pds-hero`/`.qs-hero`) DEBE cargar `article.css`, o el hero pierde el fondo oscuro y el texto queda en el color de tinta por defecto (ilegible). Ya se corrigió este olvido en las 15 páginas de `fichas-tecnicas/` y en `nosotros/quienes-somos.html` — no lo vuelvas a omitir en páginas nuevas.
  - El degradado vive en la custom property `--ph-gradient` (definida en `.page-hero`, heredada por sus descendientes). Páginas SIN foto (fichas técnicas) solo necesitan `class="page-hero"` — el degradado se ve solo. Páginas CON foto agregan, como primer hijo del `<section>`, `<div class="page-hero-bg" aria-hidden="true"><img src="..." alt="" loading="eager" fetchpriority="high" decoding="async"></div>` — el `::after` de `.page-hero-bg` reutiliza el mismo `--ph-gradient`, así que la foto y el degradado siempre coinciden.
  - El degradado (`--ph-gradient` en `article.css`, y el de `.qs-hero-media::after` en `quienes-somos.css`) usa la paleta 100% oficial: azul oscuro `#080C41` → azul petróleo `#154772` → azul cielo `#359ACC`. Antes usaban `--navy-deep`/`--navy`/`--teal` (la paleta operativa, ninguno de esos 3 hex es un color de marca real — `--teal` en particular es un turquesa que no está en el manual). Si agregas un hero nuevo, reutiliza esta misma fórmula de 3 colores en vez de inventar una paleta local (ya pasó 3 veces: `article.css`, `quienes-somos.css`, `productos.css`).
- El enlace "Productos" del navbar/footer/breadcrumbs en TODAS las páginas apunta a `productos.html` (catálogo completo, en la raíz del sitio) — ya no a `index.html#productos`. El index conserva una sección `#productos` recortada (solo algunos productos destacados) con un botón "Ver todo el portafolio" hacia `productos.html`.
- Las tarjetas de producto (`.product-card` / `.products-grid`) muestran una imagen estática y, si existe, un video que se revela en hover/focus (`assets/js/home.js`). Hay DOS diseños con los mismos nombres de clase, a propósito, para compartir esa lógica de video: el del index (`assets/css/home.css`) y el del catálogo (`assets/css/productos.css`, que no carga home.css). Productos "en desarrollo" (sin foto ni video reales) usan `assets/img/en-desarrollo.png` como cover fijo — es la solución intencional para que no se vean en blanco, no un placeholder pendiente de arreglar.
- **`productos.html` usa EXCLUSIVAMENTE la paleta corporativa oficial**, vía los tokens `--pb-*` definidos en `assets/css/productos.css` (`.prod-page`). Nada de ámbar/naranja ni del teal heredado: no uses `.btn-primary`/`.btn-outline` de `base.css` en esa página, tienen ámbar. Si agregas secciones ahí, sigue esos tokens.
- Ojo con las fotos: `Petroil_fotosplanta_46/48/60.jpg` son fauna (loros, un pájaro, una iguana), no planta industrial. Las fotos industriales reales utilizables como fondo son `Petroil_fotosplanta_29.jpg`, `noticias/euro-vi-petroil-50-10-refineria.jpg`, `noticias/euro6-refineria-petroil.jpg` y `noticias/embajada-eeuu-recorrido-planta.jpg`. Las `quienes-somos/ruta-*.png` son miniaturas (~230px), no sirven de fondo.
