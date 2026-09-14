/* Feito por GustavoN-S (https://github.com/GustavoN-S) */

(function (root) {
  'use strict';
  const GMX = (root.GMX = root.GMX || {});

  const PHONE_INTL = /\+\d[\d\s().\-]{6,19}\d/;
  const PHONE_NAT =
    /(?:\(\d{2,4}\)|\b\d{2,4})[\s.\-](?:9[\s.\-])?\d{3,5}[\s.\-]?\d{3,4}(?!\d)/;
  const PHONE_GROUPS = /\b\d{2,4}(?:[\s.\-]\d{2,4}){2,5}(?!\d)/;

  function phone(str) {
    if (!str) return '';
    const s = String(str);

    const intl = s.match(PHONE_INTL);
    if (intl) {
      const n = intl[0].replace(/\D/g, '').length;
      if (n >= 8 && n <= 15) return intl[0].replace(/\s+/g, ' ').trim();
    }

    const nat = s.match(PHONE_NAT);
    if (nat) {
      const n = nat[0].replace(/\D/g, '').length;
      if (n >= 8 && n <= 13) return nat[0].replace(/\s+/g, ' ').trim();
    }

    const grp = s.match(PHONE_GROUPS);
    if (grp) {
      const n = grp[0].replace(/\D/g, '').length;
      if (n >= 8 && n <= 13) return grp[0].replace(/\s+/g, ' ').trim();
    }

    return '';
  }

  function rating(str) {
    if (!str) return null;
    const m = String(str).replace(',', '.').match(/\d(?:\.\d)?/);
    return m ? parseFloat(m[0]) : null;
  }

  function reviews(str) {
    if (!str) return null;
    const digits = String(str).replace(/[^\d]/g, '');
    return digits ? parseInt(digits, 10) : null;
  }

  function latLng(url) {
    if (!url) return { lat: null, lng: null };
    let m = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
    m = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
    return { lat: null, lng: null };
  }

  function ids(url) {
    const out = { cid: '', placeId: '' };
    if (!url) return out;
    let m = url.match(/!1s(0x[0-9a-f]+:0x[0-9a-f]+)/i);
    if (m) out.cid = m[1];
    m = url.match(/!1s(ChI[\w-]+)/);
    if (m) out.placeId = m[1];
    m = url.match(/[?&]cid=(\d+)/);
    if (m) out.cid = out.cid || m[1];
    return out;
  }

  const HORARIO_RE =
    /(Aberto|Fechado|Fecha|Abre|Open|Closed|Closes|Opens|Temporariamente|Permanentemente)\b[\s\S]*$/i;

  function address(str) {
    let s = String(str || '')
      .replace(/[\uE000-\uF8FF\uFFF0-\uFFFF]/g, ' ')
      .replace(/^Endere[cç]o:\s*/i, '')
      .replace(/^Address:\s*/i, '')
      .replace(/^·\s*/, '')
      .replace(HORARIO_RE, '')
      .trim();

    const tel = s.match(PHONE_INTL) || s.match(PHONE_NAT) || s.match(PHONE_GROUPS);
    if (tel && s.endsWith(tel[0]) && s.length > tel[0].length + 3) {
      s = s.slice(0, s.length - tel[0].length);
    }

    return s.replace(/[\s·,\-+]+$/, '').trim();
  }

  function cityFromAddress(addr) {
    if (!addr) return '';
    const s = String(addr).trim();

    let m = s.match(/,\s*([^,]+?)\s*-\s*([A-Z]{2})\b/);
    if (m) return m[1].trim() + ' - ' + m[2];

    m = s.match(/,\s*([A-Za-z][A-Za-z .-]+),\s*([A-Z]{2})\b/);
    if (m) return m[1].trim() + ', ' + m[2];

    const parts = s.split(',').map(function (x) { return x.trim(); }).filter(Boolean);
    if (parts.length > 1) {
      var ultimo = parts[parts.length - 1]
        .replace(/^\d{4,5}[- ]?\d{0,3}\s*/, '')
        .replace(/\s+[A-Z]{1,2}\d[A-Z\d]?\s*\d?[A-Z]{0,2}$/, '')
        .replace(/\s+\d{4,}$/, '')
        .trim();
      if (ultimo && !/^\d+$/.test(ultimo)) return ultimo;
      return parts[parts.length - 2] || '';
    }
    return '';
  }

  function regionFromQuery(query) {
    if (!query) return '';
    const m = String(query).match(/\s(?:em|in|na|no|near|perto de)\s+(.+)$/i);
    return m ? m[1].trim() : '';
  }

  const HOST_GOOGLE =
    /(^|\.)(google\.[a-z.]+|googleusercontent\.com|gstatic\.com|ggpht\.com|googleapis\.com|googleadservices\.com|goo\.gl|g\.co|withgoogle\.com|schema\.org)$/i;

  const SITE_PERMITIDO = /^(sites\.google\.com|[\w-]+\.(business\.site|negocio\.site))$/i;

  function website(href) {
    if (!href) return '';
    let url = String(href).trim();
    if (!url || url.startsWith('#') || /^(javascript|mailto|tel):/i.test(url)) return '';

    if (/[/.]url\?|^\/url\?/.test(url)) {
      const m = url.match(/[?&](?:q|url|continue)=([^&]+)/);
      if (m) {
        try { url = decodeURIComponent(m[1]); } catch (_) { url = m[1]; }
      }
    }

    if (!/^https?:\/\//i.test(url)) {
      if (url.startsWith('/')) return '';
      url = 'https://' + url;
    }

    try {
      const u = new URL(url);
      const h = u.hostname.toLowerCase();

      if (SITE_PERMITIDO.test(h)) return u.href;

      if (HOST_GOOGLE.test(h)) return '';
      if (u.pathname.includes('/maps/')) return '';

      return u.href;
    } catch (_) {
      return '';
    }
  }

  function isExternal(href) {
    return !!website(href);
  }

  GMX.Parse = {
    phone, rating, reviews, latLng, ids, address,
    cityFromAddress, regionFromQuery, website, isExternal,
    PHONE_INTL, PHONE_NAT, PHONE_GROUPS, HORARIO_RE
  };
})(typeof globalThis !== 'undefined' ? globalThis : self);
