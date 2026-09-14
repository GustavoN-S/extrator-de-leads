/* Feito por GustavoN-S (https://github.com/GustavoN-S) */

const fs = require('fs'), vm = require('vm');

let fails = 0;
const ok = (c, l, g) => { if (c) console.log('  PASS  ' + l);
  else { fails++; console.log('  FAIL  ' + l + '  -> ' + JSON.stringify(g)); } };

const ctx = { console, URL, location: { href: 'https://www.google.com/maps/search/x' },
              window: { addEventListener(){}, postMessage(){} }, setTimeout };
ctx.globalThis = ctx; ctx.self = ctx; ctx.window.location = ctx.location;
vm.createContext(ctx);
for (const f of ['src/shared/constants.js','src/shared/scoring.js','src/shared/phone.js',
                 'src/content/selectors.js','src/content/parsers.js','src/content/netparse.js']) {
  vm.runInContext(fs.readFileSync(f,'utf8'), ctx, { filename: f });
}
const G = ctx.GMX, P = G.Parse;

console.log('\n[A] Hosts do Google nao sao site de empresa');
const rejeitar = [
  'https://search.google.com/local/writereview?placeid=abc',
  'https://business.google.com/dashboard',
  'https://www.google.com/maps/place/X',
  'https://maps.google.com/?cid=123',
  'https://accounts.google.com/signin',
  'https://lh3.googleusercontent.com/foto.jpg',
  'https://www.gstatic.com/x.png',
  'https://goo.gl/maps/abc',
  'https://g.co/kgs/abc',
  'https://schema.org/LocalBusiness'
];
for (const u of rejeitar) {
  const host = new URL(u).hostname;
  ok(P.website(u) === '', 'rejeita ' + host, P.website(u));
}

console.log('\n[B] Sites de verdade continuam passando');
const aceitar = {
  'https://dtailspetboutique.com': 'dominio proprio',
  'https://www.macys.com/': 'com www',
  'http://bostoncashout.com': 'http simples',
  'https://sites.google.com/view/clinica': 'Google Sites (construtor)',
  'https://minhaloja.business.site': 'site gratis do Perfil da Empresa',
  'https://instagram.com/loja': 'instagram (vira SO REDE SOCIAL no score)'
};
for (const [u, nome] of Object.entries(aceitar)) {
  ok(P.website(u) !== '', nome + ': ' + u, P.website(u));
}
ok(P.website('https://www.google.com/url?q=https%3A%2F%2Floja.com%2F&sa=U') === 'https://loja.com/',
   'redirect do Google continua sendo desembrulhado',
   P.website('https://www.google.com/url?q=https%3A%2F%2Floja.com%2F&sa=U'));

console.log('\n[C] Endereco limpo (casos da tela do usuario)');
ok(P.address('9 Marshall St+1 617-227-6968') === '9 Marshall St',
   'telefone colado no fim e removido', P.address('9 Marshall St+1 617-227-6968'));
ok(P.address('400 Brookline Avenue(617) 566-5204') === '400 Brookline Avenue',
   'telefone entre parenteses tambem', P.address('400 Brookline Avenue(617) 566-5204'));
ok(P.address('') === '', 'glifo de icone vira endereco vazio',
   JSON.stringify(P.address('')));
ok(P.address('171 Neponset AveFechado') === '171 Neponset Ave',
   'horario colado no fim', P.address('171 Neponset AveFechado'));
ok(P.address('1341 Boylston Street') === '1341 Boylston Street',
   'endereco normal fica intacto', P.address('1341 Boylston Street'));
ok(P.address('Av. Paulista, 1000 - Bela Vista') === 'Av. Paulista, 1000 - Bela Vista',
   'numero de rua nao e confundido com telefone',
   P.address('Av. Paulista, 1000 - Bela Vista'));

console.log('\n[D] Resposta de rede: site so do campo certo');
function blob(nome, cid, site, tel) {
  const a = new Array(180).fill(null);
  a[11] = nome; a[10] = cid;
  a[18] = '1 Main St';
  a[4]  = [null,null,null,null,null,null,null,4.5,100];
  if (site) a[7] = [site, site.replace(/^https?:\/\//,'')];
  if (tel)  a[178] = [[tel]];
  a[50] = ['https://search.google.com/local/writereview?placeid=' + cid];
  a[51] = ['https://lh3.googleusercontent.com/p/foto.jpg'];
  return a;
}

const respostaBoa = ")]}'\n" + JSON.stringify([[ 'x', [
  blob('Macys', '0x1:0x1', 'https://macys.com', '+1 617-357-3000'),
  blob('Target', '0x2:0x2', 'https://target.com', '+1 857-317-5220'),
  blob('Mimados Pet', '0x3:0x3', null, '+1 857-746-3194')
]]]);
G.NetIndex.harvest(respostaBoa);

const macys = G.NetIndex.find({ cid: '0x1:0x1', name: 'Macys' });
ok(macys.site === 'https://macys.com/', 'le o site do indice 7', macys.site);
ok(macys.siteKnown === true, 'marca como verificado');

const target = G.NetIndex.find({ cid: '0x2:0x2', name: 'Target' });
ok(target.site === 'https://target.com/', 'Target agora tem site (era falso SEM SITE)', target.site);

const mimados = G.NetIndex.find({ cid: '0x3:0x3', name: 'Mimados Pet' });
ok(mimados.site === '', 'quem nao tem site fica vazio', mimados.site);
ok(mimados.siteKnown === true, 'e isso pode ser afirmado (indice conferido)');
ok(mimados.phone === '+1 857-746-3194', 'telefone lido', mimados.phone);

console.log('\n[E] search.google.com nunca entra como site');
const gastoTotal = [...G.NetIndex.byCid.values()].map((r) => r.site).join(' ');
ok(!gastoTotal.includes('search.google.com'),
   'nenhum registro ficou com search.google.com', gastoTotal);
ok(!gastoTotal.includes('googleusercontent'), 'nem com URL de foto');

console.log('\n[F] Auto-conferencia: se o indice mudar, nao afirmamos nada');
const antes = G.NetIndex.stats.siteIndexBad;
const respostaEstranha = ")]}'\n" + JSON.stringify([[ 'y', [
  blob('Loja A', '0xa:0xa', null, '+1 111-222-3333'),
  blob('Loja B', '0xb:0xb', null, '+1 111-222-4444')
]]]);
G.NetIndex.harvest(respostaEstranha);
ok(G.NetIndex.stats.siteIndexBad === antes + 1, 'resposta marcada como nao-confiavel',
   G.NetIndex.stats.siteIndexBad);
const lojaA = G.NetIndex.find({ cid: '0xa:0xa', name: 'Loja A' });
ok(lojaA.siteKnown === false,
   'NAO afirma "sem site" quando o campo nao pode ser lido', lojaA.siteKnown);

const leadA = { name: 'Loja A', cid: '0xa:0xa', website: '', websiteChecked: false };
G.NetIndex.enrich(leadA);
ok(leadA.websiteChecked === false,
   'lead fica "A VERIFICAR" e sera confirmado abrindo a ficha', leadA.websiteChecked);

console.log('\n[G] Filtro "ignorar quem ja tem site" no service worker');
let STORE = { gmx_settings: { skipWithWebsite: true } };
let handler = null;
const sw = {
  console, URL, setTimeout, Promise, Object, Array, JSON, String, Number, Math, Date, Set, Map,
  importScripts(...fs2) {
    for (const f of fs2) {
      vm.runInContext(fs.readFileSync('src/' + f.replace('../',''), 'utf8'), sw, { filename: f });
    }
  },
  chrome: {
    runtime: { onMessage: { addListener: (fn) => { handler = fn; } },
               onInstalled: { addListener(){} }, onStartup: { addListener(){} },
               getURL: (p) => p },
    action: { setBadgeBackgroundColor(){}, setBadgeText(){}, setTitle(){} },
    tabs: { onRemoved: { addListener(){} }, query(){}, create(){}, update(){}, reload(){},
            sendMessage: async () => {} },
    storage: { local: {
      get: async (k) => ({ [k]: STORE[k] }),
      set: async (o) => { Object.assign(STORE, o); } } }
  }
};
sw.globalThis = sw; sw.self = sw;
vm.createContext(sw);
vm.runInContext(fs.readFileSync('src/background/service-worker.js','utf8'), sw,
  { filename: 'service-worker.js' });

function enviar(leads) {
  return new Promise((resolve) => {
    handler({ type: 'LEADS', leads }, {}, resolve);
  });
}

(async () => {
  await enviar([
    { name: 'Mimados Pet', cid: '0x3:0x3', website: '', websiteChecked: true, phone: '+1 857-746-3194' },
    { name: 'Macys', cid: '0x1:0x1', website: 'https://macys.com/', websiteChecked: true }
  ]);
  let salvos = STORE.gmx_leads || [];
  ok(salvos.length === 1, 'so o lead sem site foi salvo', salvos.map((l) => l.name));
  ok(salvos[0].name === 'Mimados Pet', 'e o certo', salvos[0] && salvos[0].name);

  await enviar([{ name: 'Longwood Galleria', cid: '0x9:0x9', website: '', websiteChecked: false }]);
  salvos = STORE.gmx_leads;
  ok(salvos.length === 2, 'entrou enquanto o site era desconhecido', salvos.length);

  await enviar([{ name: 'Longwood Galleria', cid: '0x9:0x9',
                  website: 'https://longwoodgalleria.com/', websiteChecked: true }]);
  salvos = STORE.gmx_leads;
  ok(salvos.length === 1, 'removido quando o site apareceu depois',
     salvos.map((l) => l.name));
  ok(!salvos.some((l) => l.name === 'Longwood Galleria'), 'nao sobrou na base');

  STORE.gmx_settings = { skipWithWebsite: false };
  await enviar([{ name: 'Macys', cid: '0x1:0x1', website: 'https://macys.com/', websiteChecked: true }]);
  salvos = STORE.gmx_leads;
  ok(salvos.some((l) => l.name === 'Macys'),
     'opcao desligada: quem tem site e mantido (vai pro fim da lista)',
     salvos.map((l) => l.name));

  console.log('\n' + (fails ? fails + ' TESTE(S) FALHARAM' : 'TODOS OS TESTES PASSARAM'));
  process.exit(fails ? 1 : 0);
})();
