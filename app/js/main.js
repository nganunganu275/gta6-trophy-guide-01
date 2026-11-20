// Vice Ledger — boot, checklist, detail pane, roadmap, missables, filters,
// spoiler setting, and the Next-up planner. Data comes from data/trophies.json;
// progress and the spoiler setting live in localStorage (see store.js).

import {
  loadProgress,
  saveProgress,
  loadSpoiler,
  saveSpoiler,
  buildExport,
  parseImport,
  downloadText,
} from './store.js';
import { KIND_LABELS, KIND_ORDER, ROADMAP, roadmapOrder, MISSABLE_NOTES } from './roadmap.js';

const DATA_URL = './data/trophies.json';
const GRADE_LETTERS = { platinum: 'P', gold: 'G', silver: 'S', bronze: 'B' };

const state = {
  trophies: [],
  sources: {},
  earned: loadProgress(),
  spoiler: loadSpoiler(),
  query: '',
  kind: '',
  grade: '',
  status: '',
  missableOnly: false,
  selectedId: null,
  view: 'checklist',
};

const $ = (selector) => document.querySelector(selector);

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/** A story trophy the spoiler setting hides: story kind, not yet earned. */
function isSpoilerHidden(trophy) {
  return state.spoiler && trophy.kind === 'story' && !state.earned.has(trophy.id);
}

function trophyById(id) {
  return state.trophies.find((trophy) => trophy.id === id);
}

/** First unearned trophy in roadmap order — the Next-up planner. */
function nextUp() {
  for (const id of roadmapOrder()) {
    if (!state.earned.has(id)) return trophyById(id);
  }
  return null;
}

function gradeCounts() {
  const counts = { platinum: [0, 0], gold: [0, 0], silver: [0, 0], bronze: [0, 0] };
  for (const trophy of state.trophies) {
    counts[trophy.grade][1] += 1;
    if (state.earned.has(trophy.id)) counts[trophy.grade][0] += 1;
  }
  return counts;
}

function renderStats() {
  const total = state.trophies.length;
  const earnedCount = state.earned.size;
  const percent = total ? Math.round((earnedCount / total) * 100) : 0;
  const counts = gradeCounts();
  const next = nextUp();
  const nextLine = next
    ? isSpoilerHidden(next)
      ? 'Next up: a hidden story trophy — earn it to reveal it.'
      : `Next up: <b>${escapeHtml(next.name)}</b> — ${escapeHtml(next.description)}`
    : 'Every trophy earned. The platinum is yours — congratulations, Leonida Legend.';
  $('#stats').innerHTML = `
    <div class="big-count">${earnedCount} <small>/ ${total} trophies &middot; ${percent}%</small></div>
    <div class="progress-bar" role="progressbar" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100"><div style="width:${percent}%"></div></div>
    <div class="grade-counts">
      <span>Platinum <b>${counts.platinum[0]}/${counts.platinum[1]}</b></span>
      <span>Gold <b>${counts.gold[0]}/${counts.gold[1]}</b></span>
      <span>Silver <b>${counts.silver[0]}/${counts.silver[1]}</b></span>
      <span>Bronze <b>${counts.bronze[0]}/${counts.bronze[1]}</b></span>
    </div>
    ${next ? `<button type="button" class="next-up" data-nextup="${next.id}" title="Show this trophy's guide">${nextLine}</button>` : `<div class="next-up">${nextLine}</div>`}`;
}

function renderKindChips() {
  const chips = [{ key: '', label: 'All kinds' }].concat(
    KIND_ORDER.map((key) => ({ key, label: KIND_LABELS[key] })),
  );
  $('#kind-chips').innerHTML = chips
    .map(
      (chip) =>
        `<button type="button" class="chip${state.kind === chip.key ? ' active' : ''}" data-kind="${chip.key}">${escapeHtml(chip.label)}</button>`,
    )
    .join('');
}

function matchesFilters(trophy) {
  if (state.kind && trophy.kind !== state.kind) return false;
  if (state.grade && trophy.grade !== state.grade) return false;
  if (state.status === 'earned' && !state.earned.has(trophy.id)) return false;
  if (state.status === 'unearned' && state.earned.has(trophy.id)) return false;
  if (state.missableOnly && !trophy.missable) return false;
  if (state.query) {
    const haystack = isSpoilerHidden(trophy)
      ? 'hidden story trophy story'
      : `${trophy.name} ${trophy.description} ${KIND_LABELS[trophy.kind] || ''}`.toLowerCase();
    if (!haystack.includes(state.query)) return false;
  }
  return true;
}

function renderList() {
  const list = $('#trophy-list');
  const visible = state.trophies.filter(matchesFilters);
  $('#result-count').textContent = `Showing ${visible.length} of ${state.trophies.length} trophies. Click a trophy to read its guide; tick the box when you earn it.`;
  if (visible.length === 0) {
    list.innerHTML = '<li class="trophy-row"><div class="trophy-body"><div class="trophy-name">No trophies match these filters.</div><div class="trophy-desc">Try clearing the search or a filter.</div></div></li>';
    return;
  }
  list.innerHTML = visible
    .map((trophy) => {
      const earned = state.earned.has(trophy.id);
      const hidden = isSpoilerHidden(trophy);
      const name = hidden ? 'Hidden story trophy' : trophy.name;
      const desc = hidden
        ? 'Earn this trophy to reveal its name and description.'
        : trophy.description;
      const target = trophy.target
        ? `<span class="tag target">${escapeHtml(trophy.targetLabel || `0/${trophy.target}`)}: ${trophy.target}</span>`
        : '';
      return `<li class="trophy-row${earned ? ' earned' : ''}${state.selectedId === trophy.id ? ' selected' : ''}" data-id="${trophy.id}">
        <input type="checkbox" data-check="${trophy.id}" ${earned ? 'checked' : ''} aria-label="Earned: ${escapeHtml(name)}">
        <span class="medal ${trophy.grade}" title="${trophy.grade}">${GRADE_LETTERS[trophy.grade]}</span>
        <div class="trophy-body">
          <div class="trophy-name"><span class="name-text">${escapeHtml(name)}</span>${trophy.hidden && !hidden ? ' <span class="hidden-tag">(hidden on PSN)</span>' : ''}</div>
          <div class="trophy-desc">${escapeHtml(desc)}</div>
          <div class="trophy-meta">
            <span class="tag">${escapeHtml(KIND_LABELS[trophy.kind] || trophy.kind)}</span>
            <span class="tag">${trophy.grade}</span>
            ${trophy.missable ? '<span class="tag missable">Missable</span>' : ''}
            ${target}
            ${earned ? '<span class="tag earned-tag">Earned</span>' : ''}
          </div>
        </div>
      </li>`;
    })
    .join('');
}

function renderDetail() {
  const pane = $('#detail');
  const selected = state.selectedId ? trophyById(state.selectedId) : null;
  const trophy = selected || nextUp();
  if (!trophy) {
    pane.innerHTML = '<div class="detail-card"><p class="detail-empty">Every trophy earned — nothing left to guide you to.</p></div>';
    return;
  }
  const earned = state.earned.has(trophy.id);
  const hidden = isSpoilerHidden(trophy);
  const heading = selected ? 'Guide' : 'Next up — your guide';
  if (hidden) {
    pane.innerHTML = `<div class="detail-card">
      <p class="kicker">${heading}</p>
      <h2>Hidden story trophy</h2>
      <p class="official">The spoiler setting hides this story trophy&rsquo;s name, description and guide until you earn it. Tick its box in the checklist — or turn the spoiler setting off — to reveal it.</p>
    </div>`;
    return;
  }
  const sourceLinks = (trophy.sources || [])
    .map((key) => state.sources[key])
    .filter(Boolean)
    .map(
      (source) =>
        `<li><a href="${escapeHtml(source.url)}" target="_blank" rel="noopener">${escapeHtml(source.name)}</a></li>`,
    )
    .join('');
  pane.innerHTML = `<div class="detail-card">
    <p class="kicker">${heading} &middot; ${trophy.grade}${trophy.hidden ? ' &middot; hidden on PSN' : ''}</p>
    <h2>${escapeHtml(trophy.name)}</h2>
    <p class="official">Official description: &ldquo;${escapeHtml(trophy.description)}&rdquo;${trophy.target ? ` &middot; PSN tracks ${trophy.target} ${escapeHtml(trophy.targetLabel || '')}.` : ''}</p>
    ${trophy.missable ? '<div class="warn"><b>Missable.</b> This is the list&rsquo;s only potentially missable trophy — read the timing note in the guide and see the Missables tab.</div>' : ''}
    <div class="guide"><p>${escapeHtml(trophy.guide)}</p></div>
    <label class="check"><input type="checkbox" data-check="${trophy.id}" ${earned ? 'checked' : ''}> I earned this trophy</label>
    <div class="sources"><h3>Sources — cited, never copied</h3><ul>${sourceLinks}</ul></div>
  </div>`;
}

function renderRoadmap() {
  $('#roadmap-stages').innerHTML = ROADMAP.map((stage) => {
    const done = stage.ids.filter((id) => state.earned.has(id)).length;
    const items = stage.ids
      .map((id) => {
        const trophy = trophyById(id);
        if (!trophy) return '';
        const earned = state.earned.has(id);
        const hidden = isSpoilerHidden(trophy);
        return `<li class="${earned ? 'done' : ''}"><span class="mini-grade">${trophy.grade[0].toUpperCase()}</span> ${hidden ? 'Hidden story trophy' : escapeHtml(trophy.name)}</li>`;
      })
      .join('');
    return `<div class="stage">
      <h3>Stage ${stage.stage}: ${escapeHtml(stage.title)}</h3>
      <div class="hours">${escapeHtml(stage.hours)}</div>
      <p>${escapeHtml(stage.blurb)}</p>
      <div class="stage-count">${done} of ${stage.ids.length} trophies earned in this stage.</div>
      <ul>${items}</ul>
    </div>`;
  }).join('');
}

function renderMissables() {
  const missable = state.trophies.filter((trophy) => trophy.missable);
  $('#missable-list').innerHTML =
    missable
      .map((trophy) => {
        const earned = state.earned.has(trophy.id);
        return `<div class="stage">
        <h3>${escapeHtml(trophy.name)} <span class="tag missable">Potentially missable</span>${earned ? ' <span class="tag earned-tag">Earned</span>' : ''}</h3>
        <p class="official">Official description: &ldquo;${escapeHtml(trophy.description)}&rdquo; &middot; ${trophy.grade} &middot; PSN tracks ${trophy.target} ${escapeHtml(trophy.targetLabel || '')}.</p>
        <p>${escapeHtml(trophy.guide)}</p>
      </div>`;
      })
      .join('') +
    MISSABLE_NOTES.map(
      (note) => `<div class="callout"><h3>${escapeHtml(note.title)}</h3><p>${escapeHtml(note.body)}</p><p class="cite">Source: ${escapeHtml(note.source)}.</p></div>`,
    ).join('');
}

function renderAboutSources() {
  $('#source-list').innerHTML = Object.values(state.sources)
    .map(
      (source) =>
        `<li><a href="${escapeHtml(source.url)}" target="_blank" rel="noopener">${escapeHtml(source.name)}</a></li>`,
    )
    .join('');
}

function renderAll() {
  renderStats();
  renderKindChips();
  renderList();
  renderDetail();
  renderRoadmap();
  renderMissables();
}

function setView(view) {
  state.view = view;
  for (const button of document.querySelectorAll('.tab')) {
    button.classList.toggle('active', button.dataset.view === view);
  }
  for (const section of document.querySelectorAll('.view')) {
    section.hidden = section.id !== `view-${view}`;
  }
  if (location.hash !== `#${view}`) history.replaceState(null, '', `#${view}`);
}

function toggleEarned(id, checked) {
  if (checked) state.earned.add(id);
  else state.earned.delete(id);
  saveProgress(state.earned);
  renderAll();
}

function wireEvents() {
  document.querySelectorAll('.tab').forEach((button) => {
    button.addEventListener('click', () => setView(button.dataset.view));
  });

  $('#search').addEventListener('input', (event) => {
    state.query = event.target.value.trim().toLowerCase();
    renderList();
  });

  $('#kind-chips').addEventListener('click', (event) => {
    const chip = event.target.closest('[data-kind]');
    if (!chip) return;
    state.kind = chip.dataset.kind;
    renderKindChips();
    renderList();
  });

  $('#grade-filter').addEventListener('change', (event) => {
    state.grade = event.target.value;
    renderList();
  });

  $('#status-filter').addEventListener('change', (event) => {
    state.status = event.target.value;
    renderList();
  });

  $('#missable-only').addEventListener('change', (event) => {
    state.missableOnly = event.target.checked;
    renderList();
  });

  const spoilerToggle = $('#spoiler-toggle');
  spoilerToggle.checked = state.spoiler;
  spoilerToggle.addEventListener('change', (event) => {
    state.spoiler = event.target.checked;
    saveSpoiler(state.spoiler);
    renderAll();
  });

  document.addEventListener('change', (event) => {
    const box = event.target.closest('[data-check]');
    if (box) toggleEarned(Number(box.dataset.check), box.checked);
  });

  $('#trophy-list').addEventListener('click', (event) => {
    if (event.target.closest('[data-check]')) return;
    const row = event.target.closest('[data-id]');
    if (!row) return;
    state.selectedId = Number(row.dataset.id);
    renderList();
    renderDetail();
  });

  // The Next-up box jumps to that trophy's guide (and its row in the list).
  $('#stats').addEventListener('click', (event) => {
    const box = event.target.closest('[data-nextup]');
    if (!box) return;
    state.selectedId = Number(box.dataset.nextup);
    setView('checklist');
    renderAll();
    const row = document.querySelector(`.trophy-row[data-id="${state.selectedId}"]`);
    if (row) row.scrollIntoView({ block: 'center' });
  });

  $('#export-btn').addEventListener('click', () => {
    const doc = buildExport(state.earned, state.spoiler);
    downloadText('vice-ledger-progress.json', JSON.stringify(doc, null, 2));
    $('#save-note').textContent = `Exported ${state.earned.size} earned trophies to vice-ledger-progress.json.`;
  });

  $('#import-btn').addEventListener('click', () => $('#import-file').click());
  $('#import-file').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    try {
      const { earned, spoiler } = parseImport(await file.text());
      state.earned = earned;
      state.spoiler = spoiler;
      saveProgress(state.earned);
      saveSpoiler(state.spoiler);
      spoilerToggle.checked = spoiler;
      renderAll();
      $('#save-note').textContent = `Imported ${earned.size} earned trophies from ${file.name}.`;
    } catch (error) {
      $('#save-note').textContent = `Import failed: ${error.message}`;
    }
  });

  $('#reset-btn').addEventListener('click', () => {
    if (!window.confirm('Clear all earned trophies? This cannot be undone (export first if you want a backup).')) return;
    state.earned = new Set();
    saveProgress(state.earned);
    renderAll();
    $('#save-note').textContent = 'Progress reset. Nothing is earned yet.';
  });
}

async function boot() {
  const response = await fetch(DATA_URL);
  if (!response.ok) throw new Error(`Could not load ${DATA_URL} (${response.status})`);
  const data = await response.json();
  state.trophies = data.trophies;
  state.sources = data.sources;
  renderAboutSources();
  wireEvents();
  const hashView = location.hash.replace('#', '');
  if (['checklist', 'roadmap', 'missables', 'about'].includes(hashView)) setView(hashView);
  renderAll();
}

boot().catch((error) => {
  document.querySelector('main').innerHTML =
    `<p style="padding:2rem">The guide could not load its trophy data (${escapeHtml(error.message)}). Serve app/ with a static file server — for example <code>node serve.ts</code> — and open it from your local server.</p>`;
});
