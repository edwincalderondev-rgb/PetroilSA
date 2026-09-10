// Chat widget — AIRA, asistente virtual de Petroil (sitewide)
const chatLauncher = document.getElementById('chatLauncher');
const chatPanel = document.getElementById('chatPanel');
const chatClose = document.getElementById('chatClose');
const chatLog = document.getElementById('chatLog');
if(chatLauncher){
  const LABEL_OPEN = 'Abrir chat con AIRA, asistente virtual de Petroil';
  const LABEL_CLOSE = 'Cerrar chat con AIRA';

  chatLauncher.addEventListener('click', () => {
    const isOpen = chatPanel.classList.toggle('open');
    chatLauncher.setAttribute('aria-label', isOpen ? LABEL_CLOSE : LABEL_OPEN);
  });
  chatClose.addEventListener('click', () => {
    chatPanel.classList.remove('open');
    chatLauncher.setAttribute('aria-label', LABEL_OPEN);
  });

  const answers = {
    productos: "Producimos combustibles industriales, marinos y para minería como Petroil 40 A MAX, Petroil 90 Gasolina Premium, Petroil 300 VLSFO, entre otros. Puedes ver el listado completo en la sección Productos.",
    ubicacion: "Nuestra oficina comercial está en la Torre Empresarial Pacífic, Bogotá, y nuestra refinería en el sector Mamatoco, Santa Marta. Puedes verlas en el mapa del footer.",
    certificaciones: "Contamos con la trinorma ISO 9001 (Calidad), ISO 45001 (Seguridad y Salud en el Trabajo) e ISO 14001 (Gestión Ambiental).",
    asesor: "Con gusto. Te comparto el botón de WhatsApp abajo para hablar directamente con un asesor comercial."
  };

  function addMsg(text, who){
    const div = document.createElement('div');
    div.className = 'msg ' + who;
    div.textContent = text;
    chatLog.appendChild(div);
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  document.querySelectorAll('.quick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      addMsg(btn.textContent, 'user');
      setTimeout(() => addMsg(answers[btn.dataset.q], 'bot'), 400);
    });
  });
}
