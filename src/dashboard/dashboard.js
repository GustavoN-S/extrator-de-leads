/* Feito por GustavoN-S (https://github.com/GustavoN-S) */

'use strict';

const $ = (id) => document.getElementById(id);

let ALL = [];
let VIEW = [];
const selected = new Set();

const filters = { text: '', tier: '', query: '', city: '' };
let cityCounts = [];
let sort = { key: null, dir: 'desc' };
let settings = {};

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

function toast(msg, erro) {
  const el = document.createElement('div');
  el.className = 'toast' + (erro ? ' err' : '');
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2800);
}

function telHref(phone) {
  return 'tel:' + String(phone).replace(/[^\d+]/g, '');
}

function semAcento(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function wa(lead) {
  if (lead.phoneE164) return 'https://wa.me/' + lead.phoneE164;
  return GMX.Export.waLink(lead.phone, lead);
}

async function load() {
  settings = await GMX.Store.getSettings();
  GMX.defaultCountry = settings.defaultCountry;

  ALL = await GMX.Store.getLeads();
  ALL.forEach((l) => {
    GMX.Scoring.scoreLead(l);
    if (!l.phoneE164 && l.phone && GMX.Phone) {
      l.phoneE164 = GMX.Phone.toE164(l.phone, GMX.Phone.guess(l, settings.defaultCountry));
    }
  });

  buildSelect('fQuery', 'query', 'Todas as buscas');
  buildSelect('fCity', 'city', 'Todas as cidades');
  buildDeleteCitySelect();
  renderKpis();
  apply();
}

function uniqueValues(field) {
  return Array.from(new Set(ALL.map((l) => l[field]).filter(Boolean)))
    .sort((a, b) => String(a).localeCompare(String(b), 'pt-BR'));
}

function buildSelect(id, field, labelTodos) {
  const sel = $(id);
  const atual = sel.value;
  const vals = uniqueValues(field);
  sel.innerHTML =
    '<option value="">' + labelTodos + '</option>' +
    vals.map((v) => '<option value="' + esc(v) + '">' + esc(v) + '</option>').join('');
  if (vals.includes(atual)) sel.value = atual;
}

function buildDeleteCitySelect() {
  const contagem = new Map();
  for (const l of ALL) {
    if (!l.city) continue;
    contagem.set(l.city, (contagem.get(l.city) || 0) + 1);
  }
  cityCounts = Array.from(contagem.entries()).sort((a, b) => b[1] - a[1]);
  renderDeleteCityOptions($('delCityFilter').value);
}

function renderDeleteCityOptions(termo) {
  const sel = $('delCity');
  const escolhida = sel.value;
  const t = semAcento(termo).trim();

  const lista = t
    ? cityCounts.filter(([c]) => semAcento(c).includes(t))
    : cityCounts;

  const total = lista.reduce((soma, [, n]) => soma + n, 0);
  const cabecalho = t
    ? (lista.length
        ? lista.length + ' cidade(s) · ' + total + ' leads'
        : 'Nenhuma cidade com "' + termo.trim() + '"')
    : 'Apagar leads da cidade...';

  sel.innerHTML =
    '<option value="">' + esc(cabecalho) + '</option>' +
    lista
      .map(([c, n]) => '<option value="' + esc(c) + '">' + esc(c) + ' (' + n + ')</option>')
      .join('');

  if (escolhida && lista.some(([c]) => c === escolhida)) sel.value = escolhida;
  else if (t && lista.length === 1) sel.value = lista[0][0];
  else sel.value = '';

  document.querySelector('.combo').classList.toggle('vazio', !!t && !lista.length);
  $('btnDelCity').disabled = !sel.value;
}

function renderKpis() {
  const total = ALL.length;
  const noSite = ALL.filter((l) => !l.hasWebsite).length;
  const phone = ALL.filter((l) => !!l.phone).length;
  const comWa = ALL.filter((l) => !!wa(l)).length;
  const hot = ALL.filter((l) => l.priority === 'QUENTE').length;
  const naoVerif = ALL.filter((l) => !l.website && !l.websiteChecked).length;
  const queries = new Set(ALL.map((l) => l.query).filter(Boolean));

  $('kTotal').textContent = total;
  $('kNoSite').textContent = noSite;
  $('kPhone').textContent = phone;
  $('kHot').textContent = hot;
  $('kUnchecked').textContent = naoVerif;
  $('kWa').textContent = comWa + ' com WhatsApp';
  $('kNoSitePct').textContent =
    total ? Math.round((noSite / total) * 100) + '% da base' : '0% da base';
  $('kQueries').textContent = queries.size ? queries.size + ' busca(s)' : '—';
}

function matches(lead) {
  if (filters.query && lead.query !== filters.query) return false;
  if (filters.city && lead.city !== filters.city) return false;

  switch (filters.tier) {
    case 'NOSITE':    if (lead.hasWebsite) return false; break;
    case 'SITE':      if (!lead.hasWebsite) return false; break;
    case 'UNCHECKED': if (lead.website || lead.websiteChecked) return false; break;
    case 'PHONE':     if (!lead.phone) return false; break;
    case 'WA':        if (!wa(lead)) return false; break;
    case '':          break;
    default:          if (lead.priority !== filters.tier) return false;
  }

  if (filters.text) {
    const hay = [
      lead.name, lead.category, lead.address, lead.city,
      lead.phone, lead.website, lead.query
    ].join(' ').toLowerCase();
    if (!hay.includes(filters.text)) return false;
  }
  return true;
}

function apply() {
  VIEW = ALL.filter(matches);

  if (!sort.key) {
    VIEW = GMX.Scoring.sortLeads(VIEW);
  } else {
    const k = sort.key;
    const mul = sort.dir === 'asc' ? 1 : -1;
    VIEW.sort((a, b) => {
      let x = a[k], y = b[k];
      if (k === 'hasWebsite') { x = x ? 1 : 0; y = y ? 1 : 0; }
      if (k === 'priority') { x = a.score || 0; y = b.score || 0; }
      if (typeof x === 'number' || typeof y === 'number') {
        return ((Number(x) || 0) - (Number(y) || 0)) * mul;
      }
      return String(x || '').localeCompare(String(y || ''), 'pt-BR') * mul;
    });
  }

  render();
}

function siteCell(lead) {
  if (lead.website) {
    if (lead.socialOnly) {
      return '<span class="pill social" title="' + esc(lead.website) + '">SO REDE SOCIAL</span>';
    }
    let host = lead.website;
    try { host = new URL(lead.website).hostname.replace(/^www\./, ''); } catch (_) {}
    return (
      '<span class="pill yes"><a href="' + esc(lead.website) +
      '" target="_blank" rel="noopener noreferrer">' + esc(host) + '</a></span>'
    );
  }
  if (lead.websiteChecked) return '<span class="pill no">SEM SITE</span>';
  return '<span class="pill unknown" title="Nao foi possivel confirmar. ' +
         'Rode de novo com a opcao Completar contatos ligada.">A VERIFICAR</span>';
}

function contactCell(lead) {
  if (!lead.phone) return '<span class="muted">—</span>';
  const link = wa(lead);
  return (
    '<div class="contact">' +
    '<a href="' + esc(telHref(lead.phone)) + '">' + esc(lead.phone) + '</a>' +
    (link ? '<a class="wa" href="' + esc(link) +
            '" target="_blank" rel="noopener noreferrer">WhatsApp</a>' : '') +
    '</div>'
  );
}

function row(lead) {
  const tier = GMX.TIERS[lead.priority] || GMX.TIERS.FRIO;
  const isSel = selected.has(lead._key);
  const classes = [
    lead.hasWebsite ? '' : 'nosite',
    (!lead.website && !lead.websiteChecked) ? 'unchecked' : '',
    isSel ? 'sel' : ''
  ].filter(Boolean).join(' ');

  return (
    '<tr class="' + classes + '" data-key="' + esc(lead._key) + '">' +
      '<td><input type="checkbox" class="rowchk"' + (isSel ? ' checked' : '') + '></td>' +
      '<td><span class="tag ' + tier.id + '">' + tier.label + '</span>' +
          '<span class="score">' + (lead.score || 0) + '</span></td>' +
      '<td>' +
        '<div class="name"><a href="' + esc(lead.placeUrl || '#') +
          '" target="_blank" rel="noopener noreferrer">' + esc(lead.name) + '</a></div>' +
        (lead.address ? '<div class="addr">' + esc(lead.address) + '</div>' : '') +
      '</td>' +
      '<td>' + contactCell(lead) + '</td>' +
      '<td>' + siteCell(lead) + '</td>' +
      '<td>' + esc(lead.category || '—') + '</td>' +
      '<td>' + esc(lead.city || '—') + '</td>' +
      '<td class="col-num">' + (lead.rating != null ? String(lead.rating).replace('.', ',') : '—') + '</td>' +
      '<td class="col-num">' + (lead.reviews != null ? lead.reviews : '—') + '</td>' +
      '<td class="col-act">' +
        '<a class="icon-link" href="' + esc(lead.placeUrl || '#') +
        '" target="_blank" rel="noopener noreferrer" title="Abrir no Google Maps">↗</a>' +
      '</td>' +
    '</tr>'
  );
}

function render() {
  const vazio = VIEW.length === 0;
  $('empty').hidden = !vazio;
  $('tbl').style.display = vazio ? 'none' : '';
  $('tbody').innerHTML = VIEW.map(row).join('');

  $('shownCount').textContent =
    VIEW.length + (VIEW.length === 1 ? ' lead' : ' leads') +
    (VIEW.length !== ALL.length ? ' de ' + ALL.length : '');

  renderBulk();
}

function renderBulk() {
  const n = selected.size;
  const temSel = n > 0;

  $('selCount').hidden = !temSel;
  $('selCount').textContent = n + (n === 1 ? ' selecionado' : ' selecionados');
  $('btnCsvSel').disabled = !temSel;
  $('btnDelSel').disabled = !temSel;

  const todosMarcados = VIEW.length > 0 && VIEW.every((l) => selected.has(l._key));
  const algumMarcado = VIEW.some((l) => selected.has(l._key));
  $('chkAll').checked = todosMarcados;
  $('chkAll').indeterminate = algumMarcado && !todosMarcados;
  $('selAllLabel').textContent = todosMarcados
    ? 'Desmarcar todos'
    : 'Selecionar todos (' + VIEW.length + ')';

  $('btnDelFiltered').disabled = VIEW.length === 0;
}

$('fSearch').addEventListener('input', (e) => {
  filters.text = e.target.value.trim().toLowerCase();
  apply();
});

$('fQuery').addEventListener('change', (e) => { filters.query = e.target.value; apply(); });
$('fCity').addEventListener('change', (e) => { filters.city = e.target.value; apply(); });

$('fTier').addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  document.querySelectorAll('#fTier .chip').forEach((c) => c.classList.remove('active'));
  chip.classList.add('active');
  filters.tier = chip.dataset.tier;
  apply();
});

document.querySelector('thead').addEventListener('click', (e) => {
  const th = e.target.closest('th[data-sort]');
  if (!th) return;
  const key = th.dataset.sort;

  if (sort.key === key) {
    if (sort.dir === 'desc') sort.dir = 'asc';
    else sort = { key: null, dir: 'desc' };
  } else {
    sort = { key, dir: 'desc' };
  }

  document.querySelectorAll('th[data-sort]').forEach((h) => h.classList.remove('sorted', 'asc'));
  if (sort.key) {
    th.classList.add('sorted');
    if (sort.dir === 'asc') th.classList.add('asc');
  }
  apply();
});

$('tbody').addEventListener('change', (e) => {
  if (!e.target.classList.contains('rowchk')) return;
  const tr = e.target.closest('tr');
  const key = tr.dataset.key;
  if (e.target.checked) { selected.add(key); tr.classList.add('sel'); }
  else { selected.delete(key); tr.classList.remove('sel'); }
  renderBulk();
});

$('chkAll').addEventListener('change', (e) => {
  if (e.target.checked) VIEW.forEach((l) => selected.add(l._key));
  else VIEW.forEach((l) => selected.delete(l._key));
  render();
});

async function excluir(lista, descricao) {
  if (!lista.length) return;
  if (!confirm('Excluir ' + lista.length + ' lead(s) ' + descricao + '?\n\nEssa acao nao tem volta.')) return;
  await GMX.Store.removeLeads(lista.map((l) => l._key));
  lista.forEach((l) => selected.delete(l._key));
  await load();
  toast(lista.length + ' lead(s) excluido(s).');
}

$('btnDelSel').addEventListener('click', () =>
  excluir(ALL.filter((l) => selected.has(l._key)), 'selecionados')
);

$('btnDelFiltered').addEventListener('click', () =>
  excluir(VIEW.slice(), 'que estao filtrados na tela')
);

$('delCityFilter').addEventListener('input', (e) => {
  renderDeleteCityOptions(e.target.value);
});

$('delCityFilter').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && $('delCity').value) $('btnDelCity').click();
});

$('delCity').addEventListener('change', (e) => {
  $('btnDelCity').disabled = !e.target.value;
});

$('btnDelCity').addEventListener('click', () => {
  const cidade = $('delCity').value;
  if (!cidade) return;
  excluir(ALL.filter((l) => l.city === cidade), 'da cidade "' + cidade + '"');
});

$('btnClear').addEventListener('click', async () => {
  if (!ALL.length) return;
  if (!confirm('Apagar TODOS os ' + ALL.length + ' leads?\n\nEssa acao nao tem volta.')) return;
  await GMX.Store.clearLeads();
  selected.clear();
  await load();
  toast('Base limpa.');
});

async function exportCsv(list, prefix) {
  if (!list.length) return toast('Nada para exportar.', true);
  await GMX.Export.download(
    GMX.Export.toCSV(list, settings.csvDelimiter),
    (prefix || 'leads-maps-') + GMX.Export.stamp() + '.csv',
    'text/csv'
  );
}

$('btnCsv').addEventListener('click', () => exportCsv(VIEW));
$('btnCsvSel').addEventListener('click', () =>
  exportCsv(ALL.filter((l) => selected.has(l._key)), 'leads-selecionados-')
);

$('btnJson').addEventListener('click', async () => {
  if (!VIEW.length) return toast('Nada para exportar.', true);
  await GMX.Export.download(
    GMX.Export.toJSON(VIEW),
    'leads-maps-' + GMX.Export.stamp() + '.json',
    'application/json'
  );
});

$('btnPhones').addEventListener('click', async () => {
  const txt = GMX.Export.toPhoneList(VIEW);
  if (!txt) return toast('Nenhum telefone na lista atual.', true);
  await navigator.clipboard.writeText(txt);
  toast(txt.split('\r\n').length + ' telefones copiados.');
});

$('btnWa').addEventListener('click', async () => {
  const linhas = [];
  const vistos = new Set();
  for (const l of VIEW) {
    const link = wa(l);
    if (!link || vistos.has(link)) continue;
    vistos.add(link);
    linhas.push(link + '\t' + (l.name || ''));
  }
  if (!linhas.length) return toast('Nenhum WhatsApp na lista atual.', true);
  await navigator.clipboard.writeText(linhas.join('\r\n'));
  toast(linhas.length + ' links de WhatsApp copiados.');
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes[GMX.KEYS.LEADS]) load();
});

$('btnToggleKpis').addEventListener('click', () => {
  const escondido = !$('kpis').hidden;
  $('kpis').hidden = escondido;
  $('btnToggleKpis').textContent = escondido ? 'Mostrar resumo' : 'Ocultar resumo';
  try { localStorage.setItem('gmx_kpis_off', escondido ? '1' : ''); } catch (_) {}
});

try {
  if (localStorage.getItem('gmx_kpis_off')) {
    $('kpis').hidden = true;
    $('btnToggleKpis').textContent = 'Mostrar resumo';
  }
} catch (_) {  }

load();
