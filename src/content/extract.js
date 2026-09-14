/* Feito por GustavoN-S (https://github.com/GustavoN-S) */

(function (root) {
  'use strict';
  const GMX = (root.GMX = root.GMX || {});
  const { q, qa, SEL } = GMX;
  const { text, attr } = GMX.DOM;
  const P = GMX.Parse;

  function cardOf(anchor) {
    for (const sel of SEL.cardRoot) {
      const el = anchor.closest(sel);
      if (el) return el;
    }
    let el = anchor.parentElement;
    for (let i = 0; i < 3 && el; i++) {
      if (el.querySelector('a[href]:not([href*="/maps/place/"])')) return el;
      el = el.parentElement;
    }
    return anchor.parentElement || anchor;
  }

  function findPhone(scope) {
    if (!scope) return '';

    const tel = scope.querySelector('a[href^="tel:"]');
    if (tel) {
      const raw = decodeURIComponent((tel.getAttribute('href') || '').slice(4));
      if (raw) return raw.trim();
    }

    const direct = P.phone(text(q(SEL.cardPhone, scope)));
    if (direct) return direct;

    const nodes = scope.querySelectorAll('span, div, button');
    for (const n of nodes) {
      if (n.children.length > 2) continue;
      const t = text(n);
      if (!t || t.length > 48) continue;
      const m = P.phone(t);
      if (m) return m;
    }
    return '';
  }

  function findWebsite(scope) {
    if (!scope) return '';

    const wsEl = q(SEL.cardWebsite, scope);
    if (wsEl) {
      const url = P.website(wsEl.getAttribute('href'));
      if (url) return url;
    }

    const links = scope.querySelectorAll('a[href]');
    for (const a of links) {
      const href = a.getAttribute('href') || '';
      if (href.includes('/maps/place/')) continue;
      const url = P.website(href);
      if (url) return url;
    }
    return '';
  }

  function readWebsiteFromCard(card) {
    const url = findWebsite(card);
    return { url: url, checked: !!url };
  }

  function fromCard(anchor, query) {
    const card = cardOf(anchor);
    const href = anchor.href || '';

    const name =
      text(q(SEL.cardName, card)) ||
      attr(anchor, 'aria-label') ||
      '';
    if (!name) return null;

    const rows = qa(SEL.cardInfoRows, card).map(text).filter(Boolean);
    const infoLine = rows.find((r) => r.includes('·')) || rows[0] || '';
    const pieces = infoLine.split('·').map((s) => s.trim()).filter(Boolean);

    const ws = readWebsiteFromCard(card);
    const phone = findPhone(card);

    const geo = P.latLng(href);
    const idz = P.ids(href);
    const address = P.address(pieces.length > 1 ? pieces[1] : '');

    const lead = {
      name,
      category: pieces[0] || '',
      address,
      city: P.cityFromAddress(address) || P.regionFromQuery(query),
      phone,
      phoneE164: GMX.Phone ? GMX.Phone.toE164(phone, '') : '',
      website: ws.url,
      websiteChecked: ws.checked,
      rating: P.rating(text(q(SEL.cardRating, card))),
      reviews: P.reviews(text(q(SEL.cardReviews, card))),
      hours: rows.find((r) => /aberto|fechado|open|closed|24 horas/i.test(r)) || '',
      claimed: undefined,
      lat: geo.lat,
      lng: geo.lng,
      cid: idz.cid,
      placeId: idz.placeId,
      placeUrl: href,
      query: query || '',
      source: 'lista',
      capturedAt: Date.now()
    };

    if (GMX.NetIndex) GMX.NetIndex.enrich(lead);

    return GMX.Scoring.scoreLead(lead);
  }

  function fromDetail(query) {
    const pane = q(SEL.detailPane);
    if (!pane) return null;

    const name = text(q(SEL.detailName, pane));
    if (!name) return null;

    const wsEl = q(SEL.detailWebsite, pane);
    let website = wsEl ? P.website(wsEl.getAttribute('href')) : '';
    if (!website) website = findWebsite(pane);

    const phoneBtn = q(SEL.detailPhoneBtn, pane);
    let phone = '';
    if (phoneBtn) {
      const id = attr(phoneBtn, 'data-item-id');
      const m = id.match(/tel:(.+)$/);
      phone = m ? decodeURIComponent(m[1]) : P.phone(attr(phoneBtn, 'aria-label'));
    }
    if (!phone) phone = findPhone(pane);

    const addrBtn = q(SEL.detailAddressBtn, pane);
    const address = P.address(attr(addrBtn, 'aria-label') || text(addrBtn));

    const hoursEl = q(SEL.detailHours, pane);
    const hours = attr(hoursEl, 'aria-label') || text(hoursEl);

    const claimEl = q(SEL.detailClaim, pane);
    const claimed = claimEl ? false : true;

    const geo = P.latLng(location.href);
    const idz = P.ids(location.href);

    const lead = {
      name,
      category: text(q(SEL.detailCategory, pane)),
      address,
      city: P.cityFromAddress(address) || P.regionFromQuery(query),
      phone,
      phoneE164: GMX.Phone ? GMX.Phone.toE164(phone, '') : '',
      website,
      websiteChecked: true,
      rating: P.rating(text(q(SEL.detailRating, pane))),
      reviews: P.reviews(
        attr(q(SEL.detailReviews, pane), 'aria-label') ||
        text(q(SEL.detailReviews, pane))
      ),
      hours,
      claimed,
      plusCode: text(q(SEL.detailPlusCode, pane)),
      lat: geo.lat,
      lng: geo.lng,
      cid: idz.cid,
      placeId: idz.placeId,
      placeUrl: location.href,
      query: query || '',
      source: 'ficha',
      capturedAt: Date.now()
    };

    if (GMX.NetIndex) GMX.NetIndex.enrich(lead);

    return GMX.Scoring.scoreLead(lead);
  }

  function isSinglePlacePage() {
    return /\/maps\/place\//.test(location.pathname) && !q(SEL.feed);
  }

  GMX.Extract = {
    fromCard, fromDetail, cardOf, isSinglePlacePage,
    findPhone, findWebsite, readWebsiteFromCard
  };
})(typeof globalThis !== 'undefined' ? globalThis : self);
