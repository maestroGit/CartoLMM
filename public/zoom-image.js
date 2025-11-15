// zoom-image.js: Permite hacer zoom y mover la imagen de la botella en un modal flotante
window.showZoomImage = function(imgSrc) {
  // Si ya hay un modal, no crear otro
  if (document.getElementById('zoom-image-modal')) return;
  const modal = document.createElement('div');
  modal.className = 'zoom-image-modal';
  modal.id = 'zoom-image-modal';
  modal.innerHTML = `
    <span class="close" onclick="window.closeZoomImage()">&times;</span>
    <img src="${imgSrc}" draggable="false" />
  `;
  document.body.appendChild(modal);
  // Drag para mover la imagen
  let isDragging = false, startX = 0, startY = 0, img, lastX = 0, lastY = 0;
  img = modal.querySelector('img');
  img.style.transform = 'scale(2)';
  img.addEventListener('mousedown', function(e) {
    isDragging = true;
    startX = e.clientX - lastX;
    startY = e.clientY - lastY;
    modal.style.cursor = 'grabbing';
    img.style.cursor = 'grabbing';
    e.preventDefault();
  });
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
  function onMove(e) {
    if (!isDragging) return;
    lastX = e.clientX - startX;
    lastY = e.clientY - startY;
    img.style.transform = `scale(2) translate(${lastX/2}px,${lastY/2}px)`;
  }
  function onUp() {
    isDragging = false;
    modal.style.cursor = 'grab';
    img.style.cursor = 'grab';
  }
  // Cerrar con click fuera o botón
  window.closeZoomImage = function() {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    if (modal.parentNode) modal.parentNode.removeChild(modal);
  };
  modal.addEventListener('click', function(e) {
    if (e.target === modal) window.closeZoomImage();
  });
};