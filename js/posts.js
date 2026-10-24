/* ==========================================================================
   rkz — publicaciones
   Carga data/posts.json, pinta el índice en #post-list y la entrada abierta
   en #post-article (ruta #post/<id>). Todo el texto se inserta con
   textContent / createElement: el contenido del JSON nunca se interpreta
   como HTML.

   Formato de cada entrada (ver data/posts.json):
     id        (obligatorio) identificador único, sin espacios
     title     (obligatorio)
     date      (obligatorio) AAAA-MM-DD
     content   (obligatorio) lista: texto = párrafo; objeto = imagen
                 { "image": "ruta", "alt": "texto", "caption": "opcional" }
     category  (opcional)
     excerpt   (opcional)
     links     (opcional) lista de { "label": "...", "url": "..." }
   Dentro de un párrafo se admite [texto](url) para enlaces.
   ========================================================================== */

(function () {
  'use strict';

  var DATA_URL = 'data/posts.json';
  var BASE_TITLE = 'rkz';

  var listBox = document.getElementById('post-list');
  var article = document.getElementById('post-article');
  var screen = document.querySelector('.screen');
  if (!listBox || !article) { return; }

  var posts = null;      // null = todavía no cargado
  var loadFailed = false;

  /* ---------- utilidades ---------- */

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) { node.className = className; }
    if (text !== undefined) { node.textContent = text; }
    return node;
  }

  function isSafeUrl(url) {
    return typeof url === 'string' && url.length > 0 && !/^\s*(javascript|data|vbscript):/i.test(url);
  }

  function makeLink(label, url) {
    var a = el('a', 'entry__link', label);
    a.href = url;
    if (/^https?:\/\//i.test(url)) {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    }
    return a;
  }

  // Párrafo con enlaces [texto](url)
  function paragraph(text) {
    var p = el('p');
    var re = /\[([^\]]+)\]\(([^)\s]+)\)/g;
    var last = 0;
    var m;
    while ((m = re.exec(text)) !== null) {
      if (m.index > last) { p.appendChild(document.createTextNode(text.slice(last, m.index))); }
      if (isSafeUrl(m[2])) {
        p.appendChild(makeLink(m[1], m[2]));
      } else {
        p.appendChild(document.createTextNode(m[1]));
      }
      last = re.lastIndex;
    }
    if (last < text.length) { p.appendChild(document.createTextNode(text.slice(last))); }
    return p;
  }

  function figure(block) {
    if (!isSafeUrl(block.image)) { return null; }
    var fig = el('figure', 'entry__figure');
    var img = el('img');
    img.src = block.image;
    img.alt = block.alt || '';
    img.loading = 'lazy';
    fig.appendChild(img);
    if (block.caption) { fig.appendChild(el('figcaption', null, block.caption)); }
    return fig;
  }

  function validPost(p) {
    return p && typeof p.id === 'string' && p.id && typeof p.title === 'string' &&
      typeof p.date === 'string' && Array.isArray(p.content);
  }

  function parseRoute() {
    var raw = '';
    try { raw = decodeURIComponent(window.location.hash.slice(1)); } catch (e) { raw = ''; }
    var parts = raw.split('/');
    return { view: parts[0], param: parts.slice(1).join('/') };
  }

  function setTitle(text) {
    document.title = text ? BASE_TITLE + ' — ' + text : BASE_TITLE;
    if (screen && text) { screen.setAttribute('aria-label', 'Contenido: ' + text); }
  }

  /* ---------- índice ---------- */

  function renderMessage(box, lines) {
    box.textContent = '';
    var pre = el('pre', 'term');
    pre.textContent = lines.join('\n');
    box.appendChild(pre);
  }

  function renderIndex() {
    if (loadFailed) {
      renderMessage(listBox, [
        'ERROR: no se pudo cargar ' + DATA_URL,
        'ECHO Si abres index.html con doble clic, el navegador',
        'ECHO bloquea la lectura. Usa un servidor local:',
        'ECHO    python -m http.server 8000'
      ]);
      return;
    }
    if (!posts) { renderMessage(listBox, ['CARGANDO ' + DATA_URL + ' ...']); return; }
    if (!posts.length) { renderMessage(listBox, ['ECHO NO HAY ENTRADAS TODAVIA.']); return; }

    listBox.textContent = '';
    var ul = el('ul', 'posts');
    posts.forEach(function (post) {
      var li = el('li', 'posts__item');
      var a = el('a', 'posts__link');
      a.href = '#post/' + encodeURIComponent(post.id);

      var meta = el('span', 'posts__meta', post.date + (post.category ? '  [' + post.category + ']' : ''));
      var title = el('span', 'posts__title', post.title);
      a.appendChild(meta);
      a.appendChild(title);
      li.appendChild(a);
      if (post.excerpt) { li.appendChild(el('span', 'posts__excerpt', post.excerpt)); }
      ul.appendChild(li);
    });
    listBox.appendChild(ul);
  }

  /* ---------- entrada individual ---------- */

  function renderArticle(id) {
    article.textContent = '';

    if (loadFailed) {
      article.appendChild(el('h2', 'entry__title', 'No se pudo cargar la entrada'));
      article.appendChild(el('p', null, 'No se pudo leer ' + DATA_URL + '. Si abres index.html con doble clic, usa un servidor local (python -m http.server).'));
      setTitle('ERROR');
      return;
    }
    if (!posts) {
      article.appendChild(el('p', null, 'CARGANDO...'));
      return;
    }

    var post = null;
    for (var i = 0; i < posts.length; i++) {
      if (posts[i].id === id) { post = posts[i]; break; }
    }
    if (!post) {
      article.appendChild(el('h2', 'entry__title', 'Entrada no encontrada'));
      article.appendChild(el('p', null, 'No existe ninguna entrada con el identificador "' + id + '".'));
      setTitle('ENTRADA NO ENCONTRADA');
      return;
    }

    article.appendChild(el('h2', 'entry__title', post.title));
    article.appendChild(el('p', 'entry__meta', 'FECHA: ' + post.date + (post.category ? ' | CATEGORIA: ' + post.category : '')));

    post.content.forEach(function (block) {
      if (typeof block === 'string') {
        article.appendChild(paragraph(block));
      } else if (block && typeof block === 'object') {
        var fig = figure(block);
        if (fig) { article.appendChild(fig); }
      }
    });

    if (Array.isArray(post.links) && post.links.length) {
      var ul = el('ul', 'entry__links');
      post.links.forEach(function (link) {
        if (link && isSafeUrl(link.url) && link.label) {
          var li = el('li');
          li.appendChild(makeLink(link.label, link.url));
          ul.appendChild(li);
        }
      });
      if (ul.childNodes.length) { article.appendChild(ul); }
    }

    setTitle(post.title);
    if (screen) { screen.scrollTop = 0; }
  }

  /* ---------- sincronización con la ruta ---------- */

  function sync() {
    var route = parseRoute();
    if (route.view === 'post') { renderArticle(route.param); }
  }

  window.addEventListener('hashchange', sync);

  /* ---------- carga ---------- */

  renderIndex();
  sync();

  fetch(DATA_URL, { cache: 'no-cache' })
    .then(function (response) {
      if (!response.ok) { throw new Error('HTTP ' + response.status); }
      return response.json();
    })
    .then(function (data) {
      var list = Array.isArray(data) ? data : (data && data.posts);
      if (!Array.isArray(list)) { throw new Error('Formato no válido'); }
      posts = list.filter(validPost).sort(function (a, b) {
        return a.date < b.date ? 1 : (a.date > b.date ? -1 : 0);
      });
    })
    .catch(function (error) {
      loadFailed = true;
      if (window.console) { console.error('rkz: no se pudieron cargar las publicaciones:', error); }
    })
    .then(function () {
      renderIndex();
      sync();
    });
})();
