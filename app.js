import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
import { CAKE } from './cake.js';

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
const hora = ts => new Date(ts).toLocaleString('pt-BR', { weekday: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });

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
async function viewHome() {
  const h = await home(), c = h.current, v = h.vote;
  const maxV = Math.max(1, ...v.flavors.map(f => f.votes));
  const pct = h.progress.total ? Math.round(h.progress.done / h.progress.total * 100) : 0;
  const feriado = c.moved ? `<div class="banner">Semana de feriado${c.holiday ? ' (' + esc(c.holiday) + ')' : ''}: o bolo passa para ${dia(c.cake_date)}, ${dm(c.cake_date)}.</div>` : '';
  app.innerHTML = `
  <section class="hero">
    <div>
      <div class="kick">A vez de trazer os dois bolos é de</div>
      <div class="name">${esc(c.name)}</div>
      <div class="when">${dia(c.cake_date)}, ${dm(c.cake_date)} · ${whenText(c)}</div>
      <p style="margin:16px 0 0">${c.can_confirm ? '<a class="btn" href="#/confirmar">O bolo chegou</a>' : '<a class="btn" href="#/votar">Votar no sabor</a>'}</p>
    </div>
    <div>${CAKE}</div>
  </section>
  ${feriado}
  <div class="grid">
    <section class="card">
      <h2>Votação de sabores</h2>
      <p class="muted" style="margin-top:-6px">${v.is_open ? 'Aberta até ' + esc(hora(v.closes_at)) + ' às 12h. Os 2 mais votados vencem.' : 'Votação encerrada. Os 2 mais votados venceram.'}</p>
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
}

/* ---------- Votar ---------- */
async function viewVotar() {
  const [h, pr] = await Promise.all([home(), sb.from('people').select('id,name,pos').order('pos')]);
  if (pr.error) throw pr.error;
  const v = h.vote;
  if (!v.is_open) {
    app.innerHTML = `<div class="narrow card"><h1>Votação encerrada</h1><p class="muted">Os sabores de ${dia(v.cake_date)}, ${dm(v.cake_date)}, já foram escolhidos. A próxima votação abre ${esc(hora(v.opens_at))} às 12h.</p><a class="btn" href="#/">Ver resultado</a></div>`;
    return;
  }
  let person = '', flavor = '';
  const draw = (msg) => {
    app.innerHTML = `<div class="narrow card"><h1>Votar no sabor</h1>
      <p class="muted">Bolo de ${dia(v.cake_date)}, ${dm(v.cake_date)}. Cada pessoa vota uma vez.</p>
      <label for="p">Seu nome</label>
      <select id="p"><option value="">Escolha seu nome</option>${pr.data.map(p => `<option value="${p.id}" ${p.id === person ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select>
      <label>Sabor</label>
      <div class="opts">${v.flavors.map(f => `<label class="opt ${f.id === flavor ? 'sel' : ''}" style="margin:0"><input type="radio" name="f" value="${f.id}" ${f.id === flavor ? 'checked' : ''}>${esc(f.name)}</label>`).join('')}</div>
      <label for="sg">Não achou o sabor? Sugira</label>
      <div class="inline"><input id="sg" maxlength="60" placeholder="Ex.: Prestígio"><button class="btn sec" id="sgb" type="button">Sugerir</button></div>
      <p style="margin-top:18px"><button class="btn big" id="ok" ${person && flavor ? '' : 'disabled'}>Confirmar voto</button></p>
      <div class="err" id="er">${esc(msg || '')}</div></div>`;
    $('#p').onchange = e => { person = e.target.value; draw(); };
    app.querySelectorAll('input[name=f]').forEach(r => r.onchange = e => { flavor = e.target.value; draw(); });
    $('#sgb').onclick = async () => {
      const n = $('#sg').value.trim(); if (!n) return;
      const { error } = await sb.rpc('suggest_flavor', { p_name: n });
      if (error) return toast(erro(error), true);
      const f = await sb.from('flavors').select('id,name').order('suggested').order('name');
      const novo = (f.data || []).find(x => x.name.toLowerCase() === n.toLowerCase());
      if (novo && !v.flavors.some(x => x.id === novo.id)) v.flavors.push({ id: novo.id, name: novo.name, votes: 0 });
      if (novo) flavor = novo.id;
      toast('Sabor adicionado à lista.'); draw();
    };
    $('#ok').onclick = async () => {
      $('#ok').disabled = true;
      const { error } = await sb.rpc('cast_vote', { p_person_id: person, p_flavor_id: flavor });
      if (error) { draw(error.message); return; }
      const nome = pr.data.find(p => p.id === person)?.name, fn = v.flavors.find(f => f.id === flavor)?.name;
      app.innerHTML = `<div class="narrow ok-box"><h1>Voto registrado</h1><p>${esc(nome)}, seu voto em <b>${esc(fn)}</b> foi contado.</p><a class="btn" href="#/">Ver resultado</a></div>`;
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
    sb.from('people').select('id,name,pos').order('pos'),
    sb.from('holidays').select('day,name,scope').gte('day', new Date().toISOString().slice(0, 10)).order('day'),
    sb.from('flavors').select('id,name').order('name')]);
  const cur = h.current.id;
  app.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><h1>Organizar</h1><button class="btn sec sm" id="out">Sair</button></div>
  <div class="grid">
    <section class="card"><h2>Fila</h2><ol class="list">${pr.data.map(p => `<li><span class="num">${p.pos}</span><span>${esc(p.name)} ${p.id === cur ? '<span class="chip">da vez</span>' : ''}</span><button class="btn danger sm rm" data-skip="${p.id}">Pular</button></li>`).join('')}</ol>
      <label for="np">Adicionar pessoa (vai para o fim da fila)</label>
      <div class="inline"><input id="np" maxlength="60" placeholder="Nome"><button class="btn" id="npb">Adicionar</button></div></section>
    <div style="display:grid;gap:16px;align-content:start">
      <section class="card"><h2>Feriados locais e extras</h2>
        <ul class="list">${hol.data.map(x => `<li><span><b>${dm(x.day)}</b> ${esc(x.name)}</span><span class="chip">${x.scope === 'local' ? 'local' : 'nacional'}</span><button class="btn danger sm" data-hol="${x.day}">Remover</button></li>`).join('')}</ul>
        <label for="hd">Novo feriado</label>
        <div class="inline"><input id="hd" type="date"><input id="hn" maxlength="60" placeholder="Nome"></div>
        <p><button class="btn" id="hb">Adicionar feriado</button></p></section>
      <section class="card"><h2>Sabores</h2>
        <ul class="list">${fl.data.map(f => `<li><span>${esc(f.name)}</span><button class="btn danger sm rm" data-fl="${f.id}">Remover</button></li>`).join('')}</ul></section>
    </div></div>`;
  const run = async (p, ok) => { const { error } = await p; if (error) return toast(erro(error), true); toast(ok); route(); };
  $('#out').onclick = async () => { await sb.auth.signOut(); route(); };
  app.querySelectorAll('[data-skip]').forEach(b => b.onclick = () => { if (confirm('Pular esta pessoa? Ela troca de lugar com a próxima e volta na vez seguinte.')) run(sb.rpc('skip_person', { p_person_id: b.dataset.skip }), 'Pessoa pulada.'); });
  app.querySelectorAll('[data-hol]').forEach(b => b.onclick = () => run(sb.rpc('remove_holiday', { p_day: b.dataset.hol }), 'Feriado removido.'));
  app.querySelectorAll('[data-fl]').forEach(b => b.onclick = () => run(sb.rpc('remove_flavor', { p_id: b.dataset.fl }), 'Sabor removido.'));
  $('#npb').onclick = () => { const n = $('#np').value.trim(); if (n) run(sb.rpc('add_person', { p_name: n }), 'Pessoa adicionada.'); };
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
