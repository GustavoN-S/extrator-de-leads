/* Feito por GustavoN-S (https://github.com/GustavoN-S) */

(function () {
  'use strict';

  const TAG = 'GMX_NET';

  const INTERESTING =
    /\/search\?tbm=map|\/maps\/preview\/place|\/maps\/preview\/pd|listentitiesv2|\/locationhistory\/preview/;

  const buffer = [];
  const MAX_BUFFER = 14;
  let listenerReady = false;

  function post(msg) {
    try { window.postMessage(msg, location.origin); } catch (_) {}
  }

  function emit(url, body) {
    if (!body || body.length < 64) return;
    if (body.length > 12 * 1024 * 1024) return;

    const msg = { __gmx: TAG, url: String(url), body: String(body) };

    if (listenerReady) {
      post(msg);
    } else {
      buffer.push(msg);
      while (buffer.length > MAX_BUFFER) buffer.shift();
    }
  }

  window.addEventListener('message', (ev) => {
    if (ev.source !== window) return;
    if (!ev.data || ev.data.__gmx !== 'GMX_READY') return;
    listenerReady = true;
    while (buffer.length) post(buffer.shift());
  });

  const origFetch = window.fetch;
  if (typeof origFetch === 'function') {
    window.fetch = function (...args) {
      const promise = origFetch.apply(this, args);
      try {
        const input = args[0];
        const url = (input && input.url) || input;
        if (INTERESTING.test(String(url))) {
          promise
            .then((res) => {
              try {
                res.clone().text().then((t) => emit(url, t)).catch(() => {});
              } catch (_) {  }
            })
            .catch(() => {});
        }
      } catch (_) {  }
      return promise;
    };
  }

  const origOpen = XMLHttpRequest.prototype.open;
  const origSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url) {
    try { this.__gmxUrl = url; } catch (_) {}
    return origOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function () {
    try {
      if (INTERESTING.test(String(this.__gmxUrl || ''))) {
        this.addEventListener('load', () => {
          try { emit(this.__gmxUrl, this.responseText); } catch (_) {}
        });
      }
    } catch (_) {  }
    return origSend.apply(this, arguments);
  };

  let tries = 0;
  const timer = setInterval(() => {
    try {
      if (window.APP_INITIALIZATION_STATE) {
        clearInterval(timer);
        emit('APP_INITIALIZATION_STATE', JSON.stringify(window.APP_INITIALIZATION_STATE));
      } else if (++tries > 80) {
        clearInterval(timer);
      }
    } catch (_) {
      clearInterval(timer);
    }
  }, 250);
})();
