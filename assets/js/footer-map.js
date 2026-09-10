// Footer map tabs (Bogotá / Santa Marta) — presente en el footer sitewide
const mapFrame = document.getElementById('mapFrame');
const gmapsLink = document.getElementById('gmapsLink');
const maps = {
  bogota: {
    src: "https://www.openstreetmap.org/export/embed.html?bbox=-74.0443%2C4.6803%2C-74.0243%2C4.7003&layer=mapnik&marker=4.6903%2C-74.0343",
    gmaps: "https://www.google.com/maps/search/?api=1&query=Torre+Empresarial+Pacific+Calle+110+%239-25+Bogota"
  },
  santamarta: {
    src: "https://www.openstreetmap.org/export/embed.html?bbox=-74.1806%2C11.2195%2C-74.1606%2C11.2395&layer=mapnik&marker=11.2295%2C-74.1706",
    gmaps: "https://www.google.com/maps/search/?api=1&query=Carrera+57A+%2330-399+Mamatoco+Santa+Marta"
  }
};
if(mapFrame){
  document.querySelectorAll('.map-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.map-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const key = tab.dataset.map;
      mapFrame.src = maps[key].src;
      gmapsLink.href = maps[key].gmaps;
    });
  });
}
