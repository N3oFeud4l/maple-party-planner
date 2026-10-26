(() => {
  'use strict';

  const STORE = 'maple_party_planner_web_v03';
  const OLD_STORE = 'maple_party_planner_web_v02';
  const LEVELS = [{ n: 100, label: '최소컷' }, { n: 110, label: '기본 배율' }, { n: 130, label: '메청년 비율' }, { n: 150, label: '메린이 비율' }, { n: 200, label: '메애기 비율' }];
  // 보스/난이도 목록은 코드에 정적으로 두며 필요시 유지보수할 수 있습니다.
  const BOSS_GROUPS = [
    ['주간', '자쿰', ['카오스']], ['주간', '매그너스', ['하드']],
    ['주간', '힐라', ['하드']], ['주간', '파풀라투스', ['카오스']],
    ['주간', '피에르', ['카오스']], ['주간', '반반', ['카오스']],
    ['주간', '블러디 퀸', ['카오스']], ['주간', '벨룸', ['카오스']],
    ['주간', '스우', ['노멀', '하드', '익스트림']], ['주간', '데미안', ['노멀', '하드']],
    ['주간', '가디언 엔젤 슬라임', ['노멀', '카오스']],
    ['주간', '루시드', ['이지', '노멀', '하드']],
    ['주간', '윌', ['이지', '노멀', '하드']],
    ['주간', '더스크', ['노멀', '카오스']],
    ['주간', '진 힐라', ['노멀', '하드']],
    ['주간', '듄켈', ['노멀', '하드']],
    ['주간', '선택받은 세렌', ['노멀', '하드', '익스트림']],
    ['주간', '감시자 칼로스', ['이지', '노멀', '카오스', '익스트림']],
    ['주간', '최초의 대적자', ['이지', '노멀', '하드', '익스트림']],
    ['주간', '카링', ['이지', '노멀', '하드', '익스트림']],
    ['주간', '벨로나', ['이지', '노멀', '하드']],
    ['주간', '찬란한 흉성', ['노멀', '하드']],
    ['주간', '림보', ['노멀', '하드', '익스트림']],
    ['주간', '발드릭스', ['노멀', '하드', '익스트림']],
    ['주간', '유피테르', ['노멀', '하드']],
    ['월간', '검은 마법사', ['하드', '익스트림']]
  ];
  const ALL_BOSSES = BOSS_GROUPS.flatMap(([period, boss, diffs]) => diffs.map(diff => ({ key: `${period}|${boss}|${diff}`, period, boss, diff, title: `${diff} ${boss}` })));
  const BOSS_BY_ID = new Map(ALL_BOSSES.map(x => [x.key, x]));
  const $ = id => document.getElementById(id);
  const id = () => crypto?.randomUUID?.() || `id_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const html = s => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
  const short = (s, n = 40) => String(s ?? '').trim().slice(0, n);
  const httpsUrl = raw => { try { const u = new URL(raw); return u.protocol === 'https:' ? u.href : ''; } catch { return ''; } };
  const valuePercent = raw => { if (raw === '' || raw === null || raw === undefined) return null; const n = Number(raw); return Number.isFinite(n) && n > 0 && n <= 100000 ? Math.round(n * 100) / 100 : null; };
  const powerString = power => Number.isFinite(Number(power)) && Number(power) > 0 ? Math.round(Number(power)).toLocaleString('ko-KR') : '미조회';
  const percentString = v => `${Number(v).toLocaleString('ko-KR', {maximumFractionDigits:2})}%`;
  const showTime = (percent, threshold) => { const seconds = Math.round(1200 * threshold / percent); return percent > 0 && Number.isFinite(seconds) ? `${Math.floor(seconds / 60).toLocaleString('ko-KR')}분 ${String(seconds % 60).padStart(2, '0')}초` : '—'; };
  function defaultState() { const p = id(); return { version: 3, owners: [{ id: id(), name: '나', characters: [] }], parties: [{ id: p, name: '파티 1', capacity: 6, memberIds: [] }], selectedParty: p, bossKey: '주간|벨로나|노멀', level: 110, proxyUrl: '' }; }

  function parseState(raw) {
    if (!raw || !Array.isArray(raw.owners) || !Array.isArray(raw.parties)) throw Error('유효한 캐릭터·파티 백업이 아닙니다.');
    if (raw.owners.length > 100 || raw.parties.length > 100) throw Error('허용된 목록 크기를 초과했습니다.');
    const seen = new Set();
    const owners = raw.owners.map(o => ({
      id: short(o.id, 100) || id(), name: short(o.name, 30) || '사용자',
      characters: (Array.isArray(o.characters) ? o.characters : []).slice(0, 200).map(c => {
        const charId = short(c.id, 100) || id();
        if (seen.has(charId)) throw Error('캐릭터 ID가 중복됩니다.');
        seen.add(charId);
        const ratios = {};
        for (const [key, val] of Object.entries(c.ratios && typeof c.ratios === 'object' && !Array.isArray(c.ratios) ? c.ratios : {})) {
          const n = valuePercent(val);
          if (BOSS_BY_ID.has(key) && n !== null) ratios[key] = n;
        }
        return { id: charId, name: short(c.name, 30), kind: c.kind === 'alt' ? 'alt' : 'main', image: httpsUrl(c.image || c.avatar), job: short(c.job, 40), world: short(c.world, 40), level: Math.min(1000, Math.max(0, Number(c.level) || 0)), combatPower: Math.max(0, Number(c.combatPower) || 0), fetchedAt: short(c.fetchedAt, 50), ratios };
      }).filter(c => c.name)
    }));
    if (!owners.length) owners.push({ id: id(), name: '나', characters: [] });
    const parties = raw.parties.map(p => ({
      id: short(p.id, 100) || id(), name: short(p.name, 40) || '파티',
      capacity: Math.min(6, Math.max(1, Math.round(Number(p.capacity) || 6))),
      memberIds: [...new Set((Array.isArray(p.memberIds) ? p.memberIds : []).filter(x => seen.has(x)))].slice(0, Math.min(6, Math.max(1, Math.round(Number(p.capacity) || 6))))
    }));
    if (!parties.length) parties.push({ id: id(), name: '파티 1', capacity: 6, memberIds: [] });
    return { version: 3, owners, parties, selectedParty: parties.some(p => p.id === raw.selectedParty) ? raw.selectedParty : parties[0].id, bossKey: BOSS_BY_ID.has(raw.bossKey) ? raw.bossKey : '주간|벨로나|노멀', level: LEVELS.some(x => x.n === Number(raw.level)) ? Number(raw.level) : 110, proxyUrl: httpsUrl(raw.proxyUrl) };
  }
  function migrateV02(raw) {
    return parseState({
      owners: raw.owners.map(o => ({ ...o, characters: o.characters.map(c => ({ ...c, image: c.avatar, ratios: {} })) })),
      parties: raw.parties.map(p => ({ id: p.id, name: p.name, capacity: 6, memberIds: p.memberIds })),
      selectedParty: raw.quickPartyId, level: raw.level
    });
  }
  let migrated = false;
  function load() {
    try { const s = localStorage.getItem(STORE); if (s) return parseState(JSON.parse(s));
      const old = localStorage.getItem(OLD_STORE); if (old) { migrated = true; return migrateV02(JSON.parse(old)); }
    } catch(e) { console.error('로컬 데이터 오류',e); }
    return defaultState();
  }
  let state = load();
  let expandedId = null;
  let charPeriod = new Map();
  let rosterFilter = '';
  let lookupResult = null;
  let toastTimer;
  const currentParty = () => state.parties.find(p => p.id === state.selectedParty) || state.parties[0];
  const findCharacter = charId => { for (const owner of state.owners) { const character = owner.characters.find(c => c.id === charId); if (character) return { character, owner }; } return null; };
  const totalChars = () => state.owners.reduce((acc, o) => acc + o.characters.length, 0);
  function save() { try { localStorage.setItem(STORE, JSON.stringify(state)); $('saveStatus').textContent = '브라우저에 저장'; } catch(e) { $('saveStatus').textContent = '저장 실패'; toast('저장 실패: 저장 공간을 확인하고 JSON으로 백업하세요.'); console.error(e); } }
  function toast(msg) { const el = $('toast'); el.textContent = msg; el.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 3100); }
  function avatar(ch) { return `<span class="avatar"><span class="placeholder" aria-hidden="true">✦</span>${ch.image ? `<img src="${html(httpsUrl(ch.image))}" loading="lazy" referrerpolicy="no-referrer" alt="${html(ch.name)} 캐릭터 이미지" onerror="this.remove()">` : ''}</span>`; }
  function charBrief(ch) { return [ch.job, ch.level ? `Lv.${ch.level}` : '', ch.world].filter(Boolean).map(html).join(' · ') || '직업·레벨 미등록'; }
  function renderOwnerSelect() { const prev = $('ownerSelect').value; $('ownerSelect').innerHTML = state.owners.map(o => `<option value="${html(o.id)}">${html(o.name)}</option>`).join(''); if (state.owners.some(o => o.id === prev)) $('ownerSelect').value = prev; }
  function selectedBossLabel() { const b = BOSS_BY_ID.get(state.bossKey); return b ? b.title : '보스 미선택'; }

  function bossEditor(ch) {
    const period = charPeriod.get(ch.id) || '주간';
    const sets = BOSS_GROUPS.filter(x => x[0] === period);
    return `<div class="ratio-editor" data-editor="${html(ch.id)}">
      <div class="ratio-editor-head"><div class="tabs"><button type="button" data-action="period" data-id="${html(ch.id)}" data-period="주간" class="tab ${period === '주간' ? 'active' : ''}">주간 보스</button><button type="button" data-action="period" data-id="${html(ch.id)}" data-period="월간" class="tab ${period === '월간' ? 'active' : ''}">월간 보스</button></div><input class="boss-filter" data-boss-filter="${html(ch.id)}" type="search" placeholder="보스명 검색" aria-label="보스 이름 필터"></div>
      <div class="boss-list">${sets.map(([_, boss, diffs]) => {
        const keys = diffs.map(diff => `${period}|${boss}|${diff}`);
        const count = keys.filter(key => valuePercent(ch.ratios[key]) !== null).length;
        return `<details class="boss-group" data-boss-group="${html(boss)}"><summary>${html(boss)} <span class="boss-count">${count ? `${count}개 입력됨` : ''}</span></summary><div class="boss-difficulties">${diffs.map(diff => {
          const key = `${period}|${boss}|${diff}`;
          return `<label class="diff-row"><span>${html(diff)}</span><span style="display:flex;align-items:center"><input data-ratio-key="${html(key)}" data-char="${html(ch.id)}" type="number" inputmode="decimal" step="0.01" min="0.01" max="100000" placeholder="배율 입력" value="${ch.ratios[key] ?? ''}"><span class="unit">%</span></span></label>`;
        }).join('')}</div></details>`;
      }).join('')}</div><p class="hint-small">숫자를 입력한 뒤 Enter 또는 다른 곳을 클릭하면 자동 저장됩니다. 비우면 해당 배율이 삭제됩니다.</p>
    </div>`;
  }
  function renderRoster() {
    $('characterCount').textContent = `${totalChars()}명`;
    $('roster').innerHTML = state.owners.map(o => {
      const chars = o.characters.filter(c => c.name.toLocaleLowerCase().includes(rosterFilter.toLocaleLowerCase()));
      return `<section class="owner-group"><div class="owner-head"><span class="owner-bubble">${html(o.name.slice(0,1) || '나')}</span><span class="owner-name">${html(o.name)}</span><span class="owner-count">${o.characters.length}명</span><span class="grow"></span><button class="inline-action" data-action="rename-owner" data-id="${html(o.id)}">이름 변경</button><button class="inline-action danger-text" data-action="delete-owner" data-id="${html(o.id)}">삭제</button></div>
       <div class="owner-characters">${chars.length ? chars.map(ch => `<article class="character" draggable="true" data-drag-char="${html(ch.id)}"> <div class="character-top">${avatar(ch)}<div class="char-info"><div class="char-name-line"><span class="char-name">${html(ch.name)}</span><span class="pill ${ch.kind === 'alt' ? 'alt' : ''}">${ch.kind === 'alt' ? '부캐' : '본캐'}</span></div><div class="char-meta">${charBrief(ch)}</div><div class="power-label"><small>전투력</small><strong>${powerString(ch.combatPower)}</strong></div></div><div class="char-buttons"><span class="drag-handle" draggable="true" title="잡아서 파티 슬롯으로 이동" aria-label="파티로 드래그">⠿ 이동</span><button class="mini-add" type="button" data-action="add-member" data-id="${html(ch.id)}">+ 파티 추가</button><button type="button" class="icon-button" title="캐릭터 정보 수정" aria-label="${html(ch.name)} 수정" data-action="edit-character" data-id="${html(ch.id)}">✎</button><button type="button" class="icon-button" title="캐릭터 삭제" aria-label="${html(ch.name)} 삭제" data-action="delete-character" data-id="${html(ch.id)}">✕</button></div></div><div class="expand-bar"><button class="expand-btn" type="button" data-action="toggle-editor" data-id="${html(ch.id)}">${expandedId === ch.id ? '⌃ 보스 배율 접기' : '⌄ 보스 배율 입력'}</button><span class="filled-count" data-ratio-count="${html(ch.id)}">${Object.keys(ch.ratios).length}개 보스 배율 저장</span></div>${expandedId === ch.id ? bossEditor(ch) : ''}</article>`).join('') : `<div class="empty">${rosterFilter ? '검색 결과가 없습니다.' : '캐릭터를 검색하거나 직접 등록하세요.'}</div>`}</div></section>`;
    }).join('');
  }
  function renderBossSelect() { $('bossSelect').innerHTML = ['주간','월간'].map(period => `<optgroup label="${period} 보스">${ALL_BOSSES.filter(b => b.period === period).map(b => `<option value="${html(b.key)}">${html(b.title)}</option>`).join('')}</optgroup>`).join(''); $('bossSelect').value = state.bossKey; }
  function renderParty() {
    $('partySelect').innerHTML = state.parties.map(p => `<option value="${html(p.id)}">${html(p.name)}</option>`).join('');
    const party = currentParty(); $('partySelect').value = party.id; $('partyCapacity').value = String(party.capacity);
    $('partySlots').innerHTML = Array.from({length:party.capacity}, (_, i) => {
      const found = findCharacter(party.memberIds[i]);
      return `<div class="slot ${found ? 'filled' : ''}" data-drop-slot="${i}"><span class="slot-number">${String(i+1).padStart(2,'0')}</span>${found ? `${avatar(found.character)}<div class="slot-details"><strong>${html(found.character.name)}</strong><small>${html(found.owner.name)} · ${found.character.kind === 'alt' ? '부캐' : '본캐'} · ${powerString(found.character.combatPower)}</small></div><button class="slot-remove" type="button" aria-label="${html(found.character.name)} 파티 제외" data-action="remove-member" data-id="${html(found.character.id)}">✕</button>` : '<div class="slot-placeholder">캐릭터를 여기로 드래그하세요</div>'}</div>`;
    }).join('');
  }
  function detailsFor(party) {
    const members = party.memberIds.map(findCharacter).filter(Boolean);
    const entries = members.map(f => ({ ...f, ratio: valuePercent(f.character.ratios[state.bossKey]) }));
    const known = entries.filter(x => x.ratio !== null);
    const complete = entries.length > 0 && known.length === entries.length;
    const total = Math.round(known.reduce((sum, x) => sum + x.ratio, 0) * 100) / 100;
    return { entries, known, complete, total };
  }
  function renderEstimate() {
    const stats = detailsFor(currentParty());
    $('ratioCoverage').textContent = `${stats.known.length} / ${stats.entries.length}`;
    $('ratioTotal').textContent = stats.known.length ? `${percentString(stats.total)}${stats.complete ? '' : ' +'}` : '—';
    $('memberRatios').innerHTML = stats.entries.length ? stats.entries.map(x => `<div class="member-ratio ${x.ratio === null ? 'missing' : ''}"><span>${html(x.character.name)} <small>${html(x.owner.name)}</small></span><strong>${x.ratio === null ? '배율 미입력' : percentString(x.ratio)}</strong></div>`).join('') : '<div class="empty">파티원을 추가하면 개인별 입력 배율을 표시합니다.</div>';
    $('timeRows').innerHTML = LEVELS.map(x => `<div class="time-row ${x.n === state.level ? 'selected' : ''}"><span>${x.n}% · ${html(x.label)}</span><strong>${stats.complete ? showTime(stats.total, x.n) : '—'}</strong></div>`).join('');
  }
  function renderOverview() {
    $('overviewTable').innerHTML = `<div class="table-scroll"><table class="overview-table"><thead><tr><th>파티</th><th>캐릭터 구성</th><th>배율 입력</th><th>참고 합계</th><th>${state.level}% 기준 예상 시간</th></tr></thead><tbody>${state.parties.map(p => { const s = detailsFor(p); return `<tr><td><b>${html(p.name)}</b><br><span class="muted">${p.memberIds.length}/${p.capacity}명</span></td><td><div class="tiny-names">${s.entries.map(x => html(x.character.name)).join(', ') || '미편성'}</div></td><td>${s.known.length}/${s.entries.length}</td><td>${s.complete ? `<strong>${percentString(s.total)}</strong>` : '<span class="muted-badge">미완성</span>'}</td><td>${s.complete ? showTime(s.total, state.level) : '—'}</td></tr>`; }).join('')}</tbody></table></div>`;
  }
  function renderAll() { renderOwnerSelect(); renderRoster(); renderParty(); renderEstimate(); renderOverview(); renderBossSelect(); }
  function updateMath() { renderEstimate(); renderOverview(); }
  function addCharacter(data) {
    const owner = state.owners.find(o => o.id === $('ownerSelect').value) || state.owners[0];
    const name = short(data.name, 30);
    if (!name) return toast('캐릭터명을 입력하세요.');
    if (state.owners.some(o => o.characters.some(c => c.name.toLocaleLowerCase() === name.toLocaleLowerCase()))) return toast('이미 보관함에 등록된 캐릭터입니다.');
    const ch = { id:id(), name, kind:$('kindSelect').value === 'alt' ? 'alt' : 'main', image:httpsUrl(data.image), job:short(data.job,40), world:short(data.world,40), level:Math.max(0,Number(data.level)||0), combatPower:Math.max(0,Number(data.combatPower)||0), fetchedAt:short(data.fetchedAt,50), ratios:{} };
    owner.characters.push(ch); expandedId = ch.id; save(); renderAll(); $('nicknameInput').value=''; $('lookupPreview').hidden=true; lookupResult=null; toast(`${name} 캐릭터가 ${owner.name} 보관함에 등록됐습니다.`);
  }
  function addMember(charId, index) {
    const found = findCharacter(charId); if (!found) return;
    const party = currentParty(); const arr = party.memberIds;
    if (arr.some(id => id !== charId && findCharacter(id)?.owner.id === found.owner.id)) return toast('같은 사용자의 캐릭터는 한 파티에 하나만 배치할 수 있어요.');
    const existing = arr.indexOf(charId);
    if (existing !== -1) arr.splice(existing, 1);
    if (index === undefined || index === null) {
      if (arr.length >= party.capacity) { if (existing !== -1) arr.splice(existing, 0, charId); return toast('파티가 가득 찼습니다. 인원을 늘리거나 슬롯을 비우세요.'); }
      arr.push(charId);
    } else if (arr.length >= party.capacity && existing === -1) {
      arr.splice(index, 1, charId);
    } else { arr.splice(Math.min(index, arr.length), 0, charId); }
    party.memberIds = arr.slice(0,party.capacity); save(); renderParty(); updateMath();
  }
  function manage(action, key) {
    if (action === 'add-member') return addMember(key);
    if (action === 'remove-member') { currentParty().memberIds = currentParty().memberIds.filter(i => i !== key); save(); renderParty(); updateMath(); return; }
    if (action === 'toggle-editor') { expandedId = expandedId === key ? null : key; renderRoster(); return; }
    if (action === 'period') { return; }
    if (action === 'edit-character') {
      const found = findCharacter(key); if (!found) return;
      const c=found.character; $('editId').value=c.id; $('editName').value=c.name; $('editKind').value=c.kind; $('editJob').value=c.job; $('editLevel').value=c.level||''; $('editPower').value=c.combatPower||''; $('editWorld').value=c.world; $('editImage').value=c.image; $('editDialog').showModal(); return;
    }
    if (action === 'delete-character') {
      const found = findCharacter(key); if (!found || !confirm(`'${found.character.name}' 캐릭터와 저장된 보스 배율을 모두 삭제할까요?`)) return;
      found.owner.characters=found.owner.characters.filter(c => c.id !== key);
      state.parties.forEach(p => p.memberIds=p.memberIds.filter(c=>c!==key));
      if (expandedId===key) expandedId=null; save(); renderAll(); return;
    }
    if (action === 'rename-owner') {
      const o=state.owners.find(o=>o.id===key); if(!o)return;
      const name=prompt('사용자 이름을 입력하세요.',o.name); if(name===null)return;
      if(!short(name,30))return toast('이름을 입력하세요.'); o.name=short(name,30); save(); renderAll(); return;
    }
    if (action === 'delete-owner') {
      const o=state.owners.find(o=>o.id===key); if(!o)return;
      if(state.owners.length===1)return toast('사용자는 최소 1명이 필요합니다.');
      if(!confirm(`${o.name} 사용자와 캐릭터 ${o.characters.length}명 및 배율 기록을 삭제할까요?`))return;
      const ids=new Set(o.characters.map(c=>c.id)); state.owners=state.owners.filter(a=>a.id!==key); state.parties.forEach(p=>p.memberIds=p.memberIds.filter(a=>!ids.has(a))); save(); renderAll(); return;
    }
  }

  async function lookup() {
    const name=short($('nicknameInput').value,30);
    if(!name)return toast('캐릭터명을 입력하세요.');
    if(!state.proxyUrl){ toast('프록시가 미설정 상태입니다. 직접 추가하거나 API 설정에서 Worker 주소를 등록하세요.'); return; }
    const button=$('lookupBtn');button.disabled=true;button.textContent='조회 중...';
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),12000);
    try {
      const url=`${state.proxyUrl.replace(/\/$/,'')}/character?name=${encodeURIComponent(name)}`;
      const resp=await fetch(url,{method:'GET',signal:controller.signal,headers:{'Accept':'application/json'}});
      let data; try {data=await resp.json();}catch{throw Error(`서버 응답이 JSON이 아닙니다. (${resp.status})`);}
      if(!resp.ok)throw Error(typeof data.error==='string' ? data.error : `조회 실패 (${resp.status})`);
      if(!data || typeof data.name!=='string' || data.name.length>30) throw Error('프록시 응답 구조가 올바르지 않습니다.');
      lookupResult={name:short(data.name,30),image:httpsUrl(data.image),job:short(data.job,40),world:short(data.world,40),level:Number(data.level)||0,combatPower:Number(data.combatPower)||0,fetchedAt:short(data.fetchedAt,50)};
      $('lookupPreview').hidden=false;
      $('lookupPreview').innerHTML=`<div class="lookup-inner">${avatar(lookupResult)}<div><strong>${html(lookupResult.name)}</strong><div class="lookup-meta">${charBrief(lookupResult)}</div><div class="power-label"><small>전투력</small><strong>${powerString(lookupResult.combatPower)}</strong></div></div><div class="lookup-actions"><button class="btn btn-primary" data-action="store-lookup" type="button">보관함에 저장</button><button class="icon-button" data-action="cancel-lookup" title="조회 결과 닫기" type="button">✕</button></div></div>`;
    } catch(e) { toast(e.name==='AbortError'?'조회 시간이 초과됐습니다.':`조회 오류: ${e.message}`); }
    finally {clearTimeout(timer);button.disabled=false;button.textContent='넥슨 조회';}
  }

  $('addOwnerBtn').addEventListener('click',()=>{const name=prompt('추가할 사용자 이름을 입력하세요.','사용자 2');if(name===null)return;const clean=short(name,30);if(!clean)return toast('이름을 입력하세요.');state.owners.push({id:id(),name:clean,characters:[]});save();renderAll();$('ownerSelect').value=state.owners.at(-1).id;});
  $('lookupBtn').addEventListener('click',lookup);
  $('nicknameInput').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault(); if(state.proxyUrl)lookup(); else addCharacter({name:$('nicknameInput').value});}});
  $('manualAddBtn').addEventListener('click',()=>addCharacter({name:$('nicknameInput').value}));
  $('rosterSearch').addEventListener('input',e=>{rosterFilter=e.target.value;renderRoster();});
  $('addPartyBtn').addEventListener('click',()=>{const p={id:id(),name:`파티 ${state.parties.length+1}`,capacity:6,memberIds:[]};state.parties.push(p);state.selectedParty=p.id;save();renderParty();updateMath();});
  $('partySelect').addEventListener('change',e=>{state.selectedParty=e.target.value;save();renderParty();updateMath();});
  $('partyCapacity').addEventListener('change',e=>{const p=currentParty(),next=Number(e.target.value);if(p.memberIds.length>next&&!confirm(`파티 인원을 ${next}명으로 줄이면 마지막 ${p.memberIds.length-next}명은 편성에서 제외됩니다. 계속할까요?`)){$('partyCapacity').value=p.capacity;return;}p.capacity=next;p.memberIds=p.memberIds.slice(0,next);save();renderParty();updateMath();});
  $('renamePartyBtn').addEventListener('click',()=>{const p=currentParty(),name=prompt('파티 이름',p.name);if(name===null)return;if(!short(name))return toast('파티 이름을 입력하세요.');p.name=short(name,40);save();renderParty();renderOverview();});
  $('clearPartyBtn').addEventListener('click',()=>{const p=currentParty();if(!p.memberIds.length)return;if(!confirm('현재 파티의 편성을 비울까요? 캐릭터별 배율 기록은 유지됩니다.'))return;p.memberIds=[];save();renderParty();updateMath();});
  $('deletePartyBtn').addEventListener('click',()=>{if(state.parties.length<=1)return toast('파티는 최소 1개가 필요합니다.');const p=currentParty();if(!confirm(`${p.name}를 삭제할까요?`))return;state.parties=state.parties.filter(x=>x.id!==p.id);state.selectedParty=state.parties[0].id;save();renderParty();updateMath();});
  $('bossSelect').addEventListener('change',e=>{state.bossKey=e.target.value;save();updateMath();});
  $('settingsBtn').addEventListener('click',()=>{$('proxyUrl').value=state.proxyUrl;$('settingsDialog').showModal();});
  $('settingsForm').addEventListener('submit',e=>{e.preventDefault();const raw=$('proxyUrl').value.trim();const valid=raw ? httpsUrl(raw) : '';if(raw&&!valid)return toast('HTTPS 주소만 사용 가능합니다.');state.proxyUrl=valid.replace(/\/$/,'');save();$('settingsDialog').close();toast('프록시 설정이 저장됐습니다.');});
  $('editForm').addEventListener('submit',e=>{e.preventDefault();const f=findCharacter($('editId').value);if(!f)return;const c=f.character;const name=short($('editName').value,30);if(!name)return toast('닉네임을 입력하세요.');if(state.owners.some(o=>o.characters.some(x=>x.id!==c.id&&x.name===name)))return toast('중복된 캐릭터명이 있습니다.');const imageRaw=$('editImage').value.trim();if(imageRaw&&!httpsUrl(imageRaw))return toast('캐릭터 이미지 주소는 HTTPS만 지원합니다.');Object.assign(c,{name,kind:$('editKind').value,job:short($('editJob').value,40),world:short($('editWorld').value,40),level:Number($('editLevel').value)||0,combatPower:Number($('editPower').value)||0,image:httpsUrl(imageRaw)});save();$('editDialog').close();renderRoster();renderParty();updateMath();});
  document.addEventListener('click',e=>{
    const close=e.target.closest('[data-close]');if(close){$(close.dataset.close)?.close();return;}
    const target=e.target.closest('[data-action]');if(!target)return;
    const action=target.dataset.action,key=target.dataset.id;
    if(action==='period'){charPeriod.set(key,target.dataset.period);renderRoster();return;}
    if(action==='store-lookup'&&lookupResult){addCharacter(lookupResult);return;}
    if(action==='cancel-lookup'){$('lookupPreview').hidden=true;lookupResult=null;return;}
    manage(action,key);
  });
  document.addEventListener('change',e=>{
    const input=e.target.closest('input[data-ratio-key]');if(!input)return;
    const f=findCharacter(input.dataset.char);if(!f)return;
    const key=input.dataset.ratioKey; if(!BOSS_BY_ID.has(key))return;
    const percent=valuePercent(input.value);
    if(input.value.trim()!==''&&percent===null){input.value=f.character.ratios[key]??'';return toast('배율은 0보다 크고 100,000 이하인 숫자여야 합니다.');}
    if(percent===null)delete f.character.ratios[key];else f.character.ratios[key]=percent;
    input.value=percent??'';
    const count=document.querySelector(`[data-ratio-count="${CSS.escape(f.character.id)}"]`);if(count)count.textContent=`${Object.keys(f.character.ratios).length}개 보스 배율 저장`;
    const group=input.closest('.boss-group');if(group){const num=group.querySelectorAll('input[data-ratio-key]');group.querySelector('.boss-count').textContent=`${[...num].filter(n=>n.value!=='').length}개 입력됨`;}
    save();updateMath();toast(percent===null?'보스 배율을 삭제했습니다.':'보스 배율을 저장했습니다.');
  });
  document.addEventListener('input',e=>{const el=e.target.closest('[data-boss-filter]');if(!el)return;const q=el.value.toLocaleLowerCase().trim();const editor=el.closest('.ratio-editor');editor.querySelectorAll('[data-boss-group]').forEach(group=>{group.hidden=!group.dataset.bossGroup.toLocaleLowerCase().includes(q);});});
  let draggingCharId = null;
  $('roster').addEventListener('dragstart',e=>{const card=e.target.closest('[data-drag-char]');if(!card)return;draggingCharId=card.dataset.dragChar;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',card.dataset.dragChar);card.classList.add('dragging');});
  $('roster').addEventListener('dragend',e=>{const card=e.target.closest('[data-drag-char]');card?.classList.remove('dragging');draggingCharId=null;});
  $('partySlots').addEventListener('dragover',e=>{const slot=e.target.closest('[data-drop-slot]');if(!slot)return;e.preventDefault();e.dataTransfer.dropEffect='move';slot.classList.add('over');});
  $('partySlots').addEventListener('dragleave',e=>{const slot=e.target.closest('[data-drop-slot]');if(slot&&!slot.contains(e.relatedTarget))slot.classList.remove('over');});
  $('partySlots').addEventListener('drop',e=>{const slot=e.target.closest('[data-drop-slot]');if(!slot)return;e.preventDefault();$('partySlots').querySelectorAll('.over').forEach(el=>el.classList.remove('over'));const charId=e.dataTransfer.getData('text/plain') || draggingCharId; if(findCharacter(charId))addMember(charId,Number(slot.dataset.dropSlot)); draggingCharId=null;});
  $('backupBtn').addEventListener('click',()=>{const blob=new Blob([JSON.stringify({ ...state, exportedAt:new Date().toISOString() },null,2)],{type:'application/json'});const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download=`maple-party-backup-${new Date().toISOString().slice(0,10)}.json`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);});
  $('restoreBtn').addEventListener('click',()=>$('importFile').click());
  $('importFile').addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;if(f.size>3_000_000){toast('3MB 이하 JSON 백업을 선택하세요.');e.target.value='';return;}try{const parsed=parseState(JSON.parse(await f.text()));if(!confirm('현재 브라우저에 저장된 데이터를 백업 파일로 교체할까요?'))return;state=parsed;expandedId=null;save();renderAll();toast('백업 데이터를 복원했습니다.');}catch(err){toast(`복원 실패: ${err.message}`);}finally{e.target.value='';}});

  renderAll();if(migrated){save();toast('이전 버전의 캐릭터·파티를 가져왔습니다. 이전 파티별 배율은 개인 배율로 옮기지 않았습니다.');}
})();
