// PQRSF: selector visual de tipo + envío con panel de éxito y radicado (solo existe en legal/pqrsf.html)
const pqrsfForm = document.getElementById('pqrsfForm');
const toast = document.getElementById('toast');

document.querySelectorAll('.pqrsf-type-card input[type="radio"]').forEach(input => {
  input.addEventListener('change', () => {
    document.querySelectorAll('.pqrsf-type-card').forEach(card => card.classList.remove('selected'));
    input.closest('.pqrsf-type-card').classList.add('selected');
  });
});

if(pqrsfForm){
  const successPanel = document.getElementById('pqrsfSuccess');
  const radicadoEl = document.getElementById('pqrsfRadicado');
  const resetBtn = document.getElementById('pqrsfReset');

  pqrsfForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const year = new Date().getFullYear();
    const folio = String(Math.floor(100000 + Math.random() * 899999));
    if(radicadoEl) radicadoEl.textContent = `PQR-${year}-${folio}`;
    pqrsfForm.style.display = 'none';
    if(successPanel) successPanel.classList.add('show');
    if(toast){
      toast.textContent = (window.PetroilI18n && window.PetroilI18n.t('toast.registrada')) || 'Solicitud de ejemplo registrada correctamente. (Formulario de demostración)';
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 3800);
    }
  });

  if(resetBtn){
    resetBtn.addEventListener('click', () => {
      pqrsfForm.reset();
      document.querySelectorAll('.pqrsf-type-card').forEach(card => card.classList.remove('selected'));
      if(successPanel) successPanel.classList.remove('show');
      pqrsfForm.style.display = '';
    });
  }
}
