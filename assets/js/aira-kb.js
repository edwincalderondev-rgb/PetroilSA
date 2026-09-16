/* ============================================================
   AIRA · BASE DE CONOCIMIENTO
   ------------------------------------------------------------
   Esta es la ÚNICA fuente de verdad de lo que el chat sabe
   responder. Para enseñarle algo nuevo a AIRA basta con agregar
   una entrada aquí: NO hay que tocar aira.js.

   Va como .js (window.AIRA_KB) y no como .json a propósito: un
   fetch() de JSON falla bajo file:// por CORS, y el flujo de
   revisión del proyecto abre las páginas con Edge headless sobre
   file:/// (ver CLAUDE.md). Como <script> funciona en ambos.

   ------------------------------------------------------------
   ANATOMÍA DE UNA ENTRADA
   ------------------------------------------------------------
   id    Identificador único (historial y seguimiento de contexto).
   cat   Categoría: agrupa la entrada en el menú "Explorar temas".
   title Título corto — encabeza la respuesta y las sugerencias.
   p     FRASES clave (peso alto). Si la pregunta contiene la frase
         completa, gana casi seguro. Úsalas para desambiguar entre
         entradas parecidas ("gasolina premium" vs "gasolina
         corriente").
   k     PALABRAS clave sueltas (peso medio), separadas por espacios.
         Escríbelas SIN tilde y en minúscula: el motor normaliza la
         pregunta del usuario igual antes de comparar, así que
         "diesel" matchea "diésel", "DIÉSEL" y "Diesel".
   a     Respuesta en HTML (<p> <b> <i> <ul> <li> <br>).
   links Tarjetas de navegación al final de la respuesta:
         {l: etiqueta, h: href relativo a la raíz del sitio,
          i: icono (doc|cart|map|mail|wa|info|leaf|tool|news|ship|
          shield|drop), ext: true si abre en pestaña nueva}
   next  Sugerencias de seguimiento (chips). Deben ser preguntas
         que esta misma base sepa responder.
   ============================================================ */

window.AIRA_KB = {
  meta: {
    version: '1.0',
    updated: '2026-09-16',
    /* Las categorías alimentan el menú "Explorar temas" del panel
       de bienvenida, en este orden. */
    categories: [
      { id: 'productos', label: 'Productos',        icon: 'drop',   hint: '15 combustibles y refinados' },
      { id: 'empresa',   label: 'La empresa',       icon: 'info',   hint: 'Quiénes somos y hacia dónde vamos' },
      { id: 'calidad',   label: 'Calidad y normas', icon: 'shield', hint: 'ISO, Euro VI, ISO 8217' },
      { id: 'sectores',  label: 'Aplicaciones',     icon: 'ship',   hint: 'Marino, industria, minería…' },
      { id: 'comercial', label: 'Cotizar',          icon: 'cart',   hint: 'Precios, alianzas y asesores' },
      { id: 'contacto',  label: 'Contacto',         icon: 'map',    hint: 'Sedes, canales y PQRSF' }
    ]
  },

  /* Sinónimos: la clave es el término "oficial" que aparece en las
     keywords; los valores son las formas en que la gente lo escribe
     de verdad. El motor expande la pregunta con estos términos antes
     de puntuar, así que no hace falta repetirlos en cada k. */
  synonyms: {
    producto:     ['productos', 'articulo', 'articulos', 'referencia', 'referencias', 'portafolio', 'catalogo', 'linea', 'lineas'],
    combustible:  ['combustibles', 'carburante', 'fuel', 'gasolina', 'diesel', 'acpm'],
    diesel:       ['acpm', 'gasoil', 'gasoleo', 'petrodiesel'],
    precio:       ['precios', 'costo', 'costos', 'vale', 'valor', 'tarifa', 'tarifas', 'cotizacion', 'cotizar'],
    comprar:      ['compra', 'adquirir', 'pedido', 'pedir', 'ordenar', 'venden', 'vender', 'venta', 'distribuidor'],
    ubicacion:    ['ubicados', 'ubicado', 'direccion', 'sede', 'sedes', 'planta', 'oficina', 'quedan', 'queda'],
    contacto:     ['contactar', 'comunicar', 'escribir', 'llamar', 'telefono', 'celular', 'correo', 'email', 'mail'],
    empresa:      ['compania', 'organizacion', 'petroil', 'ustedes', 'firma', 'negocio'],
    certificacion:['certificaciones', 'certificado', 'certificados', 'norma', 'normas', 'acreditacion', 'iso'],
    trabajo:      ['empleo', 'vacante', 'vacantes', 'trabajar', 'contratar', 'cv', 'curriculum', 'postular'],
    ficha:        ['fichas', 'datasheet', 'especificaciones', 'especificacion', 'tecnica', 'tecnicas', 'parametros'],
    ambiente:     ['ambiental', 'ecologico', 'verde', 'sostenible', 'sostenibilidad', 'emisiones', 'contaminacion'],
    marino:       ['maritimo', 'barco', 'barcos', 'buque', 'buques', 'embarcacion', 'embarcaciones', 'naviera', 'bunker'],
    mineria:      ['minero', 'minera', 'excavadora', 'retroexcavadora'],
    generacion:   ['generador', 'generadores', 'turbina', 'turbinas'],
    azufre:       ['sulfur', 'sox', 'ppm']
  },

  entries: [

    /* ══════════════════ PRODUCTOS · VISIÓN GENERAL ══════════════════ */
    {
      id: 'productos-general', cat: 'productos',
      title: 'Portafolio de productos',
      p: ['que productos', 'que productos ofrecen', 'que venden', 'que fabrican', 'que producen', 'lista de productos', 'todos los productos', 'que combustibles'],
      k: 'producto portafolio catalogo combustible refinado oferta linea familia venden fabrican producen cuales',
      a: '<p>Petroil produce <b>15 combustibles y refinados</b>, agrupados en 4 familias:</p>' +
         '<ul>' +
         '<li><b>Combustibles</b> — Petroil 40 A MAX, ULSD Premium 50/10, Gasolina Premium 90, Gasolina Corriente 87 R y la línea Racing Fuel.</li>' +
         '<li><b>Fuel Oils</b> — Petroil 250 (Fuel Oil #4), 800 G Green y 800 HCl.</li>' +
         '<li><b>Marine</b> — Petroil 300 VLSFO y Petroil 500 Marine MGO.</li>' +
         '<li><b>Especializados</b> — Nafta Virgen 60, Kerosene 70, Varsol 230 MS y el Mejorador de IFOS 100.</li>' +
         '</ul>' +
         '<p>Cada producto tiene su <b>ficha técnica</b> con parámetros de calidad, métodos de ensayo y aplicaciones.</p>',
      links: [{ l: 'Ver catálogo completo', h: 'productos.html#catalogo', i: 'cart' }],
      next: ['¿Cuál me sirve para uso marino?', '¿Qué es el ULSD Premium 50/10?', 'Quiero cotizar']
    },
    {
      id: 'familia-combustibles', cat: 'productos',
      title: 'Familia Combustibles',
      p: ['familia combustibles', 'combustibles automotores', 'gasolinas y diesel'],
      k: 'combustible automotor carretera vehiculo vehiculos carro camion gasolina diesel familia',
      a: '<p>La familia <b>Combustibles</b> reúne los productos para transporte y motores: ' +
         '<b>Petroil 40 A MAX</b> (diésel de uso general con base orgánica renovable), ' +
         '<b>ULSD Premium P-50/10</b> (diésel Euro VI), ' +
         '<b>Gasolina Premium P-90</b> (RON 95–99), ' +
         '<b>Gasolina Corriente P-87 R</b> (RON 87) y la línea <b>Racing Fuel</b> (RF-100+ y RF-110+).</p>',
      links: [{ l: 'Abrir catálogo filtrado', h: 'productos.html?cat=combustibles#catalogo', i: 'cart' }],
      next: ['¿Qué es el ULSD Premium 50/10?', '¿Tienen gasolina premium?']
    },
    {
      id: 'familia-fueloils', cat: 'productos',
      title: 'Familia Fuel Oils',
      p: ['fuel oil', 'fuel oils', 'familia fuel oils'],
      k: 'fuel oil oils industrial caldera calderas horno hornos generacion familia',
      a: '<p>Los <b>Fuel Oils</b> están pensados para industria y generación de energía: ' +
         '<b>Petroil 250</b> (Fuel Oil #4 ultra bajo en azufre), ' +
         '<b>Petroil 800 G Green</b> (soluciones más limpias para uso industrial) y ' +
         '<b>Petroil 800 HCl</b> (combustible no convencional con tecnología FISTech®).</p>',
      links: [{ l: 'Abrir catálogo filtrado', h: 'productos.html?cat=fuel-oils#catalogo', i: 'cart' }],
      next: ['¿Qué es el Petroil 800 HCl?', '¿Qué es el Petroil 250?']
    },
    {
      id: 'familia-marine', cat: 'productos',
      title: 'Familia Marine',
      p: ['familia marine', 'combustible marino', 'combustibles marinos', 'productos marinos'],
      k: 'marine marino maritimo barco buque embarcacion naviera bunker familia iso 8217 imo',
      a: '<p>La familia <b>Marine</b> cubre la industria naviera bajo norma <b>ISO 8217</b>: ' +
         '<b>Petroil 300 VLSFO</b> (Very Low Sulfur Fuel Oil, ISO 8217:2017) y ' +
         '<b>Petroil 500 Marine MGO F.O.4</b> (ISO 8217:2021 para IMO 2020).</p>' +
         '<p>El <b>Petroil 100 Mejorador de IFOS</b> complementa la línea como cutter para mezclas de bunker fuel.</p>',
      links: [{ l: 'Ver productos marinos', h: 'productos.html?sector=maritimo#catalogo', i: 'ship' }],
      next: ['¿Qué es la norma ISO 8217?', '¿Qué es el Petroil 300 VLSFO?']
    },
    {
      id: 'familia-especializados', cat: 'productos',
      title: 'Familia Especializados',
      p: ['familia especializados', 'productos especializados', 'solventes'],
      k: 'especializado especializados solvente disolvente nafta kerosene varsol aditivo quimica familia',
      a: '<p>Los <b>Especializados</b> son refinados para procesos industriales y químicos: ' +
         '<b>Petroil 60 Nafta Virgen</b>, <b>Petroil 70 Kerosene</b>, ' +
         '<b>Petroil 230 MS · Varsol</b> (solvente) y <b>Petroil 100 Mejorador de IFOS</b> (aditivo).</p>',
      links: [{ l: 'Abrir catálogo filtrado', h: 'productos.html?cat=especializados#catalogo', i: 'cart' }],
      next: ['¿Qué es el Varsol 230 MS?', '¿Qué es la Nafta Virgen?']
    },

    /* ══════════════════ PRODUCTOS · UNO POR UNO ══════════════════ */
    {
      id: 'p-50-10', cat: 'productos',
      title: 'Petroil 50 10 · ULSD Premium',
      p: ['50 10', '5010', '50/10', 'ulsd', 'ultra bajo azufre', 'diesel euro vi', 'diesel premium'],
      k: 'p5010 ulsd premium diesel cetano euro tier5 tier 5 servicio pesado alta gama azufre',
      a: '<p><b>Petroil 50 10 — ULSD Premium</b> (código <b>P-50/10</b>) es un diésel de ultra bajo azufre que cumple la norma de emisiones <b>Euro VI</b>. Es el <b>primer producto de este tipo fabricado en Colombia</b>.</p>' +
         '<ul>' +
         '<li>Número de cetano <b>&gt;50</b> (ASTM D613)</li>' +
         '<li>Azufre <b>≤10 mg/kg</b> (ASTM D2622)</li>' +
         '<li>Reduce hasta <b>8 %</b> el consumo frente al combustible convencional en Colombia</li>' +
         '</ul>' +
         '<p>Diseñado para motores diésel <b>TIER 5 / Euro VI</b>: camiones, tractocamiones, maquinaria pesada, equipos de minería y agrícolas. También se recomienda en turbinas de generación por su bajo contenido de gomas (&lt;6 mg/100 ml).</p>',
      links: [
        { l: 'Ficha técnica completa', h: 'fichas-tecnicas/ficha-tecnica-petroil-50-10.html', i: 'doc' },
        { l: 'Cotizar este producto', h: 'contacto.html?producto=P-50%2F10#formulario', i: 'cart' }
      ],
      next: ['¿Qué es Euro VI?', '¿Qué productos ofrecen?']
    },
    {
      id: 'p-40', cat: 'productos',
      title: 'Petroil 40 A MAX',
      p: ['40 a max', 'a max', 'petroil 40'],
      k: 'p40 amax diesel general base organica renovable transporte construccion',
      a: '<p><b>Petroil 40 A MAX</b> (código <b>P-40</b>) es un <b>diésel de uso general con contenidos de base orgánica renovable</b>, orientado a transporte, construcción e industria.</p>' +
         '<p>Su ficha técnica detallada está en preparación; el equipo comercial puede enviarte los parámetros oficiales.</p>',
      links: [
        { l: 'Ver ficha del producto', h: 'fichas-tecnicas/ficha-tecnica-petroil-40-a-max.html', i: 'doc' },
        { l: 'Pedir parámetros oficiales', h: 'contacto.html?producto=P-40#formulario', i: 'cart' }
      ],
      next: ['¿Qué es el ULSD Premium 50/10?', 'Quiero cotizar']
    },
    {
      id: 'p-90', cat: 'productos',
      title: 'Petroil 90 · Gasolina Premium',
      p: ['gasolina premium', 'petroil 90', 'gasolina extra', 'ron 95'],
      k: 'p90 gasolina premium extra octanaje ron 95 99 alto rendimiento carretera',
      a: '<p><b>Petroil 90 — Gasolina Premium</b> (código <b>P-90</b>) es la <b>primera gasolina extra producida en Colombia</b>, con <b>RON 95–99</b> y azufre <b>≤20 ppm</b>.</p>' +
         '<p>Ofrece alto rendimiento y confiabilidad en carretera, con clasificación N.° 1 en corrosión a lámina de cobre.</p>',
      links: [
        { l: 'Ficha técnica completa', h: 'fichas-tecnicas/ficha-tecnica-petroil-90.html', i: 'doc' },
        { l: 'Cotizar este producto', h: 'contacto.html?producto=P-90#formulario', i: 'cart' }
      ],
      next: ['¿Tienen gasolina corriente?', '¿Qué es Racing Fuel?']
    },
    {
      id: 'p-87r', cat: 'productos',
      title: 'Petroil 87 R · Gasolina Corriente',
      p: ['gasolina corriente', 'petroil 87', '87 r', 'ron 87'],
      k: 'p87 gasolina corriente regular ron 87 vehiculo liviano livianos',
      a: '<p><b>Petroil 87 R — Gasolina Corriente</b> (código <b>P-87 R</b>) es la <b>primera gasolina corriente producida en Colombia con RON 87</b>, con azufre <b>≤50 ppm</b>.</p>' +
         '<p>Está formulada para vehículos livianos de uso corriente.</p>',
      links: [
        { l: 'Ficha técnica completa', h: 'fichas-tecnicas/ficha-tecnica-petroil-87-r.html', i: 'doc' },
        { l: 'Cotizar este producto', h: 'contacto.html?producto=P-87+R#formulario', i: 'cart' }
      ],
      next: ['¿Tienen gasolina premium?', '¿Qué productos ofrecen?']
    },
    {
      id: 'p-60', cat: 'productos',
      title: 'Petroil 60 · Nafta Virgen',
      p: ['nafta virgen', 'nafta', 'petroil 60'],
      k: 'p60 nafta virgen destilado liviano alifatico pintura pinturas resina resinas acrilico diluyente crudo pesado petroquimica materia prima',
      a: '<p><b>Petroil 60 — Nafta Virgen</b> (código <b>P-60</b>) es un destilado liviano con alto contenido de alifáticos: <b>58 °API</b> y punto de inflamación de <b>28 °C</b>.</p>' +
         '<p>Es ideal para producir <b>disolventes, pinturas, resinas y acrílicos</b>, y funciona como excelente <b>diluyente para crudos pesados</b>.</p>',
      links: [
        { l: 'Ficha técnica completa', h: 'fichas-tecnicas/ficha-tecnica-petroil-60.html', i: 'doc' },
        { l: 'Cotizar este producto', h: 'contacto.html?producto=P-60#formulario', i: 'cart' }
      ],
      next: ['¿Qué es el Varsol 230 MS?', '¿Qué productos especializados tienen?']
    },
    {
      id: 'p-70', cat: 'productos',
      title: 'Petroil 70 · Kerosene',
      p: ['kerosene', 'queroseno', 'petroil 70'],
      k: 'p70 kerosene queroseno destilado ligero domestico industrial termico calefaccion',
      a: '<p><b>Petroil 70 — Kerosene</b> (código <b>P-70</b>) es un destilado ligero para <b>uso doméstico e industrial</b>, con gravedad de <b>≈42–44 °API</b> y punto de inflamación <b>&gt;38 °C</b>.</p>' +
         '<p>Se emplea en aplicaciones térmicas e industriales.</p>',
      links: [
        { l: 'Ficha técnica completa', h: 'fichas-tecnicas/ficha-tecnica-petroil-70-kerosene.html', i: 'doc' },
        { l: 'Cotizar este producto', h: 'contacto.html?producto=P-70#formulario', i: 'cart' }
      ],
      next: ['¿Qué es la Nafta Virgen?', '¿Qué productos ofrecen?']
    },
    {
      id: 'p-100', cat: 'productos',
      title: 'Petroil 100 · Mejorador de IFOS',
      p: ['mejorador de ifos', 'ifos', 'cutter', 'petroil 100', 'mejorador'],
      k: 'p100 mifos mejorador ifo bunker fuel cutter mezclador aditivo metales aromaticos parafinas mezcla marino',
      a: '<p><b>Petroil 100 — Mejorador de IFOS</b> (código <b>P-100</b>) fue desarrollado para la industria del <b>Bunker Fuel versión IFO</b>.</p>' +
         '<p>Por su bajo contenido de <b>metales, aromáticos y parafinas</b> (típico 100 ppm, punto de inflamación 98 °C) es el mejor <b>mezclador o cutter</b> para elaborar mezclas precisas, con incorporación de hasta el <b>70 %</b>.</p>',
      links: [
        { l: 'Ficha técnica completa', h: 'fichas-tecnicas/ficha-tecnica-petroil-100-mifos.html', i: 'doc' },
        { l: 'Cotizar este producto', h: 'contacto.html?producto=P-100#formulario', i: 'cart' }
      ],
      next: ['¿Qué es el Petroil 300 VLSFO?', '¿Qué es la norma ISO 8217?']
    },
    {
      id: 'p-230', cat: 'productos',
      title: 'Petroil 230 MS · Varsol',
      p: ['varsol', '230 ms', 'petroil 230', 'solvente'],
      k: 'p230 varsol solvente disolvente destilado liviano torre atmosferica industria quimica limpieza construccion polivalente',
      a: '<p><b>Petroil 230 MS — Varsol</b> (código <b>P-230</b>) es un destilado liviano refinado en torre atmosférica, comúnmente denominado <b>Varsol</b>.</p>' +
         '<p>Es un producto <b>polivalente</b> usado como disolvente en la <b>industria química y de la limpieza</b>. Densidad 0,797 kg/m³ y punto de inflamación mínimo de 23 °C.</p>',
      links: [
        { l: 'Ficha técnica completa', h: 'fichas-tecnicas/ficha-tecnica-petroil-230-ms.html', i: 'doc' },
        { l: 'Cotizar este producto', h: 'contacto.html?producto=P-230#formulario', i: 'cart' }
      ],
      next: ['¿Qué es la Nafta Virgen?', '¿Qué productos especializados tienen?']
    },
    {
      id: 'p-250', cat: 'productos',
      title: 'Petroil 250 · Fuel Oil #4',
      p: ['fuel oil 4', 'fuel oil #4', 'petroil 250', 'ulsfo'],
      k: 'p250 fuel oil 4 ulsfo ultra bajo azufre generacion industria fuera de carretera off road combustion motor emisiones',
      a: '<p><b>Petroil 250 — Fuel Oil #4</b> (código <b>P-250</b>) es un destilado de la categoría Fuel Oil No. 4 que integra tecnología de punta en su refinación.</p>' +
         '<ul>' +
         '<li>Azufre <b>máx. 120 ppm</b> (ultra bajo azufre)</li>' +
         '<li>Punto de inflamación <b>62 °C</b></li>' +
         '<li>Mejora la combustión, <b>incrementa la vida útil del motor</b> y reduce emisiones contaminantes</li>' +
         '</ul>' +
         '<p>Está destinado a <b>generación de energía e industria</b>, en uso fuera de carretera.</p>',
      links: [
        { l: 'Ficha técnica completa', h: 'fichas-tecnicas/ficha-tecnica-petroil-250.html', i: 'doc' },
        { l: 'Cotizar este producto', h: 'contacto.html?producto=P-250#formulario', i: 'cart' }
      ],
      next: ['¿Qué tienen para generación de energía?', '¿Qué es el Petroil 800 HCl?']
    },
    {
      id: 'p-300', cat: 'productos',
      title: 'Petroil 300 · VLS Fuel Oil',
      p: ['vlsfo', 'vls fuel oil', 'petroil 300', 'very low sulfur'],
      k: 'p300 vlsfo muy bajo azufre industria marina iso 8217 2017 estabilidad btu barco buque',
      a: '<p><b>Petroil 300 — VLS Fuel Oil</b> (código <b>P-300</b>) es un <i>Very Low Sulfur Fuel Oil</i> destinado a la <b>industria marina</b>.</p>' +
         '<ul>' +
         '<li>Cumple todos los parámetros de la norma <b>ISO 8217 de 2017</b></li>' +
         '<li>Azufre <b>máx. 3.520 ppm</b></li>' +
         '<li>Poder calorífico <b>18.157 BTU/lb</b> · Punto de inflamación 72 °C</li>' +
         '</ul>',
      links: [
        { l: 'Ficha técnica completa', h: 'fichas-tecnicas/ficha-tecnica-petroil-300.html', i: 'doc' },
        { l: 'Cotizar este producto', h: 'contacto.html?producto=P-300#formulario', i: 'cart' }
      ],
      next: ['¿Qué es la norma ISO 8217?', '¿Qué es el Petroil 500 MGO?']
    },
    {
      id: 'p-500', cat: 'productos',
      title: 'Petroil 500 · Marine MGO F.O.4',
      p: ['mgo', 'marine mgo', 'petroil 500', 'gasoleo marino', 'imo 2020'],
      k: 'p500 mgo marine marino gasoleo destilado medio fuel oil 4 iso 8217 2021 imo 2020 huella carbono naviera',
      a: '<p><b>Petroil 500 — Marine MGO F.O.4</b> (código <b>P-500</b>) es un destilado medio de la categoría Fuel Oil No. 4, diseñado para generar una <b>menor huella de carbono</b>.</p>' +
         '<ul>' +
         '<li>Cumple y <b>excede</b> los requerimientos de la norma <b>ISO 8217:2021 para IMO 2020</b></li>' +
         '<li>Azufre <b>máx. 780 ppm</b></li>' +
         '<li>Índice cetano <b>mín. 44,3</b> · Punto de inflamación 63 °C</li>' +
         '</ul>',
      links: [
        { l: 'Ficha técnica completa', h: 'fichas-tecnicas/ficha-tecnica-petroil-500.html', i: 'doc' },
        { l: 'Cotizar este producto', h: 'contacto.html?producto=P-500#formulario', i: 'cart' }
      ],
      next: ['¿Qué es la norma ISO 8217?', '¿Qué es el Petroil 300 VLSFO?']
    },
    {
      id: 'p-800g', cat: 'productos',
      title: 'Petroil 800 G · Green',
      p: ['800 g', '800 green', 'petroil 800 g', 'linea green'],
      k: 'p800g green limpio industrial linea verde',
      a: '<p><b>Petroil 800 G — Green</b> (código <b>P-800 G</b>) pertenece a la <b>línea Green</b>: soluciones más limpias para uso industrial y generación.</p>' +
         '<p>Sus parámetros técnicos están en definición; el equipo comercial puede confirmarte disponibilidad y especificaciones.</p>',
      links: [
        { l: 'Ver ficha del producto', h: 'fichas-tecnicas/ficha-tecnica-petroil-800-g.html', i: 'doc' },
        { l: 'Consultar disponibilidad', h: 'contacto.html?producto=P-800+G#formulario', i: 'cart' }
      ],
      next: ['¿Qué es el Petroil 800 HCl?', '¿Qué hacen por el medio ambiente?']
    },
    {
      id: 'p-800hcl', cat: 'productos',
      title: 'Petroil 800 HCl',
      p: ['800 hcl', '800 hc', 'petroil 800 hcl', 'fistech'],
      k: 'p800hcl no convencional fistech tecnologia patentada primero colombia industrial btu emisiones reduccion',
      a: '<p><b>Petroil 800 HCl</b> (código <b>P-800 HCl</b>) es un <b>combustible no convencional</b> producido con la tecnología patentada <b>FISTech®</b> — el primero de su tipo producido en Colombia.</p>' +
         '<ul>' +
         '<li>Reducción de emisiones de hasta <b>-45 %</b></li>' +
         '<li>Poder calorífico típico <b>14.579 BTU/lb</b></li>' +
         '<li>Punto de inflamación típico <b>110 °C</b></li>' +
         '</ul>' +
         '<p>Está destinado a procesos industriales.</p>',
      links: [
        { l: 'Ficha técnica completa', h: 'fichas-tecnicas/ficha-tecnica-petroil-800-hc.html', i: 'doc' },
        { l: 'Cotizar este producto', h: 'contacto.html?producto=P-800+HCl#formulario', i: 'cart' }
      ],
      next: ['¿Qué es el Petroil 250?', '¿Qué hacen por el medio ambiente?']
    },
    {
      id: 'racing', cat: 'productos',
      title: 'Línea Racing Fuel',
      p: ['racing', 'racing fuel', 'competencia', 'rf 110', 'rf 100', '110+', '100+'],
      k: 'racing fuel competencia octanaje booster alto desempeno carrera motor deportivo rf110 rf100',
      a: '<p>La línea <b>Racing Fuel</b> está formulada para motores de alto desempeño y competencia:</p>' +
         '<ul>' +
         '<li><b>RF-110+ · Racing Fuel</b> — booster mejorador de octanaje, <b>110+</b>.</li>' +
         '<li><b>RF-100+ · 100+ Racing Fuel</b> — combustible de competencia de alto desempeño.</li>' +
         '</ul>' +
         '<p>Las fichas oficiales de esta línea están en preparación.</p>',
      links: [
        { l: 'Ficha RF 110+', h: 'fichas-tecnicas/ficha-tecnica-petroil-rf-110.html', i: 'doc' },
        { l: 'Ficha 100+ Racing', h: 'fichas-tecnicas/ficha-tecnica-petroil-100-plus-racing.html', i: 'doc' }
      ],
      next: ['¿Tienen gasolina premium?', 'Quiero cotizar']
    },

    /* ══════════════════ SECTORES / APLICACIONES ══════════════════ */
    {
      id: 'sector-maritimo', cat: 'sectores',
      title: 'Uso marino',
      p: ['uso marino', 'para barcos', 'para buques', 'sector maritimo', 'combustible para embarcaciones', 'cual me sirve para uso marino'],
      k: 'marino maritimo barco buque embarcacion naviera flota bunker puerto mgo vlsfo hsfo',
      a: '<p>Para el sector marítimo Petroil ofrece <b>MGO, VLSFO y HSFO</b> para todo tipo de embarcaciones, bajo la norma <b>ISO 8217</b> para <b>IMO 2020</b>.</p>' +
         '<p>Los productos clave son <b>Petroil 500 Marine MGO</b> (ISO 8217:2021), <b>Petroil 300 VLSFO</b> (ISO 8217:2017) y el <b>Petroil 100 Mejorador de IFOS</b> como cutter de mezclas.</p>',
      links: [{ l: 'Ver productos para uso marino', h: 'productos.html?sector=maritimo#catalogo', i: 'ship' }],
      next: ['¿Qué es la norma ISO 8217?', '¿Qué es el Petroil 500 MGO?']
    },
    {
      id: 'sector-industria', cat: 'sectores',
      title: 'Uso industrial',
      p: ['uso industrial', 'sector industrial', 'para calderas', 'para la industria'],
      k: 'industria industrial caldera calderas horno maquinaria transporte carga planta fabrica proceso',
      a: '<p>Para la industria formulamos combustibles a la medida para <b>transporte de carga, maquinaria, calderas y generación de energía</b>.</p>' +
         '<p>Los más usados son <b>Petroil 250 Fuel Oil #4</b>, <b>Petroil 800 G Green</b>, <b>Petroil 800 HCl</b> y, para flotas, el <b>ULSD Premium 50/10</b>.</p>',
      links: [{ l: 'Ver productos industriales', h: 'productos.html?sector=industria#catalogo', i: 'cart' }],
      next: ['¿Qué es el Petroil 250?', 'Quiero cotizar']
    },
    {
      id: 'sector-mineria', cat: 'sectores',
      title: 'Minería y construcción',
      p: ['equipos de mineria', 'sector minero', 'maquinaria pesada', 'para construccion'],
      k: 'mineria minero construccion maquinaria pesada excavadora extractiva obra volqueta agricola',
      a: '<p>Para minería y construcción ofrecemos <b>formulaciones de alto rendimiento para maquinaria pesada y operaciones extractivas</b>.</p>' +
         '<p>El <b>ULSD Premium 50/10</b> está recomendado para equipos de minería y agrícolas con tecnología TIER 5, y el <b>Petroil 40 A MAX</b> cubre el uso general en obra.</p>',
      links: [{ l: 'Ver productos del sector', h: 'productos.html?sector=construccion#catalogo', i: 'cart' }],
      next: ['¿Qué es el ULSD Premium 50/10?', 'Quiero cotizar']
    },
    {
      id: 'sector-generacion', cat: 'sectores',
      title: 'Generación de energía',
      p: ['generacion de energia', 'motores estacionarios', 'planta electrica', 'para turbinas', 'que tienen para generacion de energia'],
      k: 'generacion energia electrica motor estacionario turbina planta continua',
      a: '<p>Para plantas de generación y motores de operación continua ofrecemos <b>Petroil 250 Fuel Oil #4</b>, <b>Petroil 300 VLSFO</b> y <b>Petroil 800 G Green</b>.</p>' +
         '<p>El <b>ULSD Premium 50/10</b> también se recomienda en <b>turbinas de generación</b> gracias a su bajo contenido de gomas (&lt;6 mg/100 ml).</p>',
      links: [{ l: 'Ver productos para generación', h: 'productos.html?sector=generacion#catalogo', i: 'cart' }],
      next: ['¿Qué es el Petroil 250?', 'Quiero cotizar']
    },

    /* ══════════════════ EMPRESA ══════════════════ */
    {
      id: 'quienes-somos', cat: 'empresa',
      title: 'Quiénes somos',
      p: ['quienes son', 'quienes somos', 'que es petroil', 'sobre la empresa', 'acerca de', 'a que se dedican', 'que hacen'],
      k: 'empresa compania petroil historia refineria hidrocarburos dedican quienes somos sobre acerca informacion',
      a: '<p><b>Petroil S.A.</b> es una compañía energética integrada que <b>diseña, produce y distribuye soluciones energéticas más eficientes y limpias</b>, bajo el lema <i>«Mejorando el aire que respiramos»</i>.</p>' +
         '<p>Opera como <b>refinería de hidrocarburos</b>: transforma crudo y otras materias primas en combustibles terminados mediante procesos de destilación, mezcla y tratamiento, ajustando cada producto a las especificaciones que exige cada industria — marítima, industrial, minera o de generación eléctrica.</p>',
      links: [{ l: 'Conocer la compañía', h: 'nosotros/quienes-somos.html', i: 'info' }],
      next: ['¿Cuál es su visión 2031?', '¿Qué certificaciones tienen?', '¿Dónde están ubicados?']
    },
    {
      id: 'proposito-vision', cat: 'empresa',
      title: 'Propósito y Visión 2031',
      p: ['vision 2031', 'cual es su vision', 'su proposito', 'mision', 'objetivo de la empresa', 'plan estrategico'],
      k: 'proposito vision mision 2031 futuro meta objetivo estrategia estrategico ruta crecimiento',
      a: '<p><b>Propósito:</b> <i>Mejorando el aire que respiramos</i> — diseñar, producir y distribuir mejores opciones de energía para Colombia y la región.</p>' +
         '<p><b>Visión 2031:</b> ser una compañía energética integrada y confiable para Colombia y la región, reconocida por la <b>calidad, la eficiencia, la innovación y un crecimiento sostenible</b> que crea valor.</p>' +
         '<p>La ruta a 2031 se apoya en cinco programas: <b>negocio base</b>, <b>nuevas líneas de producto</b> (Jet A-1, White Spirit, gasolinas especiales), <b>expansión comercial</b> (red nacional camino a 500 EDS), <b>combustibles alternativos</b> y <b>proyectos transformacionales</b>.</p>',
      links: [{ l: 'Ver la Visión Estratégica 2031', h: 'nosotros/quienes-somos.html', i: 'info' }],
      next: ['¿Cuáles son sus valores?', '¿Quién dirige Petroil?']
    },
    {
      id: 'valores', cat: 'empresa',
      title: 'Valores corporativos',
      p: ['sus valores', 'valores corporativos', 'principios', 'cuales son sus valores'],
      k: 'valor valores principio principios lealtad reciprocidad respeto cultura',
      a: '<p>Los valores que guían a Petroil son <b>Lealtad</b>, <b>Reciprocidad</b> y <b>Respeto</b>.</p>' +
         '<p>Se complementan con cinco fuerzas que impulsan la estrategia: <b>crecimiento rentable</b>, <b>experiencia del cliente</b>, <b>excelencia operacional</b>, <b>innovación</b> y <b>personas y cultura</b>.</p>',
      links: [{ l: 'Leer más sobre nosotros', h: 'nosotros/quienes-somos.html', i: 'info' }],
      next: ['¿Cuál es su visión 2031?', '¿Quién dirige Petroil?']
    },
    {
      id: 'equipo', cat: 'empresa',
      title: 'Equipo directivo',
      p: ['quien dirige', 'equipo directivo', 'junta directiva', 'el ceo', 'presidente', 'directivos', 'quien dirige petroil'],
      k: 'equipo directivo junta directiva ceo presidente vicepresidente lider liderazgo gerencia direccion gerente',
      a: '<p>Petroil está dirigida por ejecutivos con décadas de experiencia en energía, hidrocarburos, finanzas y relaciones internacionales:</p>' +
         '<ul>' +
         '<li><b>Luis Alberto Hincapié Carvajal</b> — Presidente de la Junta Directiva</li>' +
         '<li><b>Ramiro Hernando Sánchez Benítez</b> — CEO, fundador de Biomax Colombia</li>' +
         '<li><b>Adriana Milena Munévar Arciniegas</b> — Finanzas corporativas</li>' +
         '<li><b>Fernando Vargas Rubio</b> — VP de E&amp;P y Nuevos Negocios</li>' +
         '<li><b>Pablo Antonio Motta Candela</b> — VP de Operaciones</li>' +
         '<li><b>Carlos Alberto Buitrago Ferreira</b> — VP de Planeación Estratégica Comercial</li>' +
         '<li><b>William Albert McDowell</b> — VP de Relaciones Externas y Negocios Internacionales</li>' +
         '</ul>',
      links: [{ l: 'Ver perfiles completos', h: 'nosotros/quienes-somos.html', i: 'info' }],
      next: ['¿Cuál es su visión 2031?', '¿Qué es Petroil?']
    },
    {
      id: 'diferencial', cat: 'empresa',
      title: 'Qué nos diferencia',
      p: ['que los diferencia', 'por que petroil', 'diferencia con otros', 'que tienen de especial', 'ventaja'],
      k: 'diferencia diferencial diferencian ventaja mejor especial competencia convencional porque comparacion',
      a: '<p>Cada línea de producto se diseña para <b>reducir emisiones de gases de efecto invernadero</b> frente a alternativas convencionales, <b>sin sacrificar el rendimiento</b>.</p>' +
         '<p>Cada combustible se identifica con un <b>código propio</b> dentro de nuestro sistema de clasificación y se formula para el uso específico al que va destinado. Varios de ellos son <b>primeros de su tipo producidos en Colombia</b>: el ULSD Premium 50/10 (Euro VI), la gasolina 87 R, la gasolina extra 90 y el Petroil 800 HCl con tecnología FISTech®.</p>',
      links: [{ l: 'Ver el portafolio', h: 'productos.html#catalogo', i: 'cart' }],
      next: ['¿Qué certificaciones tienen?', '¿Qué es Euro VI?']
    },
    {
      id: 'noticias', cat: 'empresa',
      title: 'Noticias y publicaciones',
      p: ['noticias', 'publicaciones', 'novedades', 'blog', 'articulos'],
      k: 'noticia noticias publicacion novedad blog articulo prensa actualidad comunicado',
      a: '<p>En la sección de noticias encuentras publicaciones técnicas e institucionales, como:</p>' +
         '<ul>' +
         '<li><b>Euro VI:</b> por qué la calidad del combustible importa tanto como la tecnología del motor.</li>' +
         '<li><b>Petroil recibe la visita de la Embajada de Estados Unidos</b> en Santa Marta.</li>' +
         '<li><b>Euro 6:</b> qué es y por qué importa para la calidad del aire.</li>' +
         '</ul>',
      links: [{ l: 'Ir a noticias', h: '#noticias', i: 'news' }],
      next: ['¿Qué es Euro VI?', '¿Qué es Petroil?']
    },

    /* ══════════════════ CALIDAD Y NORMAS ══════════════════ */
    {
      id: 'iso', cat: 'calidad',
      title: 'Certificaciones ISO',
      p: ['certificaciones iso', 'que certificaciones', 'estan certificados', 'trinorma', 'iso 9001', 'iso 14001', 'iso 45001', 'que certificaciones tienen'],
      k: 'certificacion iso 9001 14001 45001 trinorma calidad ambiental seguridad salud trabajo auditoria acreditacion respaldo',
      a: '<p>Petroil cuenta con la <b>trinorma</b>:</p>' +
         '<ul>' +
         '<li><b>ISO 9001</b> — Gestión de Calidad</li>' +
         '<li><b>ISO 45001</b> — Seguridad y Salud en el Trabajo</li>' +
         '<li><b>ISO 14001</b> — Gestión Ambiental</li>' +
         '</ul>' +
         '<p>Las tres están integradas bajo un único <b>Sistema de Gestión Integrada (SGI)</b> que audita procesos, indicadores y mejora continua de forma periódica.</p>',
      links: [{ l: 'Conocer el SGI', h: 'sostenibilidad/sgi.html', i: 'shield' }],
      next: ['¿Qué es el SGI?', '¿Cumplen la normativa ambiental?']
    },
    {
      id: 'sgi', cat: 'calidad',
      title: 'Sistema de Gestión Integrada',
      p: ['sistema de gestion', 'que es el sgi', 'sgi'],
      k: 'sgi sistema gestion integrada integrado phva mejora continua indicadores proceso auditoria politica',
      a: '<p>El <b>Sistema de Gestión Integrada (SGI)</b> reúne en un solo marco las tres certificaciones ISO de la compañía (Calidad, Seguridad y Salud en el Trabajo, y Gestión Ambiental).</p>' +
         '<p>Funciona bajo el ciclo de <b>mejora continua PHVA</b> (Planear, Hacer, Verificar, Actuar), con indicadores de gestión y documentos del sistema auditados periódicamente.</p>',
      links: [{ l: 'Ver el SGI completo', h: 'sostenibilidad/sgi.html', i: 'shield' }],
      next: ['¿Qué certificaciones tienen?', '¿Qué hacen por el medio ambiente?']
    },
    {
      id: 'euro-vi', cat: 'calidad',
      title: 'Norma Euro 6 / Euro VI',
      p: ['que es euro 6', 'que es euro vi', 'euro 6', 'euro vi', 'norma euro'],
      k: 'euro 6 vi norma emision emisiones europea diesel vehiculo limite 2023 colombia tier',
      a: '<p><b>Euro 6 (o Euro VI)</b> es una norma ambiental de origen europeo que establece <b>límites muy bajos para las emisiones contaminantes</b> de los vehículos con motor diésel.</p>' +
         '<p>En <b>Colombia aplica desde el 1 de enero de 2023</b> para todos los vehículos diésel nuevos, incluidos automóviles, buses y camiones.</p>' +
         '<p>Los motores Euro VI dependen de un combustible de <b>ultra bajo azufre</b> para que sus sistemas de control de emisiones funcionen: por eso Petroil desarrolló el <b>ULSD Premium 50/10</b>, el primer diésel Euro VI fabricado en Colombia.</p>',
      links: [
        { l: 'Leer: Euro VI y la calidad del combustible', h: 'noticias/euro-vi-calidad-combustible-tecnologia-motor.html', i: 'news' },
        { l: 'Leer: Euro 6 y la calidad del aire', h: 'noticias/euro-6-que-es-calidad-del-aire.html', i: 'news' }
      ],
      next: ['¿Qué es el ULSD Premium 50/10?', '¿Qué es la transición energética?']
    },
    {
      id: 'iso-8217', cat: 'calidad',
      title: 'Norma ISO 8217 e IMO 2020',
      p: ['iso 8217', 'imo 2020', 'norma marina', 'norma para barcos', 'que es la norma iso 8217'],
      k: 'iso 8217 imo 2020 marino maritimo norma bunker azufre naviera 2017 2021 cumplimiento',
      a: '<p>La <b>ISO 8217</b> es la norma internacional que fija las especificaciones de los combustibles marinos. <b>IMO 2020</b> es el límite global de azufre que la Organización Marítima Internacional impuso a los buques desde 2020.</p>' +
         '<p>En Petroil:</p>' +
         '<ul>' +
         '<li><b>Petroil 300 VLSFO</b> cumple todos los parámetros de la <b>ISO 8217:2017</b>.</li>' +
         '<li><b>Petroil 500 Marine MGO</b> <b>cumple y excede</b> la <b>ISO 8217:2021</b> para IMO 2020.</li>' +
         '</ul>',
      links: [{ l: 'Ver productos marinos', h: 'productos.html?sector=maritimo#catalogo', i: 'ship' }],
      next: ['¿Qué es el Petroil 500 MGO?', '¿Qué es el Petroil 300 VLSFO?']
    },
    {
      id: 'transicion', cat: 'calidad',
      title: 'Transición energética',
      p: ['transicion energetica', 'que es la transicion', 'acuerdo de paris', 'combustibles de transicion'],
      k: 'transicion energetica acuerdo paris cop21 cop 21 cambio climatico renovable solar eolica carbono puente fosil',
      a: '<p>En 2015, durante la <b>COP 21</b>, 195 países firmaron el <b>Acuerdo de París</b> para reducir las emisiones de carbono y limitar el calentamiento global a menos de dos grados centígrados.</p>' +
         '<p>La <b>transición energética</b> es el proceso de cambio de una forma de producción de energía a otra, e incluye el reemplazo de combustibles fósiles como el carbón y el petróleo por fuentes renovables como la solar y la eólica.</p>' +
         '<p>Los <b>combustibles de transición</b> son fuentes «puente»: están diseñados para reducir significativamente las emisiones de gases de efecto invernadero (CO, CO₂, SOx, NOx, CH₄, aromáticos, material particulado PM10 y PM2.5) mientras se completa la infraestructura para energías 100 % renovables. Ese es el terreno donde trabaja Petroil.</p>',
      links: [{ l: 'Ver responsabilidad ambiental', h: 'sostenibilidad/responsabilidad-ambiental.html', i: 'leaf' }],
      next: ['¿Qué hacen por el medio ambiente?', '¿Qué es Euro VI?']
    },
    {
      id: 'ambiental', cat: 'calidad',
      title: 'Responsabilidad ambiental',
      p: ['medio ambiente', 'responsabilidad ambiental', 'cumplen la normativa ambiental', 'anla', 'impacto ambiental', 'huella de carbono', 'que hacen por el medio ambiente'],
      k: 'ambiente ambiental ecologico sostenible sostenibilidad emision emisiones contaminacion anla licencia decreto monitoreo huella carbono verde',
      a: '<p>Petroil opera bajo la <b>normativa ambiental vigente en Colombia</b> y está sujeta a la autorización, seguimiento y control de la <b>Autoridad Nacional de Licencias Ambientales (ANLA)</b>, conforme al <b>Decreto 1076 de 2015</b>.</p>' +
         '<p>Realizamos <b>monitoreos permanentes</b> para garantizar el cumplimiento de los estándares ambientales, respaldados por la certificación <b>ISO 14001</b> de Gestión Ambiental.</p>',
      links: [{ l: 'Ver responsabilidad ambiental', h: 'sostenibilidad/responsabilidad-ambiental.html', i: 'leaf' }],
      next: ['¿Qué certificaciones tienen?', '¿Qué es la transición energética?']
    },
    {
      id: 'seguridad', cat: 'calidad',
      title: 'Seguridad de la operación',
      p: ['medidas de seguridad', 'que tan seguro', 'seguridad de la refineria', 'emergencias'],
      k: 'seguridad seguro riesgo protocolo emergencia capacitacion monitoreo salud trabajo accidente',
      a: '<p>La operación se rige por un <b>Sistema de Gestión Integral</b> certificado bajo <b>ISO 9001:2015, ISO 14001:2015 e ISO 45001:2018</b>.</p>' +
         '<p>Se orienta por la <b>Política de Gestión Integral y Sostenibilidad</b>, junto con estrictos protocolos de seguridad, <b>capacitación continua</b>, monitoreo permanente de procesos y <b>planes de respuesta ante emergencias</b>.</p>',
      links: [{ l: 'Conocer el SGI', h: 'sostenibilidad/sgi.html', i: 'shield' }],
      next: ['¿Qué certificaciones tienen?', '¿Cumplen la normativa ambiental?']
    },
    {
      id: 'refineria', cat: 'calidad',
      title: 'Qué hace una refinería',
      p: ['que hace una refineria', 'como funciona la refineria', 'proceso de refinacion', 'como producen'],
      k: 'refineria refinacion proceso destilacion mezcla tratamiento crudo materia prima transformar produccion planta',
      a: '<p>Una refinería como Petroil <b>transforma crudo y otras materias primas en combustibles terminados</b> —fuel oil, nafta, gasolina, VLSFO— mediante procesos de <b>destilación, mezcla y tratamiento</b>.</p>' +
         '<p>Cada producto se ajusta a las especificaciones técnicas que exige su industria destino: marítima, industrial, minera o de generación eléctrica.</p>' +
         '<p>La refinería de Petroil está en el <b>sector Mamatoco, Santa Marta</b>.</p>',
      links: [{ l: 'Ver el portafolio', h: 'productos.html#catalogo', i: 'cart' }],
      next: ['¿Dónde están ubicados?', '¿Qué productos ofrecen?']
    },
    {
      id: 'fichas', cat: 'calidad',
      title: 'Fichas técnicas',
      p: ['ficha tecnica', 'fichas tecnicas', 'especificaciones tecnicas', 'descargar ficha', 'pdf de producto', 'hoja tecnica', 'que son las fichas tecnicas'],
      k: 'ficha tecnica especificacion parametro dato metodo ensayo astm descargar pdf documento hoja',
      a: '<p>Cada producto tiene una <b>ficha técnica en línea</b> con su descripción, aplicaciones, beneficios y la tabla completa de parámetros de calidad con sus <b>métodos de ensayo ASTM</b>.</p>' +
         '<p>Las fichas <b>no se descargan en PDF</b>: se consultan directamente en el sitio y así siempre están actualizadas. Si necesitas el documento oficial firmado, solicítalo al equipo comercial.</p>',
      links: [
        { l: 'Ver todas las fichas', h: 'productos.html#catalogo', i: 'doc' },
        { l: 'Solicitar ficha oficial', h: 'contacto.html#formulario', i: 'mail' }
      ],
      next: ['¿Qué productos ofrecen?', 'Quiero cotizar']
    },

    /* ══════════════════ COMERCIAL ══════════════════ */
    {
      id: 'cotizar', cat: 'comercial',
      title: 'Solicitar una cotización',
      p: ['quiero cotizar', 'solicitar cotizacion', 'cuanto cuesta', 'cual es el precio', 'precios', 'me pasas precios', 'quiero comprar', 'hacer un pedido', 'cuanto vale'],
      k: 'cotizar cotizacion precio costo valor comprar compra pedido venta adquirir presupuesto tarifa cuanto',
      a: '<p>Los precios de Petroil se cotizan <b>a la medida de cada operación</b>: dependen del producto, el volumen y las condiciones logísticas, así que no hay una lista pública.</p>' +
         '<p>Para recibir una propuesta, completa el <b>formulario de cotización</b> indicando el producto que te interesa — el área comercial te contacta por WhatsApp o correo.</p>',
      links: [
        { l: 'Solicitar cotización', h: 'contacto.html#formulario', i: 'cart' },
        { l: 'Hablar por WhatsApp', h: 'https://wa.me/573113337046?text=%C2%A1Hola!%20Quiero%20solicitar%20una%20cotizaci%C3%B3n%20de%20combustibles%20Petroil.', i: 'wa', ext: true }
      ],
      next: ['¿Qué productos ofrecen?', '¿Cómo me convierto en cliente?']
    },
    {
      id: 'ser-cliente', cat: 'comercial',
      title: 'Convertirse en cliente o aliado',
      p: ['como ser cliente', 'convertirme en cliente', 'ser aliado', 'alianza comercial', 'ser distribuidor', 'quiero ser cliente', 'como me convierto en cliente'],
      k: 'cliente aliado alianza comercial distribuidor socio negocio convenio volumen logistica propuesta',
      a: '<p>Escríbenos por <b>WhatsApp</b> o <b>correo electrónico</b> para ser contactado por el área comercial.</p>' +
         '<p>El equipo evalúa el <b>volumen</b>, el <b>tipo de combustible</b> y las <b>condiciones logísticas</b> requeridas para diseñar una propuesta a la medida de tu operación.</p>',
      links: [
        { l: 'Escribir al área comercial', h: 'contacto.html#formulario', i: 'mail' },
        { l: 'WhatsApp +57 311 333 7046', h: 'https://wa.me/573113337046?text=%C2%A1Hola!%20Quiero%20explorar%20una%20alianza%20comercial%20con%20Petroil.', i: 'wa', ext: true }
      ],
      next: ['Quiero cotizar', '¿Dónde están ubicados?']
    },
    {
      id: 'asesor', cat: 'comercial',
      title: 'Hablar con un asesor',
      p: ['hablar con un asesor', 'hablar con alguien', 'atencion al cliente', 'asesor comercial', 'hablar con una persona', 'servicio al cliente', 'quiero hablar con un humano'],
      k: 'asesor asesoria humano persona agente atencion soporte ayuda comercial vendedor hablar',
      a: '<p>Con gusto. Un <b>asesor comercial</b> puede atenderte directamente por estos canales:</p>' +
         '<ul>' +
         '<li><b>WhatsApp:</b> +57 311 333 7046</li>' +
         '<li><b>Correo:</b> contacto@petroilsa.com</li>' +
         '</ul>' +
         '<p>También puedes dejar tus datos en el formulario y te contactamos.</p>',
      links: [
        { l: 'Abrir WhatsApp', h: 'https://wa.me/573113337046?text=%C2%A1Hola!%20Vengo%20del%20chat%20del%20sitio%20web%20de%20Petroil%20y%20quiero%20hablar%20con%20un%20asesor.', i: 'wa', ext: true },
        { l: 'Formulario de contacto', h: 'contacto.html#formulario', i: 'mail' }
      ],
      next: ['Quiero cotizar', '¿Dónde están ubicados?']
    },
    {
      id: 'proveedores', cat: 'comercial',
      title: 'Ser proveedor de Petroil',
      p: ['ser proveedor', 'registrarme como proveedor', 'requisitos para ser proveedor', 'licitaciones'],
      k: 'proveedor proveedores licitacion licitaciones contratacion adquisicion registro requisito documentacion',
      a: '<p>Los proveedores deben cumplir los <b>requisitos legales aplicables</b>, la documentación corporativa solicitada y los <b>estándares de calidad, seguridad y políticas corporativas</b> de Petroil.</p>' +
         '<p>Las oportunidades de contratación y los procesos de licitación vigentes se publican en el portal web. La sección de <b>Proveedores</b> aún está en desarrollo; mientras tanto, escríbenos directamente y te orientamos sobre el proceso de registro.</p>',
      links: [{ l: 'Escribir a Petroil', h: 'contacto.html#formulario', i: 'mail' }],
      next: ['¿Dónde están ubicados?', '¿Cómo presento una PQRSF?']
    },
    {
      id: 'empleo', cat: 'comercial',
      title: 'Trabajar en Petroil',
      p: ['trabajar con ustedes', 'hay vacantes', 'busco empleo', 'hoja de vida', 'enviar hoja de vida', 'practicas', 'pasantia', 'trabajar en petroil'],
      k: 'trabajo empleo vacante vacantes contratar hoja vida cv curriculum postular practicante pasantia estudiante formacion talento',
      a: '<p>Las vacantes disponibles se publican en la sección <b>«Trabaja con nosotros»</b> del sitio, donde podrás consultar las oportunidades vigentes y enviar tu hoja de vida. Esa sección aún está en desarrollo.</p>' +
         '<p>Petroil también desarrolla periódicamente <b>programas de prácticas, pasantías y formación profesional</b> para estudiantes y jóvenes talentos, según las necesidades de la organización.</p>' +
         '<p>Mientras la sección se publica, puedes escribir a <b>contacto@petroilsa.com</b>.</p>',
      links: [{ l: 'Escribir a Petroil', h: 'contacto.html#formulario', i: 'mail' }],
      next: ['¿Quiénes son Petroil?', '¿Dónde están ubicados?']
    },

    /* ══════════════════ CONTACTO ══════════════════ */
    {
      id: 'ubicacion', cat: 'contacto',
      title: 'Dónde estamos',
      p: ['donde estan', 'donde estan ubicados', 'cual es la direccion', 'sus sedes', 'donde queda', 'donde esta la refineria', 'como llego'],
      k: 'ubicacion ubicados direccion sede sedes oficina refineria planta bogota santa marta barranquilla mapa llegar lugar',
      a: '<p>Petroil tiene tres puntos:</p>' +
         '<ul>' +
         '<li><b>Oficina comercial</b> — Torre Empresarial Pacífic, Cl. 110 #9-25 Of. 1702, <b>Bogotá</b>.</li>' +
         '<li><b>Refinería</b> — Cra. 57A No. 30–399, Km 1 Sector Mamatoco, <b>Santa Marta</b>.</li>' +
         '<li><b>Aliado</b> — Esquivensa, Cl. 1c #5-231 a 5-1, Zona Franca, <b>Barranquilla</b>.</li>' +
         '</ul>' +
         '<p>En el pie de página encuentras el mapa interactivo de las tres ubicaciones.</p>',
      links: [{ l: 'Ver mapa de ubicaciones', h: '#contacto', i: 'map' }],
      next: ['¿Cómo los contacto?', '¿Qué hace una refinería?']
    },
    {
      id: 'contacto', cat: 'contacto',
      title: 'Canales de contacto',
      p: ['como los contacto', 'cual es el telefono', 'cual es el correo', 'datos de contacto', 'como me comunico', 'whatsapp'],
      k: 'contacto contactar telefono celular correo email mail whatsapp escribir llamar comunicar canal formulario redes sociales',
      a: '<p>Puedes comunicarte con Petroil por:</p>' +
         '<ul>' +
         '<li><b>WhatsApp:</b> +57 311 333 7046</li>' +
         '<li><b>Correo:</b> contacto@petroilsa.com</li>' +
         '<li><b>Formulario web:</b> con opción de preseleccionar el producto que te interesa</li>' +
         '</ul>' +
         '<p>También estamos en Facebook, LinkedIn, Instagram y YouTube.</p>',
      links: [
        { l: 'Ir al formulario', h: 'contacto.html#formulario', i: 'mail' },
        { l: 'Abrir WhatsApp', h: 'https://wa.me/573113337046?text=%C2%A1Hola!%20Vengo%20del%20chat%20del%20sitio%20web%20de%20Petroil%20y%20quiero%20m%C3%A1s%20informaci%C3%B3n.', i: 'wa', ext: true }
      ],
      next: ['¿Dónde están ubicados?', 'Quiero cotizar']
    },
    {
      id: 'pqrsf', cat: 'contacto',
      title: 'PQRSF · Peticiones, quejas y sugerencias',
      p: ['pqrsf', 'poner una queja', 'presentar un reclamo', 'hacer una sugerencia', 'felicitacion', 'reclamo', 'como presento una pqrsf'],
      k: 'pqrsf peticion queja reclamo sugerencia felicitacion radicar solicitud tramite respuesta inconformidad',
      a: '<p>Puedes presentar una <b>Petición, Queja, Reclamo, Sugerencia o Felicitación</b> a través del formulario <b>PQRSF</b> del sitio, o escribiendo a <b>pqrsf@petroilsa.com</b>.</p>' +
         '<p>Recibes un número de referencia y respuesta en máximo <b>15 días hábiles</b> (peticiones, quejas y reclamos) u <b>8 días hábiles</b> (sugerencias y felicitaciones).</p>',
      links: [{ l: 'Radicar una PQRSF', h: 'legal/pqrsf.html', i: 'doc' }],
      next: ['¿Cómo los contacto?', '¿Cómo tratan mis datos personales?']
    },
    {
      id: 'datos-personales', cat: 'contacto',
      title: 'Protección de datos personales',
      p: ['politica de datos', 'proteccion de datos', 'mis datos personales', 'habeas data', 'privacidad', 'como tratan mis datos personales'],
      k: 'dato datos personal personales politica proteccion privacidad habeas tratamiento titular derecho seguridad informacion',
      a: '<p>Petroil cuenta con una <b>Política de protección de datos personales</b> que describe el responsable del tratamiento, el marco legal, las finalidades, los <b>derechos de los titulares</b>, el procedimiento para ejercerlos, las medidas de seguridad de la información y su vigencia.</p>',
      links: [{ l: 'Leer la política de datos', h: 'legal/politica-datos.html', i: 'doc' }],
      next: ['¿Cómo presento una PQRSF?', '¿Cómo los contacto?']
    },
    {
      id: 'comunidad', cat: 'contacto',
      title: 'Comunidad y compromiso social',
      p: ['compromiso social', 'responsabilidad social', 'programas sociales', 'la comunidad', 'como informan a la comunidad'],
      k: 'comunidad social responsabilidad programa educacion desarrollo local tejido economico impacto vecino',
      a: '<p>Petroil desarrolla iniciativas de <b>compromiso social corporativo</b> enfocadas en <b>educación, protección del medio ambiente, desarrollo comunitario y fortalecimiento del tejido económico local</b>.</p>' +
         '<p>La información de interés se publica a través del sitio web, redes sociales, reuniones con la comunidad y los demás canales oficiales de comunicación institucional.</p>',
      links: [{ l: 'Ver compromiso social', h: 'sostenibilidad/compromiso-social.html', i: 'leaf' }],
      next: ['¿Qué hacen por el medio ambiente?', '¿Cómo los contacto?']
    },
    {
      id: 'herramienta-color', cat: 'contacto',
      title: 'Colorímetro ASTM D1500',
      p: ['colorimetro', 'astm d1500', 'herramienta de color', 'medir color'],
      k: 'colorimetro color astm d1500 herramienta laboratorio medicion escala beta interno',
      a: '<p>El sitio incluye un <b>Colorímetro ASTM D1500</b> en fase BETA: una herramienta de laboratorio para estimar el color de productos derivados del petróleo según la escala ASTM D1500.</p>' +
         '<p>Está pensada para uso interno del equipo técnico.</p>',
      links: [{ l: 'Abrir el colorímetro', h: 'herramientas/astm-d1500-color-tool.html', i: 'tool' }],
      next: ['¿Qué son las fichas técnicas?', '¿Qué productos ofrecen?']
    }
  ]
};
