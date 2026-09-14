/* Feito por GustavoN-S (https://github.com/GustavoN-S) */

(function (root) {
  'use strict';
  const GMX = (root.GMX = root.GMX || {});

  function hostOf(url) {
    if (!url) return '';
    try {
      return new URL(url.startsWith('http') ? url : 'https://' + url)
        .hostname.replace(/^www\./, '')
        .toLowerCase();
    } catch (_) {
      return '';
    }
  }

  function isSocialOnly(url) {
    const host = hostOf(url);
    if (!host) return false;
    return GMX.SOCIAL_HOSTS.some((s) => host === s || host.endsWith('.' + s));
  }

  function scoreLead(lead, weights) {
    const W = Object.assign({}, GMX.WEIGHTS, weights || {});
    const reasons = [];
    let score = 0;

    const social = isSocialOnly(lead.website);
    const realSite = !!lead.website && !social;

    lead.socialOnly = social;
    lead.hasWebsite = realSite;

    if (!lead.website) {
      score += W.noWebsite;
      reasons.push('Sem site');
    } else if (social) {
      score += W.socialOnly;
      reasons.push('So rede social');
    } else {
      score += W.hasWebsitePenalty;
      reasons.push('Ja tem site');
    }

    if (lead.phone) {
      score += W.hasPhone;
      reasons.push('Telefone disponivel');
    }

    if (lead.claimed === false) {
      score += W.notClaimed;
      reasons.push('Perfil nao reivindicado');
    }

    const reviews = Number(lead.reviews) || 0;
    if (reviews > 0 && reviews < 30) {
      score += W.fewReviews;
      reasons.push('Poucas avaliacoes');
    }

    const rating = Number(lead.rating) || 0;
    if (rating >= 4.0) {
      score += W.goodRating;
      reasons.push('Boa reputacao');
    }

    score = Math.max(0, Math.min(100, Math.round(score)));
    lead.score = score;
    lead.reasons = reasons;

    if (score >= GMX.TIERS.QUENTE.min) lead.priority = GMX.TIERS.QUENTE.id;
    else if (score >= GMX.TIERS.MORNO.min) lead.priority = GMX.TIERS.MORNO.id;
    else lead.priority = GMX.TIERS.FRIO.id;

    return lead;
  }

  function compareLeads(a, b) {
    if (!!a.hasWebsite !== !!b.hasWebsite) return a.hasWebsite ? 1 : -1;
    if (b.score !== a.score) return (b.score || 0) - (a.score || 0);
    if (!!a.phone !== !!b.phone) return a.phone ? -1 : 1;
    return String(a.name || '').localeCompare(String(b.name || ''), 'pt-BR');
  }

  function sortLeads(list) {
    return list.slice().sort(compareLeads);
  }

  GMX.Scoring = { scoreLead, sortLeads, compareLeads, isSocialOnly, hostOf };
})(typeof globalThis !== 'undefined' ? globalThis : self);
