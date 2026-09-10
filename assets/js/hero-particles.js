// Hero particles (aire que asciende) — index.html y nosotros/quienes-somos.html
const particleHost = document.getElementById('heroParticles');
if(particleHost){
  const n = 22;
  for(let i=0;i<n;i++){
    const p = document.createElement('span');
    p.className = 'particle';
    const size = 4 + Math.random()*10;
    p.style.width = size+'px';
    p.style.height = size+'px';
    p.style.left = Math.random()*100+'%';
    p.style.animationDuration = (7 + Math.random()*8)+'s';
    p.style.animationDelay = (Math.random()*10)+'s';
    particleHost.appendChild(p);
  }
}
