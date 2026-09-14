/* Feito por GustavoN-S (https://github.com/GustavoN-S) */

'use strict';

const $ = (id) => document.getElementById(id);
const MSG = GMX.MSG;

const ui = {
  terms: $('terms'),
  region: $('region'),
  preview: $('preview'),
  maxPerQuery: $('maxPerQuery'),
  minRating: $('minRating'),
  scrollDelay: $('scrollDelay'),
  defaultCountry: $('defaultCountry'),
  deepMode: $('deepMode'),
  fillContacts: $('fillContacts'),
  skipWithWebsite: $('skipWithWebsite'),
  autoOpenDashboard: $('autoOpenDashboard'),
  btnStart: $('btnStart'),
  btnHere: $('btnHere'),
  btnStop: $('btnStop'),
  btnDash: $('btnDash'),
  btnOpts: $('btnOpts'),
  opts: $('opts'),
  kTotal: $('kTotal'),
  kNoSite: $('kNoSite'),
  kPhone: $('kPhone'),
  state: $('state'),
  log: $('log'),
  btnCsv: $('btnCsv'),
  btnJson: $('btnJson'),
  btnClear: $('btnClear')
};

let pollTimer = null;

function send(type, extra) {
  return chrome.runtime.sendMessage(Object.assign({ type }, extra || {}));
}

function termsList() {
  return ui.terms.value
    .split(/[\n;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function renderPreview() {
  const terms = termsList();
  const region = ui.region.value.trim();

  if (!terms.length) {
    ui.preview.hidden = true;
    return;
  }

  const queries = terms.map((t) =>
    region && !/\b(em|in|near|perto de)\b/i.test(t) ? t + ' em ' + region : t
  );

  const shown = queries.slice(0, 3).map((q) => '<b>' + esc(q) + '</b>').join(' · ');
  const rest = queries.length > 3 ? ' e mais ' + (queries.length - 3) : '';
  ui.preview.innerHTML =
    queries.length + ' busca(s): ' + shown + rest;
  ui.preview.hidden = false;
}

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])
  );
}

function readSettings() {
  return {
    maxPerQuery: Math.max(5, parseInt(ui.maxPerQuery.value, 10) || 120),
    minRating: parseFloat(ui.minRating.value) || 0,
    scrollDelay: parseInt(ui.scrollDelay.value, 10) || 900,
    defaultCountry: ui.defaultCountry.value,
    deepMode: ui.deepMode.checked,
    fillContacts: ui.fillContacts.checked,
    skipWithWebsite: ui.skipWithWebsite.checked,
    autoOpenDashboard: ui.autoOpenDashboard.checked
  };
}

function applySettings(s) {
  ui.maxPerQuery.value = s.maxPerQuery;
  ui.minRating.value = String(s.minRating);
  ui.scrollDelay.value = String(s.scrollDelay);
  ui.defaultCountry.value = s.defaultCountry || 'AUTO';
  ui.deepMode.checked = !!s.deepMode;
  ui.fillContacts.checked = s.fillContacts !== false;
  ui.skipWithWebsite.checked = !!s.skipWithWebsite;
  ui.autoOpenDashboard.checked = !!s.autoOpenDashboard;
  if (s.lastTerms && !ui.terms.value) ui.terms.value = s.lastTerms;
  if (s.lastRegion && !ui.region.value) ui.region.value = s.lastRegion;
}

async function refresh() {
  const res = await send(MSG.JOB_STATE);
  if (!res || !res.ok) return;

  const { job, counts, log } = res;

  ui.kTotal.textContent = counts.total;
  ui.kNoSite.textContent = counts.noSite;
  ui.kPhone.textContent = counts.withPhone;

  const running = job && job.status === GMX.JOB_STATUS.RUNNING;
  ui.btnStop.hidden = !running;
  ui.btnStart.hidden = running;
  ui.btnHere.hidden = running;
  ui.state.className = 'state' + (running ? ' run' : '');

  if (running) {
    const q = job.queries.length
      ? ' (' + (job.index + 1) + '/' + job.queries.length + ') ' + job.queries[job.index]
      : ' na aba atual';
    ui.state.textContent = 'Extraindo' + q;
  } else if (job && job.finishedAt) {
    ui.state.textContent = job.stopReason || 'Concluido.';
  } else {
    ui.state.textContent = counts.total
      ? counts.total + ' leads salvos. Pronto para uma nova busca.'
      : 'Pronto.';
  }

  ui.log.innerHTML = (log || [])
    .slice()
    .reverse()
    .map((e) => '<div>' + esc(e.line) + '</div>')
    .join('');

  clearTimeout(pollTimer);
  pollTimer = setTimeout(refresh, running ? 1200 : 4000);
}

ui.btnStart.addEventListener('click', async () => {
  const terms = termsList();
  if (!terms.length) {
    ui.terms.focus();
    ui.state.className = 'state err';
    ui.state.textContent = 'Digite pelo menos um termo de busca.';
    return;
  }

  const settings = readSettings();
  await GMX.Store.saveSettings(
    Object.assign(settings, {
      lastTerms: ui.terms.value,
      lastRegion: ui.region.value
    })
  );

  ui.btnStart.disabled = true;
  const res = await send(MSG.START, {
    payload: { terms, region: ui.region.value.trim(), settings }
  });
  ui.btnStart.disabled = false;

  if (!res || !res.ok) {
    ui.state.className = 'state err';
    ui.state.textContent = (res && res.error) || 'Falha ao iniciar.';
    return;
  }
  refresh();
});

ui.btnHere.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !/google\.[a-z.]+\/maps/.test(tab.url || '')) {
    ui.state.className = 'state err';
    ui.state.textContent = 'Abra uma busca no Google Maps nesta aba primeiro.';
    return;
  }
  const res = await send(MSG.START_HERE, {
    tabId: tab.id,
    payload: { settings: readSettings() }
  });
  if (!res || !res.ok) {
    ui.state.className = 'state err';
    ui.state.textContent =
      (res && res.error) || 'Recarregue a pagina do Maps (F5) e tente de novo.';
    return;
  }
  refresh();
});

ui.btnStop.addEventListener('click', async () => {
  await send(MSG.STOP, { reason: 'Parado pelo usuario' });
  refresh();
});

ui.btnDash.addEventListener('click', () => send(MSG.OPEN_DASHBOARD));

ui.btnOpts.addEventListener('click', () => {
  const open = ui.btnOpts.getAttribute('aria-expanded') === 'true';
  ui.btnOpts.setAttribute('aria-expanded', String(!open));
  ui.opts.hidden = open;
});

ui.btnCsv.addEventListener('click', async () => {
  const leads = GMX.Scoring.sortLeads(await GMX.Store.getLeads());
  if (!leads.length) return;
  const s = await GMX.Store.getSettings();
  await GMX.Export.download(
    GMX.Export.toCSV(leads, s.csvDelimiter),
    'leads-maps-' + GMX.Export.stamp() + '.csv',
    'text/csv'
  );
});

ui.btnJson.addEventListener('click', async () => {
  const leads = GMX.Scoring.sortLeads(await GMX.Store.getLeads());
  if (!leads.length) return;
  await GMX.Export.download(
    GMX.Export.toJSON(leads),
    'leads-maps-' + GMX.Export.stamp() + '.json',
    'application/json'
  );
});

ui.btnClear.addEventListener('click', async () => {
  if (!confirm('Apagar todos os leads salvos? Essa acao nao tem volta.')) return;
  await send(MSG.CLEAR);
  refresh();
});

ui.terms.addEventListener('input', renderPreview);
ui.region.addEventListener('input', renderPreview);

ui.region.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') ui.btnStart.click();
});

function fillCountries() {
  const opts = GMX.Phone.list()
    .map((c) => '<option value="' + c.iso + '">' + c.name + ' (+' + c.dial + ')</option>')
    .join('');
  ui.defaultCountry.insertAdjacentHTML('beforeend', opts);
}

(async function init() {
  fillCountries();
  const s = await GMX.Store.getSettings();
  applySettings(s);
  renderPreview();
  refresh();
})();
