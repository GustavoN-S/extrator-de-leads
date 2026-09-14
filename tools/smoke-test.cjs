/* Feito por GustavoN-S (https://github.com/GustavoN-S) */

const fs = require('fs'), vm = require('vm');
const ctx = { console, URL, Blob: class {}, chrome: { storage: { local: {} }, downloads: {} } };
ctx.globalThis = ctx; ctx.self = ctx;
vm.createContext(ctx);
for (const f of ['src/shared/constants.js','src/shared/scoring.js','src/shared/phone.js','src/shared/export.js',
                 'src/content/selectors.js','src/content/parsers.js']) {
  vm.runInContext(fs.readFileSync(f,'utf8'), ctx, { filename: f });
}
const G = ctx.GMX;
let fails = 0;
const ok = (cond, label, got) => {
  if (cond) console.log('  PASS  ' + label);
  else { fails++; console.log('  FAIL  ' + label + '  -> ' + JSON.stringify(got)); }
};

console.log('\n[1] Score e prioridade');
const semSite = G.Scoring.scoreLead({ name:'Clinica A', phone:'(11) 3333-4444', reviews:12, rating:4.6, claimed:false });
ok(semSite.priority === 'QUENTE' && !semSite.hasWebsite, 'sem site + telefone = QUENTE', semSite.score);

const comSite = G.Scoring.scoreLead({ name:'Clinica B', phone:'(11) 3333-4444', website:'https://clinicab.com.br', reviews:300, rating:4.8 });
ok(comSite.priority === 'FRIO' && comSite.hasWebsite, 'com site proprio = FRIO', comSite.score);

const social = G.Scoring.scoreLead({ name:'Clinica C', phone:'(11) 3333-4444', website:'https://instagram.com/clinicac', reviews:8 });
ok(social.socialOnly && !social.hasWebsite, 'so instagram NAO conta como site', social.score);

console.log('\n[2] Ordenacao (sem site primeiro)');
const ordenado = G.Scoring.sortLeads([comSite, social, semSite]).map(l => l.name);
ok(ordenado[0] === 'Clinica A' && ordenado[2] === 'Clinica B', 'ordem A > C > B', ordenado);

console.log('\n[3] Parsers');
ok(G.Parse.phone('Clinica · (11) 98765-4321 · Aberto') === '(11) 98765-4321', 'telefone celular BR', G.Parse.phone('Clinica · (11) 98765-4321'));
ok(G.Parse.phone('4,8(312)') === '', 'nota+avaliacoes nao viram telefone', G.Parse.phone('4,8(312)'));
ok(G.Parse.rating('4,8') === 4.8, 'nota com virgula', G.Parse.rating('4,8'));
ok(G.Parse.reviews('(1.234)') === 1234, 'avaliacoes com separador', G.Parse.reviews('(1.234)'));
const geo = G.Parse.latLng('https://www.google.com/maps/place/X/@-23.55,-46.63,17z/data=!3m1!4b1!4m6!3m5!1s0x94ce5:0xabc!8m2!3d-23.5505!4d-46.6333');
ok(geo.lat === -23.5505 && geo.lng === -46.6333, 'lat/lng da URL', geo);
ok(G.Parse.ids('...!1s0x94ce5:0xabc!8m2...').cid === '0x94ce5:0xabc', 'CID da URL', G.Parse.ids('!1s0x94ce5:0xabc').cid);
ok(G.Parse.cityFromAddress('R. Augusta, 100 - Consolacao, Sao Paulo - SP') === 'Sao Paulo - SP', 'cidade/UF do endereco', G.Parse.cityFromAddress('R. Augusta, 100 - Consolacao, Sao Paulo - SP'));
ok(G.Parse.website('clinicab.com.br') === 'https://clinicab.com.br/', 'site sem protocolo', G.Parse.website('clinicab.com.br'));

console.log('\n[4] WhatsApp e CSV');
ok(G.Export.waLink('(11) 98765-4321', { phone:'(11) 98765-4321' }) === 'https://wa.me/5511987654321',
   'link wa.me com DDI', G.Export.waLink('(11) 98765-4321', { phone:'(11) 98765-4321' }));
const csv = G.Export.toCSV([semSite, comSite], ';');
const linhas = csv.split('\r\n');
ok(csv.charCodeAt(0) === 0xFEFF, 'CSV com BOM (Excel pt-BR)');
ok(linhas[0].split(';').length === G.FIELDS.length, 'cabecalho com todas as colunas', linhas[0].split(';').length);
ok(linhas[1].includes('Clinica A') && linhas[1].includes('NAO'), 'linha do lead sem site marcada NAO', linhas[1].slice(0,60));

console.log('\n[5] Deduplicacao');
vm.runInContext(fs.readFileSync('src/shared/store.js','utf8'), ctx, { filename:'store.js' });
const k1 = G.Store.dedupeKey({ name:'Clinica A', cid:'0x1:0x2' });
const k2 = G.Store.dedupeKey({ name:'CLINICA  A!', cid:'0x1:0x2' });
ok(k1 === k2, 'mesmo CID = mesma chave', [k1,k2]);
const k3 = G.Store.dedupeKey({ name:'Clinica A', address:'R. Augusta, 100' });
const k4 = G.Store.dedupeKey({ name:'Clínica Á', address:'R. Augusta, 100' });
ok(k3 === k4, 'acentos ignorados na chave', [k3,k4]);

console.log('\n' + (fails ? fails + ' TESTE(S) FALHARAM' : 'TODOS OS TESTES PASSARAM'));
process.exit(fails ? 1 : 0);
