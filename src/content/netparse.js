/* Feito por GustavoN-S (https://github.com/GustavoN-S) */

(function (root) {
  'use strict';
  const GMX = (root.GMX = root.GMX || {});

  const byCid = new Map();
  const byName = new Map();
  const stats = {
    responses: 0,
    places: 0,
    phones: 0,
    sites: 0,
    siteIndexOk: 0,
    siteIndexBad: 0
  };

  const CID_RE = /^0x[0-9a-f]+:0x[0-9a-f]+$/i;
  const URL_RE = /^https?:\/\//i;

  function lerTelefone(s) {
    return GMX.Parse ? GMX.Parse.phone(s) : '';
  }

  function norm(s) {
    return String(s || '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '');
  }

  function isPlaceBlob(a) {
    return (
      Array.isArray(a) &&
      a.length > 12 &&
      typeof a[11] === 'string' &&
      a[11].length > 1 &&
      (Array.isArray(a[178]) || Array.isArray(a[7]) ||
       typeof a[18] === 'string' || Array.isArray(a[4]))
    );
  }

  function strings(node, out, depth) {
    if (!node || depth > 6 || out.length > 300) return out;
    if (typeof node === 'string') { out.push(node); return out; }
    if (Array.isArray(node)) for (const c of node) strings(c, out, depth + 1);
    return out;
  }

  function firstPhone(list) {
    for (const s of list) {
      if (typeof s !== 'string' || !s.trim().startsWith('+')) continue;
      const m = lerTelefone(s);
      if (m) return m;
    }
    for (const s of list) {
      if (typeof s !== 'string' || s.length > 40) continue;
      const m = lerTelefone(s);
      if (m) return m;
    }
    return '';
  }

  function siteFromIndex(a) {
    if (!Array.isArray(a[7])) return '';
    for (const s of strings(a[7], [], 0)) {
      if (typeof s !== 'string' || !URL_RE.test(s)) continue;
      const limpo = GMX.Parse ? GMX.Parse.website(s) : s;
      if (limpo) return limpo;
    }
    return '';
  }

  function readBlob(a, siteIndexOk) {
    const name = a[11];
    if (!name) return false;

    const site = siteFromIndex(a);
    let phone = firstPhone(strings(a[178], [], 0));
    let cid = typeof a[10] === 'string' && CID_RE.test(a[10]) ? a[10] : '';
    const address = typeof a[18] === 'string' ? a[18] : '';

    if (!phone || !cid) {
      const todas = strings(a, [], 0);
      if (!cid) cid = todas.find((s) => CID_RE.test(s)) || '';
      if (!phone) phone = firstPhone(todas);
    }

    if (!phone && !site && !siteIndexOk) return false;

    const rec = {
      name: name,
      phone: phone,
      site: site,
      address: address,
      cid: cid,
      siteKnown: !!site || siteIndexOk
    };

    if (cid) byCid.set(cid, merge(byCid.get(cid), rec));
    const nk = norm(name);
    if (nk) byName.set(nk, merge(byName.get(nk), rec));

    stats.places++;
    if (phone) stats.phones++;
    if (site) stats.sites++;
    return true;
  }

  function merge(anterior, novo) {
    if (!anterior) return novo;
    return {
      name: anterior.name || novo.name,
      phone: anterior.phone || novo.phone,
      site: anterior.site || novo.site,
      address: anterior.address || novo.address,
      cid: anterior.cid || novo.cid,
      siteKnown: anterior.siteKnown || novo.siteKnown
    };
  }

  function strip(text) {
    return String(text).replace(/^\)\]\}'[\s\S]{0,4}?\n/, '').trim();
  }

  function harvest(text) {
    let data;
    try {
      data = JSON.parse(strip(text));
    } catch (_) {
      return 0;
    }

    const blocos = [];
    const visitados = new Set();

    (function walk(node, depth) {
      if (depth > 24) return;

      if (typeof node === 'string') {
        if (node.length > 200 && (node.startsWith(")]}'") || node.startsWith('[['))) {
          try { walk(JSON.parse(strip(node)), depth + 1); } catch (_) {}
        }
        return;
      }
      if (!Array.isArray(node) || visitados.has(node)) return;
      visitados.add(node);

      if (isPlaceBlob(node)) blocos.push(node);
      for (const c of node) walk(c, depth + 1);
    })(data, 0);

    const comSite = blocos.filter((b) => siteFromIndex(b)).length;
    const siteIndexOk = comSite > 0;

    if (blocos.length) {
      if (siteIndexOk) stats.siteIndexOk++;
      else stats.siteIndexBad++;
    }

    let achados = 0;
    for (const b of blocos) if (readBlob(b, siteIndexOk)) achados++;

    stats.responses++;
    return achados;
  }

  const processadas = new Set();

  window.addEventListener('message', (ev) => {
    if (ev.source !== window) return;
    const d = ev.data;
    if (!d || d.__gmx !== 'GMX_NET' || !d.body) return;

    const sig = d.body.length + '|' + d.body.slice(0, 80);
    if (processadas.has(sig)) return;
    processadas.add(sig);

    setTimeout(() => {
      try { harvest(d.body); } catch (_) {}
    }, 0);
  });

  try { window.postMessage({ __gmx: 'GMX_READY' }, location.origin); } catch (_) {}

  function find(lead) {
    if (!lead) return null;
    if (lead.cid && byCid.has(lead.cid)) return byCid.get(lead.cid);
    const nk = norm(lead.name);
    if (nk && byName.has(nk)) return byName.get(nk);
    return null;
  }

  function enrich(lead) {
    const rec = find(lead);
    if (!rec) return lead;

    let usou = false;
    if (!lead.phone && rec.phone) { lead.phone = rec.phone; usou = true; }
    if (!lead.website && rec.site) { lead.website = rec.site; usou = true; }
    if (!lead.address && rec.address) { lead.address = rec.address; usou = true; }

    if (rec.siteKnown && !lead.websiteChecked) {
      lead.websiteChecked = true;
      usou = true;
    }

    if (lead.phone && !lead.phoneE164 && GMX.Phone) {
      lead.phoneE164 = GMX.Phone.toE164(lead.phone, GMX.Phone.guess(lead, ''));
    }

    if (usou) {
      lead.source = (lead.source || '') + '+rede';
      if (GMX.Scoring) GMX.Scoring.scoreLead(lead);
    }
    return lead;
  }

  GMX.NetIndex = {
    harvest: harvest, find: find, enrich: enrich, stats: stats,
    byCid: byCid, byName: byName, size: function () { return byCid.size; }
  };
})(typeof globalThis !== 'undefined' ? globalThis : self);
