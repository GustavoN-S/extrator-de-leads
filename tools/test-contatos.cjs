/* Feito por GustavoN-S (https://github.com/GustavoN-S) */

const fs = require('fs'), vm = require('vm');
const ctx = { console, URL, location: { href: 'https://www.google.com/maps/search/x' },
              window: { addEventListener(){}, postMessage(){} } };
ctx.globalThis = ctx; ctx.self = ctx;
ctx.window.location = ctx.location;
vm.createContext(ctx);
for (const f of ['src/shared/constants.js','src/shared/scoring.js',
                 'src/content/selectors.js','src/content/parsers.js',
                 'src/content/netparse.js']) {
  vm.runInContext(fs.readFileSync(f,'utf8'), ctx, { filename: f });
}
const G = ctx.GMX, P = G.Parse;
let fails = 0;
const ok = (c,l,g) => { if(c) console.log('  PASS  '+l);
  else { fails++; console.log('  FAIL  '+l+'  -> '+JSON.stringify(g)); } };

console.log('\n[A] SITE — o bug do link embrulhado pelo Google');
ok(P.website('https://www.google.com/url?q=https%3A%2F%2Fclinicasaude.com.br%2F&sa=U')
   === 'https://clinicasaude.com.br/', 'redirect /url?q= agora vira o site real',
   P.website('https://www.google.com/url?q=https%3A%2F%2Fclinicasaude.com.br%2F&sa=U'));
ok(P.website('/url?q=http%3A%2F%2Fpetshop.com.br&sa=D') === 'http://petshop.com.br/',
   'redirect relativo tambem', P.website('/url?q=http%3A%2F%2Fpetshop.com.br&sa=D'));
ok(P.website('https://clinicab.com.br') === 'https://clinicab.com.br/', 'link direto');
ok(P.website('https://www.google.com/maps/place/Clinica/@-23,-46') === '', 'link do proprio Maps e descartado');
ok(P.website('/maps/place/Clinica') === '', 'caminho interno descartado');
ok(P.website('https://lh3.googleusercontent.com/foto.jpg') === '', 'imagem descartada');
ok(P.website('https://sites.google.com/view/clinica') === 'https://sites.google.com/view/clinica',
   'sites.google.com continua contando como site');
ok(P.website('https://instagram.com/clinica') === 'https://instagram.com/clinica', 'instagram passa (vira SO REDE SOCIAL no score)');

console.log('\n[B] TELEFONE — formatos que apareciam vazios');
const casos = {
  '(11) 3456-7890':        '(11) 3456-7890',
  '(11) 98765-4321':       '(11) 98765-4321',
  '11 98765-4321':         '11 98765-4321',
  '+55 11 98765-4321':     '+55 11 98765-4321',
  '(11) 9 8765-4321':      '(11) 9 8765-4321',
  '(21) 2222 3333':        '(21) 2222 3333'
};
for (const [entrada, esperado] of Object.entries(casos)) {
  ok(P.phone(entrada) === esperado, 'le "'+entrada+'"', P.phone(entrada));
}

console.log('\n[C] TELEFONE — nao pode inventar numero');
ok(P.phone('4,8(312)') === '', 'nota + avaliacoes');
ok(P.phone('R. Augusta, 1000 - Consolacao') === '', 'numero de rua');
ok(P.phone('CEP 01310-100') === '', 'CEP');
ok(P.phone('Aberto  Fecha 18:00') === '', 'horario');

console.log('\n[D] REDE — leitura do payload do Maps');
const blob = new Array(180).fill(null);
blob[4] = [null,null,null,null,null,null,null,4.7,231];
blob[7] = ['https://clinicasaude.com.br/','clinicasaude.com.br'];
blob[10] = '0x94ce5abc:0xdef123';
blob[11] = 'Clinica Saude Total';
blob[18] = 'R. Augusta, 1000 - Sao Paulo';
blob[178] = [['+55 11 3456-7890'],['(11) 3456-7890']];
const payload = ")]}'\n" + JSON.stringify([[ 'x', [ blob ] ]]);
const n = G.NetIndex.harvest(payload);
ok(n === 1, 'achou 1 empresa no payload', n);
const rec = G.NetIndex.find({ cid: '0x94ce5abc:0xdef123', name: 'Clinica Saude Total' });
ok(rec && rec.phone === '+55 11 3456-7890', 'telefone veio da rede', rec && rec.phone);
ok(rec && rec.site === 'https://clinicasaude.com.br/', 'site veio da rede', rec && rec.site);

console.log('\n[E] REDE — enriquecer o lead que veio sem contato');
const lead = G.Scoring.scoreLead({ name:'Clinica Saude Total', cid:'0x94ce5abc:0xdef123',
                                   phone:'', website:'', source:'lista' });
ok(lead.priority === 'MORNO' && !lead.phone && !lead.hasWebsite,
   'antes: sem site e sem telefone = MORNO (sem contato nao da pra ligar)', lead.priority);
G.NetIndex.enrich(lead);
ok(lead.phone === '+55 11 3456-7890', 'depois: telefone preenchido', lead.phone);
ok(lead.hasWebsite === true, 'depois: reconhecido que TEM site', lead.website);
ok(lead.priority === 'FRIO', 'score recalculado -> foi para o fim da fila', lead.priority);

console.log('\n[F] REDE — casar por nome quando nao ha CID');
const rec2 = G.NetIndex.find({ name: 'CLÍNICA  SAÚDE TOTAL' });
ok(rec2 && rec2.phone === '+55 11 3456-7890', 'nome com acento/caixa diferente casa', rec2 && rec2.phone);

console.log('\n' + (fails ? fails+' TESTE(S) FALHARAM' : 'TODOS OS TESTES PASSARAM'));
process.exit(fails ? 1 : 0);
