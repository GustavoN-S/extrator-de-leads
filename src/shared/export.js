/* Feito por GustavoN-S (https://github.com/GustavoN-S) */

(function (root) {
  'use strict';
  const GMX = (root.GMX = root.GMX || {});

  function cell(value) {
    if (value === undefined || value === null) return '';
    if (typeof value === 'boolean') return value ? 'SIM' : 'NAO';
    return String(value);
  }

  function escapeCsv(value, delimiter) {
    const s = cell(value);
    const needsQuote =
      s.includes(delimiter) || s.includes('"') || s.includes('\n') || s.includes('\r');
    return needsQuote ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  function toCSV(leads, delimiter) {
    const d = delimiter || ';';
    const header = GMX.FIELDS.map((f) => escapeCsv(f.label, d)).join(d);
    const rows = leads.map((lead) =>
      GMX.FIELDS.map((f) => escapeCsv(project(lead, f.key), d)).join(d)
    );
    return '\uFEFF' + [header].concat(rows).join('\r\n');
  }

  function project(lead, key) {
    switch (key) {
      case 'priority':
        return (GMX.TIERS[lead.priority] || {}).label || lead.priority || '';
      case 'hasWebsite':
        return lead.hasWebsite ? 'SIM' : 'NAO';
      case 'claimed':
        return lead.claimed === undefined ? '' : lead.claimed ? 'SIM' : 'NAO';
      case 'whatsapp':
        return waLink(lead.phone, lead);
      case 'capturedAt':
        return lead.capturedAt
          ? new Date(lead.capturedAt).toLocaleString('pt-BR')
          : '';
      default:
        return lead[key];
    }
  }

  function waLink(phone, lead) {
    if (!phone) return '';
    if (lead && lead.phoneE164) return 'https://wa.me/' + lead.phoneE164;
    if (!GMX.Phone) return '';
    const iso = GMX.Phone.guess(lead || { phone: phone }, GMX.defaultCountry);
    return GMX.Phone.waLink(phone, iso);
  }

  function toJSON(leads) {
    return JSON.stringify(
      leads.map((l) => {
        const o = Object.assign({}, l);
        delete o._key;
        return o;
      }),
      null,
      2
    );
  }

  function toPhoneList(leads) {
    const seen = new Set();
    const out = [];
    for (const l of leads) {
      if (!l.phone) continue;
      const k = String(l.phone).replace(/\D/g, '');
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(l.phone + '\t' + (l.name || ''));
    }
    return out.join('\r\n');
  }

  function stamp() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return (
      d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' +
      p(d.getHours()) + p(d.getMinutes())
    );
  }

  function download(content, filename, mime) {
    const blob = new Blob([content], { type: (mime || 'text/plain') + ';charset=utf-8' });
    const url = URL.createObjectURL(blob);
    return new Promise((resolve) => {
      chrome.downloads.download({ url, filename, saveAs: true }, (id) => {
        setTimeout(() => URL.revokeObjectURL(url), 60000);
        resolve(id);
      });
    });
  }

  GMX.Export = { toCSV, toJSON, toPhoneList, download, stamp, waLink, project };
})(typeof globalThis !== 'undefined' ? globalThis : self);
