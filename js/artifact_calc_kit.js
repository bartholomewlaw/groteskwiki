/*
  Copyright (c) 2025-2026 bartholomewlaw
  All Rights Reserved
*/

document.addEventListener("DOMContentLoaded", () => {
  const kitSel = document.getElementById("kit-select");
  const insSel = document.getElementById("insert-select");
  const zoneSel = document.getElementById("zone-select");
  const out = document.getElementById("kit-result");
  if (!kitSel || !insSel || !zoneSel || !out) return;

  const ZONES = [
    { name: "Вне зоны", dmg: 0, delay: 25 },
    { name: "Фон (до 4.7)", dmg: 4.7, delay: 25 },
    { name: "Слабая (до 36)", dmg: 36, delay: 25 },
    { name: "Средняя (до 65)", dmg: 65, delay: 25 },
    { name: "Сильная (до 111)", dmg: 111, delay: 25 },
    { name: "ЧАЭС (240, раз в 5 с)", dmg: 240, delay: 5 }
  ];
  const SICK_DOSE = 1000;
  const TICK = 30;

  let kits = [];
  let inserts = [];
  let artRad = 0;

  function pct(s) { return parseFloat(String(s).replace("%", "")) || 0; }

  function fill() {
    kitSel.innerHTML = '<option value="">Без комплекта</option>';
    kits.forEach((k, ki) => k.variants.forEach((v, vi) => {
      const o = document.createElement("option");
      o.value = ki + ":" + vi;
      o.textContent = k.name + " · " + v.rank;
      kitSel.appendChild(o);
    }));
    insSel.innerHTML = '<option value="0">Без вставки</option>';
    inserts.forEach(r => {
      const o = document.createElement("option");
      o.value = pct(r.reduce) / 100;
      o.textContent = r.name + " (" + r.reduce + ")";
      insSel.appendChild(o);
    });
    zoneSel.innerHTML = "";
    ZONES.forEach((z, i) => {
      const o = document.createElement("option");
      o.value = i;
      o.textContent = z.name;
      zoneSel.appendChild(o);
    });
  }

  function row(label, value, cls) {
    return `<div class="stat-row ${cls || ""}"><span>${label}</span><span>${value}</span></div>`;
  }

  function render() {
    const reduce = parseFloat(insSel.value) || 0;
    let stats = null;
    if (kitSel.value) {
      const [ki, vi] = kitSel.value.split(":").map(Number);
      stats = kits[ki]?.variants[vi]?.stats || null;
    }
    const kitRad = stats ? Number(stats["Защита от радиации"]) || 0 : 0;
    let html = '<div class="stat-group">';
    ["Защита торса", "Защита головы", "Защита ног"].forEach(k => {
      const base = stats ? pct(stats[k]) / 100 : 0;
      const total = 1 - (1 - base) * (1 - reduce);
      html += row(k, Math.round(total * 100) + "%", total > 0 ? "positive" : "");
    });
    html += row("Радзащита комплекта", kitRad, kitRad > 0 ? "positive" : "");
    html += "</div>";

    const z = ZONES[Number(zoneSel.value) || 0];
    const hit = Math.max(0, z.dmg - kitRad);
    const zoneDose = hit * TICK / z.delay;
    const net = zoneDose - artRad;
    html += '<div class="stat-group">';
    if (z.dmg > 0)
      html += row("Доза от зоны за 30 с", "+" + parseFloat(zoneDose.toFixed(2)), zoneDose > 0 ? "negative" : "positive");
    if (artRad !== 0)
      html += row("Артефакты за 30 с", (artRad > 0 ? "−" : "+") + parseFloat(Math.abs(artRad).toFixed(2)), artRad > 0 ? "positive" : "negative");
    html += row("Итого за 30 с", (net > 0 ? "+" : net < 0 ? "−" : "") + parseFloat(Math.abs(net).toFixed(2)), net > 0 ? "negative" : "positive");
    if (net > 0) {
      const min = SICK_DOSE / net * TICK / 60;
      html += row("До болезни (доза 1000)", min >= 120 ? Math.round(min / 60) + " ч" : Math.max(1, Math.round(min)) + " мин", "negative");
    } else {
      html += row("Доза", net < 0 ? "выводится" : "не растёт", "positive");
    }
    html += "</div>";
    out.innerHTML = html;
  }

  document.addEventListener("artcalc:rad", e => { artRad = Number(e.detail) || 0; render(); });
  [kitSel, insSel, zoneSel].forEach(s => s.addEventListener("change", render));

  Promise.all([
    fetch("data/gear/Kits.json").then(r => r.json()),
    fetch("data/gear/inserts.json").then(r => r.json())
  ]).then(([k, i]) => { kits = k; inserts = i; fill(); render(); })
    .catch(err => console.error("Ошибка загрузки комплектов:", err));
});
