/* Feito por GustavoN-S (https://github.com/GustavoN-S) */

(function (root) {
  'use strict';
  const GMX = (root.GMX = root.GMX || {});

  GMX.SEL = {
    feed: [
      'div[role="feed"]',
      'div[aria-label^="Resultados"]',
      'div[aria-label^="Results"]'
    ],
    cardLink: [
      'a.hfpxzc',
      'a[href*="/maps/place/"]'
    ],
    cardRoot: ['div.Nv2PK', 'div.THOPZb', 'div.bfdHYd'],
    endOfList: ['span.HlvSq', 'div.PbZDve p', 'p.fontBodyMedium > span > span'],

    cardName: ['div.qBF1Pd', 'div.fontHeadlineSmall'],
    cardRating: ['span.MW4etd'],
    cardReviews: ['span.UY7F9'],
    cardInfoRows: ['div.W4Efsd'],
    cardPhone: ['span.UsdlK', 'span.UsdlK.fontBodyMedium'],
    cardWebsite: [
      'a[data-value="Website"]',
      'a[data-value="Site"]',
      'a[aria-label^="Visitar o site"]',
      'a[aria-label^="Visit"]',
      'a.lcr4fd',
      'div.Rwjeuc a[href]'
    ],

    detailPane: [
      'div[role="main"][aria-label]',
      'div.m6QErb[role="main"]'
    ],
    detailName: ['h1.DUwDvf', 'h1.fontHeadlineLarge', 'div[role="main"] h1'],
    detailCategory: ['button.DkEaL', 'button[jsaction*="category"]'],
    detailWebsite: [
      'a[data-item-id="authority"]',
      'a[data-tooltip="Abrir site"]',
      'a[data-tooltip="Open website"]'
    ],
    detailPhoneBtn: [
      'button[data-item-id^="phone:tel:"]',
      'button[data-tooltip="Copiar numero de telefone"]',
      'button[data-tooltip="Copy phone number"]'
    ],
    detailAddressBtn: [
      'button[data-item-id="address"]',
      'button[data-tooltip="Copiar endereco"]',
      'button[data-tooltip="Copy address"]'
    ],
    detailPlusCode: ['button[data-item-id="oloc"]'],
    detailRating: [
      'div.F7nice span[aria-hidden="true"]',
      'div.fontDisplayLarge'
    ],
    detailReviews: [
      'div.F7nice span[aria-label*="avalia"]',
      'div.F7nice span[aria-label*="review"]',
      'button[jsaction*="reviewChart"] span'
    ],
    detailHours: [
      'div.t39EBf[aria-label]',
      'div[jsaction*="openhours"][aria-label]'
    ],
    detailClaim: [
      'a[href*="business.google.com"]',
      'button[aria-label*="Reivindicar"]',
      'button[aria-label*="Claim"]'
    ],
    backButton: [
      'button[aria-label="Voltar"]',
      'button[jsaction*="omnibox.close"]',
      'button.hYBOP'
    ],

    endTexts: [
      'chegou ao fim da lista',
      'reached the end of the list',
      'final da lista',
      'llegaste al final'
    ]
  };

  GMX.q = function (list, ctx) {
    const scope = ctx || document;
    for (const sel of [].concat(list)) {
      try {
        const el = scope.querySelector(sel);
        if (el) return el;
      } catch (_) {  }
    }
    return null;
  };

  GMX.qa = function (list, ctx) {
    const scope = ctx || document;
    for (const sel of [].concat(list)) {
      try {
        const els = scope.querySelectorAll(sel);
        if (els.length) return Array.from(els);
      } catch (_) {  }
    }
    return [];
  };
})(typeof globalThis !== 'undefined' ? globalThis : self);
