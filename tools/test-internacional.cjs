/* Feito por GustavoN-S (https://github.com/GustavoN-S) */

const fs = require('fs'), vm = require('vm');
const ctx = { console, URL, location: { href: 'https://www.google.com/maps/search/x' },
              window: { addEventListener(){}, postMessage(){} } };
ctx.globalThis = ctx; ctx.self = ctx; ctx.window.location = ctx.location;
vm.createContext(ctx);
for (const f of ['src/shared/constants.js','src/shared/scoring.js','src/shared/phone.js',
                 'src/shared/export.js','src/content/selectors.js','src/content/parsers.js',
                 'src/content/netparse.js']) {
  vm.runInContext(fs.readFileSync(f,'utf8'), ctx, { filename: f });
}
const G = ctx.GMX, P = G.Parse, Ph = G.Phone;
let fails = 0;
const ok = (c,l,g) => { if(c) console.log('  PASS  '+l);
  else { fails++; console.log('  FAIL  '+l+'  -> '+JSON.stringify(g)); } };

console.log('\n[A] LEITURA — formatos da Europa e America do Norte');
const leitura = {
  '(305) 555-1234':      'EUA  3-3-4',
  '(416) 555-0199':      'Canada',
  '020 7946 0958':       'Reino Unido',
  '030 12345678':        'Alemanha',
  '01 42 68 53 00':      'Franca',
  '06 1234 5678':        'Italia',
  '912 345 678':         'Portugal',
  '(11) 98765-4321':     'Brasil celular',
  '+1 305-555-1234':     'EUA internacional',
  '+44 20 7946 0958':    'UK internacional',
  '+351 912 345 678':    'Portugal internacional',
  '+49 30 12345678':     'Alemanha internacional'
};
for (const [txt, nome] of Object.entries(leitura)) {
  ok(P.phone(txt) !== '', nome + ': "' + txt + '"', P.phone(txt));
}

console.log('\n[B] MASCARA E.164 — o que vai virar link de WhatsApp');
const e164 = [
  ['(305) 555-1234',    'US', '13055551234',   'EUA: ganha o +1'],
  ['(416) 555-0199',    'CA', '14165550199',   'Canada: +1'],
  ['020 7946 0958',     'GB', '442079460958',  'UK: cai o 0 do trunk'],
  ['030 12345678',      'DE', '493012345678',  'Alemanha: cai o 0'],
  ['01 42 68 53 00',    'FR', '33142685300',   'Franca: cai o 0'],
  ['912 345 678',       'PT', '351912345678',  'Portugal: sem trunk'],
  ['(11) 98765-4321',   'BR', '5511987654321', 'Brasil celular'],
  ['(11) 3456-7890',    'BR', '551134567890',  'Brasil fixo'],
  ['+1 305-555-1234',   'BR', '13055551234',   'ja internacional ignora o pais'],
  ['+44 20 7946 0958',  'BR', '442079460958',  'UK internacional ignora o pais'],
  ['00351 912345678',   'BR', '351912345678',  'prefixo 00 vira DDI'],
  ['8 495 123-45-67',   'RU', '74951234567',   'Russia: 8 vira 7']
];
for (const [raw, iso, esperado, nome] of e164) {
  ok(Ph.toE164(raw, iso) === esperado, nome, Ph.toE164(raw, iso));
}

console.log('\n[C] O BUG ANTIGO — numero de fora nao pode virar brasileiro');
const antigo = (phone) => {
  let d = String(phone).replace(/\D/g,'');
  if (d.length <= 11 && !d.startsWith('55')) d = '55' + d;
  return d.length < 12 ? '' : 'https://wa.me/' + d;
};
ok(antigo('(305) 555-1234') === 'https://wa.me/5530555512340'.slice(0,-1),
   'antes: numero de Miami virava +55 (errado)', antigo('(305) 555-1234'));
ok(Ph.waLink('(305) 555-1234', 'US') === 'https://wa.me/13055551234',
   'agora: vira +1 corretamente', Ph.waLink('(305) 555-1234','US'));
ok(antigo('912 345 678') === '', 'antes: portugues era descartado');
ok(Ph.waLink('912 345 678', 'PT') === 'https://wa.me/351912345678',
   'agora: portugues gera link', Ph.waLink('912 345 678','PT'));

console.log('\n[D] DETECCAO DE PAIS PELO ENDERECO');
ok(Ph.guess({ address: '171 Neponset Ave, Boston, MA', phone: '(617) 555-1234' }, 'AUTO') === 'BR',
   'endereco sem nome de pais cai no padrao', Ph.guess({address:'171 Neponset Ave, Boston, MA'},'AUTO'));
ok(Ph.guess({ address: '12 Oxford St, London, United Kingdom' }, 'AUTO') === 'GB',
   'detecta Reino Unido pelo endereco');
ok(Ph.guess({ query: 'dentista em Lisboa, Portugal' }, 'AUTO') === 'PT',
   'detecta Portugal pela busca');
ok(Ph.guess({ phone: '+1 305 555 1234' }, 'US') === '',
   'numero com + dispensa palpite de pais');
ok(Ph.guess({ address: 'qualquer' }, 'US') === 'US', 'pais fixado nas opcoes manda');

console.log('\n[E] COBERTURA');
const eu = ['PT','ES','FR','IT','DE','GB','IE','NL','BE','CH','AT','PL','SE','NO','DK','FI','GR','RO','CZ','HU','BG','HR','SI','SK','RS','BA','MK','ME','AL','LT','LV','EE','IS','LU','MT','CY','MD','BY','UA','RU','TR','MC','AD','SM','LI','GI'];
const na = ['US','CA','MX','DO','PR','JM','TT','BS','BB','BZ','GT','SV','HN','NI','CR','PA','CU','HT'];
ok(eu.every(c => Ph.COUNTRIES[c]), 'Europa: ' + eu.length + ' paises', eu.filter(c=>!Ph.COUNTRIES[c]));
ok(na.every(c => Ph.COUNTRIES[c]), 'America do Norte/Central: ' + na.length + ' paises', na.filter(c=>!Ph.COUNTRIES[c]));
const ruins = eu.concat(na).filter(function (c) {
  const n = Ph.COUNTRIES[c].nsn[0];
  const num = '9'.repeat(n);
  const e = Ph.toE164(num, c);
  return e !== Ph.COUNTRIES[c].dial + num;
});
ok(ruins.length === 0, 'todos os 64 paises geram E.164 correto', ruins);

console.log('\n[F] SITE — o flag de verificacao');
const naoVerificado = G.Scoring.scoreLead({ name:'X', website:'', websiteChecked:false });
ok(!naoVerificado.hasWebsite && !naoVerificado.websiteChecked,
   'vazio sem verificacao NAO afirma "sem site"', naoVerificado.websiteChecked);
const verificado = G.Scoring.scoreLead({ name:'Y', website:'', websiteChecked:true });
ok(verificado.websiteChecked === true, 'vazio verificado afirma "sem site"');

const blob = new Array(180).fill(null);
blob[7]  = ['https://loja.com/','loja.com'];
blob[10] = '0xaaa:0xbbb';
blob[11] = 'Loja Teste';
blob[178]= [['+1 305-555-1234']];
G.NetIndex.harvest(")]}'\n" + JSON.stringify([[ 'x', [ blob ] ]]));
const leadRede = { name:'Loja Teste', cid:'0xaaa:0xbbb', website:'', websiteChecked:false, phone:'' };
G.NetIndex.enrich(leadRede);
ok(leadRede.website === 'https://loja.com/', 'rede traz o site', leadRede.website);
ok(leadRede.websiteChecked === true, 'rede marca como verificado');
ok(leadRede.phoneE164 === '13055551234', 'rede gera E.164 dos EUA', leadRede.phoneE164);

console.log('\n[G] ENDERECO E CIDADE — o caso de Boston');
ok(P.address('171 Neponset AveFechado') === '171 Neponset Ave',
   'horario colado no endereco e removido', P.address('171 Neponset AveFechado'));
ok(P.address('R. Augusta, 100Aberto ⋅ Fecha 18:00') === 'R. Augusta, 100',
   'variante em portugues', P.address('R. Augusta, 100Aberto ⋅ Fecha 18:00'));
ok(P.cityFromAddress('171 Neponset Ave, Boston, MA 02122') === 'Boston, MA',
   'cidade dos EUA', P.cityFromAddress('171 Neponset Ave, Boston, MA 02122'));
ok(P.cityFromAddress('R. Augusta, 100 - Consolacao, Sao Paulo - SP') === 'Sao Paulo - SP',
   'cidade do Brasil');
ok(P.cityFromAddress('Rua X 10, 1200-109 Lisboa') === 'Lisboa',
   'cidade de Portugal (CEP removido)', P.cityFromAddress('Rua X 10, 1200-109 Lisboa'));
ok(P.cityFromAddress('12 Oxford St, London W1D 1AN') === 'London',
   'cidade do UK (postcode removido)', P.cityFromAddress('12 Oxford St, London W1D 1AN'));
ok(P.regionFromQuery('pet shop em Boston MA') === 'Boston MA',
   'regiao vinda da busca', P.regionFromQuery('pet shop em Boston MA'));
ok(P.regionFromQuery('dentist in London') === 'London', 'regiao em ingles');

console.log('\n[H] EXPORTACAO com WhatsApp internacional');
const us = { name:'Shop', phone:'(305) 555-1234', phoneE164:'13055551234' };
ok(G.Export.waLink(us.phone, us) === 'https://wa.me/13055551234',
   'CSV usa o E.164 ja calculado', G.Export.waLink(us.phone, us));

console.log('\n' + (fails ? fails+' TESTE(S) FALHARAM' : 'TODOS OS TESTES PASSARAM'));
process.exit(fails ? 1 : 0);
