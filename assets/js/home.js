// Product videos: se reproducen con el cursor (desktop) o con el toque (móvil).
// El resto del tiempo se ve la imagen (.product-poster). Lo usan index.html
// (tarjetas de home.css) y productos.html (tarjetas propias de productos.css):
// ambas conservan los mismos nombres de clase para reutilizar esta lógica.
const productVideos = document.querySelectorAll('.product-video');
if(productVideos.length){

  // Precarga anticipada: en cuanto la tarjeta está por entrar en pantalla
  // (600px antes), empezamos a descargar el video en segundo plano, para que
  // cuando el usuario realmente llegue a esa tarjeta ya esté listo y no haya
  // demora al reproducirlo (evita el "stutter" inicial en desktop).
  const preloadObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        const v = entry.target;
        v.preload = 'auto';
        v.load();
        obs.unobserve(v);
      }
    });
  }, { rootMargin: '600px 0px', threshold: 0 });

  // Pausa automática cuando la tarjeta sale de pantalla (ahorra batería/datos,
  // sobre todo en móvil donde el video puede quedar reproduciéndose de fondo).
  const visibilityObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => { if(!entry.isIntersecting) entry.target.pause(); });
  }, { threshold: 0 });

  productVideos.forEach(v => {
    v.pause(); // por si el navegador intenta arrancarlo solo
    preloadObserver.observe(v);
    visibilityObserver.observe(v);

    const card = v.closest('.product-card');
    if(!card) return;

    function playVideo(){
      try { v.currentTime = 0; } catch(e) { /* aún sin metadata cargada, se ignora */ }
      const p = v.play();
      if(p && typeof p.catch === 'function') p.catch(() => { /* autoplay bloqueado, sigue la imagen */ });
    }
    function pauseVideo(){ v.pause(); }

    // Desktop: mouse y teclado
    card.addEventListener('mouseenter', playVideo);
    card.addEventListener('mouseleave', pauseVideo);
    // Accesibilidad: la tarjeta es un <a>, navegable con teclado
    card.addEventListener('focus', playVideo);
    card.addEventListener('blur', pauseVideo);

    // Móvil: muchos navegadores activan el estado :hover del CSS con el
    // primer toque (por eso la imagen ya se ocultaba y el video "aparecía"),
    // pero nadie llamaba a .play(). Con este listener, el toque también
    // dispara la reproducción real, evitando la pantalla en blanco.
    card.addEventListener('touchstart', playVideo, { passive: true });
  });
}
