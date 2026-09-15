// Selector de idioma (ES / EN / PT) — traducción client-side por diccionario JSON.
// Piloto: index.html. Ver CLAUDE.md antes de replicar este patrón a otras páginas.
//
// Cómo funciona:
// - <body data-i18n-page="assets/i18n/<pagina>.json"> apunta al diccionario de ESTA página.
// - Cualquier texto marcado con data-i18n="clave" se reemplaza (textContent) con el valor
//   de esa clave en el idioma activo.
// - Texto que necesita HTML interno (negritas, listas, <p>) usa data-i18n-html="clave" en
//   vez de data-i18n, y se aplica con innerHTML.
// - El idioma elegido se guarda en localStorage y se reaplica en cada carga de página.
(function () {
  const STORAGE_KEY = 'petroil-lang';
  const DEFAULT_LANG = 'es';
  const SUPPORTED = ['es', 'en', 'pt'];

  function getSavedLang() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && SUPPORTED.includes(saved)) return saved;
    } catch (e) { /* localStorage no disponible (modo privado, etc.) */ }
    return DEFAULT_LANG;
  }

  function applyDict(dict, lang) {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const entry = dict[el.getAttribute('data-i18n')];
      if (entry && entry[lang]) el.textContent = entry[lang];
    });
    document.querySelectorAll('[data-i18n-html]').forEach((el) => {
      const entry = dict[el.getAttribute('data-i18n-html')];
      if (entry && entry[lang]) el.innerHTML = entry[lang];
    });
  }

  function updateLangUI(lang) {
    document.documentElement.setAttribute('lang', lang);
    document.querySelectorAll('[data-lang-current]').forEach((el) => {
      el.textContent = lang.toUpperCase();
    });
    document.querySelectorAll('.lang-dropdown a[data-lang]').forEach((a) => {
      a.classList.toggle('active', a.getAttribute('data-lang') === lang);
    });
  }

  let currentDict = null;

  function setLang(lang) {
    if (!SUPPORTED.includes(lang)) return;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* noop */ }
    updateLangUI(lang);
    if (currentDict) applyDict(currentDict, lang);
  }

  function wireDropdowns() {
    document.querySelectorAll('.lang-dropdown a[data-lang]').forEach((a) => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        setLang(a.getAttribute('data-lang'));
        const select = a.closest('.lang-select');
        if (select) {
          select.classList.remove('open');
          select.querySelector('.lang-btn')?.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  function init() {
    const lang = getSavedLang();
    updateLangUI(lang);
    wireDropdowns();

    const dictPath = document.body.getAttribute('data-i18n-page');
    if (!dictPath) return; // página aún no tiene diccionario — el selector queda visible pero inactivo

    fetch(dictPath)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('i18n: no se pudo cargar ' + dictPath))))
      .then((dict) => {
        currentDict = dict;
        applyDict(dict, lang);
      })
      .catch((err) => console.warn(err));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.PetroilI18n = { setLang };
})();
