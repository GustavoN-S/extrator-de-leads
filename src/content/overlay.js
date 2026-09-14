/* Feito por GustavoN-S (https://github.com/GustavoN-S) */

(function (root) {
  'use strict';
  const GMX = (root.GMX = root.GMX || {});

  let el = null;
  let refs = {};
  let minimized = false;

  function build() {
    if (el) return el;
    el = document.createElement('div');
    el.id = 'gmx-hud';
    el.innerHTML = [
      '<div class="gmx-head">',
      '  <i class="gmx-dot"></i>',
      '  <span class="gmx-title">Maps Lead Extractor</span>',
      '  <button class="gmx-btn" data-act="min" title="Minimizar">—</button>',
      '  <button class="gmx-btn" data-act="close" title="Fechar">x</button>',
      '</div>',
      '<div class="gmx-body">',
      '  <div class="gmx-stats">',
      '    <div class="gmx-stat gmx-hot"><b data-k="nosite">0</b><span>sem site</span></div>',
      '    <div class="gmx-stat"><b data-k="total">0</b><span>capturados</span></div>',
      '  </div>',
      '  <div class="gmx-bar"><i data-k="bar"></i></div>',
      '  <div class="gmx-log"></div>',
      '  <div class="gmx-actions">',
      '    <button data-act="stop" class="gmx-stop">Parar</button>',
      '    <button data-act="dash">Ver leads</button>',
      '  </div>',
      '</div>'
    ].join('');
    document.body.appendChild(el);

    refs = {
      dot: el.querySelector('.gmx-dot'),
      nosite: el.querySelector('[data-k="nosite"]'),
      total: el.querySelector('[data-k="total"]'),
      bar: el.querySelector('[data-k="bar"]'),
      log: el.querySelector('.gmx-log')
    };

    el.addEventListener('click', (ev) => {
      const act = ev.target.getAttribute && ev.target.getAttribute('data-act');
      if (!act) return;
      if (act === 'min') { minimized = !minimized; el.classList.toggle('gmx-min', minimized); }
      if (act === 'close') hide();
      if (act === 'stop') GMX.Scraper && GMX.Scraper.stop('Interrompido pelo usuario');
      if (act === 'dash') chrome.runtime.sendMessage({ type: GMX.MSG.OPEN_DASHBOARD });
    });

    makeDraggable(el, el.querySelector('.gmx-head'));
    return el;
  }

  function makeDraggable(box, handle) {
    let sx = 0, sy = 0, ox = 0, oy = 0, dragging = false;
    handle.addEventListener('mousedown', (e) => {
      if (e.target.tagName === 'BUTTON') return;
      dragging = true;
      const r = box.getBoundingClientRect();
      sx = e.clientX; sy = e.clientY; ox = r.left; oy = r.top;
      e.preventDefault();
    });
    window.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      box.style.left = ox + (e.clientX - sx) + 'px';
      box.style.top = oy + (e.clientY - sy) + 'px';
      box.style.right = 'auto';
      box.style.bottom = 'auto';
    });
    window.addEventListener('mouseup', () => { dragging = false; });
  }

  function show() { build().style.display = ''; }
  function hide() { if (el) el.style.display = 'none'; }

  function setState(kind) {
    build();
    el.classList.remove('gmx-run', 'gmx-done', 'gmx-err');
    if (kind) el.classList.add('gmx-' + kind);
  }

  function stats({ total, noSite, pct }) {
    build();
    if (total !== undefined) refs.total.textContent = total;
    if (noSite !== undefined) refs.nosite.textContent = noSite;
    if (pct !== undefined) refs.bar.style.width = Math.min(100, Math.max(0, pct)) + '%';
  }

  function log(line) {
    build();
    const row = document.createElement('div');
    const t = new Date();
    row.textContent =
      String(t.getHours()).padStart(2, '0') + ':' +
      String(t.getMinutes()).padStart(2, '0') + ':' +
      String(t.getSeconds()).padStart(2, '0') + '  ' + line;
    refs.log.appendChild(row);
    while (refs.log.children.length > 40) refs.log.removeChild(refs.log.firstChild);
    refs.log.scrollTop = refs.log.scrollHeight;
  }

  GMX.Overlay = { show, hide, log, stats, setState };
})(typeof globalThis !== 'undefined' ? globalThis : self);
