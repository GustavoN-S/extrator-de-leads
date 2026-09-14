/* Feito por GustavoN-S (https://github.com/GustavoN-S) */

(function (root) {
  'use strict';
  const GMX = (root.GMX = root.GMX || {});
  const K = GMX.KEYS;

  function get(key, fallback) {
    return chrome.storage.local.get(key).then((r) =>
      r[key] === undefined ? fallback : r[key]
    );
  }
  function set(key, value) {
    return chrome.storage.local.set({ [key]: value });
  }

  function norm(s) {
    return String(s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '');
  }

  function dedupeKey(lead) {
    if (lead.cid) return 'cid:' + lead.cid;
    if (lead.placeId) return 'pid:' + lead.placeId;
    const geo =
      lead.lat && lead.lng
        ? ':' + Number(lead.lat).toFixed(4) + ',' + Number(lead.lng).toFixed(4)
        : '';
    return 'nm:' + norm(lead.name) + geo + ':' + norm(lead.address).slice(0, 40);
  }

  async function getLeads() {
    return get(K.LEADS, []);
  }

  async function setLeads(list) {
    return set(K.LEADS, list);
  }

  async function upsertLeads(incoming) {
    const list = await getLeads();
    const index = new Map();
    list.forEach((l, i) => index.set(l._key || dedupeKey(l), i));

    let added = 0;
    let updated = 0;

    for (const raw of incoming) {
      const lead = Object.assign({}, raw);
      lead._key = dedupeKey(lead);
      const at = index.get(lead._key);

      if (at === undefined) {
        list.push(lead);
        index.set(lead._key, list.length - 1);
        added++;
      } else {
        const merged = mergeLead(list[at], lead);
        list[at] = merged;
        updated++;
      }
    }

    await setLeads(list);
    return { added, updated, total: list.length };
  }

  function mergeLead(oldLead, newLead) {
    const out = Object.assign({}, oldLead);
    for (const [k, v] of Object.entries(newLead)) {
      const empty =
        out[k] === undefined || out[k] === null || out[k] === '' ;
      if (empty && v !== undefined && v !== null && v !== '') out[k] = v;
    }
    if (GMX.Scoring) GMX.Scoring.scoreLead(out);
    return out;
  }

  async function clearLeads() {
    await setLeads([]);
    return { total: 0 };
  }

  async function removeLeads(keys) {
    const drop = new Set(keys);
    const list = (await getLeads()).filter((l) => !drop.has(l._key));
    await setLeads(list);
    return { total: list.length };
  }

  async function getSettings() {
    const s = await get(K.SETTINGS, {});
    return Object.assign({}, GMX.DEFAULT_SETTINGS, s);
  }
  async function saveSettings(patch) {
    const s = await getSettings();
    const next = Object.assign(s, patch || {});
    await set(K.SETTINGS, next);
    return next;
  }

  async function getJob() {
    return get(K.JOB, null);
  }
  async function setJob(job) {
    return set(K.JOB, job);
  }

  async function pushLog(line) {
    const log = await get(K.LOG, []);
    log.push({ t: Date.now(), line: String(line) });
    while (log.length > 200) log.shift();
    await set(K.LOG, log);
    return log;
  }
  async function getLog() {
    return get(K.LOG, []);
  }
  async function clearLog() {
    return set(K.LOG, []);
  }

  GMX.Store = {
    dedupeKey,
    getLeads,
    setLeads,
    upsertLeads,
    clearLeads,
    removeLeads,
    getSettings,
    saveSettings,
    getJob,
    setJob,
    pushLog,
    getLog,
    clearLog
  };
})(typeof globalThis !== 'undefined' ? globalThis : self);
