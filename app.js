import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
import { CAKE } from './cake.js';
import { mountScene } from './anim.js';

const sb = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, detectSessionInUrl: true } });
const app = document.getElementById('app');
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const DIAS_C = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function pd(s) { const [y, m, d] = String(s).slice(0, 10).split('-').map(Number); return new Date(y, m - 1, d); }
const dm = s => { const d = pd(s); return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0'); };
const dia = s => DIAS[pd(s).getDay()];
const diaC = s => DIAS_C[pd(s).getDay()];
const hora = ts => new Date(ts).toLocaleString('pt-BR', { weekday: 'long', timeZone: 'America/Sao_Paulo' });

let toastT;
function toast(msg, bad) {
  const t = $('#toast'); t.textContent = msg; t.className = 'toast show' + (bad ? ' bad' : '');
  clearTimeout(toastT); toastT = setTimeout(() => t.className = 'toast', 3500);
}
const erro = e => (e && e.message) ? e.message : 'Algo deu errado. Tente de novo.';

async function home() {
  const { data, error } = await sb.rpc('get_home');
  if (error) throw error;
  return data;
}

function whenText(c) {
  if (c.days_left === 0) return 'É hoje!';
  if (c.days_left === 1) return 'Amanhã';
  return 'Em ' + c.days_left + ' dias';
}

/* ---------- Início ---------- */
const BTN_VOTE = '<a class="btn" href="#/votar">Votar nos sabores</a>';
function heroState(h) {
  const c = h.current, v = h.vote, cel = h.celebrate;
  const quando = `${dia(c.cake_date)}, ${dm(c.cake_date)}`;
  if (cel) {
    const chip = c.moved ? ' <span class="chip warn">feriado</span>' : '';
    return cel.round_end
      ? { scene: 'round', opts: { round: h.round }, kick: `Fim da rodada ${cel.round}! Obrigado,`, name: cel.name,
          when: `A rodada ${h.round} começa com ${esc(c.name)}, ${dm(c.cake_date)}${chip}`, btn: v.is_open ? BTN_VOTE : '',
          label: 'Bolo grande com vela acesa comemorando a nova rodada' }
      : { scene: 'party', kick: 'O bolo chegou! Obrigado,', name: cel.name,
          when: `Próxima vez: ${esc(c.name)}, ${quando}${chip}`, btn: v.is_open ? BTN_VOTE : '',
          label: 'Colegas comendo os bolos em volta da mesa com confete' };
  }
  const base = { kick: 'A vez de trazer os dois bolos é de', name: c.name, when: `${quando} · ${whenText(c)}` };
  if (c.can_confirm) return { ...base, scene: 'wait', btn: '<a class="btn" href="#/confirmar">O bolo chegou</a>',
    label: 'Colegas esperam na porta e o motoboy chega com o bolo' };
  if (v.is_open) {
    const horas = (new Date(v.closes_at) - Date.now()) / 36e5;
    if (horas <= 24) return { ...base, scene: 'urgent', btn: BTN_VOTE,
      when: `Votação fecha ${horas < 12 ? 'hoje' : 'em menos de 24h'}, ${esc(hora(v.closes_at))} às 12h`,
      label: 'Chef corre com o bolo, tropeça e cai de cara no bolo' };
    return { ...base, scene: 'vote', btn: BTN_VOTE, label: 'Chef com o bolo apontando para o botão de votar' };
  }
  const top = v.flavors.filter(f => f.votes > 0).sort((a, b) => b.votes - a.votes).slice(0, 2).map(f => esc(f.name));
  return { ...base, scene: 'moto', opts: { day: pd(c.cake_date).getDay() === 4 ? 'QUINTA' : 'SEXTA' },
    extra: top.length ? `<p class="sabores">Sabores escolhidos: ${top.join(' e ')}</p>` : '',
    label: 'Motoboy pilotando com os dois bolos na garupa' };
}

async function viewHome() {
  const h = await home(), c = h.current, v = h.vote;
  const maxV = Math.max(1, ...v.flavors.map(f => f.votes));
  const pct = h.progress.total ? Math.round(h.progress.done / h.progress.total * 100) : 0;
  const feriado = c.moved ? `<div class="banner">Semana de feriado${c.holiday ? ' (' + esc(c.holiday) + ')' : ''}: o bolo passa para ${dia(c.cake_date)}, ${dm(c.cake_date)}.</div>` : '';
  const hs = heroState(h);
  app.innerHTML = `
  <section class="hero">
    <div>
      <div class="kick">${hs.kick}</div>
      <div class="name">${esc(hs.name)}</div>
      <div class="when">${hs.when}</div>
      ${hs.extra || ''}
      ${hs.btn ? `<p style="margin:16px 0 0">${hs.btn}</p>` : ''}
    </div>
    <div><canvas id="scene" role="img" aria-label="${esc(hs.label)}"></canvas></div>
  </section>
  ${feriado}
  <div class="grid">
    <section class="card">
      <h2>Votação de sabores</h2>
      <p class="muted" style="margin-top:-6px">${v.is_open ? 'Aberta até ' + esc(hora(v.closes_at)) + ' às 12h. Cada pessoa escolhe 2 sabores e os 2 mais votados vencem.' : 'Votação encerrada. Os 2 mais votados venceram.'}</p>
      <div class="fl">${v.flavors.map(f => `<div class="row"><span>${esc(f.name)}</span><b>${f.votes}</b><div class="bar"><i style="width:${Math.round(f.votes / maxV * 100)}%"></i></div></div>`).join('')}</div>
      <p class="muted">${v.total_votes} de ${v.total_people} pessoas votaram.</p>
      ${v.is_open ? '<a class="btn" href="#/votar">Votar agora</a>' : ''}
    </section>
    <section class="card">
      <h2>Rodada ${h.round}</h2>
      <p class="muted" style="margin-top:-6px">${h.progress.done} de ${h.progress.total} pessoas já trouxeram.</p>
      <div class="bar"><i style="width:${pct}%"></i></div>
      <h2 style="margin-top:20px">Próximas na fila</h2>
      <ol class="list">${h.upcoming.map(u => `<li><span class="num">${u.pos}</span><span>${esc(u.name)}</span><span class="sub">${diaC(u.cake_date)} ${dm(u.cake_date)}${u.moved ? '<br><span class="chip warn">' + esc(u.holiday || 'Feriado') + '</span>' : ''}</span></li>`).join('')}</ol>
    </section>
    <section class="card full">
      <h2>Quem já trouxe nesta rodada</h2>
      ${h.history.length ? `<ul class="list">${h.history.map(p => `<li class="done"><span class="num">${p.pos}</span><span>${esc(p.name)}</span><span class="sub">${p.cake_date ? dm(p.cake_date) : ''}</span></li>`).join('')}</ul>` : '<p class="muted">Ninguém ainda.</p>'}
    </section>
  </div>`;
  mountScene($('#scene'), hs.scene, hs.opts);
}

/* ---------- Votar ---------- */
async function viewVotar() {
  const [h, pr] = await Promise.all([home(), sb.from('people').select('id,name,pos').eq('active', true).order('pos')]);
  if (pr.error) throw pr.error;
  const v = h.vote;
  const ord = () => v.flavors.sort((a, b) => (a.is_free - b.is_free) || ((a.sort ?? 50) - (b.sort ?? 50)) || a.name.localeCompare(b.name, 'pt-BR'));
  if (!v.is_open) {
    app.innerHTML = `<div class="narrow card"><h1>Votação encerrada</h1><p class="muted">Os sabores de ${dia(v.cake_date)}, ${dm(v.cake_date)}, já foram escolhidos. A próxima votação abre ${esc(hora(v.opens_at))} às 12h.</p><a class="btn" href="#/">Ver resultado</a></div>`;
    return;
  }
  let person = '', picked = [];
  const draw = (msg) => {
    const full = picked.length >= 2;
    const nome = pr.data.find(p => p.id === person)?.name;
    app.innerHTML = `<div class="narrow card"><h1>Votar nos sabores</h1>
      <p class="muted">Bolo de ${dia(v.cake_date)}, ${dm(v.cake_date)}. Como são dois bolos, cada pessoa escolhe <b>2 sabores diferentes</b>.</p>
      <div class="note">Vote só por você. Esta votação funciona na confiança, então por favor seja honesto e não vote por outra pessoa.</div>
      <label for="p">Seu nome</label>
      <select id="p"><option value="">Escolha seu nome</option>${pr.data.map(p => `<option value="${p.id}" ${p.id === person ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select>
      <label>Sabores <span class="muted">(${picked.length} de 2)</span></label>
      <div class="opts">${ord().map(f => { const on = picked.includes(f.id); return `<label class="opt ${on ? 'sel' : ''}" style="margin:0;${!on && full ? 'opacity:.5' : ''}"><input type="checkbox" value="${f.id}" ${on ? 'checked' : ''} ${!on && full ? 'disabled' : ''}>${esc(f.name)}</label>`; }).join('')}</div>
      <label for="sg">Não achou o sabor? Sugira</label>
      <div class="inline"><input id="sg" maxlength="40" placeholder="Ex.: Prestígio"><button class="btn sec" id="sgb" type="button">Sugerir</button></div>
      ${nome ? `<p class="muted" style="margin:18px 0 0">Você está votando como <b>${esc(nome)}</b>.</p>` : ''}
      <p style="margin-top:12px"><button class="btn big" id="ok" ${person && full ? '' : 'disabled'}>Confirmar votos</button></p>
      <div class="err" id="er">${esc(msg || '')}</div></div>`;
    $('#p').onchange = e => { person = e.target.value; draw(); };
    app.querySelectorAll('.opts input').forEach(r => r.onchange = e => {
      const id = e.target.value;
      picked = e.target.checked ? (picked.includes(id) || picked.length >= 2 ? picked : [...picked, id]) : picked.filter(x => x !== id);
      draw();
    });
    $('#sgb').onclick = async () => {
      const n = $('#sg').value.trim(); if (!n) return;
      const { error } = await sb.rpc('suggest_flavor', { p_name: n });
      if (error) return toast(erro(error), true);
      const f = await sb.from('flavors').select('id,name').order('name');
      const novo = (f.data || []).find(x => x.name.toLowerCase() === n.toLowerCase());
      if (novo && !v.flavors.some(x => x.id === novo.id)) v.flavors.push({ id: novo.id, name: novo.name, votes: 0, sort: 50, is_free: false });
      if (novo && picked.length < 2 && !picked.includes(novo.id)) picked.push(novo.id);
      toast('Sabor adicionado à lista.'); draw();
    };
    $('#ok').onclick = async () => {
      $('#ok').disabled = true;
      const { error } = await sb.rpc('cast_votes', { p_person_id: person, p_flavor_ids: picked });
      if (error) { draw(error.message); return; }
      const fn = picked.map(id => v.flavors.find(f => f.id === id)?.name);
      app.innerHTML = `<div class="narrow ok-box"><h1>Votos registrados</h1><p>${esc(nome)}, seus votos em <b>${esc(fn[0])}</b> e <b>${esc(fn[1])}</b> foram contados.</p><a class="btn" href="#/">Ver resultado</a></div>`;
    };
  };
  draw();
}

/* ---------- Confirmar ---------- */
async function viewConfirmar() {
  const h = await home(), c = h.current;
  if (!c.can_confirm) {
    app.innerHTML = `<div class="narrow card"><h1>Ainda não é dia do bolo</h1><p class="muted">A vez de ${esc(c.name)} é ${dia(c.cake_date)}, ${dm(c.cake_date)}. A confirmação abre nesse dia.</p><a class="btn" href="#/">Voltar</a></div>`;
    return;
  }
  app.innerHTML = `<div class="narrow card" style="text-align:center"><div style="max-width:260px;margin:0 auto">${CAKE}</div>
    <h1>O bolo de ${esc(c.name)} chegou?</h1>
    <p class="muted">Qualquer pessoa pode confirmar. Isso passa a vez para a próxima da fila.</p>
    <button class="btn big" id="go">Sim, o bolo chegou</button><div class="err" id="er"></div></div>`;
  $('#go').onclick = async () => {
    $('#go').disabled = true;
    const { data, error } = await sb.rpc('confirm_arrival');
    if (error) { $('#er').textContent = erro(error); $('#go').disabled = false; return; }
    const n = data?.current?.name;
    app.innerHTML = `<div class="narrow ok-box"><h1>Bolo confirmado</h1><p>${n ? 'Próxima vez: <b>' + esc(n) + '</b>, ' + dia(data.current.cake_date) + ' ' + dm(data.current.cake_date) + '.' : 'Vez passada para a próxima pessoa.'}</p><a class="btn" href="#/">Ver a fila</a></div>`;
  };
}

/* ---------- Organizar ---------- */
async function viewOrganizar() {
  const { data: s } = await sb.auth.getSession();
  if (!s.session) return loginView();
  const h = await home();
  if (!h.organizer) {
    app.innerHTML = `<div class="narrow card"><h1>Sem permissão</h1><p class="muted">Este e-mail não é de quem organiza.</p><button class="btn sec" id="out">Sair</button></div>`;
    $('#out').onclick = async () => { await sb.auth.signOut(); route(); };
    return;
  }
  const [pr, hol, fl] = await Promise.all([
    sb.from('people').select('id,name,pos,active').order('pos'),
    sb.from('holidays').select('day,name,scope').gte('day', new Date().toISOString().slice(0, 10)).order('day'),
    sb.from('flavors').select('id,name,sort,is_free').order('is_free').order('sort').order('name')]);
  const cur = h.current.id;
  const ativos = pr.data.filter(p => p.active), arq = pr.data.filter(p => !p.active);
  app.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><h1>Organizar</h1><button class="btn sec sm" id="out">Sair</button></div>
  <div class="grid">
    <section class="card"><h2>Fila</h2><ol class="list">${ativos.map((p, i) => `<li><span class="num">${i + 1}</span><span>${esc(p.name)} ${p.id === cur ? '<span class="chip">da vez</span>' : ''}</span>
      <span class="rm acts">
        <button class="btn sec sm" data-up="${p.id}" ${i === 0 ? 'disabled' : ''} aria-label="Subir ${esc(p.name)}">↑</button>
        <button class="btn sec sm" data-down="${p.id}" ${i === ativos.length - 1 ? 'disabled' : ''} aria-label="Descer ${esc(p.name)}">↓</button>
        <button class="btn sec sm" data-ren="${p.id}" data-name="${esc(p.name)}">Editar</button>
        <button class="btn danger sm" data-skip="${p.id}">Pular</button>
        <button class="btn danger sm" data-arq="${p.id}" data-name="${esc(p.name)}">Arquivar</button>
      </span></li>`).join('')}</ol>
      <label for="np">Adicionar pessoa</label>
      <div class="inline"><input id="np" maxlength="60" placeholder="Nome"></div>
      <label for="na">Posição na fila</label>
      <select id="na"><option value="">No fim da fila</option>${ativos.map(p => `<option value="${p.id}">Depois de ${esc(p.name)}</option>`).join('')}</select>
      <p><button class="btn" id="npb">Adicionar</button></p>
      ${arq.length ? `<h2 style="margin-top:20px">Arquivadas</h2><ul class="list">${arq.map(p => `<li><span>${esc(p.name)}</span><button class="btn sec sm rm" data-res="${p.id}">Voltar para a fila</button></li>`).join('')}</ul>` : ''}
    </section>
    <div style="display:grid;gap:16px;align-content:start">
      <section class="card"><h2>Limpar voto</h2><p class="muted" style="margin-top:-6px">Use se alguém votou no nome de outra pessoa. A pessoa poderá votar de novo.</p>
        <select id="cv"><option value="">Escolha a pessoa</option>${ativos.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select>
        <p><button class="btn danger" id="cvb">Limpar voto</button></p></section>
      <section class="card"><h2>Feriados locais e extras</h2>
        <ul class="list">${hol.data.map(x => `<li><span><b>${dm(x.day)}</b> ${esc(x.name)}</span><span class="chip">${x.scope === 'local' ? 'local' : 'nacional'}</span><button class="btn danger sm" data-hol="${x.day}">Remover</button></li>`).join('')}</ul>
        <label for="hd">Novo feriado</label>
        <div class="inline"><input id="hd" type="date"><input id="hn" maxlength="60" placeholder="Nome"></div>
        <p><button class="btn" id="hb">Adicionar feriado</button></p></section>
      <section class="card"><h2>Sabores</h2>
        <ul class="list">${fl.data.map(f => `<li><span>${esc(f.name)}</span>${f.is_free ? '<span class="chip rm">fixa</span>' : `<button class="btn danger sm rm" data-fl="${f.id}">Remover</button>`}</li>`).join('')}</ul></section>
    </div></div>`;
  const run = async (p, ok) => { const { error } = await p; if (error) return toast(erro(error), true); toast(ok); route(); };
  const on = (sel, fn) => app.querySelectorAll(sel).forEach(fn);
  $('#out').onclick = async () => { await sb.auth.signOut(); route(); };
  on('[data-up]', b => b.onclick = () => run(sb.rpc('move_person', { p_person_id: b.dataset.up, p_dir: -1 }), 'Fila atualizada.'));
  on('[data-down]', b => b.onclick = () => run(sb.rpc('move_person', { p_person_id: b.dataset.down, p_dir: 1 }), 'Fila atualizada.'));
  on('[data-ren]', b => b.onclick = () => { const n = prompt('Novo nome', b.dataset.name); if (n && n.trim() && n.trim() !== b.dataset.name) run(sb.rpc('rename_person', { p_person_id: b.dataset.ren, p_name: n }), 'Nome atualizado.'); });
  on('[data-skip]', b => b.onclick = () => { if (confirm('Pular esta pessoa? Ela troca de lugar com a próxima e volta na vez seguinte.')) run(sb.rpc('skip_person', { p_person_id: b.dataset.skip }), 'Pessoa pulada.'); });
  on('[data-arq]', b => b.onclick = () => { if (confirm('Arquivar ' + b.dataset.name + '? Sai da fila e da lista de votos. O histórico é mantido e dá para voltar depois.')) run(sb.rpc('archive_person', { p_person_id: b.dataset.arq }), 'Pessoa arquivada.'); });
  on('[data-res]', b => b.onclick = () => run(sb.rpc('restore_person', { p_person_id: b.dataset.res }), 'Pessoa de volta no fim da fila.'));
  on('[data-hol]', b => b.onclick = () => run(sb.rpc('remove_holiday', { p_day: b.dataset.hol }), 'Feriado removido.'));
  on('[data-fl]', b => b.onclick = () => run(sb.rpc('remove_flavor', { p_id: b.dataset.fl }), 'Sabor removido.'));
  $('#npb').onclick = () => { const n = $('#np').value.trim(); if (n) run(sb.rpc('add_person', { p_name: n, p_after: $('#na').value || null }), 'Pessoa adicionada.'); };
  $('#cvb').onclick = () => { const id = $('#cv').value; if (id) run(sb.rpc('clear_vote', { p_person_id: id }), 'Voto removido.'); else toast('Escolha a pessoa.', true); };
  $('#hb').onclick = () => { const d = $('#hd').value, n = $('#hn').value.trim(); if (d && n) run(sb.rpc('add_holiday', { p_day: d, p_name: n }), 'Feriado adicionado.'); else toast('Preencha data e nome.', true); };
}

function loginView() {
  app.innerHTML = `<div class="narrow card"><h1>Entrar para organizar</h1><p class="muted">Só quem organiza precisa entrar. Enviamos um link para o seu e-mail.</p>
    <label for="em">E-mail</label><input id="em" type="email" autocomplete="email" placeholder="voce@exemplo.com">
    <p><button class="btn big" id="lg">Enviar link de acesso</button></p><div class="err" id="er"></div></div>`;
  $('#lg').onclick = async () => {
    const email = $('#em').value.trim(); if (!email) return;
    const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + location.pathname } });
    try { localStorage.setItem('goOrg', '1'); } catch (e) {}
    if (error) { $('#er').textContent = erro(error); return; }
    app.innerHTML = `<div class="narrow ok-box"><h1>Link enviado</h1><p>Abra o e-mail e clique no link para entrar.</p></div>`;
  };
}

/* ---------- Rotas ---------- */
const routes = { home: viewHome, votar: viewVotar, confirmar: viewConfirmar, organizar: viewOrganizar };
async function route() {
  const r = (location.hash.replace(/^#\/?/, '').split(/[?&]/)[0]) || 'home';
  const key = routes[r] ? r : 'home';
  document.querySelectorAll('.nav a').forEach(a => a.classList.toggle('on', a.dataset.r === key));
  try { await routes[key](); }
  catch (e) { app.innerHTML = `<div class="narrow card"><h1>Não foi possível carregar</h1><p class="muted">${esc(erro(e))}</p><button class="btn" onclick="location.reload()">Tentar de novo</button></div>`; }
}
window.addEventListener('hashchange', route);
sb.auth.onAuthStateChange((ev) => {
  if (ev !== 'SIGNED_IN') return;
  let go = false; try { go = localStorage.getItem('goOrg') === '1'; localStorage.removeItem('goOrg'); } catch (e) {}
  if (go) { location.hash = '#/organizar'; } else if (location.hash.startsWith('#/organizar')) route();
});
route();
setInterval(() => { if (!document.hidden && ['', '#/', '#'].includes(location.hash) && !document.activeElement?.closest('input,select')) route(); }, 60000);
