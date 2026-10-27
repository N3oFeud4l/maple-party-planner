(() => {
  'use strict';

  const STORE = 'maple_party_planner_web_v03';
  // 서버 주소만 공개해도 됩니다. 실제 넥슨 API 키는 Worker Secret에 보관합니다.
  const WORKER_URL = 'https://maple-nexon-api.maple-party-planner.workers.dev';
  const OLD_STORE = 'maple_party_planner_web_v02';
  const LEVELS = [{ n: 100, label: '최소컷' }, { n: 110, label: '기본 배율' }, { n: 130, label: '메청년 비율' }, { n: 150, label: '메린이 비율' }, { n: 200, label: '메애기 비율' }];
  // 보스/난이도 목록은 코드에 정적으로 두며 필요시 유지보수할 수 있습니다.
  
const BOSS_GROUPS = [
  ['주간', '스우', ['노멀', '하드', '익스트림']],
  ['주간', '데미안', ['노멀', '하드']],
  ['주간', '가디언 엔젤 슬라임', ['노멀', '카오스']],
  ['주간', '루시드', ['이지', '노멀', '하드']],
  ['주간', '윌', ['이지', '노멀', '하드']],
  ['주간', '더스크', ['노멀', '카오스']],
  ['주간', '진 힐라', ['노멀', '하드']],
  ['주간', '듄켈', ['노멀', '하드']],
  ['주간', '세렌', ['노멀', '하드', '익스트림']],
  ['주간', '칼로스', ['이지', '노멀', '카오스', '익스트림']],
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
  const powerString = power => {
    const n = Number(power);
    if (!Number.isFinite(n) || n <= 0) return '미조회';
    const whole = Math.round(n);
    const parts = [];
    if (whole >= 1e12) parts.push(`${Math.floor(whole / 1e12).toLocaleString('ko-KR')}조`);
    const rest = whole % 1e12;
    if (rest >= 1e8) parts.push(`${Math.floor(rest / 1e8).toLocaleString('ko-KR')}억`);
    const man = Math.floor((rest % 1e8) / 1e4);
    if (man) parts.push(`${man.toLocaleString('ko-KR')}만`);
    if (!parts.length) return whole.toLocaleString('ko-KR');
    return parts.join(' ');
  };
  const optionalStat = value => value === '' || value == null || !Number.isFinite(Number(value)) ? null : Math.max(0, Number(value));
  // 보스 이미지는 레포지토리 내부 파일만 사용합니다. 외부 이미지 서버에 요청하지 않습니다.
  
const BOSS_ASSET_NAMES = {
  '스우':'lotus', '데미안':'damien', '가디언 엔젤 슬라임':'guardian-angel-slime',
  '루시드':'lucid', '윌':'will', '더스크':'dusk', '진 힐라':'verus-hilla',
  '듄켈':'darknell', '세렌':'seren', '칼로스':'kalos', '최초의 대적자':'first-adversary',
  '카링':'kaling', '벨로나':'vellona', '찬란한 흉성':'radiant-star', '림보':'limbo',
  '발드릭스':'baldrix', '유피테르':'jupiter', '검은 마법사':'black-mage'
};
  const bossCover = (boss, classname = 'boss-cover') => {
    const name = BOSS_ASSET_NAMES[boss];
    return `<span class="${classname}"><img src="./assets/bosses/${name}.png" loading="lazy" alt="${html(boss)} 이미지" onerror="this.hidden=true"></span>`;
  };
  const percentString = v => `${Number(v).toLocaleString('ko-KR', {maximumFractionDigits:2})}%`;
  const showTime = (percent, threshold) => { const seconds = Math.round(1200 * threshold / percent); return percent > 0 && Number.isFinite(seconds) ? `${Math.floor(seconds / 60).toLocaleString('ko-KR')}분 ${String(seconds % 60).padStart(2, '0')}초` : '—'; };
  function defaultState() { const p = id(); return { version: 3, owners: [{ id: id(), name: '나', characters: [] }], parties: [{ id: p, name: '파티 1', capacity: 6, memberIds: [] }], selectedParty: p, bossKey: '주간|스우|노멀', level: 110 }; }

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
        return { id: charId, name: short(c.name, 30), kind: c.kind === 'alt' ? 'alt' : 'main', image: httpsUrl(c.image || c.avatar), job: short(c.job, 40), world: short(c.world, 40), level: Math.min(1000, Math.max(0, Number(c.level) || 0)), combatPower: Math.max(0, Number(c.combatPower) || 0), arcaneForce: optionalStat(c.arcaneForce), authenticForce: optionalStat(c.authenticForce), fetchedAt: short(c.fetchedAt, 50), statStatus: short(c.statStatus, 30), ratios };
      }).filter(c => c.name)
    }));
    if (!owners.length) owners.push({ id: id(), name: '나', characters: [] });
    const parties = raw.parties.map(p => ({
      id: short(p.id, 100) || id(), name: short(p.name, 40) || '파티',
      capacity: Math.min(6, Math.max(1, Math.round(Number(p.capacity) || 6))),
      memberIds: [...new Set((Array.isArray(p.memberIds) ? p.memberIds : []).filter(x => seen.has(x)))].slice(0, Math.min(6, Math.max(1, Math.round(Number(p.capacity) || 6))))
    }));
    if (!parties.length) parties.push({ id: id(), name: '파티 1', capacity: 6, memberIds: [] });
    return { version: 3, owners, parties, selectedParty: parties.some(p => p.id === raw.selectedParty) ? raw.selectedParty : parties[0].id, bossKey: BOSS_BY_ID.has(raw.bossKey) ? raw.bossKey : '주간|스우|노멀', level: LEVELS.some(x => x.n === Number(raw.level)) ? Number(raw.level) : 110 };
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
  let comparePeriod = '주간';
  let selectedBossOpen = false;
  let activeRatioCharId = null;
  let charPeriod = new Map();
  const draftRatioSelections = new Set();
  let rosterFilter = '';
  let lookupResult = null;
  let toastTimer;
  const currentParty = () => state.parties.find(p => p.id === state.selectedParty) || state.parties[0];
  const findCharacter = charId => { for (const owner of state.owners) { const character = owner.characters.find(c => c.id === charId); if (character) return { character, owner }; } return null; };
  const totalChars = () => state.owners.reduce((acc, o) => acc + o.characters.length, 0);
  function save() { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch(e) { toast('저장에 실패했어요. 백업 후 저장 공간을 확인해 주세요.'); console.error(e); } }
  function toast(msg) { const el = $('toast'); el.textContent = msg; el.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 3100); }

  let pendingAction = null;
  function openActionDialog({ title, message = '', inputLabel = '', value = '', confirmText = '확인', danger = false, onConfirm, onCancel }) {
    const dialog = $('actionDialog');
    if (dialog.open) dialog.close();
    pendingAction = { onConfirm, onCancel, hasInput: Boolean(inputLabel) };
    $('actionDialogTitle').textContent = title;
    $('actionDialogMessage').textContent = message;
    $('actionDialogMessage').hidden = !message;
    $('actionDialogInputWrap').hidden = !inputLabel;
    $('actionDialogInputLabel').textContent = inputLabel;
    const input = $('actionDialogInput');
    input.value = value;
    input.required = Boolean(inputLabel);
    input.maxLength = inputLabel === '캐릭터명' || inputLabel === '사용자 이름' ? 30 : 40;
    $('actionDialogConfirmBtn').textContent = confirmText;
    $('actionDialogConfirmBtn').classList.toggle('btn-danger', danger);
    $('actionDialogConfirmBtn').classList.toggle('btn-primary', !danger);
    dialog.showModal();
    if (inputLabel) input.focus(); else $('actionDialogConfirmBtn').focus();
  }
  $('actionDialogForm').addEventListener('submit', e => {
    e.preventDefault();
    const action = pendingAction;
    if (!action) return;
    const value = $('actionDialogInput').value.trim();
    if (action.hasInput && !value) {
      $('actionDialogInput').focus();
      return;
    }
    pendingAction = null;
    $('actionDialog').close();
    action.onConfirm?.(value);
  });
  $('actionDialog').addEventListener('close', () => {
    const action = pendingAction;
    pendingAction = null;
    action?.onCancel?.();
  });

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
        return `<details class="boss-group" data-boss-group="${html(boss)}"><summary>${bossCover(boss,'boss-small-cover')}${html(boss)} <span class="boss-count">${count ? `${count}개 입력됨` : ''}</span></summary><div class="boss-difficulties">${diffs.map(diff => {
          const key = `${period}|${boss}|${diff}`;
          const saved = valuePercent(ch.ratios[key]);
          const enabled = saved !== null || draftRatioSelections.has(`${ch.id}|${key}`);
          return `<div class="diff-item ${enabled ? 'enabled' : ''}"><label class="diff-select"><input type="checkbox" data-diff-toggle data-ratio-key="${html(key)}" data-char="${html(ch.id)}" ${enabled ? 'checked' : ''}><span>${html(diff)}</span></label><span class="diff-value"><input data-ratio-key="${html(key)}" data-char="${html(ch.id)}" aria-label="${html(boss)} ${html(diff)} 배율" type="number" inputmode="decimal" step="0.01" min="0.01" max="100000" placeholder="배율" value="${saved ?? ''}" ${enabled ? '' : 'disabled'}><span class="unit">%</span></span></div>`;
        }).join('')}</div></details>`;
      }).join('')}</div><p class="hint-small">난이도를 체크하면 배율 입력칸이 열립니다. 입력값은 Enter 또는 포커스 이동 시 저장됩니다.</p>
    </div>`;
  }
  function charPowers(ch) { return `<div class="char-stats"><span class="stat-chip stat-power"><small>전투력</small><b title="${Math.round(Number(ch.combatPower)||0).toLocaleString('ko-KR')}">${powerString(ch.combatPower)}</b></span></div>`; }
  function openRatioDialog(charId) {
    const found = findCharacter(charId); if (!found) return;
    activeRatioCharId = charId;
    $('ratioDialogTitle').textContent = `${found.character.name} · 보스 배율`;
    $('ratioCharacterInfo').innerHTML = `${avatar(found.character)}<div><strong>${html(found.character.name)}</strong><div class="char-meta">${charBrief(found.character)}</div>${charPowers(found.character)}</div>`;
    renderRatioDialogBody();
    $('ratioDialog').showModal();
  }
  function renderRatioDialogBody() {
    const found=findCharacter(activeRatioCharId);
    if (found) $('ratioDialogBody').innerHTML=bossEditor(found.character);
  }
  function renderRoster() {
    $('characterCount').textContent = `${totalChars()}명`;
    $('roster').innerHTML = state.owners.map(o => {
      const chars = o.characters.filter(c => c.name.toLocaleLowerCase().includes(rosterFilter.toLocaleLowerCase()));
      return `<section class="owner-group"><div class="owner-head"><span class="owner-bubble">${html(o.name.slice(0,1) || '나')}</span><span class="owner-name">${html(o.name)}</span><span class="owner-count">${o.characters.length}명</span><span class="grow"></span><button class="inline-action" data-action="rename-owner" data-id="${html(o.id)}">이름 변경</button><button class="inline-action danger-text" data-action="delete-owner" data-id="${html(o.id)}">삭제</button></div>
       <div class="owner-characters">${chars.length ? chars.map(ch => `<article class="character" draggable="true" data-drag-char="${html(ch.id)}"><button type="button" class="character-top card-opener" data-action="open-ratios" data-id="${html(ch.id)}" aria-label="${html(ch.name)} 캐릭터의 보스 배율 설정">${avatar(ch)}<div class="char-info"><div class="char-name-line"><span class="char-name">${html(ch.name)}</span><span class="pill ${ch.kind === 'alt' ? 'alt' : ''}">${ch.kind === 'alt' ? '부캐' : '본캐'}</span></div><div class="char-meta">${charBrief(ch)}</div>${charPowers(ch)}</div><span class="open-arrow">›</span></button><div class="character-actions"><span class="drag-handle" title="파티 슬롯으로 끌어놓기">⠿ 드래그</span><button class="mini-add" type="button" data-action="add-member" data-id="${html(ch.id)}">＋ 파티</button><span class="grow"></span><button type="button" class="inline-action" data-action="open-ratios" data-id="${html(ch.id)}">보스 배율 ${Object.keys(ch.ratios).length}개 <span aria-hidden="true">›</span></button><button type="button" class="icon-button refresh-character" title="넥슨 정보 새로고침" aria-label="${html(ch.name)} 넥슨 정보 새로고침" data-action="refresh-character" data-id="${html(ch.id)}">↻</button><button type="button" class="icon-button" title="캐릭터 정보 수정" aria-label="${html(ch.name)} 수정" data-action="edit-character" data-id="${html(ch.id)}">✎</button><button type="button" class="icon-button" title="캐릭터 삭제" aria-label="${html(ch.name)} 삭제" data-action="delete-character" data-id="${html(ch.id)}">✕</button></div></article>`).join('') : `<div class="empty">${rosterFilter ? '검색 결과가 없습니다.' : '캐릭터를 조회하거나 직접 등록하세요.'}</div>`}</div></section>`;
    }).join('');
  }
  function renderBossSelect() { $('bossSelect').innerHTML = ['주간','월간'].map(period => `<optgroup label="${period} 보스">${ALL_BOSSES.filter(b => b.period === period).map(b => `<option value="${html(b.key)}">${html(b.title)}</option>`).join('')}</optgroup>`).join(''); $('bossSelect').value = state.bossKey; }
  function renderParty() {
    $('partySelect').innerHTML = state.parties.map(p => `<option value="${html(p.id)}">${html(p.name)}</option>`).join('');
    const party = currentParty(); $('partySelect').value = party.id; $('partyCapacity').value = String(party.capacity);
    $('partyCurrentName').textContent = party.name;
    $('partyList').innerHTML = state.parties.map(p => `<button type="button" class="party-choice ${p.id === party.id ? 'active' : ''}" data-action="switch-party" data-id="${html(p.id)}" aria-pressed="${p.id === party.id}"><span class="party-choice-text">${html(p.name)}</span><small>${p.memberIds.length}/${p.capacity}명</small>${p.id === party.id ? '<span class="party-check" aria-hidden="true">✓</span>' : ''}</button>`).join('');
    $('partySlots').innerHTML = Array.from({length:party.capacity}, (_, i) => {
      const found = findCharacter(party.memberIds[i]);
      return `<div class="slot ${found ? 'filled' : ''}" data-drop-slot="${i}"><span class="slot-number">${i+1}</span>${found ? `${avatar(found.character)}<div class="slot-details"><strong>${html(found.character.name)}</strong><small>${html(found.owner.name)} · ${powerString(found.character.combatPower)}</small></div><button class="slot-remove" type="button" aria-label="${html(found.character.name)} 파티 제외" data-action="remove-member" data-id="${html(found.character.id)}">✕</button>` : '<span class="slot-plus">＋</span><div class="slot-placeholder">캐릭터 배치</div>'}</div>`;
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
  function renderBossTiles() {
    $('comparePeriodTabs').querySelectorAll('[data-period]').forEach(b=>b.classList.toggle('active',b.dataset.period===comparePeriod));
    const filter=$('compareBossFilter').value.trim().toLocaleLowerCase();
    const groups=BOSS_GROUPS.filter(([period,boss])=>period===comparePeriod&&boss.toLocaleLowerCase().includes(filter));
    $('bossTiles').innerHTML=groups.length?groups.map(([period,boss,diffs])=>{
      const selected=selectedBossOpen&&BOSS_BY_ID.get(state.bossKey)?.boss===boss;
      const entered=diffs.filter(d=>currentParty().memberIds.some(cid=>valuePercent(findCharacter(cid)?.character.ratios[`${period}|${boss}|${d}`])!==null)).length;
      return `<button type="button" class="boss-tile ${selected?'active':''}" data-action="select-boss" data-boss="${html(boss)}" data-period="${html(period)}">${bossCover(boss)}<strong>${html(boss)}</strong>${entered?`<small>${entered}개 난이도 기록</small>`:'<small>배율 확인</small>'}</button>`;
    }).join(''):'<div class="empty">검색된 보스가 없어요.</div>';
  }
  
function renderBossDetailDialog() {
  const dialog = $('bossDetailDialog');
  if (!dialog || !selectedBossOpen) return;
  const b = BOSS_BY_ID.get(state.bossKey); if (!b) return;
  $('dialogSelectedBossVisual').innerHTML = `${bossCover(b.boss,'selected-boss-cover')}<div><small>${html(b.period)} 보스</small><h3>${html(b.boss)}</h3></div>`;
  const group = BOSS_GROUPS.find(([period,boss])=>period===b.period&&boss===b.boss);
  $('dialogDifficultyChips').innerHTML = group[2].map(diff=>`<button type="button" class="difficulty-chip ${diff===b.diff?'active':''}" data-action="select-difficulty" data-boss="${html(b.boss)}" data-period="${html(b.period)}" data-diff="${html(diff)}">${html(diff)}</button>`).join('');
  const stats = detailsFor(currentParty());
  $('dialogRatioCoverage').textContent = `${stats.known.length} / ${stats.entries.length}`;
  $('dialogRatioTotal').textContent = stats.known.length ? `${percentString(stats.total)}${stats.complete?'':' +'}` : '—';
  $('dialogMemberRatios').innerHTML = stats.entries.length ? stats.entries.map(x=>`<div class="member-ratio ${x.ratio===null?'missing':''}"><span>${html(x.character.name)} <small>${html(x.owner.name)}</small></span><strong>${x.ratio===null?'미입력':percentString(x.ratio)}</strong></div>`).join('') : '<div class="empty">파티에 캐릭터를 추가해 주세요.</div>';
  $('dialogTimeRows').innerHTML = LEVELS.map(x=>`<div class="time-row ${x.n===state.level?'selected':''}"><span>${x.n}% · ${html(x.label)}</span><strong>${stats.complete?showTime(stats.total,x.n):'—'}</strong></div>`).join('');
}
function renderEstimate() {
  $('bossChooseHint').hidden = selectedBossOpen;
  renderBossTiles();
  renderBossDetailDialog();
}
  function renderOverview() {
    $('partyOverview').hidden=!totalChars()||!selectedBossOpen;
    if(!selectedBossOpen)return;
    $('overviewTable').innerHTML=`<div class="overview-cards">${state.parties.map(p=>{const s=detailsFor(p);return `<div class="overview-item"><strong>${html(p.name)}</strong><span>${s.entries.map(x=>html(x.character.name)).join(' · ')||'미편성'}</span><div><b>${s.complete?percentString(s.total):'배율 미입력'}</b><strong>${s.complete?showTime(s.total,state.level):'—'}</strong></div></div>`;}).join('')}</div>`;
  }
  function updateWorkspaceVisibility() {
    const visible = totalChars() > 0;
    $('partyWorkspace').hidden = !visible;
    $('partyOverview').hidden = !visible || !selectedBossOpen;
    $('mainGrid').classList.toggle('no-party', !visible);
  }
  function renderAll() { renderOwnerSelect(); renderRoster(); renderParty(); renderEstimate(); renderOverview(); renderBossSelect(); updateWorkspaceVisibility(); }
  function updateMath() { renderEstimate(); renderOverview(); }
  function addCharacter(data) {
    const owner = state.owners.find(o => o.id === $('ownerSelect').value) || state.owners[0];
    const name = short(data.name, 30);
    if (!name) return toast('캐릭터명을 입력하세요.');
    if (state.owners.some(o => o.characters.some(c => c.name.toLocaleLowerCase() === name.toLocaleLowerCase()))) return toast('이미 보관함에 등록된 캐릭터입니다.');
    const ch = { id:id(), name, kind:$('kindSelect').value === 'alt' ? 'alt' : 'main', image:httpsUrl(data.image), job:short(data.job,40), world:short(data.world,40), level:Math.max(0,Number(data.level)||0), combatPower:Math.max(0,Number(data.combatPower)||0), arcaneForce:optionalStat(data.arcaneForce), authenticForce:optionalStat(data.authenticForce), fetchedAt:short(data.fetchedAt,50), statStatus:short(data.statStatus,30), ratios:{} };
    owner.characters.push(ch); save(); renderAll(); $('nicknameInput').value=''; $('lookupPreview').hidden=true; lookupResult=null; toast(`${name} 캐릭터가 ${owner.name} 보관함에 등록됐습니다.`);
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
    if (action === 'open-ratios') return openRatioDialog(key);
    if (action === 'refresh-character') return refreshCharacter(key);
    if (action === 'period') { return; }
    if (action === 'edit-character') {
      const found = findCharacter(key); if (!found) return;
      const c=found.character; $('editId').value=c.id; $('editName').value=c.name; $('editKind').value=c.kind; $('editJob').value=c.job; $('editLevel').value=c.level||''; $('editPower').value=c.combatPower||''; $('editWorld').value=c.world; $('editImage').value=c.image; $('editDialog').showModal(); return;
    }
    if (action === 'delete-character') {
      const found = findCharacter(key); if (!found) return;
      openActionDialog({
        title: '캐릭터 삭제',
        message: `${found.character.name} 캐릭터와 저장된 보스 배율을 삭제할까요?`,
        confirmText: '삭제', danger: true,
        onConfirm: () => {
          found.owner.characters = found.owner.characters.filter(c => c.id !== key);
          state.parties.forEach(p => p.memberIds = p.memberIds.filter(c => c !== key));
          if (expandedId === key) expandedId = null;
          save(); renderAll();
        }
      });
      return;
    }
    if (action === 'rename-owner') {
      const owner = state.owners.find(o => o.id === key); if (!owner) return;
      openActionDialog({
        title: '사용자 이름 변경', inputLabel: '사용자 이름', value: owner.name,
        confirmText: '변경', onConfirm: name => { owner.name = short(name, 30); save(); renderAll(); }
      });
      return;
    }
    if (action === 'delete-owner') {
      const owner = state.owners.find(o => o.id === key); if (!owner) return;
      if (state.owners.length === 1) return toast('사용자는 최소 1명이 필요해요.');
      openActionDialog({
        title: '사용자 삭제',
        message: `${owner.name} 사용자와 등록 캐릭터 ${owner.characters.length}명, 보스 배율 기록을 모두 삭제할까요?`,
        confirmText: '삭제', danger: true,
        onConfirm: () => {
          const ids = new Set(owner.characters.map(c => c.id));
          state.owners = state.owners.filter(o => o.id !== key);
          state.parties.forEach(p => p.memberIds = p.memberIds.filter(c => !ids.has(c)));
          save(); renderAll();
        }
      });
      return;
    }
  }

  async function fetchCharacterInfo(name) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 14000);
    try {
      const resp = await fetch(`${WORKER_URL}/character?name=${encodeURIComponent(name)}`, {
        method: 'GET', signal: controller.signal, headers: { Accept: 'application/json' }
      });
      let data;
      try { data = await resp.json(); } catch { throw Error(`API 응답 형식 오류 (${resp.status})`); }
      if (!resp.ok) throw Error(typeof data.error === 'string' ? data.error : `조회 실패 (${resp.status})`);
      if (!data || typeof data.name !== 'string' || data.name.length > 30) throw Error('API 응답 구조가 올바르지 않습니다.');
      return {
        name: short(data.name, 30), image: httpsUrl(data.image), job: short(data.job, 40),
        world: short(data.world, 40), level: Number(data.level) || 0,
        combatPower: Math.max(0, Number(data.combatPower) || 0),
        arcaneForce: optionalStat(data.arcaneForce), authenticForce: optionalStat(data.authenticForce),
        statStatus: short(data.statStatus, 30), fetchedAt: short(data.fetchedAt, 50)
      };
    } finally { clearTimeout(timer); }
  }
  async function refreshCharacter(charId) {
    const found = findCharacter(charId); if (!found) return;
    toast(`${found.character.name} 정보 조회 중...`);
    try {
      const fresh = await fetchCharacterInfo(found.character.name);
      // 기존 사용자, 본캐/부캐, 개별 보스 배율, 파티 편성을 유지합니다.
      Object.assign(found.character, fresh);
      save(); renderAll();
      toast(`${fresh.name} 캐릭터 정보를 갱신했습니다.`);
    } catch (e) { toast(`갱신 실패: ${e.name === 'AbortError' ? '요청 시간 초과' : e.message}`); }
  }
  async function lookup() {
    const name=short($('nicknameInput').value,30);
    if(!name)return toast('캐릭터명을 입력하세요.');
    const button=$('lookupBtn');button.disabled=true;button.textContent='조회 중...';
    try {
      lookupResult = await fetchCharacterInfo(name);
      $('lookupPreview').hidden=false;
      $('lookupPreview').innerHTML=`<div class="lookup-inner">${avatar(lookupResult)}<div><strong>${html(lookupResult.name)}</strong><div class="lookup-meta">${charBrief(lookupResult)}</div>${charPowers(lookupResult)}</div><div class="lookup-actions"><button class="btn btn-primary" data-action="store-lookup" type="button">보관함에 저장</button><button class="icon-button" data-action="cancel-lookup" title="조회 결과 닫기" type="button">✕</button></div></div>`;
    } catch(e) { toast(e.name==='AbortError'?'조회 시간이 초과됐습니다.':`조회 오류: ${e.message}`); }
    finally {button.disabled=false;button.textContent='넥슨 조회';}
  }

  $('addOwnerBtn').addEventListener('click', () => {
    openActionDialog({
      title: '사용자 추가', inputLabel: '사용자 이름', value: `사용자 ${state.owners.length + 1}`,
      confirmText: '추가', onConfirm: name => {
        const owner = {id:id(), name:short(name, 30), characters:[]};
        state.owners.push(owner); save(); renderAll(); $('ownerSelect').value = owner.id;
      }
    });
  });
  $('lookupBtn').addEventListener('click',lookup);
  $('nicknameInput').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault(); lookup();}});
  $('manualAddBtn').addEventListener('click', () => {
    openActionDialog({
      title: '캐릭터 직접 추가', message: '현재 선택된 사용자의 보관함에 등록해요.',
      inputLabel: '캐릭터명', value: $('nicknameInput').value.trim(),
      confirmText: '등록', onConfirm: name => addCharacter({name})
    });
  });
  $('rosterSearch').addEventListener('input',e=>{rosterFilter=e.target.value;renderRoster();});
  $('addPartyBtn').addEventListener('click', () => {
    openActionDialog({
      title: '새 파티 만들기', inputLabel: '파티 이름', value: `파티 ${state.parties.length + 1}`,
      confirmText: '만들기', onConfirm: name => {
        const party = {id:id(),name:short(name,40),capacity:6,memberIds:[]};
        state.parties.push(party); state.selectedParty = party.id;
        save(); renderParty(); updateMath();
      }
    });
  });
  $('partySelect').addEventListener('change',e=>{state.selectedParty=e.target.value;save();renderParty();updateMath();});
  $('partyCapacity').addEventListener('change', e => {
    const party = currentParty(), next = Number(e.target.value);
    const apply = () => { party.capacity=next; party.memberIds=party.memberIds.slice(0,next); save(); renderParty(); updateMath(); };
    if (party.memberIds.length <= next) return apply();
    openActionDialog({
      title: '파티 인원 변경',
      message: `${next}명으로 줄이면 마지막 ${party.memberIds.length - next}명이 파티에서 제외돼요.`,
      confirmText: '변경', onConfirm: apply,
      onCancel: () => { $('partyCapacity').value = String(party.capacity); }
    });
  });
  $('renamePartyBtn').addEventListener('click', () => {
    const party = currentParty();
    openActionDialog({title:'파티 이름 변경',inputLabel:'파티 이름',value:party.name,confirmText:'변경',
      onConfirm: name => { party.name=short(name,40); save(); renderParty(); renderOverview(); }});
  });
  $('clearPartyBtn').addEventListener('click', () => {
    const party = currentParty(); if (!party.memberIds.length) return;
    openActionDialog({title:'파티 비우기',message:'파티원만 제외해요. 캐릭터와 보스 배율 기록은 유지돼요.',confirmText:'비우기',danger:true,
      onConfirm: () => { party.memberIds=[]; save(); renderParty(); updateMath(); }});
  });
  $('deletePartyBtn').addEventListener('click', () => {
    if (state.parties.length <= 1) return toast('파티는 최소 1개가 필요해요.');
    const party = currentParty();
    openActionDialog({title:'파티 삭제',message:`${party.name} 파티를 삭제할까요? 캐릭터별 배율 기록은 유지돼요.`,confirmText:'삭제',danger:true,
      onConfirm: () => {state.parties=state.parties.filter(p=>p.id!==party.id);state.selectedParty=state.parties[0].id;save();renderParty();updateMath();}});
  });

  $('editForm').addEventListener('submit',e=>{e.preventDefault();const f=findCharacter($('editId').value);if(!f)return;const c=f.character;const name=short($('editName').value,30);if(!name)return toast('닉네임을 입력하세요.');if(state.owners.some(o=>o.characters.some(x=>x.id!==c.id&&x.name===name)))return toast('중복된 캐릭터명이 있습니다.');const imageRaw=$('editImage').value.trim();if(imageRaw&&!httpsUrl(imageRaw))return toast('캐릭터 이미지 주소는 HTTPS만 지원합니다.');Object.assign(c,{name,kind:$('editKind').value,job:short($('editJob').value,40),world:short($('editWorld').value,40),level:Number($('editLevel').value)||0,combatPower:Number($('editPower').value)||0,image:httpsUrl(imageRaw)});save();$('editDialog').close();renderRoster();renderParty();updateMath();});
  document.addEventListener('click',e=>{
    const close=e.target.closest('[data-close]');if(close){$(close.dataset.close)?.close();return;}
    const target=e.target.closest('[data-action]');if(!target)return;
    const action=target.dataset.action,key=target.dataset.id;
    if(action==='switch-party'){
      if (!state.parties.some(p => p.id === key)) return;
      state.selectedParty = key;
      $('partySwitcher').open = false;
      save(); renderParty(); updateMath(); return;
    }
    if(action==='show-overview'){if(!selectedBossOpen)return toast('보스를 먼저 선택하세요.');$('overviewDialog').showModal();return;}
    if(action==='period'){charPeriod.set(key,target.dataset.period);renderRatioDialogBody();return;}
    if(action==='compare-period'){comparePeriod=target.dataset.period;selectedBossOpen=false;renderEstimate();renderOverview();return;}
    if(action==='close-compare'){selectedBossOpen=false;$('bossDetailDialog')?.close();updateMath();return;}
    if(action==='select-boss'){
      const {boss,period}=target.dataset;
      const g=BOSS_GROUPS.find(([p,b])=>p===period&&b===boss); if(!g)return;
      const current=BOSS_BY_ID.get(state.bossKey);
      if(selectedBossOpen&&current?.boss===boss&&current?.period===period){selectedBossOpen=false;}
      else {
        // 해당 파티의 배율이 기록된 난이도를 우선 선택합니다.
        const candidates=g[2].map(diff=>({diff,records:currentParty().memberIds.filter(cid=>valuePercent(findCharacter(cid)?.character.ratios[`${period}|${boss}|${diff}`])!==null).length}));
        const preferred=[...candidates].sort((a,b)=>b.records-a.records)[0];
        const diff=(current?.boss===boss&&current.period===period && currentParty().memberIds.some(cid=>valuePercent(findCharacter(cid)?.character.ratios[`${period}|${boss}|${current.diff}`])!==null)) ? current.diff : (preferred?.records ? preferred.diff : g[2][0]);
        state.bossKey=`${period}|${boss}|${diff}`; selectedBossOpen=true; save();
      }
      updateMath(); if (!$('bossDetailDialog').open) $('bossDetailDialog').showModal(); return;
    }
    if(action==='select-difficulty'){state.bossKey=`${target.dataset.period}|${target.dataset.boss}|${target.dataset.diff}`;save();updateMath(); if (!$('bossDetailDialog').open) $('bossDetailDialog').showModal(); return;}
    if(action==='store-lookup'&&lookupResult){addCharacter(lookupResult);return;}
    if(action==='cancel-lookup'){$('lookupPreview').hidden=true;lookupResult=null;return;}
    manage(action,key);
  });
  function refreshRatioCount(ch, group) {
    const count = document.querySelector(`[data-ratio-count="${CSS.escape(ch.id)}"]`);
    if (count) count.textContent = `${Object.keys(ch.ratios).length}개 보스 배율 저장`;
    if (group) {
      const checked = [...group.querySelectorAll('input[data-ratio-key][type=number]')]
        .filter(el => valuePercent(el.value) !== null).length;
      group.querySelector('.boss-count').textContent = checked ? `${checked}개 입력됨` : '';
    }
  }
  document.addEventListener('change',e=>{
    const toggle = e.target.closest('input[data-diff-toggle]');
    if (toggle) {
      const found = findCharacter(toggle.dataset.char);
      const key = toggle.dataset.ratioKey;
      if (!found || !BOSS_BY_ID.has(key)) return;
      const item = toggle.closest('.diff-item');
      const field = item.querySelector('input[data-ratio-key][type=number]');
      const draftKey = `${found.character.id}|${key}`;
      if (toggle.checked) {
        draftRatioSelections.add(draftKey);
        item.classList.add('enabled');
        field.disabled = false;
        field.focus();
      } else {
        draftRatioSelections.delete(draftKey);
        delete found.character.ratios[key];
        field.value = '';
        field.disabled = true;
        item.classList.remove('enabled');
        refreshRatioCount(found.character, item.closest('.boss-group'));
        save(); updateMath();
      }
      return;
    }
    const input = e.target.closest('input[data-ratio-key][type=number]');
    if (!input) return;
    const found = findCharacter(input.dataset.char);
    if (!found) return;
    const key = input.dataset.ratioKey;
    if (!BOSS_BY_ID.has(key)) return;
    const percent = valuePercent(input.value);
    if (input.value.trim() !== '' && percent === null) {
      input.value = found.character.ratios[key] ?? '';
      return toast('배율은 0보다 크고 100,000 이하인 숫자여야 합니다.');
    }
    const item = input.closest('.diff-item');
    if (percent === null) {
      delete found.character.ratios[key];
      draftRatioSelections.delete(`${found.character.id}|${key}`);
      item.querySelector('[data-diff-toggle]').checked = false;
      item.classList.remove('enabled');
      input.disabled = true;
    } else {
      found.character.ratios[key] = percent;
      draftRatioSelections.delete(`${found.character.id}|${key}`);
    }
    input.value = percent ?? '';
    refreshRatioCount(found.character, item.closest('.boss-group'));
    save(); updateMath();
    toast(percent === null ? '보스 배율을 삭제했습니다.' : '보스 배율을 저장했습니다.');
  });
  $('compareBossFilter').addEventListener('input',renderBossTiles);
  $('ratioDialog').addEventListener('close',()=>{activeRatioCharId=null;renderRoster();});
  $('bossDetailDialog').addEventListener('close',()=>{selectedBossOpen=false;renderEstimate();renderOverview();});
  document.addEventListener('input',e=>{const el=e.target.closest('[data-boss-filter]');if(!el)return;const q=el.value.toLocaleLowerCase().trim();const editor=el.closest('.ratio-editor');editor.querySelectorAll('[data-boss-group]').forEach(group=>{group.hidden=!group.dataset.bossGroup.toLocaleLowerCase().includes(q);});});
  let draggingCharId = null;
  $('roster').addEventListener('dragstart',e=>{const card=e.target.closest('[data-drag-char]');if(!card)return;draggingCharId=card.dataset.dragChar;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',card.dataset.dragChar);card.classList.add('dragging');});
  $('roster').addEventListener('dragend',e=>{const card=e.target.closest('[data-drag-char]');card?.classList.remove('dragging');draggingCharId=null;});
  $('partySlots').addEventListener('dragover',e=>{const slot=e.target.closest('[data-drop-slot]');if(!slot)return;e.preventDefault();e.dataTransfer.dropEffect='move';slot.classList.add('over');});
  $('partySlots').addEventListener('dragleave',e=>{const slot=e.target.closest('[data-drop-slot]');if(slot&&!slot.contains(e.relatedTarget))slot.classList.remove('over');});
  $('partySlots').addEventListener('drop',e=>{const slot=e.target.closest('[data-drop-slot]');if(!slot)return;e.preventDefault();$('partySlots').querySelectorAll('.over').forEach(el=>el.classList.remove('over'));const charId=e.dataTransfer.getData('text/plain') || draggingCharId; if(findCharacter(charId))addMember(charId,Number(slot.dataset.dropSlot)); draggingCharId=null;});
  $('backupBtn').addEventListener('click',()=>{const blob=new Blob([JSON.stringify({ ...state, proxyUrl: undefined, exportedAt:new Date().toISOString() },null,2)],{type:'application/json'});const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download=`maple-party-backup-${new Date().toISOString().slice(0,10)}.json`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);});
  $('restoreBtn').addEventListener('click',()=>$('importFile').click());
  $('importFile').addEventListener('change', async e => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      if (file.size > 3_000_000) throw Error('3MB 이하 JSON 백업을 선택해 주세요.');
      const parsed = parseState(JSON.parse(await file.text()));
      openActionDialog({
        title: '백업 복원', message: '지금 저장된 데이터가 백업 파일 내용으로 교체돼요.',
        confirmText: '복원', danger: true,
        onConfirm: () => {
          state = parsed; expandedId = null; selectedBossOpen = false;
          save(); renderAll(); toast('백업을 복원했어요.');
        }
      });
    } catch (err) { toast(`복원 실패: ${err.message}`); }
    finally { e.target.value=''; }
  });
  $('resetBtn').addEventListener('click', () => {
    openActionDialog({
      title: '전체 데이터 초기화',
      message: '등록한 사용자, 캐릭터, 보스 배율, 파티 구성이 모두 삭제돼요. 되돌릴 수 없으니 필요한 데이터는 먼저 백업해 주세요.',
      confirmText: '전체 초기화', danger: true,
      onConfirm: () => {
        try { localStorage.removeItem(STORE); localStorage.removeItem(OLD_STORE); }
        catch (e) { console.error(e); return toast('초기화하지 못했어요. 저장 공간을 확인해 주세요.'); }
        state = defaultState(); expandedId=null; selectedBossOpen=false; activeRatioCharId=null;
        charPeriod.clear(); draftRatioSelections.clear(); lookupResult=null; rosterFilter=''; comparePeriod='주간';
        $('nicknameInput').value=''; $('rosterSearch').value=''; $('compareBossFilter').value='';
        $('lookupPreview').hidden=true; $('lookupPreview').innerHTML='';
        save(); renderAll(); toast('전체 데이터를 초기화했어요.');
      }
    });
  });

  renderAll();if(migrated){save();toast('이전 버전의 캐릭터·파티를 가져왔습니다. 이전 파티별 배율은 개인 배율로 옮기지 않았습니다.');}
})();
