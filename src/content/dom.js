/* Feito por GustavoN-S (https://github.com/GustavoN-S) */

(function (root) {
  'use strict';
  const GMX = (root.GMX = root.GMX || {});

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  async function waitFor(fn, { timeout = 15000, interval = 200, label = '' } = {}) {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      let v;
      try { v = fn(); } catch (_) { v = null; }
      if (v) return v;
      await sleep(interval);
    }
    throw new Error('Timeout aguardando ' + (label || 'elemento'));
  }

  async function waitForSoft(fn, opts) {
    try { return await waitFor(fn, opts); } catch (_) { return null; }
  }

  function text(el) {
    if (!el) return '';
    return (el.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function attr(el, name) {
    return el ? (el.getAttribute(name) || '').trim() : '';
  }

  async function scrollContainer(el, delay) {
    const before = el.scrollHeight;
    el.scrollTo({ top: el.scrollHeight, behavior: 'instant' });
    el.dispatchEvent(new WheelEvent('wheel', { deltaY: 2000, bubbles: true }));
    await sleep(delay);
    return el.scrollHeight !== before;
  }

  function realClick(el) {
    if (!el) return false;
    const opts = { bubbles: true, cancelable: true, view: window };
    el.scrollIntoView({ block: 'center' });
    el.dispatchEvent(new PointerEvent('pointerdown', opts));
    el.dispatchEvent(new MouseEvent('mousedown', opts));
    el.dispatchEvent(new PointerEvent('pointerup', opts));
    el.dispatchEvent(new MouseEvent('mouseup', opts));
    el.dispatchEvent(new MouseEvent('click', opts));
    return true;
  }

  GMX.DOM = { sleep, waitFor, waitForSoft, text, attr, scrollContainer, realClick };
})(typeof globalThis !== 'undefined' ? globalThis : self);
