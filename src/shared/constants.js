/* Feito por GustavoN-S (https://github.com/GustavoN-S) */

(function (root) {
  'use strict';
  const GMX = (root.GMX = root.GMX || {});

  GMX.KEYS = {
    LEADS: 'gmx_leads',
    JOB: 'gmx_job',
    SETTINGS: 'gmx_settings',
    LOG: 'gmx_log'
  };

  GMX.FIELDS = [
    { key: 'priority',    label: 'Prioridade' },
    { key: 'score',       label: 'Score' },
    { key: 'name',        label: 'Empresa' },
    { key: 'hasWebsite',  label: 'Tem site' },
    { key: 'website',     label: 'Site' },
    { key: 'phone',       label: 'Telefone' },
    { key: 'whatsapp',    label: 'WhatsApp (link)' },
    { key: 'category',    label: 'Categoria' },
    { key: 'address',     label: 'Endereco' },
    { key: 'city',        label: 'Cidade/UF' },
    { key: 'rating',      label: 'Nota' },
    { key: 'reviews',     label: 'Avaliacoes' },
    { key: 'claimed',     label: 'Perfil reivindicado' },
    { key: 'hours',       label: 'Horario' },
    { key: 'lat',         label: 'Latitude' },
    { key: 'lng',         label: 'Longitude' },
    { key: 'placeUrl',    label: 'Link Google Maps' },
    { key: 'query',       label: 'Busca de origem' },
    { key: 'capturedAt',  label: 'Capturado em' }
  ];

  GMX.TIERS = {
    QUENTE: { id: 'QUENTE', label: 'Quente',  min: 70, color: '#e5484d' },
    MORNO:  { id: 'MORNO',  label: 'Morno',   min: 40, color: '#f5a524' },
    FRIO:   { id: 'FRIO',   label: 'Frio',    min: 0,  color: '#5b7cfa' }
  };

  GMX.WEIGHTS = {
    noWebsite: 55,
    hasPhone: 18,
    notClaimed: 12,
    fewReviews: 8,
    goodRating: 5,
    socialOnly: 10,
    hasWebsitePenalty: -25
  };

  GMX.DEFAULT_SETTINGS = {
    maxPerQuery: 120,
    deepMode: false,
    fillContacts: true,
    skipWithWebsite: true,
    minRating: 0,
    scrollDelay: 900,
    detailDelay: 1400,
    csvDelimiter: ';',
    defaultCountry: 'AUTO',
    lang: 'pt-BR',
    autoOpenDashboard: true
  };

  GMX.SOCIAL_HOSTS = [
    'instagram.com', 'facebook.com', 'fb.com', 'm.facebook.com',
    'linktr.ee', 'linktree.com', 'wa.me', 'api.whatsapp.com',
    'whatsapp.com', 'twitter.com', 'x.com', 'tiktok.com',
    'youtube.com', 'linkedin.com', 'ifood.com.br', 'goo.gl',
    'bit.ly', 'beacons.ai', 'bio.link', 'about.me',
    'negocio.site', 'business.site', 'sites.google.com'
  ];

  GMX.JOB_STATUS = {
    IDLE: 'idle',
    RUNNING: 'running',
    PAUSED: 'paused',
    DONE: 'done',
    ERROR: 'error'
  };

  GMX.MSG = {
    HELLO: 'HELLO',
    START: 'START',
    START_HERE: 'START_HERE',
    STOP: 'STOP',
    LEADS: 'LEADS',
    PROGRESS: 'PROGRESS',
    QUERY_DONE: 'QUERY_DONE',
    JOB_STATE: 'JOB_STATE',
    OPEN_DASHBOARD: 'OPEN_DASHBOARD',
    CLEAR: 'CLEAR'
  };
})(typeof globalThis !== 'undefined' ? globalThis : self);
