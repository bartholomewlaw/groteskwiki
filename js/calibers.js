const grid = document.querySelector('.caliber-grid');
const searchInput = document.getElementById('caliberSearch');
const groupSelect = document.getElementById('caliberGroup');
const tierSelect = document.getElementById('caliberTier');
const mutantSelect = document.getElementById('caliberMutant');
const tableWrap = document.querySelector('.caliber-table-wrap');
const tableBody = document.querySelector('#caliberTable tbody');
const tableHead = document.querySelector('#caliberTable thead');
const viewButtons = document.querySelectorAll('.caliber-view button');
const compareBar = document.querySelector('.caliber-compare-bar');
const compareCount = document.getElementById('compareCount');
const compareBox = document.querySelector('.caliber-compare');
const HP_REF = 1000;

const COLUMNS = [
    { key: 'pick', label: '', sortable: false },
    { key: 'group', label: 'Калибр', type: 'group' },
    { key: 'name', label: 'Патрон', type: 'text' },
    { key: 'damage', label: 'Урон', type: 'num' },
    { key: 'shot', label: 'За выстрел', type: 'num' },
    { key: 'blood', label: 'Кровь', type: 'num' },
    { key: 'hits', label: 'Выстрелов на 1000 HP', type: 'num' },
    { key: 'mutBody', label: 'На мутанта: тело', type: 'num' },
    { key: 'mutHead', label: 'На мутанта: голова', type: 'num' },
    { key: 'speed', label: 'Скорость, м/с', type: 'num' },
    { key: 'tier', label: 'Тир', type: 'text' },
    { key: 'price', label: 'Цена', type: 'num' },
    { key: 'source', label: 'Где взять', type: 'text' },
    { key: 'gunsCount', label: 'Стволов', type: 'num' }
];

let data = [];
let view = 'table';
let sortKey = 'shot';
let sortDir = -1;
const picked = new Set();
const opened = new Set();

function loadView() {
    try {
        const v = localStorage.getItem('caliberView');
        if (v === 'cards' || v === 'table') view = v;
    } catch (e) {}
}

function saveView() {
    try { localStorage.setItem('caliberView', view); } catch (e) {}
}

function groupKey(g) {
    const m = String(g).match(/[\d.]+/);
    return m ? parseFloat(m[0]) : 9999;
}

function esc(s) {
    return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

fetch("data/calibers.json", { cache: "no-cache" })
    .then(res => res.json())
    .then(json => {
        data = json.map(r => Object.assign({}, r, {
            pellets: r.pellets || 1,
            shot: r.shot || r.damage,
            hits: (r.shot || r.damage) > 0 ? Math.ceil(HP_REF / (r.shot || r.damage)) : '',
            gunsCount: (r.guns || []).length
        }));
        fillFilters();
        buildHead();
        loadView();
        applyMutant();
        render();
        return fetch("data/mutants.json", { cache: "no-cache" }).then(res => res.json()).then(m => {
            mutants = m;
            fillMutants();
            applyMutant();
            render();
        });
    })
    .catch(err => console.error('Ошибка загрузки калибров:', err));

let mutants = [];
let mutantIdx = -1;

function mutantLabel(m) {
    return m.name + (m.tier ? ' (T' + m.tier + ')' : '') + (m.suffix ? ' ' + m.suffix : '');
}

function fillMutants() {
    let saved = '';
    try { saved = localStorage.getItem('caliberMutant') || ''; } catch (e) {}
    const fams = [['мутанты', 'Мутанты и зомби'], ['животные', 'Животные']];
    fams.forEach(([fam, title]) => {
        const items = mutants.map((m, i) => [m, i]).filter(([m]) => m.fam === fam);
        if (!items.length) return;
        const og = document.createElement('optgroup');
        og.label = title;
        items.forEach(([m, i]) => {
            const o = document.createElement('option');
            o.value = String(i);
            o.textContent = mutantLabel(m);
            og.appendChild(o);
        });
        mutantSelect.appendChild(og);
    });
    let def = mutants.findIndex(m => m.name === saved);
    if (def < 0) def = mutants.findIndex(m => /кровосос/i.test(m.name) && m.mod === 'SMCS');
    if (def < 0) def = 0;
    mutantSelect.value = String(def);
}

function applyMutant() {
    mutantIdx = mutants.length ? Number(mutantSelect.value) : -1;
    const m = mutantIdx >= 0 ? mutants[mutantIdx] : null;
    data.forEach(r => {
        const shot = r.shot || r.damage;
        r.mutBody = m && m.body && shot > 0 ? Math.ceil(m.body / shot) : '';
        r.mutHead = m && m.head && shot > 0 ? Math.ceil(m.head / shot) : '';
    });
    if (m) { try { localStorage.setItem('caliberMutant', m.name); } catch (e) {} }
}

function fillFilters() {
    const groups = [...new Set(data.map(r => r.group))].sort((a, b) => groupKey(a) - groupKey(b) || a.localeCompare(b));
    groups.forEach(g => groupSelect.insertAdjacentHTML('beforeend', `<option value="${esc(g)}">${esc(g)}</option>`));
    const tiers = [...new Set(data.map(r => r.tier || ''))].sort();
    tiers.forEach(t => tierSelect.insertAdjacentHTML('beforeend', `<option value="${esc(t)}">${t ? esc(t) : 'без тира'}</option>`));
}

function filtered() {
    const q = searchInput.value.trim().toLowerCase();
    const g = groupSelect.value;
    const t = tierSelect.value;
    return data.filter(r => {
        if (g !== '*' && r.group !== g) return false;
        if (t !== '*' && (r.tier || '') !== t) return false;
        if (!q) return true;
        return r.name.toLowerCase().includes(q) || r.group.toLowerCase().includes(q) || (r.guns || []).some(x => x.toLowerCase().includes(q));
    });
}

function sorted(rows) {
    const col = COLUMNS.find(c => c.key === sortKey);
    return rows.slice().sort((a, b) => {
        let va = a[sortKey], vb = b[sortKey];
        let r;
        if (col && col.type === 'num') {
            const na = va === '' || va == null ? null : Number(va);
            const nb = vb === '' || vb == null ? null : Number(vb);
            if (na === null && nb === null) r = 0;
            else if (na === null) return 1;
            else if (nb === null) return -1;
            else r = na - nb;
        } else if (col && col.type === 'group') {
            r = groupKey(va) - groupKey(vb) || String(va).localeCompare(String(vb));
        } else {
            if (!va && vb) return 1;
            if (va && !vb) return -1;
            r = String(va || '').localeCompare(String(vb || ''), 'ru');
        }
        return r * sortDir || a.name.localeCompare(b.name, 'ru');
    });
}

function buildHead() {
    tableHead.innerHTML = '<tr>' + COLUMNS.map(c => {
        if (c.sortable === false) return '<th class="col-pick"></th>';
        return `<th data-key="${c.key}" class="sortable" tabindex="0">${esc(c.label)}<span class="sort-mark"></span></th>`;
    }).join('') + '</tr>';
    tableHead.querySelectorAll('th.sortable').forEach(th => {
        const go = () => {
            const k = th.dataset.key;
            if (sortKey === k) sortDir = -sortDir;
            else { sortKey = k; sortDir = (COLUMNS.find(c => c.key === k).type === 'num') ? -1 : 1; }
            render();
        };
        th.addEventListener('click', go);
        th.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    });
}

function renderTable(rows) {
    tableHead.querySelectorAll('th.sortable').forEach(th => {
        const mark = th.querySelector('.sort-mark');
        th.classList.toggle('active', th.dataset.key === sortKey);
        mark.textContent = th.dataset.key === sortKey ? (sortDir > 0 ? ' ▲' : ' ▼') : '';
    });
    const maxDmg = Math.max(...data.map(r => r.shot || 0), 1);
    tableBody.innerHTML = '';
    rows.forEach(r => {
        const tr = document.createElement('tr');
        tr.className = 'cal-row' + (r.rank ? ' rank-' + r.rank : '');
        const pct = Math.round((r.shot / maxDmg) * 100);
        tr.innerHTML = `
            <td class="col-pick"><input type="checkbox" aria-label="Сравнить ${esc(r.name)}" ${picked.has(r.class) ? 'checked' : ''}></td>
            <td class="col-group">${esc(r.group)}</td>
            <td class="col-name">${esc(r.name)}</td>
            <td class="num">${r.damage}${r.pellets > 1 ? ` <span class="pellets">× ${r.pellets}</span>` : ''}</td>
            <td class="num col-dmg"><span class="dmg-bar" style="width:${pct}%"></span><span class="dmg-val">${r.shot}</span></td>
            <td class="num">${r.blood !== '' ? r.blood : '—'}</td>
            <td class="num">${r.hits}</td>
            <td class="num col-mut">${r.mutBody !== '' ? r.mutBody : '—'}</td>
            <td class="num col-mut">${r.mutHead !== '' ? r.mutHead : '—'}</td>
            <td class="num">${r.speed !== '' ? r.speed : '—'}</td>
            <td class="col-tier">${r.tier ? `<span class="tier-pill">${esc(r.tier)}</span>` : '—'}</td>
            <td class="num">${r.price !== '' ? r.price : '—'}</td>
            <td class="col-src">${r.source ? esc(r.source) : '—'}</td>
            <td class="num col-guns">${r.gunsCount}<span class="guns-toggle">${opened.has(r.class) ? '▾' : '▸'}</span></td>`;
        tr.querySelector('input').addEventListener('click', e => {
            e.stopPropagation();
            if (e.target.checked) picked.add(r.class); else picked.delete(r.class);
            renderCompareBar();
        });
        tr.addEventListener('click', () => {
            if (opened.has(r.class)) opened.delete(r.class); else opened.add(r.class);
            render();
        });
        tableBody.appendChild(tr);
        if (opened.has(r.class)) {
            const sub = document.createElement('tr');
            sub.className = 'cal-guns';
            sub.innerHTML = `<td></td><td colspan="${COLUMNS.length - 1}"><span class="label">Стволы под патрон:</span> ${(r.guns || []).map(esc).join(', ') || '—'}</td>`;
            tableBody.appendChild(sub);
        }
    });
    if (!rows.length) tableBody.innerHTML = `<tr><td colspan="${COLUMNS.length}" class="empty">Ничего не найдено. Попробуйте другой запрос или сбросьте фильтры.</td></tr>`;
}

function renderCards(rows) {
    grid.innerHTML = '';
    rows.forEach(item => {
        const card = document.createElement('div');
        card.classList.add('caliber-card');
        if (item.rank) card.dataset.rank = item.rank;
        card.innerHTML = `
            <div class="caliber-name"><span class="label">Калибр:</span>${esc(item.name)}</div>
            <div class="caliber-damage"><span class="label">Урон:</span>${item.damage}${item.pellets > 1 ? ' × ' + item.pellets + ' = ' + item.shot : ''}</div>
        ${item.tier ? `<div class="caliber-damage"><span class="label">Тир:</span>${esc(item.tier)}</div>` : ''}
        `;
        grid.appendChild(card);
    });
}

function renderCompareBar() {
    compareCount.textContent = picked.size;
    compareBar.hidden = picked.size === 0;
    if (!compareBox.hidden) renderCompare();
}

function renderCompare() {
    const rows = data.filter(r => picked.has(r.class));
    if (rows.length === 0) { compareBox.hidden = true; return; }
    const fields = [
        ['Калибр', r => r.group], ['Урон', r => r.pellets > 1 ? r.damage + ' × ' + r.pellets : r.damage], ['За выстрел', r => r.shot], ['Кровь', r => r.blood || '—'],
        ['Выстрелов на 1000 HP', r => r.hits], ['На мутанта: тело', r => r.mutBody !== '' ? r.mutBody : '—'], ['На мутанта: голова', r => r.mutHead !== '' ? r.mutHead : '—'],
        ['Скорость, м/с', r => r.speed || '—'], ['Тир', r => r.tier || '—'],
        ['Цена', r => r.price !== '' ? r.price : '—'], ['Где взять', r => r.source || '—'], ['Стволов', r => r.gunsCount]
    ];
    const best = {
        'За выстрел': Math.max(...rows.map(r => r.shot)),
        'Выстрелов на 1000 HP': Math.min(...rows.map(r => r.hits || 9999)),
        'На мутанта: тело': Math.min(...rows.map(r => r.mutBody || 9999)),
        'На мутанта: голова': Math.min(...rows.map(r => r.mutHead || 9999)),
        'Скорость, м/с': Math.max(...rows.map(r => r.speed || 0))
    };
    compareBox.innerHTML = `
        <div class="compare-head"><span>Сравнение</span><button type="button" class="compare-close">Закрыть</button></div>
        <div class="compare-scroll"><table class="compare-table">
            <thead><tr><th></th>${rows.map(r => `<th>${esc(r.name)}</th>`).join('')}</tr></thead>
            <tbody>${fields.map(([label, fn]) => `<tr><th>${label}</th>${rows.map(r => {
                const v = fn(r);
                const win = best[label] !== undefined && rows.length > 1 && v === best[label];
                return `<td class="${win ? 'best' : ''}">${esc(v)}</td>`;
            }).join('')}</tr>`).join('')}</tbody>
        </table></div>`;
    compareBox.querySelector('.compare-close').addEventListener('click', () => { compareBox.hidden = true; });
    compareBox.hidden = false;
}

function render() {
    const rows = sorted(filtered());
    viewButtons.forEach(b => b.classList.toggle('active', b.dataset.view === view));
    tableWrap.hidden = view !== 'table';
    grid.hidden = view !== 'cards';
    if (view === 'table') renderTable(rows); else renderCards(rows);
    renderCompareBar();
}

searchInput.addEventListener('input', render);
groupSelect.addEventListener('change', render);
tierSelect.addEventListener('change', render);
mutantSelect.addEventListener('change', () => { applyMutant(); render(); });
viewButtons.forEach(b => b.addEventListener('click', () => { view = b.dataset.view; saveView(); render(); }));
document.getElementById('compareShow').addEventListener('click', renderCompare);
document.getElementById('compareClear').addEventListener('click', () => {
    picked.clear();
    compareBox.hidden = true;
    render();
});
