/* Feito por GustavoN-S (https://github.com/GustavoN-S) */

'use strict';

importScripts(
  '../shared/constants.js',
  '../shared/scoring.js',
  '../shared/phone.js',
  '../shared/store.js'
);

const { MSG, JOB_STATUS } = GMX;

function buildQueries(terms, region) {
  const clean = (terms || [])
    .map((t) => String(t).trim())
    .filter(Boolean);
  const loc = String(region || '').trim();
  if (!loc) return clean;
  return clean.map((t) =>
    /\b(em|in|near|perto de)\b/i.test(t) ? t : t + ' em ' + loc
  );
}

function mapsUrl(query, lang) {
  const hl = lang || 'pt-BR';
  return (
    'https://www.google.com/maps/search/' +
    encodeURIComponent(query) +
    '/?hl=' + encodeURIComponent(hl) +
    '&authuser=0'
  );
}

async function refreshBadge() {
  const job = await GMX.Store.getJob();
  const leads = await GMX.Store.getLeads();
  const n = leads.length;

  chrome.action.setBadgeBackgroundColor({
    color: job && job.status === JOB_STATUS.RUNNING ? '#30c48d' : '#5b7cfa'
  });
  chrome.action.setBadgeText({ text: n ? String(n > 9999 ? '9k+' : n) : '' });
}

async function startJob({ terms, region, settings, tabId }) {
  const cfg = Object.assign(await GMX.Store.getSettings(), settings || {});
  await GMX.Store.saveSettings(cfg);

  const queries = buildQueries(terms, region);
  if (!queries.length) throw new Error('Informe pelo menos um termo de busca.');

  const job = {
    id: 'job_' + Date.now(),
    queries,
    index: 0,
    status: JOB_STATUS.RUNNING,
    settings: cfg,
    tabId: tabId || null,
    startedAt: Date.now(),
    finishedAt: null,
    stats: { total: 0, noSite: 0, perQuery: [] }
  };

  await GMX.Store.setJob(job);
  await GMX.Store.clearLog();
  await GMX.Store.pushLog('Job iniciado com ' + queries.length + ' busca(s).');

  const tab = await openQuery(job, 0);
  job.tabId = tab.id;
  await GMX.Store.setJob(job);
  await refreshBadge();
  return job;
}

async function openQuery(job, i) {
  const url = mapsUrl(job.queries[i], job.settings.lang);

  if (job.tabId) {
    try {
      return await chrome.tabs.update(job.tabId, { url, active: true });
    } catch (_) {
    }
  }
  return chrome.tabs.create({ url, active: true });
}

async function stopJob(reason) {
  const job = await GMX.Store.getJob();
  if (!job) return null;

  job.status = JOB_STATUS.DONE;
  job.finishedAt = Date.now();
  job.stopReason = reason || 'Parado pelo usuario';
  await GMX.Store.setJob(job);
  await GMX.Store.pushLog('Job encerrado: ' + job.stopReason);

  if (job.tabId) {
    try {
      await chrome.tabs.sendMessage(job.tabId, { type: MSG.STOP });
    } catch (_) {  }
  }
  await refreshBadge();
  return job;
}

async function onQueryDone(info) {
  const job = await GMX.Store.getJob();
  if (!job || job.id !== info.jobId) return;

  job.stats.perQuery.push({
    query: info.query,
    total: info.total,
    noSite: info.noSite,
    reason: info.reason
  });
  await GMX.Store.pushLog(
    'Busca "' + info.query + '": ' + info.total + ' leads (' + info.noSite + ' sem site). ' +
    (info.reason || '')
  );

  if (job.status !== JOB_STATUS.RUNNING) {
    await GMX.Store.setJob(job);
    return;
  }

  const next = job.index + 1;
  if (next < job.queries.length) {
    job.index = next;
    await GMX.Store.setJob(job);
    await GMX.Store.pushLog('Proxima busca: ' + job.queries[next]);
    setTimeout(() => openQuery(job, next), 2500);
  } else {
    job.status = JOB_STATUS.DONE;
    job.finishedAt = Date.now();
    job.stopReason = 'Todas as buscas concluidas';
    await GMX.Store.setJob(job);
    await GMX.Store.pushLog('Job concluido.');
    if (job.settings.autoOpenDashboard) openDashboard();
    notifyDone(job);
  }
  await refreshBadge();
}

function notifyDone(job) {
  chrome.action.setTitle({
    title: 'Maps Lead Extractor — concluido (' + job.queries.length + ' buscas)'
  });
}

function openDashboard() {
  const url = chrome.runtime.getURL('src/dashboard/dashboard.html');
  chrome.tabs.query({ url }, (tabs) => {
    if (tabs && tabs.length) {
      chrome.tabs.update(tabs[0].id, { active: true });
      chrome.tabs.reload(tabs[0].id);
    } else {
      chrome.tabs.create({ url });
    }
  });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || !msg.type) return;

  (async () => {
    try {
      switch (msg.type) {
        case MSG.HELLO: {
          const job = await GMX.Store.getJob();
          const sameTab =
            job && sender.tab && (!job.tabId || job.tabId === sender.tab.id);
          sendResponse({ job: sameTab ? job : null });
          break;
        }

        case MSG.START: {
          const job = await startJob(msg.payload || {});
          sendResponse({ ok: true, job });
          break;
        }

        case MSG.START_HERE: {
          const cfg = Object.assign(
            await GMX.Store.getSettings(),
            (msg.payload && msg.payload.settings) || {}
          );
          await GMX.Store.saveSettings(cfg);

          const job = {
            id: 'job_' + Date.now(),
            queries: [],
            index: 0,
            status: JOB_STATUS.RUNNING,
            settings: cfg,
            tabId: msg.tabId,
            startedAt: Date.now(),
            stats: { total: 0, noSite: 0, perQuery: [] }
          };
          await GMX.Store.setJob(job);
          await chrome.tabs.sendMessage(msg.tabId, { type: MSG.START_HERE, job });
          await refreshBadge();
          sendResponse({ ok: true, job });
          break;
        }

        case MSG.STOP: {
          if (msg.fromContent) { sendResponse({ ok: true }); break; }
          const job = await stopJob(msg.reason);
          sendResponse({ ok: true, job });
          break;
        }

        case MSG.LEADS: {
          const batch = (msg.leads || []).map((l) => GMX.Scoring.scoreLead(l));
          const cfg = await GMX.Store.getSettings();

          let batchFinal = batch;
          if (cfg.skipWithWebsite) {
            const comSite = batch.filter((l) => l.hasWebsite);
            batchFinal = batch.filter((l) => !l.hasWebsite);
            if (comSite.length) {
              await GMX.Store.removeLeads(comSite.map(GMX.Store.dedupeKey));
            }
          }

          const res = await GMX.Store.upsertLeads(batchFinal);
          const job = await GMX.Store.getJob();
          if (job) {
            const all = await GMX.Store.getLeads();
            job.stats.total = all.length;
            job.stats.noSite = all.filter((l) => !l.hasWebsite).length;
            await GMX.Store.setJob(job);
          }
          await refreshBadge();
          sendResponse({ ok: true, ...res });
          break;
        }

        case MSG.PROGRESS: {
          sendResponse({ ok: true });
          break;
        }

        case MSG.QUERY_DONE: {
          await onQueryDone(msg);
          sendResponse({ ok: true });
          break;
        }

        case MSG.JOB_STATE: {
          const job = await GMX.Store.getJob();
          const leads = await GMX.Store.getLeads();
          const log = await GMX.Store.getLog();
          sendResponse({
            ok: true,
            job,
            log: log.slice(-12),
            settings: await GMX.Store.getSettings(),
            counts: {
              total: leads.length,
              noSite: leads.filter((l) => !l.hasWebsite).length,
              withPhone: leads.filter((l) => !!l.phone).length,
              hot: leads.filter((l) => l.priority === 'QUENTE').length
            }
          });
          break;
        }

        case MSG.OPEN_DASHBOARD: {
          openDashboard();
          sendResponse({ ok: true });
          break;
        }

        case MSG.CLEAR: {
          await GMX.Store.clearLeads();
          await GMX.Store.clearLog();
          await refreshBadge();
          sendResponse({ ok: true });
          break;
        }

        default:
          sendResponse({ ok: false, error: 'Mensagem desconhecida: ' + msg.type });
      }
    } catch (err) {
      await GMX.Store.pushLog('ERRO: ' + err.message);
      sendResponse({ ok: false, error: err.message });
    }
  })();

  return true;
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  const job = await GMX.Store.getJob();
  if (job && job.status === JOB_STATUS.RUNNING && job.tabId === tabId) {
    await stopJob('A aba do Google Maps foi fechada');
  }
});

chrome.runtime.onInstalled.addListener(async () => {
  await GMX.Store.saveSettings({});
  await refreshBadge();
});

chrome.runtime.onStartup.addListener(refreshBadge);
