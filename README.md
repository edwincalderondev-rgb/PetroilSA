# PetroilSA
Prototipo Petroil SA

## Estructura del proyecto

Sitio estático (HTML/CSS/JS sin build). Las páginas están agrupadas por
sección y los estilos/scripts compartidos viven en `assets/`, divididos por
función en vez de dos bundles únicos:

```
index.html                 # portada (se mantiene en la raíz)
productos.html             # catálogo completo del portafolio
contacto.html              # formulario de cotización/información (WhatsApp o correo)
fichas-tecnicas/           # fichas técnicas de producto
nosotros/                  # quienes-somos, ala-de-sable
legal/                     # política de datos, PQRSF
sostenibilidad/            # compromiso social, ambiental, SGI
noticias/                  # artículos y notas de prensa
herramientas/              # utilidades autocontenidas (colorímetro ASTM D1500)
portal-clientes/           # portal de clientes (prototipo)
scripts/                   # utilidades de mantenimiento del repo (no se sirven en el sitio)
assets/
  css/                      # base, header-nav, hero, home, footer, chatbot,
                             # article, pqrsf, ficha-tecnica, cursor, productos,
                             # contacto + los CSS propios de quienes-somos y ala-de-sable
  js/                       # nav, hero-particles, home, footer-map, chatbot,
                             # article-toc, pqrsf, cursor, i18n, productos,
                             # contacto + el JS de quienes-somos
  i18n/                     # diccionarios de traducción (piloto: index.json)
  img/  vids/               # imágenes y video (las fichas técnicas ya no se publican en PDF)
```

Cada página carga solo los módulos CSS/JS que necesita (ver el `<head>`/pie
de cada plantilla). `scripts/verify-links.sh` recorre todas las páginas y
confirma que cada `href`/`src` local apunte a un archivo existente — útil
para correr después de mover o renombrar cualquier página o asset.
