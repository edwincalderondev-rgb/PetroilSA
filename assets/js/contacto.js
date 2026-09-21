// ============================================
// CONTACTO (contacto.html) — formulario de cotización / información.
//
// El sitio es estático (sin backend): el formulario NO envía datos a un
// servidor. Flujo:
//   1) Valida lo diligenciado.
//   2) Abre un diálogo "Revisa tu solicitud" con el mensaje ya redactado
//      (incluye un número de referencia) y deja elegir el canal:
//      WhatsApp · Gmail · Outlook.com · Outlook (Microsoft 365) ·
//      app de correo predeterminada (mailto:) · copiar el texto.
//   3) Abre el canal elegido con el mensaje listo; el usuario solo presiona
//      "Enviar" (ni WhatsApp ni los correos permiten enviarlo solos).
//
// Por qué hay botones de Gmail/Outlook además de mailto: "mailto:" abre
// el cliente de correo PREDETERMINADO del sistema (en muchos Windows es
// Outlook de escritorio aunque el usuario use Gmail en el navegador).
//
// Preselección desde las fichas técnicas:
//   contacto.html?producto=P-50%2F10#formulario
//   contacto.html?producto=P-50%2F10&tipo=Información técnica
// ============================================
const contactForm = document.getElementById('contactForm');

if(contactForm){
  const WA_NUMBER = '573113337046';
  const MAIL_TO = 'contacto@petroilsa.com';
  const TIPO_SIN_PRODUCTO = 'Otra consulta';

  const productBoxes = Array.from(contactForm.querySelectorAll('input[name="productos"]'));
  const tipoRadios = Array.from(contactForm.querySelectorAll('input[name="tipo"]'));
  const productsGroup = document.getElementById('ctProductos');
  const productsError = document.getElementById('ctProductosError');
  const successPanel = document.getElementById('ctSuccess');
  const successTitle = document.getElementById('ctSuccessTitle');
  const successText = document.getElementById('ctSuccessText');
  // #ctRef y #ctSuccessRef NO se guardan en constantes: viven dentro de un
  // data-i18n-html y i18n.js los reemplaza al traducir, así que una
  // referencia tomada al cargar queda apuntando a un nodo desconectado y el
  // usuario veía "PTL-000000-0000" en vez de su número real.
  const setRef = (id, ref) => { const el = document.getElementById(id); if(el) el.textContent = ref; };
  const reopenBtn = document.getElementById('ctReopen');
  const resetBtn = document.getElementById('ctReset');
  const dialog = document.getElementById('ctReview');
  const previewEl = document.getElementById('ctPreview');
  const copyBtn = document.getElementById('ctCopy');
  const copyLabel = copyBtn ? copyBtn.querySelector('span') : null;

  let current = null;     // { ref, data } de la solicitud en revisión
  let lastChannel = null; // último canal usado, para "volver a abrir"

  // Strings de la UI reactiva (después de enviar) traducidas vía i18n.js;
  // el mensaje que se ENVÍA a Petroil (whatsappText/emailText) se mantiene
  // siempre en español porque el equipo comercial que lo recibe es local.
  const t = (key, fallback) => (window.PetroilI18n && window.PetroilI18n.t(key)) || fallback;

  // ---------- Utilidades ----------
  const field = (name) => (contactForm.elements[name] ? contactForm.elements[name].value.trim() : '');
  const tipoValue = () => (tipoRadios.find(r => r.checked) || {}).value || '';

  function makeRef(){
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const rand = String(Math.floor(1000 + Math.random() * 9000));
    return 'PTL-' + String(d.getFullYear()).slice(2) + pad(d.getMonth() + 1) + pad(d.getDate()) + '-' + rand;
  }

  function nowLabel(){
    return new Date().toLocaleString('es-CO', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
  }

  function collect(){
    return {
      tipo: tipoValue(),
      nombre: field('nombre'),
      empresa: field('empresa'),
      correo: field('correo'),
      telefono: field('telefono'),
      ciudad: field('ciudad'),
      productos: productBoxes.filter(box => box.checked).map(box => box.dataset.label || box.value),
      volumen: field('volumen'),
      mensaje: field('mensaje'),
      fecha: nowLabel()
    };
  }

  // ---------- Mensajes ----------
  // WhatsApp: *negrita* y emojis como marcadores visuales de cada bloque.
  function whatsappText(ref, d){
    const L = [];
    L.push('Hola, equipo comercial de Petroil 👋');
    L.push('Les escribo desde el sitio web con la siguiente solicitud:');
    L.push('');
    L.push('📋 *' + d.tipo.toUpperCase() + '*');
    L.push('Ref: ' + ref);
    L.push('');
    L.push('👤 *Datos de contacto*');
    L.push('• Nombre: ' + d.nombre);
    if(d.empresa) L.push('• Empresa: ' + d.empresa);
    L.push('• Correo: ' + d.correo);
    L.push('• Teléfono: ' + d.telefono);
    if(d.ciudad) L.push('• Ciudad / entrega: ' + d.ciudad);
    if(d.productos.length){
      L.push('');
      L.push('⛽ *Producto(s) de interés*');
      d.productos.forEach(p => L.push('• ' + p));
    }
    if(d.volumen){
      L.push('');
      L.push('📦 *Volumen / frecuencia:* ' + d.volumen);
    }
    if(d.mensaje){
      L.push('');
      L.push('💬 *Mensaje*');
      L.push(d.mensaje);
    }
    L.push('');
    L.push('✅ Acepto la política de tratamiento de datos personales de Petroil S.A.');
    L.push('🕒 ' + d.fecha);
    return L.join('\n');
  }

  // Correo: texto plano sobrio (sin asteriscos ni emojis).
  function emailSubject(ref, d){
    return d.tipo + ' — ' + d.nombre + (d.empresa ? ' (' + d.empresa + ')' : '') + ' · Ref. ' + ref;
  }
  function emailText(ref, d){
    const L = [];
    L.push('Hola, equipo comercial de Petroil:');
    L.push('');
    L.push('Les escribo desde el sitio web con la siguiente solicitud.');
    L.push('');
    L.push('TIPO DE SOLICITUD: ' + d.tipo);
    L.push('REFERENCIA: ' + ref);
    L.push('');
    L.push('DATOS DE CONTACTO');
    L.push('- Nombre: ' + d.nombre);
    if(d.empresa) L.push('- Empresa: ' + d.empresa);
    L.push('- Correo: ' + d.correo);
    L.push('- Teléfono: ' + d.telefono);
    if(d.ciudad) L.push('- Ciudad / entrega: ' + d.ciudad);
    if(d.productos.length){
      L.push('');
      L.push('PRODUCTO(S) DE INTERÉS');
      d.productos.forEach(p => L.push('- ' + p));
    }
    if(d.volumen){
      L.push('');
      L.push('VOLUMEN / FRECUENCIA: ' + d.volumen);
    }
    if(d.mensaje){
      L.push('');
      L.push('MENSAJE');
      L.push(d.mensaje);
    }
    L.push('');
    L.push('Acepto la política de tratamiento de datos personales de Petroil S.A.');
    L.push('Enviado el ' + d.fecha + '.');
    L.push('');
    L.push('Saludos,');
    L.push(d.nombre);
    return L.join('\n');
  }

  // ---------- Canales ----------
  const enc = encodeURIComponent;
  const channels = {
    whatsapp: {
      label: 'WhatsApp',
      url: (ref, d) => 'https://wa.me/' + WA_NUMBER + '?text=' + enc(whatsappText(ref, d)),
      get done() { return t('channel.whatsapp.done', 'Abrimos WhatsApp con tu solicitud ya escrita. <b>Presiona «Enviar» en WhatsApp</b> para que llegue a nuestro asesor comercial.'); }
    },
    gmail: {
      label: 'Gmail',
      url: (ref, d) => 'https://mail.google.com/mail/?view=cm&fs=1&to=' + enc(MAIL_TO) + '&su=' + enc(emailSubject(ref, d)) + '&body=' + enc(emailText(ref, d)),
      get done() { return t('channel.gmail.done', 'Abrimos Gmail con el correo listo para ' + MAIL_TO + '. <b>Revisa y presiona «Enviar»</b>. Si no habías iniciado sesión, Gmail te lo pedirá primero.').replace(/\{email\}/g, MAIL_TO); }
    },
    outlook: {
      label: 'Outlook.com',
      url: (ref, d) => 'https://outlook.live.com/mail/0/deeplink/compose?to=' + enc(MAIL_TO) + '&subject=' + enc(emailSubject(ref, d)) + '&body=' + enc(emailText(ref, d)),
      get done() { return t('channel.outlook.done', 'Abrimos Outlook con el correo listo para ' + MAIL_TO + '. <b>Revisa y presiona «Enviar»</b>.').replace(/\{email\}/g, MAIL_TO); }
    },
    outlook365: {
      label: 'Outlook (Microsoft 365)',
      url: (ref, d) => 'https://outlook.office.com/mail/deeplink/compose?to=' + enc(MAIL_TO) + '&subject=' + enc(emailSubject(ref, d)) + '&body=' + enc(emailText(ref, d)),
      get done() { return t('channel.outlook365.done', 'Abrimos Outlook de tu cuenta empresarial con el correo listo para ' + MAIL_TO + '. <b>Revisa y presiona «Enviar»</b>.').replace(/\{email\}/g, MAIL_TO); }
    },
    mailto: {
      label: 'tu aplicación de correo',
      url: (ref, d) => 'mailto:' + MAIL_TO + '?subject=' + enc(emailSubject(ref, d)) + '&body=' + enc(emailText(ref, d)),
      sameTab: true,
      get done() { return t('channel.mailto.done', 'Intentamos abrir la aplicación de correo predeterminada de tu equipo. Si no se abrió ninguna, vuelve y elige Gmail u Outlook, o copia el texto.'); }
    }
  };

  function openChannel(key){
    const ch = channels[key];
    if(!ch || !current) return;
    const url = ch.url(current.ref, current.data);
    if(ch.sameTab) window.location.href = url;
    else window.open(url, '_blank', 'noopener');
    lastChannel = key;
    showSuccess(key);
  }

  // ---------- Validación ----------
  // Al menos un producto, salvo que la solicitud sea una consulta general.
  function validateProducts(){
    const ok = tipoValue() === TIPO_SIN_PRODUCTO || productBoxes.some(box => box.checked);
    productsGroup.classList.toggle('is-invalid', !ok);
    productsError.hidden = ok;
    return ok;
  }

  function validate(){
    const nativeOk = contactForm.checkValidity();
    const productsOk = validateProducts();
    if(!nativeOk){
      contactForm.reportValidity(); // enfoca y describe el primer campo inválido
    } else if(!productsOk){
      productsGroup.scrollIntoView({ behavior:'smooth', block:'center' });
      productBoxes[0]?.focus({ preventScroll:true });
    }
    return nativeOk && productsOk;
  }

  // ---------- UI ----------
  function openReview(){
    current = { ref: makeRef(), data: collect() };
    setRef('ctRef', current.ref);
    previewEl.textContent = whatsappText(current.ref, current.data).replace(/\*/g, '');
    if(copyLabel) copyLabel.textContent = t('review.copyText', 'Copiar texto');
    if(typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }

  function closeReview(){
    if(dialog.open) (typeof dialog.close === 'function') ? dialog.close() : dialog.removeAttribute('open');
  }

  function showSuccess(key){
    closeReview();
    const ch = channels[key];
    successTitle.textContent = key === 'mailto' ? t('success.titleMailto', 'Tu correo está listo') : t('success.title', '¡Tu solicitud está lista!');
    successText.innerHTML = ch.done;
    setRef('ctSuccessRef', current.ref);
    reopenBtn.querySelector('span').textContent = t('success.reopenWith', 'Abrir {channel} de nuevo').replace('{channel}', ch.label);
    contactForm.hidden = true;
    successPanel.hidden = false;
    successPanel.scrollIntoView({ behavior:'smooth', block:'center' });
    successTitle.focus({ preventScroll:true });
  }

  async function copyText(){
    if(!current) return;
    const text = emailText(current.ref, current.data);
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch(e){
      // Respaldo para navegadores sin Clipboard API (o file://)
      const ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      dialog.appendChild(ta); ta.select();
      try { ok = document.execCommand('copy'); } catch(err){ ok = false; }
      ta.remove();
    }
    if(copyLabel) copyLabel.textContent = ok ? t('review.copySuccess', '¡Copiado! Pégalo donde prefieras') : t('review.copyError', 'No se pudo copiar');
  }

  // ---------- Eventos ----------
  productBoxes.forEach(box => box.addEventListener('change', () => { if(!productsError.hidden) validateProducts(); }));
  tipoRadios.forEach(radio => radio.addEventListener('change', () => { if(!productsError.hidden) validateProducts(); }));

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if(validate()) openReview();
  });

  dialog.querySelectorAll('[data-channel]').forEach(btn => {
    btn.addEventListener('click', () => openChannel(btn.dataset.channel));
  });
  dialog.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', closeReview));
  // Clic en el fondo oscuro (fuera de la tarjeta) cierra el diálogo
  dialog.addEventListener('click', (e) => { if(e.target === dialog) closeReview(); });
  if(copyBtn) copyBtn.addEventListener('click', copyText);

  if(reopenBtn){
    reopenBtn.addEventListener('click', () => { if(lastChannel) openChannel(lastChannel); });
  }
  const otherChannelBtn = document.getElementById('ctOtherChannel');
  if(otherChannelBtn){
    otherChannelBtn.addEventListener('click', () => {
      if(!current) return;
      if(typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
    });
  }

  if(resetBtn){
    resetBtn.addEventListener('click', () => {
      contactForm.reset();
      productsGroup.classList.remove('is-invalid');
      productsError.hidden = true;
      successPanel.hidden = true;
      contactForm.hidden = false;
      current = null; lastChannel = null;
      contactForm.scrollIntoView({ behavior:'smooth', block:'start' });
    });
  }

  // Preselección por URL
  const params = new URLSearchParams(window.location.search);
  const preProducto = params.get('producto');
  const preTipo = params.get('tipo');
  if(preProducto) productBoxes.forEach(box => { if(box.value === preProducto) box.checked = true; });
  if(preTipo) tipoRadios.forEach(radio => { if(radio.value === preTipo) radio.checked = true; });
}
