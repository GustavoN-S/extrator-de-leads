/* Feito por GustavoN-S (https://github.com/GustavoN-S) */

(function (root) {
  'use strict';
  const GMX = (root.GMX = root.GMX || {});
  const { sleep, waitFor, waitForSoft, scrollContainer, realClick, text } = GMX.DOM;
  const { q, qa, SEL, MSG } = GMX;

  const state = {
    running: false,
    stopReason: '',
    job: null,
    seen: new Set(),
    buffer: [],
    leads: [],
    total: 0,
    noSite: 0
  };

  function send(type, payload) {
    try {
      return chrome.runtime.sendMessage(Object.assign({ type }, payload || {}));
    } catch (_) {
      return Promise.resolve(null);
    }
  }

  async function flush(force) {
    if (!state.buffer.length) return;
    if (!force && state.buffer.length < 10) return;
    const batch = state.buffer.splice(0, state.buffer.length);
    await send(MSG.LEADS, { leads: batch, jobId: state.job && state.job.id });
  }

  function push(lead) {
    if (!lead) return false;
    const key = lead.cid || lead.placeId || lead.placeUrl || lead.name;
    if (state.seen.has(key)) return false;
    state.seen.add(key);

    const s = state.job.settings;
    if (s.minRating > 0 && (Number(lead.rating) || 0) < s.minRating) return false;

    state.buffer.push(lead);
    state.leads.push(lead);
    state.total++;
    if (!lead.hasWebsite) state.noSite++;
    return true;
  }

  function reconcile() {
    if (!GMX.NetIndex) return 0;
    let fixed = 0;
    for (const lead of state.leads) {
      if (lead.phone && lead.websiteChecked) continue;
      const antes = (lead.phone || '') + '|' + (lead.website || '');
      GMX.NetIndex.enrich(lead);
      if ((lead.phone || '') + '|' + (lead.website || '') !== antes) {
        state.buffer.push(lead);
        fixed++;
      }
    }
    if (fixed) GMX.Overlay.log('Rede completou ' + fixed + ' contato(s).');
    return fixed;
  }

  function progress() {
    const max = state.job.settings.maxPerQuery || 100;
    GMX.Overlay.stats({
      total: state.total,
      noSite: state.noSite,
      pct: (state.total / max) * 100
    });
    send(MSG.PROGRESS, {
      total: state.total,
      noSite: state.noSite,
      query: currentQuery()
    });
  }

  function currentQuery() {
    const j = state.job;
    if (j && j.queries && j.queries.length) return j.queries[j.index] || '';
    const raw = (location.pathname.match(/\/maps\/search\/([^/]+)/) || [])[1] || '';
    try {
      return decodeURIComponent(raw).replace(/\+/g, ' ');
    } catch (_) {
      return raw.replace(/\+/g, ' ');
    }
  }

  function isEndOfList() {
    const nodes = qa(SEL.endOfList);
    const blob = nodes.map(text).join(' ').toLowerCase();
    return SEL.endTexts.some((t) => blob.includes(t));
  }

  async function scrapeFeed() {
    const s = state.job.settings;
    const max = s.maxPerQuery || 100;

    const feed = await waitFor(() => q(SEL.feed), {
      timeout: 25000,
      label: 'lista de resultados'
    });

    GMX.Overlay.log('Lista encontrada. Rolando...');

    let stagnant = 0;
    let lastCount = 0;

    while (state.running && state.total < max) {
      const anchors = qa(SEL.cardLink, feed);

      for (const a of anchors) {
        if (!state.running || state.total >= max) break;
        const href = a.href || '';
        if (!href.includes('/maps/place/')) continue;
        if (state.seen.has(href)) continue;
        state.seen.add(href);

        const lead = GMX.Extract.fromCard(a, currentQuery());
        if (lead && push(lead)) {
          GMX.Overlay.log((lead.hasWebsite ? '- ' : '* ') + lead.name.slice(0, 30));
        }
      }

      progress();
      await flush(false);

      if (state.total >= max) {
        state.stopReason = 'Teto de ' + max + ' resultados atingido';
        break;
      }

      if (isEndOfList()) {
        state.stopReason = 'Fim da lista do Google';
        break;
      }

      const grew = await scrollContainer(feed, s.scrollDelay || 900);
      const nowCount = qa(SEL.cardLink, feed).length;

      if (!grew && nowCount === lastCount) {
        stagnant++;
        const list = qa(SEL.cardLink, feed);
        if (list.length) list[list.length - 1].scrollIntoView({ block: 'end' });
        await sleep(700);
        if (stagnant >= 4) {
          state.stopReason = 'Google parou de carregar novos resultados';
          break;
        }
      } else {
        stagnant = 0;
      }
      lastCount = nowCount;
    }
  }

  async function deepPass(apenasFaltando) {
    const s = state.job.settings;

    const alvos = apenasFaltando
      ? state.leads.filter((l) => l.placeUrl && (!l.phone || !l.websiteChecked))
      : state.leads.filter((l) => l.placeUrl);

    const urls = alvos.map((l) => l.placeUrl);
    if (!urls.length) {
      if (apenasFaltando) GMX.Overlay.log('Todos os contatos ja vieram. Nada a completar.');
      return;
    }

    GMX.Overlay.log(
      (apenasFaltando ? 'Completando contatos: ' : 'Modo completo: ') +
      urls.length + ' ficha(s)...'
    );

    let done = 0;
    let achou = 0;

    for (const original of alvos) {
      if (!state.running) break;
      const url = original.placeUrl;

      const anchor = Array.from(document.querySelectorAll('a[href]')).find(
        (a) => a.href === url
      );
      if (!anchor) continue;

      realClick(anchor);

      const pane = await waitForSoft(
        () => {
          const p = q(SEL.detailPane);
          return p && q(SEL.detailName, p) ? p : null;
        },
        { timeout: 8000 }
      );

      if (pane) {
        await sleep(s.detailDelay || 1400);
        const ficha = GMX.Extract.fromDetail(currentQuery());
        if (ficha) {
          ficha.placeUrl = url;
          ficha.cid = original.cid || ficha.cid;
          ficha.placeId = original.placeId || ficha.placeId;
          ficha.lat = ficha.lat != null ? ficha.lat : original.lat;
          ficha.lng = ficha.lng != null ? ficha.lng : original.lng;

          if (ficha.phone) original.phone = original.phone || ficha.phone;
          if (ficha.website) original.website = original.website || ficha.website;
          original.websiteChecked = true;

          state.buffer.push(ficha);
          if (ficha.phone) achou++;
          done++;
          GMX.Overlay.log(
            (ficha.phone ? 'tel ' : 's/tel ') + ficha.name.slice(0, 24)
          );
        }
      }

      await flush(false);
      GMX.Overlay.stats({ pct: (done / Math.max(1, alvos.length)) * 100 });

      history.back();
      await waitForSoft(() => q(SEL.feed), { timeout: 6000 });
      await sleep(400);
    }

    GMX.Overlay.log('Fichas abertas: ' + done + ' · telefones novos: ' + achou);
    await flush(true);
  }

  async function run(job) {
    if (state.running) return;
    state.running = true;
    state.stopReason = '';
    state.job = job;
    state.seen = new Set();
    state.buffer = [];
    state.total = 0;
    state.noSite = 0;

    GMX.Overlay.show();
    GMX.Overlay.setState('run');
    GMX.Overlay.log('Iniciando: ' + (currentQuery() || 'busca atual'));

    let aborted = false;
    try {
      if (GMX.Extract.isSinglePlacePage()) {
        await waitFor(() => q(SEL.detailName), { timeout: 15000, label: 'ficha' });
        push(GMX.Extract.fromDetail(currentQuery()));
        state.stopReason = 'Ficha unica capturada';
      } else {
        await scrapeFeed();

        reconcile();

        if (state.running) {
          if (state.job.settings.deepMode) await deepPass(false);
          else if (state.job.settings.fillContacts !== false) await deepPass(true);
        }

        reconcile();
      }

      await flush(true);
      GMX.Overlay.setState('done');
      GMX.Overlay.log('Concluido: ' + state.total + ' leads. ' + state.stopReason);
    } catch (err) {
      aborted = true;
      await flush(true);
      GMX.Overlay.setState('err');
      GMX.Overlay.log('Erro: ' + err.message);
      state.stopReason = 'Erro: ' + err.message;
    }

    state.running = false;

    await send(MSG.QUERY_DONE, {
      jobId: job.id,
      query: currentQuery(),
      total: state.total,
      noSite: state.noSite,
      reason: state.stopReason,
      aborted: aborted
    });
  }

  function stop(reason) {
    if (!state.running) return;
    state.running = false;
    state.stopReason = reason || 'Parado';
    GMX.Overlay.setState('done');
    GMX.Overlay.log(state.stopReason);
    flush(true);
    send(MSG.STOP, { fromContent: true });
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (!msg || !msg.type) return;
    switch (msg.type) {
      case MSG.START_HERE:
        run(msg.job);
        sendResponse({ ok: true });
        break;
      case MSG.STOP:
        stop('Interrompido');
        sendResponse({ ok: true });
        break;
      case 'PING':
        sendResponse({ ok: true, running: state.running, total: state.total });
        break;
      default:
        return;
    }
    return true;
  });

  (async function boot() {
    await sleep(1200);
    try {
      const res = await send(MSG.HELLO, { url: location.href });
      if (res && res.job && res.job.status === GMX.JOB_STATUS.RUNNING) {
        run(res.job);
      }
    } catch (_) {
    }
  })();

  function diagnose() {
    const feed = q(SEL.feed);
    const out = {
      feedEncontrado: !!feed,
      cardsVisiveis: feed ? qa(SEL.cardLink, feed).length : 0,
      respostasDeRede: GMX.NetIndex ? GMX.NetIndex.stats.responses : 'netparse ausente',
      lugaresNaRede: GMX.NetIndex ? GMX.NetIndex.stats.places : 0,
      telefonesNaRede: GMX.NetIndex ? GMX.NetIndex.stats.phones : 0,
      sitesNaRede: GMX.NetIndex ? GMX.NetIndex.stats.sites : 0
    };

    const a = feed ? qa(SEL.cardLink, feed)[0] : null;
    if (a) {
      const card = GMX.Extract.cardOf(a);
      out.primeiroCard = {
        cardRootCasou: SEL.cardRoot.some((s) => a.closest(s)),
        linksNoCard: Array.from(card.querySelectorAll('a[href]')).map((x) =>
          x.getAttribute('href').slice(0, 70)
        ),
        telefoneLidoDoDom: GMX.Extract.findPhone(card) || '(nada)',
        siteLidoDoDom: GMX.Extract.findWebsite(card) || '(nada)',
        leadFinal: GMX.Extract.fromCard(a, 'diagnostico')
      };
    }

    console.log('%c[Maps Lead Extractor] diagnostico', 'color:#30c48d;font-weight:bold');
    console.log(out);
    return out;
  }

  GMX.Scraper = { run, stop, state, reconcile };
  GMX.diagnose = diagnose;
})(typeof globalThis !== 'undefined' ? globalThis : self);
