/* ============================================================
   AIRA · Asistente virtual de Petroil
   Motor de respuestas por coincidencia de palabras clave.
   ------------------------------------------------------------
   SIN API, SIN IA, SIN backend: todo ocurre en el navegador.
   El contenido vive en aira-kb.js (window.AIRA_KB); este archivo
   solo se encarga de ENTENDER la pregunta y PINTAR la respuesta.

   Cómo entiende una pregunta (pipeline de 4 pasos):
     1. normalize()  — minúsculas, sin tildes, sin signos. Así
                       "¿DIÉSEL?" y "diesel" son la misma cadena.
     2. intents      — saludos, gracias, despedidas y pedidos de
                       ayuda se resuelven antes de tocar la base.
     3. score()      — cada entrada de la base recibe puntos por
                       frase exacta (mucho), palabra clave (medio),
                       palabra del título (medio) y palabra
                       parecida/con typo (poco).
     4. umbrales     — puntaje alto: responde. Puntaje medio:
                       responde y ofrece alternativas. Puntaje
                       bajo: admite que no sabe y propone temas.

   API pública (por si otra parte del sitio quiere usar el chat):
     AIRA.open()            abre el panel
     AIRA.close()           lo cierra
     AIRA.ask('cotizar')    lo abre y hace esa pregunta
   ============================================================ */
(function () {
  'use strict';

  var KB = window.AIRA_KB;
  var root = document.getElementById('aira');
  if (!KB || !root) return;

  /* ---------- Referencias al DOM ---------- */
  var launcher  = document.getElementById('airaLauncher');
  var panel     = document.getElementById('airaPanel');
  var log       = document.getElementById('airaLog');
  var form      = document.getElementById('airaForm');
  var input     = document.getElementById('airaInput');
  var chipsBar  = document.getElementById('airaChips');
  var btnClose  = document.getElementById('airaClose');
  var btnReset  = document.getElementById('airaReset');
  var teaser    = document.getElementById('airaTeaser');

  /* Prefijo para los enlaces de la base de conocimiento. En la raíz
     del sitio es ''; si algún día se monta AIRA en una subcarpeta,
     basta con poner data-base="../" en #aira. */
  var BASE = root.getAttribute('data-base') || '';
  /* v2: los enlaces guardados llevan data-h (ver restore). Las
     conversaciones v1 no lo tienen y no se podrían re-resolver. */
  var STORE_KEY = 'aira-chat-v2';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Estado de la conversación: lo último que respondió AIRA sirve
     para resolver preguntas de seguimiento ("¿y ese?", "cuéntame más"). */
  var lastEntry = null;
  var history = [];     // para recuperar lo escrito con la flecha ↑
  var histIdx = -1;
  var busy = false;

  /* ============================================================
     1 · NORMALIZACIÓN Y TOKENIZADO
     ============================================================ */

  /* Quita tildes, signos y mayúsculas. Es lo que permite que
     "¿Cuál es el PRECIO?" y "cual es el precio" sean iguales.
     La ñ se conserva como n a propósito: la gente escribe
     "diseno" tanto como "diseño". */
  function normalize(s) {
    return (s || '')
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9+#]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /* Palabras vacías del español. Se descartan al puntuar por
     palabra suelta, NUNCA al buscar frases: por eso "¿dónde están
     ubicados?" sigue encontrando la frase "donde estan". */
  var STOP = ('a al algo alguna algunas alguno algunos ante antes aqui como con contra cual cuales ' +
    'cuando de del desde donde dos e el ella ellas ello ellos en entre era eran eres es esa esas ese ' +
    'eso esos esta estan estar estas este esto estos fue fueron ha haber habia han hasta hay la las le ' +
    'les lo los me mi mis mucho muchos muy nada ni no nos nosotros o os otra otras otro otros para pero ' +
    'poco por porque pues que quien quienes se sea ser si sin sobre son su sus tal tambien tampoco tan ' +
    'tanto te tener ti toda todas todo todos tu tus un una uno unos usted ustedes y ya yo hola favor'
  ).split(' ').reduce(function (acc, w) { acc[w] = 1; return acc; }, {});

  function tokens(norm) {
    var out = [], parts = norm.split(' ');
    for (var i = 0; i < parts.length; i++) {
      var w = parts[i];
      if (!w) continue;
      if (STOP[w]) continue;
      if (w.length < 2 && !/[0-9]/.test(w)) continue;
      out.push(w);
    }
    return out;
  }

  /* Agrega los sinónimos declarados en la base. Si alguien escribe
     "acpm", la consulta pasa a contener también "diesel", que es la
     palabra que sí está en las keywords de los productos. */
  var SYN = (function build() {
    var map = {};
    var src = KB.synonyms || {};
    Object.keys(src).forEach(function (canon) {
      var group = [canon].concat(src[canon]);
      group.forEach(function (word) {
        var n = normalize(word);
        map[n] = (map[n] || []).concat(group.map(normalize));
      });
    });
    return map;
  })();

  /* Vocabulario completo que la base reconoce (keywords, títulos,
     frases y sinónimos). Se usa para CORREGIR erratas antes de
     puntuar: sin esto, "certificasiones" no se parecía lo bastante a
     la keyword "certificacion" (difieren en 2 letras) y la pregunta
     caía en "no entendí". Corrigiendo primero contra el vocabulario,
     "certificasiones" → "certificaciones" → sinónimo de
     "certificacion", y puntúa con peso completo. */
  var VOCAB = (function () {
    var set = {};
    function add(list) { list.forEach(function (w) { set[w] = 1; }); }
    KB.entries.forEach(function (e) {
      add(tokens(normalize(e.k || '')));
      add(tokens(normalize(e.title || '')));
      (e.p || []).forEach(function (ph) { add(tokens(normalize(ph))); });
    });
    Object.keys(SYN).forEach(function (w) { set[w] = 1; });
    return { set: set, list: Object.keys(set) };
  })();

  /* Solo palabras de 5+ letras: en palabras cortas, una sola letra de
     diferencia cambia el significado ("gas" / "gis") y corregir haría
     más daño que bien. */
  function correct(t) {
    if (t.length < 5 || VOCAB.set[t]) return null;
    for (var i = 0; i < VOCAB.list.length; i++) {
      if (closeEnough(VOCAB.list[i], t)) return VOCAB.list[i];
    }
    return null;
  }

  function expand(toks) {
    var seen = {}, out = [];
    function push(w) { if (!seen[w]) { seen[w] = 1; out.push(w); } }
    toks.forEach(function (t) {
      var fixed = correct(t);
      [t].concat(fixed ? [fixed] : []).forEach(function (w) {
        push(w);
        (SYN[w] || []).forEach(push);
      });
    });
    return out;
  }

  /* Distancia de edición acotada: solo necesitamos saber si dos
     palabras se diferencian en 1 carácter ("gasolna" → "gasolina").
     Cortar en 2 la hace mucho más barata que una Levenshtein normal. */
  function closeEnough(a, b) {
    if (a === b) return true;
    if (Math.abs(a.length - b.length) > 1) return false;
    if (a.length < 5 || b.length < 5) return false;
    var i = 0, j = 0, diff = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) { i++; j++; continue; }
      if (++diff > 1) return false;
      if (a.length > b.length) i++;
      else if (a.length < b.length) j++;
      else { i++; j++; }
    }
    return diff + (a.length - i) + (b.length - j) <= 1;
  }

  /* ============================================================
     2 · ÍNDICE Y PUNTUACIÓN
     ============================================================ */

  /* Se precalcula una vez: normalizar 40 entradas en cada pulsación
     de tecla sería trabajo repetido para nada. */
  var INDEX = KB.entries.map(function (e) {
    return {
      e: e,
      phrases: (e.p || []).map(normalize),
      keys: tokens(normalize(e.k || '')),
      title: tokens(normalize(e.title || ''))
    };
  });

  var W = { PHRASE: 55, KEY: 9, TITLE: 7, FUZZY: 3, CONTEXT: 6 };
  var CONFIDENT = 50;   // responde directo
  var MAYBE = 16;       // responde, pero ofreciendo alternativas

  function score(item, q, toks) {
    var s = 0, i, j;

    /* Frase exacta contenida en la pregunta: la señal más fuerte.
       Se pondera por número de palabras para que "gasolina premium"
       (2 palabras) pese más que "nafta" (1).
       Se prueba contra la pregunta tal cual Y contra su versión con
       las erratas corregidas: sin esto "gasolna premium" perdía la
       frase entera por una letra y caía en la familia genérica en
       vez de en el producto concreto. */
    for (i = 0; i < item.phrases.length; i++) {
      var ph = item.phrases[i];
      if (!ph) continue;
      if ((' ' + q.norm + ' ').indexOf(' ' + ph + ' ') !== -1 ||
          (q.fixed !== q.norm && (' ' + q.fixed + ' ').indexOf(' ' + ph + ' ') !== -1)) {
        s += W.PHRASE + ph.split(' ').length * 8;
      }
    }

    /* Palabras clave y palabras del título. */
    for (i = 0; i < toks.length; i++) {
      var t = toks[i], hitKey = false, hitTitle = false;
      for (j = 0; j < item.keys.length; j++) {
        if (item.keys[j] === t) { hitKey = true; break; }
      }
      for (j = 0; j < item.title.length; j++) {
        if (item.title[j] === t) { hitTitle = true; break; }
      }
      if (hitKey) s += W.KEY;
      if (hitTitle) s += W.TITLE;

      /* Tolerancia a erratas: solo si la palabra no acertó exacta,
         para no premiar dos veces lo mismo. */
      if (!hitKey && !hitTitle) {
        for (j = 0; j < item.keys.length; j++) {
          if (closeEnough(item.keys[j], t)) { s += W.FUZZY; break; }
        }
      }
    }

    /* Continuidad de la conversación: si la pregunta anterior fue
       sobre esta entrada o sobre su categoría, un empate se resuelve
       a favor de seguir en el mismo tema. */
    if (lastEntry) {
      if (item.e.id === lastEntry.id) s += W.CONTEXT / 2;
      else if (item.e.cat === lastEntry.cat) s += W.CONTEXT;
    }

    return s;
  }

  /* Prepara la pregunta una sola vez para las ~40 comparaciones:
     versión normalizada, versión con erratas corregidas (para las
     frases) y lista de palabras expandida con sinónimos. */
  function prepare(text) {
    var norm = normalize(text);
    var fixed = norm.split(' ').map(function (w) {
      return correct(w) || w;
    }).join(' ');
    return { norm: norm, fixed: fixed, toks: expand(tokens(norm)) };
  }

  function search(text) {
    var q = prepare(text);
    var scored = INDEX.map(function (item) {
      return { entry: item.e, score: score(item, q, q.toks) };
    }).filter(function (r) { return r.score > 0; });
    scored.sort(function (a, b) { return b.score - a.score; });
    return scored;
  }

  /* ============================================================
     3 · INTENCIONES CONVERSACIONALES
     Cosas que no son preguntas sobre Petroil pero que un chat
     tiene que saber responder para no sentirse un buscador.
     ============================================================ */
  var INTENTS = [
    {
      id: 'saludo',
      test: /^(hola|holi|buenas|buen dia|buenos dias|buenas tardes|buenas noches|hey|que tal|saludos|alo|epa)\b/,
      reply: function () {
        return {
          html: '<p>¡Hola! 👋 Soy <b>AIRA</b>, la asistente virtual de Petroil.</p>' +
                '<p>Puedo contarte sobre nuestros <b>combustibles</b>, las <b>normas</b> que cumplimos, <b>dónde estamos</b> o cómo <b>pedir una cotización</b>. ¿Qué necesitas?</p>',
          chips: ['¿Qué productos ofrecen?', '¿Qué es Petroil?', 'Quiero cotizar']
        };
      }
    },
    {
      id: 'gracias',
      test: /\b(gracias|muchas gracias|mil gracias|te pasaste|excelente|perfecto|genial|muy amable)\b/,
      reply: function () {
        return {
          html: '<p>¡Con gusto! 😊 Si te queda otra duda sobre Petroil, aquí sigo.</p>',
          chips: ['¿Qué productos ofrecen?', 'Hablar con un asesor']
        };
      }
    },
    {
      id: 'despedida',
      test: /^(chao|adios|hasta luego|nos vemos|bye|listo gracias|eso es todo)\b/,
      reply: function () {
        return {
          html: '<p>¡Hasta pronto! 👋 Recuerda que puedes escribirnos por WhatsApp al <b>+57 311 333 7046</b> cuando quieras.</p>',
          chips: ['Hablar con un asesor']
        };
      }
    },
    {
      id: 'ayuda',
      test: /\b(que puedes hacer|que sabes|en que me puedes ayudar|ayuda|como funcionas|quien eres|eres un bot|eres humano|eres real)\b/,
      reply: function () {
        return {
          html: '<p>Soy <b>AIRA</b>, un asistente automático del sitio de Petroil. No soy una persona: respondo con la información publicada en esta web.</p>' +
                '<p>Puedo ayudarte con:</p>' +
                '<ul><li>Los <b>15 productos</b> del portafolio y sus fichas técnicas</li>' +
                '<li>Normas y certificaciones (<b>ISO, Euro VI, ISO 8217</b>)</li>' +
                '<li>Qué combustible sirve para <b>tu sector</b></li>' +
                '<li><b>Cotizaciones</b>, sedes y canales de contacto</li></ul>' +
                '<p>Para temas comerciales puntuales, te paso con un asesor humano.</p>',
          chips: ['¿Qué productos ofrecen?', 'Hablar con un asesor', '¿Dónde están ubicados?']
        };
      }
    }
  ];

  function matchIntent(text) {
    var norm = normalize(text);
    for (var i = 0; i < INTENTS.length; i++) {
      if (INTENTS[i].test.test(norm)) return INTENTS[i].reply();
    }
    return null;
  }

  /* ============================================================
     4 · RENDERIZADO
     ============================================================ */

  var ICONS = {
    doc:   '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h4"/>',
    cart:  '<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h3l2.7 12.4a2 2 0 002 1.6h7.7a2 2 0 002-1.6L21 7H6"/>',
    map:   '<path d="M12 21s7-6.5 7-11a7 7 0 10-14 0c0 4.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    mail:  '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    wa:    '<path d="M20.5 3.5A11 11 0 003.3 17L2 22l5.2-1.4A11 11 0 1020.5 3.5z"/>',
    info:  '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    leaf:  '<path d="M11 20A7 7 0 014 13c0-6 8-9 16-9 0 8-4 13-9 13z"/><path d="M4 21c2-6 6-9 11-11"/>',
    tool:  '<path d="M14.7 6.3a4 4 0 01-5.4 5.4L4 17v3h3l5.3-5.3a4 4 0 015.4-5.4l-2.5 2.5"/>',
    news:  '<path d="M4 5h13v14H4z"/><path d="M17 8h3v9a2 2 0 01-2 2M7 9h7M7 13h7M7 16h4"/>',
    ship:  '<path d="M12 3v8m0 0l-5 2m5-2l5 2M4 14c0 4 3.5 7 8 7s8-3 8-7"/>',
    shield:'<path d="M5 6l7-3 7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9z"/><path d="M9.5 12l1.8 1.8L15 10.2"/>',
    drop:  '<path d="M12 3s6 6.5 6 11a6 6 0 01-12 0c0-4.5 6-11 6-11z"/>'
  };

  function icon(name, size) {
    var d = ICONS[name] || ICONS.info;
    return '<svg viewBox="0 0 24 24" width="' + (size || 16) + '" height="' + (size || 16) +
           '" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" ' +
           'stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function now() {
    var d = new Date();
    return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
  }

  /* Resuelve un href de la base contra la ubicación real de la página.
     Un ancla (#contacto, #preguntas-frecuentes) se queda en esta página
     si la sección existe aquí; si no, apunta a la del index. Antes, en
     productos.html o contacto.html (data-base="") "#preguntas-frecuentes"
     quedaba como ancla local inexistente y el enlace no hacía nada. */
  function href(h) {
    if (/^(https?:|mailto:|tel:)/.test(h)) return h;
    if (h.charAt(0) === '#') return document.getElementById(h.slice(1)) ? h : BASE + 'index.html' + h;
    return BASE + h;
  }

  function linkCards(links) {
    if (!links || !links.length) return '';
    return '<div class="aira-links">' + links.map(function (lk) {
      var ext = lk.ext ? ' target="_blank" rel="noopener"' : '';
      /* data-h guarda la ruta original de la base: restore() la vuelve a
         resolver si la conversación se retoma en otra carpeta del sitio. */
      return '<a class="aira-link" href="' + esc(href(lk.h)) + '" data-h="' + esc(lk.h) + '"' + ext + '>' +
             '<span class="aira-link-ico">' + icon(lk.i) + '</span>' +
             '<span class="aira-link-label">' + esc(lk.l) + '</span>' +
             '<span class="aira-link-go">' + (lk.ext
               ? '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 17L17 7M8 7h9v9"/></svg>'
               : '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h13M12 5l7 7-7 7"/></svg>') +
             '</span></a>';
    }).join('') + '</div>';
  }

  function scrollDown() {
    /* requestAnimationFrame para que el scroll ocurra después de que
       el navegador haya medido la burbuja recién insertada. */
    requestAnimationFrame(function () { log.scrollTop = log.scrollHeight; });
  }

  /* Margen que queda por encima de la respuesta al anclarla: deja
     asomar el hueco de la burbuja anterior, para que se note que
     arriba hay conversación y no parezca el principio del chat. */
  var ANCHOR_PAD = 12;

  /* Deja la PRIMERA línea de una respuesta arriba del todo, en vez de
     bajar al final. Una respuesta más alta que el panel se leía al
     revés: el chat saltaba al último párrafo y había que subir a mano
     a buscar por dónde empezaba. Si lo que queda por debajo de esa
     primera línea sí cabe en pantalla, el Math.min hace lo de siempre
     (bajar al fondo), así que sirve para cualquier mensaje.
     Se usa offsetTop y no getBoundingClientRect porque .aira-row entra
     con una animación de transform: el rect mentiría durante esos
     340 ms; offsetTop es posición de maquetación y no se inmuta.
     (Requiere que .aira-log sea position:relative — así lo es.) */
  function focusAnswer(row) {
    if (!row) { scrollDown(); return; }
    requestAnimationFrame(function () {
      log.scrollTop = Math.min(
        Math.max(0, row.offsetTop - ANCHOR_PAD),
        log.scrollHeight - log.clientHeight
      );
    });
  }

  /* Al reabrir o restaurar el chat: por el principio de lo último que
     respondió AIRA, no por el final del scroll. */
  function focusLastAnswer() {
    var bots = log.querySelectorAll('.aira-row.bot');
    focusAnswer(bots.length ? bots[bots.length - 1] : null);
  }

  function addUser(text) {
    var row = document.createElement('div');
    row.className = 'aira-row user';
    row.innerHTML = '<div class="aira-bubble user">' + esc(text) +
      '<time class="aira-time">' + now() + '</time></div>';
    log.appendChild(row);
    scrollDown();
  }

  var msgSeq = 0;

  function addBot(html, opts) {
    opts = opts || {};
    var id = 'aira-m' + (++msgSeq);
    var row = document.createElement('div');
    row.className = 'aira-row bot';
    row.innerHTML =
      '<img class="aira-msg-avatar" src="' + BASE + 'assets/img/aira-avatar.webp" alt="" width="28" height="28">' +
      '<div class="aira-bubble bot" id="' + id + '">' +
        (opts.title ? '<span class="aira-answer-title">' + esc(opts.title) + '</span>' : '') +
        html +
        linkCards(opts.links) +
        (opts.feedback === false ? '' :
          '<div class="aira-feedback" data-for="' + id + '">' +
            '<span>¿Te sirvió?</span>' +
            '<button type="button" class="aira-fb" data-v="1" aria-label="Sí, me sirvió">👍</button>' +
            '<button type="button" class="aira-fb" data-v="0" aria-label="No me sirvió">👎</button>' +
          '</div>') +
        '<time class="aira-time">' + now() + '</time>' +
      '</div>';
    log.appendChild(row);
    /* El saludo inicial es largo (menú de temas incluido): si se
       autodesliza al fondo, el "¡Hola! Soy AIRA" queda fuera de vista.
       opts.scroll === false no toca el scroll — lo usan el saludo (que
       se queda arriba) y quien va a encadenar varias burbujas y prefiere
       anclar él mismo al final (ver respondWith). */
    if (opts.scroll !== false) focusAnswer(row);
    return row;
  }

  function showTyping() {
    var row = document.createElement('div');
    row.className = 'aira-row bot aira-typing-row';
    row.innerHTML =
      '<img class="aira-msg-avatar" src="' + BASE + 'assets/img/aira-avatar.webp" alt="" width="28" height="28">' +
      '<div class="aira-bubble bot aira-typing" aria-label="AIRA está escribiendo">' +
      '<span></span><span></span><span></span></div>';
    log.appendChild(row);
    scrollDown();
    return row;
  }

  /* Los chips de sugerencia viven fuera del log, encima del input:
     así siguen visibles aunque el usuario suba a releer la conversación. */
  function setChips(list) {
    chipsBar.innerHTML = '';
    if (!list || !list.length) { chipsBar.hidden = true; return; }
    chipsBar.hidden = false;
    list.forEach(function (label) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'aira-chip';
      b.textContent = label;
      b.addEventListener('click', function () { ask(label); });
      chipsBar.appendChild(b);
    });
  }

  /* ---------- Listas de sugerencias dentro de una burbuja ----------
     Hay categorías con muchas entradas (Productos tiene 20): pintarlas
     todas convierte la respuesta en un muro que empuja el texto útil
     fuera de la pantalla. Se muestran SUGGEST_VISIBLE y el resto queda
     detrás de un "Ver N más" plegable (el botón lo cablea
     wireSuggestions, igual que las sugerencias). */
  var SUGGEST_VISIBLE = 4;

  function suggestList(items) {
    if (!items || !items.length) return '';
    var hidden = items.length - SUGGEST_VISIBLE;
    var html = items.map(function (e, i) {
      var extra = i >= SUGGEST_VISIBLE;
      return '<button type="button" class="aira-sug' + (extra ? ' is-extra' : '') + '"' +
             (extra ? ' hidden' : '') + ' data-id="' + esc(e.id) + '">' + esc(e.title) + '</button>';
    }).join('');
    if (hidden > 0) {
      html += '<button type="button" class="aira-sug-more" aria-expanded="false" data-more="' + hidden + '">' +
              esc(moreLabel(hidden)) + '</button>';
    }
    return '<div class="aira-suggest">' + html + '</div>';
  }

  function moreLabel(n) { return 'Ver ' + n + (n === 1 ? ' opción más' : ' opciones más'); }

  /* Pantalla de bienvenida: en vez de una burbuja vacía, un menú de
     temas. Da a entender de un vistazo qué sabe responder AIRA. */
  function welcome() {
    var cats = (KB.meta.categories || []).map(function (c) {
      return '<button type="button" class="aira-topic" data-cat="' + c.id + '">' +
             '<span class="aira-topic-ico">' + icon(c.icon, 18) + '</span>' +
             '<span class="aira-topic-txt"><b>' + esc(c.label) + '</b><em>' + esc(c.hint) + '</em></span>' +
             '</button>';
    }).join('');

    addBot(
      '<p>¡Hola! 👋 Soy <b>AIRA</b>, la asistente virtual de Petroil.</p>' +
      '<p>Pregúntame lo que quieras con tus palabras — o elige un tema para empezar:</p>' +
      '<div class="aira-topics">' + cats + '</div>',
      { feedback: false, scroll: false }
    );

    log.querySelectorAll('.aira-topic').forEach(function (btn) {
      btn.addEventListener('click', function () { openCategory(btn.getAttribute('data-cat')); });
    });

    setChips(['¿Qué productos ofrecen?', '¿Dónde están ubicados?', 'Quiero cotizar']);
  }

  /* Al pulsar una categoría no se "responde" nada: se listan sus
     entradas como preguntas pulsables. Es navegación, no búsqueda. */
  function openCategory(catId) {
    var cat = (KB.meta.categories || []).filter(function (c) { return c.id === catId; })[0];
    if (!cat) return;
    var items = KB.entries.filter(function (e) { return e.cat === catId; });

    addUser(cat.label);
    var t = showTyping();
    setTimeout(function () {
      t.remove();
      addBot(
        '<p>Esto es lo que puedo contarte sobre <b>' + esc(cat.label.toLowerCase()) + '</b>:</p>' +
        suggestList(items),
        { feedback: false }
      );
      wireSuggestions();
      setChips(['Hablar con un asesor']);
    }, reduceMotion ? 0 : 420);
  }

  function wireSuggestions() {
    log.querySelectorAll('.aira-sug[data-id]').forEach(function (btn) {
      if (btn.dataset.wired) return;
      btn.dataset.wired = '1';
      btn.addEventListener('click', function () {
        var e = KB.entries.filter(function (x) { return x.id === btn.getAttribute('data-id'); })[0];
        if (!e) return;
        addUser(e.title);
        respondWith(e);
      });
    });
    /* "Ver N más" / "Ver menos". El estado abierto o cerrado viaja en
       el HTML (atributo hidden), así que save() lo persiste solo y al
       restaurar la conversación basta con volver a cablear el botón. */
    log.querySelectorAll('.aira-sug-more').forEach(function (btn) {
      if (btn.dataset.wired) return;
      btn.dataset.wired = '1';
      btn.addEventListener('click', function () {
        var box = btn.parentNode;
        var open = btn.getAttribute('aria-expanded') === 'true';
        box.querySelectorAll('.aira-sug.is-extra').forEach(function (b) { b.hidden = open; });
        btn.setAttribute('aria-expanded', open ? 'false' : 'true');
        btn.textContent = open
          ? moreLabel(parseInt(btn.getAttribute('data-more'), 10) || 0)
          : 'Ver menos';
        save();
      });
    });
  }

  /* ============================================================
     5 · CICLO PREGUNTA → RESPUESTA
     ============================================================ */

  /* La pausa antes de responder es deliberada: una respuesta
     instantánea se lee como un error de la página, no como una
     respuesta. Se escala con la longitud del texto y se anula por
     completo si el usuario pidió menos animación. */
  function thinkTime(html) {
    if (reduceMotion) return 0;
    var chars = html.replace(/<[^>]+>/g, '').length;
    return Math.min(1300, 420 + chars * 3);
  }

  function respondWith(entry, altList) {
    busy = true;
    lastEntry = entry;
    var t = showTyping();
    setTimeout(function () {
      t.remove();
      var html = entry.a;
      if (altList && altList.length) {
        html = '<p class="aira-hedge">No estoy segura de haber entendido, pero creo que preguntas por esto:</p>' + html;
      }
      /* scroll:false en las dos burbujas y un solo anclaje al final:
         si cada una se colocara al insertarse, la de alternativas
         mandaría la respuesta —lo que de verdad importa— fuera de
         vista justo después de haberla anclado. */
      var row = addBot(html, { title: entry.title, links: entry.links, scroll: false });

      if (altList && altList.length) {
        addBot(
          '<p>Si no era eso, quizá te sirva:</p>' + suggestList(altList),
          { feedback: false, scroll: false }
        );
        wireSuggestions();
      }
      focusAnswer(row);
      setChips(entry.next && entry.next.length ? entry.next : ['Hablar con un asesor']);
      busy = false;
      save();
    }, thinkTime(entry.a));
  }

  function respondUnknown(text) {
    busy = true;
    var t = showTyping();
    setTimeout(function () {
      t.remove();
      /* Cuando no hay coincidencia, lo peor que puede hacer un chat es
         repetir "no entendí". Se ofrece salida: temas y un humano. */
      var picks = ['productos-general', 'cotizar', 'ubicacion', 'iso']
        .map(function (id) { return KB.entries.filter(function (e) { return e.id === id; })[0]; })
        .filter(Boolean);

      addBot(
        '<p>Perdón, no encontré información sobre <b>«' + esc(text.slice(0, 60)) + '»</b> en el sitio de Petroil. 😕</p>' +
        '<p>Intenta con otras palabras, o mira uno de estos temas:</p>' +
        suggestList(picks) +
        '<p class="aira-hedge">Si es una consulta comercial concreta, un asesor la resuelve mejor que yo.</p>',
        { feedback: false, links: [{ l: 'Hablar con un asesor por WhatsApp', i: 'wa', ext: true,
          h: 'https://wa.me/573113337046?text=%C2%A1Hola!%20Tengo%20una%20consulta%20que%20el%20chat%20del%20sitio%20no%20pudo%20resolver.' }] }
      );
      wireSuggestions();
      setChips(['¿Qué productos ofrecen?', '¿Qué es Petroil?', '¿Dónde están ubicados?']);
      busy = false;
      save();
    }, reduceMotion ? 0 : 700);
  }

  function ask(text) {
    text = (text || '').trim();
    if (!text || busy) return;

    addUser(text);
    history.push(text);
    histIdx = history.length;
    input.value = '';
    setChips([]);

    /* Lo conversacional (hola, gracias, ¿quién eres?) solo gana si la
       pregunta NO trae también un tema que la base reconozca con
       seguridad. Antes se evaluaba primero y "hola, ¿qué es una PQRS?"
       o "necesito ayuda para cotizar" recibían un saludo genérico en
       vez de la respuesta: la palabra "hola"/"ayuda" tapaba el tema. */
    var results = search(text);
    var intent = matchIntent(text);
    if (intent && !(results.length && results[0].score >= CONFIDENT)) {
      busy = true;
      var ti = showTyping();
      setTimeout(function () {
        ti.remove();
        addBot(intent.html, { feedback: false });
        setChips(intent.chips);
        busy = false;
        save();
      }, thinkTime(intent.html));
      return;
    }

    if (!results.length || results[0].score < MAYBE) { respondUnknown(text); return; }

    var best = results[0];
    /* Alternativas: solo las que estén razonablemente cerca del
       ganador. Listar opciones lejanas ensucia más de lo que ayuda. */
    var alts = results.slice(1, 4)
      .filter(function (r) { return r.score >= best.score * 0.45; })
      .map(function (r) { return r.entry; });

    respondWith(best.entry, best.score < CONFIDENT ? alts : null);
    save();
  }

  /* ============================================================
     6 · PERSISTENCIA
     La conversación sobrevive a la navegación entre páginas dentro
     de la misma pestaña (sessionStorage, no localStorage: al cerrar
     la pestaña se empieza de cero, que es lo que espera la gente).
     ============================================================ */
  function save() {
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify({
        html: log.innerHTML,
        chips: Array.prototype.map.call(chipsBar.querySelectorAll('.aira-chip'), function (c) { return c.textContent; }),
        last: lastEntry ? lastEntry.id : null
      }));
    } catch (err) { /* modo privado o storage lleno: seguimos sin persistir */ }
  }

  function restore() {
    var raw;
    try { raw = sessionStorage.getItem(STORE_KEY); } catch (err) { return false; }
    if (!raw) return false;
    try {
      var data = JSON.parse(raw);
      if (!data || !data.html) return false;
      log.innerHTML = data.html;
      /* El HTML guardado trae las rutas resueltas para la página donde
         se escribió. Si se retoma en otra carpeta (pregunta en el index,
         chat abierto en una ficha técnica) "productos.html" pasaba a ser
         fichas-tecnicas/productos.html (404) y el avatar salía roto:
         se re-resuelven contra la página actual. */
      log.querySelectorAll('a.aira-link[data-h]').forEach(function (a) {
        a.setAttribute('href', href(a.getAttribute('data-h')));
      });
      log.querySelectorAll('img.aira-msg-avatar').forEach(function (img) {
        img.setAttribute('src', BASE + 'assets/img/aira-avatar.webp');
      });
      /* msgSeq arranca en 0 en cada página: se continúa desde el último
         id restaurado para no repetir ids (aira-m1, aira-m2…). */
      log.querySelectorAll('[id^="aira-m"]').forEach(function (el) {
        var n = parseInt(el.id.slice(6), 10);
        if (n > msgSeq) msgSeq = n;
      });
      /* El HTML restaurado trae botones sin listeners: hay que
         volver a cablearlos. */
      wireSuggestions();
      log.querySelectorAll('.aira-topic').forEach(function (btn) {
        btn.addEventListener('click', function () { openCategory(btn.getAttribute('data-cat')); });
      });
      setChips(data.chips || []);
      lastEntry = data.last ? KB.entries.filter(function (e) { return e.id === data.last; })[0] || null : null;
      /* Se retoma por el principio de la última respuesta, no por su
         final: al reabrir el chat en otra página lo normal es querer
         releerla desde arriba (mismo criterio que focusAnswer). */
      focusLastAnswer();
      return true;
    } catch (err) { return false; }
  }

  function reset() {
    log.innerHTML = '';
    lastEntry = null;
    try { sessionStorage.removeItem(STORE_KEY); } catch (err) { /* noop */ }
    welcome();
  }

  /* ============================================================
     7 · APERTURA, CIERRE Y ACCESIBILIDAD
     ============================================================ */
  var lastFocus = null;

  function isOpen() { return root.classList.contains('open'); }

  function open(focusInput) {
    if (isOpen()) return;
    lastFocus = document.activeElement;
    root.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    launcher.setAttribute('aria-expanded', 'true');
    launcher.setAttribute('aria-label', 'Cerrar el chat con AIRA');
    hideTeaser();
    var isFreshWelcome = false;
    if (!log.children.length) {
      if (!restore()) { welcome(); isFreshWelcome = true; }
    }
    /* En móvil el panel ocupa la pantalla: enfocar el input abriría
       el teclado y taparía la conversación recién restaurada. */
    if (focusInput !== false && window.innerWidth > 720) {
      setTimeout(function () { input.focus(); }, 260);
    }
    /* Con saludo nuevo se queda arriba (ver addBot/welcome); si hay
       conversación restaurada o en curso, se vuelve al principio de la
       última respuesta, que es por donde se retoma la lectura. */
    if (!isFreshWelcome) focusLastAnswer();
  }

  function close() {
    if (!isOpen()) return;
    root.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    launcher.setAttribute('aria-expanded', 'false');
    launcher.setAttribute('aria-label', 'Abrir el chat con AIRA, asistente virtual de Petroil');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function toggle() { isOpen() ? close() : open(); }

  /* Teaser: burbuja que aparece sola a los pocos segundos. Se muestra
     una sola vez por sesión — insistir es molesto, no persuasivo. */
  function hideTeaser() {
    if (!teaser) return;
    teaser.classList.remove('show');
    try { sessionStorage.setItem('aira-teaser', '1'); } catch (err) { /* noop */ }
  }

  function maybeTeaser() {
    if (!teaser) return;
    var seen;
    try { seen = sessionStorage.getItem('aira-teaser'); } catch (err) { seen = '1'; }
    if (seen) return;
    setTimeout(function () {
      if (!isOpen()) {
        teaser.classList.add('show');
        launcher.classList.add('has-badge');
      }
    }, 6000);
  }

  /* ---------- Eventos ---------- */
  launcher.addEventListener('click', toggle);
  btnClose.addEventListener('click', close);
  btnReset.addEventListener('click', reset);

  if (teaser) {
    teaser.addEventListener('click', function (ev) {
      if (ev.target.closest('.aira-teaser-x')) { hideTeaser(); return; }
      hideTeaser();
      open();
    });
  }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    ask(input.value);
  });

  input.addEventListener('keydown', function (ev) {
    /* Flecha ↑ recupera lo último escrito, como en una terminal. */
    if (ev.key === 'ArrowUp' && !input.value && history.length) {
      histIdx = Math.max(0, histIdx - 1);
      input.value = history[histIdx] || '';
      ev.preventDefault();
    } else if (ev.key === 'ArrowDown' && histIdx < history.length) {
      histIdx++;
      input.value = history[histIdx] || '';
    }
  });

  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && isOpen()) close();
  });

  /* Voto de utilidad: no viaja a ningún lado (no hay backend). Sirve
     para cerrar el gesto del usuario y, si es negativo, ofrecer un
     humano en lugar de dejarlo en un callejón sin salida. */
  log.addEventListener('click', function (ev) {
    var btn = ev.target.closest('.aira-fb');
    if (!btn) return;
    var box = btn.closest('.aira-feedback');
    var good = btn.getAttribute('data-v') === '1';
    box.innerHTML = good
      ? '<span class="aira-fb-done">¡Gracias! 🙌</span>'
      : '<span class="aira-fb-done">Gracias por avisar. ' +
        '<a href="' + href('contacto.html#formulario') + '">Habla con un asesor →</a></span>';
    save();
  });

  /* Enlaces internos que apuntan a esta misma página (#noticias,
     #contacto): en vez de recargar, se cierra el chat y se hace
     scroll suave, que es lo que el usuario espera. */
  log.addEventListener('click', function (ev) {
    var a = ev.target.closest('a.aira-link');
    if (!a) return;
    var url = a.getAttribute('href') || '';
    if (url.charAt(0) !== '#') return;
    var target = document.querySelector(url);
    if (!target) return;
    ev.preventDefault();
    close();
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  });

  maybeTeaser();

  /* API pública para el resto del sitio. */
  window.AIRA = {
    open: function () { open(); },
    close: close,
    ask: function (q) { open(false); setTimeout(function () { ask(q); }, 260); },

    /* Ayuda de mantenimiento. Al agregar entradas a aira-kb.js es fácil
       que dos se roben las mismas palabras; esto deja ver el ranking sin
       tener que abrir el chat y adivinar. En la consola del navegador:
           AIRA.match('quiero cotizar diesel marino')
       → [{id:'cotizar', score:118}, {id:'sector-maritimo', score:37}, …]
       Un puntaje <16 se considera "no entendí"; <50 responde ofreciendo
       alternativas (constantes MAYBE y CONFIDENT). */
    match: function (q) {
      return search(q).slice(0, 6).map(function (r) {
        return { id: r.entry.id, title: r.entry.title, score: Math.round(r.score) };
      });
    }
  };

  /* Deep link: cualquier enlace del sitio puede abrir el chat, con o
     sin pregunta hecha:  href="#chat"  ·  href="#chat=quiero cotizar"
     El token es "chat" y NO "aira" a propósito: el contenedor tiene
     id="aira", así que #aira haría que el navegador saltara hasta el
     widget antes de que corra este código. No existe ningún elemento
     con id="chat", así que no hay salto. */
  (function deepLink() {
    var h = decodeURIComponent(window.location.hash || '');
    if (h.indexOf('#chat') !== 0) return;
    var q = h.slice(5).replace(/^=/, '');
    setTimeout(function () { q ? window.AIRA.ask(q) : open(); }, 600);
  })();
})();
