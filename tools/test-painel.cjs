/* Feito por GustavoN-S (https://github.com/GustavoN-S) */

const fs = require('fs'), vm = require('vm');

function makeEl(id) {
  return {
    id,
    value: '',
    innerHTML: '',
    textContent: '',
    disabled: false,
    hidden: false,
    checked: false,
    indeterminate: false,
    _handlers: {},
    dataset: {},
    classList: { _s: new Set(),
      add(c) { this._s.add(c); }, remove(c) { this._s.delete(c); },
      toggle(c, on) { on ? this._s.add(c) : this._s.delete(c); },
      contains(c) { return this._s.has(c); } },
    style: { setProperty() {} },
    addEventListener(ev, fn) { this._handlers[ev] = fn; },
    fire(ev, extra) {
      const e = Object.assign({ target: this, preventDefault() {}, closest: () => null }, extra || {});
      if (this._handlers[ev]) this._handlers[ev](e);
    },
    getBoundingClientRect: () => ({ height: 58 }),
    closest: () => null,
    querySelectorAll: () => [],
    insertAdjacentHTML() {},
    options() {
      return [...this.innerHTML.matchAll(/<option value="([^"]*)">([^<]*)<\/option>/g)]
        .map((m) => ({ value: m[1], label: m[2] }));
    }
  };
}

const els = {};
const el = (id) => (els[id] = els[id] || makeEl(id));

const LEADS_KEY = 'gmx_leads';
let STORE = {};

const ctx = {
  console, URL, Set, Map, Array, Object, JSON, String, Number, Math, Date,
  setTimeout, Promise,
  confirm: () => true,
  navigator: { clipboard: { writeText: async () => {} } },
  document: {
    getElementById: el,
    querySelector: (s) => el('q:' + s),
    querySelectorAll: () => [],
    documentElement: { style: { setProperty() {} } },
    addEventListener() {},
    createElement: () => makeEl('novo')
  },
  window: { addEventListener() {} },
  chrome: {
    storage: {
      local: {
        get: async (k) => ({ [k]: STORE[k] }),
        set: async (o) => { Object.assign(STORE, o); }
      },
      onChanged: { addListener() {} }
    }
  }
};
ctx.globalThis = ctx; ctx.self = ctx;
ctx.document.body = { appendChild() {} };
vm.createContext(ctx);

for (const f of ['src/shared/constants.js', 'src/shared/scoring.js',
                 'src/shared/phone.js', 'src/shared/store.js', 'src/shared/export.js']) {
  vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f });
}

const cidades = [
  ['Sao Paulo - SP', 12], ['Sáo Bernardo - SP', 3], ['Boston, MA', 7],
  ['Brookline, MA', 2], ['Lisboa', 5], ['London', 4], ['Santos - SP', 1]
];
const leads = [];
cidades.forEach(([cidade, n], ci) => {
  for (let i = 0; i < n; i++) {
    leads.push({
      _key: 'k' + ci + '_' + i,
      name: 'Empresa ' + ci + '-' + i,
      city: cidade,
      query: 'teste em ' + cidade,
      phone: i % 2 ? '(11) 98765-432' + (i % 10) : '',
      website: i % 3 === 0 ? 'https://site' + i + '.com' : '',
      websiteChecked: i % 4 !== 0,
      rating: 4.5, reviews: 10
    });
  }
});
STORE[LEADS_KEY] = leads.map((l) => ctx.GMX.Scoring.scoreLead(l));
const TOTAL = leads.length;

vm.runInContext(fs.readFileSync('src/dashboard/dashboard.js', 'utf8'), ctx,
  { filename: 'dashboard.js' });

let fails = 0;
const ok = (c, l, g) => { if (c) console.log('  PASS  ' + l);
  else { fails++; console.log('  FAIL  ' + l + '  -> ' + JSON.stringify(g)); } };

setTimeout(() => {
  const delCity = el('delCity');
  const filtro = el('delCityFilter');
  const btn = el('btnDelCity');

  console.log('\n[1] Combo de exclusao — estado inicial');
  let opts = delCity.options();
  ok(opts.length === cidades.length + 1, 'lista todas as cidades + cabecalho', opts.length);
  ok(opts[0].label === 'Apagar leads da cidade...', 'cabecalho padrao', opts[0].label);
  ok(opts[1].label === 'Sao Paulo - SP (12)', 'cidade com mais leads vem primeiro', opts[1].label);
  ok(btn.disabled === true, 'botao comeca desabilitado');

  console.log('\n[2] Filtro do combo');
  filtro.value = 'bo';
  filtro.fire('input');
  opts = delCity.options();
  const nomes = opts.slice(1).map((o) => o.value);
  ok(nomes.includes('Boston, MA') && nomes.includes('Lisboa'),
     '"bo" acha Boston e Lis-bo-a (casa em qualquer posicao)', nomes);
  ok(!nomes.includes('Brookline, MA'),
     '"bo" NAO acha Brookline (b-r-o-o, sem "bo")', nomes);
  ok(!nomes.includes('London'), '"bo" nao traz London', nomes);

  filtro.value = 'broo';
  filtro.fire('input');
  ok(delCity.options().slice(1).map((o) => o.value).includes('Brookline, MA'),
     '"broo" acha Brookline', delCity.options().slice(1).map((o) => o.value));

  filtro.value = 'bo';
  filtro.fire('input');
  opts = delCity.options();
  ok(opts[0].label.includes('cidade(s)'), 'cabecalho vira contador', opts[0].label);

  console.log('\n[3] Filtro ignora acento');
  filtro.value = 'sao';
  filtro.fire('input');
  const comAcento = delCity.options().slice(1).map((o) => o.value);
  ok(comAcento.includes('Sáo Bernardo - SP'), '"sao" acha "Sáo Bernardo"', comAcento);
  ok(comAcento.includes('Sao Paulo - SP'), '"sao" acha "Sao Paulo"', comAcento);

  console.log('\n[4] Uma unica correspondencia ja seleciona');
  filtro.value = 'lond';
  filtro.fire('input');
  ok(delCity.value === 'London', 'seleciona London sozinho', delCity.value);
  ok(btn.disabled === false, 'botao habilita automaticamente');

  console.log('\n[5] Termo sem resultado');
  filtro.value = 'xyznaoexiste';
  filtro.fire('input');
  ok(delCity.options().length === 1, 'so o cabecalho sobra', delCity.options().length);
  ok(delCity.options()[0].label.includes('Nenhuma cidade'), 'avisa que nao achou',
     delCity.options()[0].label);
  ok(btn.disabled === true, 'botao volta a desabilitar');

  console.log('\n[6] Selecao manual sobrevive a um filtro mais amplo');
  filtro.value = 'boston';
  filtro.fire('input');
  ok(delCity.value === 'Boston, MA', 'Boston selecionado', delCity.value);
  filtro.value = 'bo';
  filtro.fire('input');
  ok(delCity.value === 'Boston, MA', 'continua selecionado ao alargar o filtro', delCity.value);

  console.log('\n[7] Exclusao por cidade');
  filtro.value = 'lisboa';
  filtro.fire('input');
  ok(delCity.value === 'Lisboa', 'Lisboa escolhida', delCity.value);
  btn.fire('click');

  setTimeout(() => {
    const restantes = STORE[LEADS_KEY];
    ok(restantes.length === TOTAL - 5, 'apagou os 5 leads de Lisboa', restantes.length);
    ok(!restantes.some((l) => l.city === 'Lisboa'), 'nenhum lead de Lisboa sobrou');
    ok(restantes.some((l) => l.city === 'Boston, MA'), 'outras cidades intactas');
    ok(!delCity.options().some((o) => o.value === 'Lisboa'),
       'Lisboa sai do combo apos a exclusao');

    console.log('\n[8] Contadores');
    ok(Number(el('kTotal').textContent) === TOTAL - 5, 'KPI total atualizado',
       el('kTotal').textContent);
    ok(el('shownCount').textContent.includes(String(TOTAL - 5)),
       'contador da tabela atualizado', el('shownCount').textContent);

    console.log('\n' + (fails ? fails + ' TESTE(S) FALHARAM' : 'TODOS OS TESTES PASSARAM'));
    process.exit(fails ? 1 : 0);
  }, 60);
}, 60);
