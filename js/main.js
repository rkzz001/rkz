/* ==========================================================================
   rkz — navegación
   Cada vista del panel izquierdo es un <section data-view="nombre">.
   La vista activa se guarda en el hash de la URL (#fixed, #more-about...).
   Una ruta puede llevar un parámetro tras "/" (#post/mi-entrada): la parte
   anterior elige la vista y el parámetro lo interpreta js/posts.js.
   de modo que funcionan los botones Atrás/Adelante, los enlaces directos y
   la recarga, sin recargar la página y sin tocar el panel de la imagen.

   - data-view : nombre de la vista (coincide con el hash)
   - data-tab  : pestaña de la barra superior que se marca como activa
   - data-title: texto que se añade al título del documento
   ========================================================================== */

(function () {
  'use strict';

  var DEFAULT_VIEW = 'summary';
  var BASE_TITLE = 'rkz';

  var screen = document.querySelector('.screen');
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab'));
  var views = {};
  Array.prototype.forEach.call(document.querySelectorAll('[data-view]'), function (el) {
    views[el.getAttribute('data-view')] = el;
  });

  if (!screen || !tabs.length || !views[DEFAULT_VIEW]) { return; }

  var current = null;

  function routeFromHash() {
    var route = '';
    try { route = decodeURIComponent(window.location.hash.slice(1)); } catch (e) { route = ''; }
    var name = route.split('/')[0];
    return Object.prototype.hasOwnProperty.call(views, name) ? route : DEFAULT_VIEW;
  }

  function show(route) {
    if (route === current) { return; }
    current = route;
    var name = route.split('/')[0];

    Object.keys(views).forEach(function (key) {
      views[key].hidden = key !== name;
    });

    var view = views[name];
    var activeTab = view.getAttribute('data-tab');
    tabs.forEach(function (tab) {
      if (tab.getAttribute('data-tab') === activeTab) {
        tab.setAttribute('aria-current', 'page');
      } else {
        tab.removeAttribute('aria-current');
      }
    });

    var title = view.getAttribute('data-title');
    document.title = title ? BASE_TITLE + ' — ' + title : BASE_TITLE;
    screen.setAttribute('aria-label', title ? 'Contenido: ' + title : 'Contenido principal');
    screen.scrollTop = 0;

    // Entrada breve y discreta (se anula con prefers-reduced-motion en el CSS)
    view.classList.remove('view--enter');
    void view.offsetWidth;
    view.classList.add('view--enter');
  }

  window.addEventListener('hashchange', function () { show(routeFromHash()); });
  show(routeFromHash());

  // Teclado en la barra: flechas / Inicio / Fin mueven el foco entre pestañas;
  // Enter activa el enlace enfocado.
  var bar = document.querySelector('.topbar');
  if (bar) {
    bar.addEventListener('keydown', function (event) {
      var index = tabs.indexOf(document.activeElement);
      if (index === -1) { return; }
      var next = -1;
      if (event.key === 'ArrowRight') { next = (index + 1) % tabs.length; }
      else if (event.key === 'ArrowLeft') { next = (index - 1 + tabs.length) % tabs.length; }
      else if (event.key === 'Home') { next = 0; }
      else if (event.key === 'End') { next = tabs.length - 1; }
      if (next !== -1) {
        event.preventDefault();
        tabs[next].focus();
      }
    });
  }
})();
