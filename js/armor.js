/*
  Copyright (c) 2025-2026 bartholomewlaw
  All Rights Reserved
*/
document.addEventListener("DOMContentLoaded", () => {
  const body = document.querySelector("#inserts-table tbody");
  if (!body) return;
  fetch("data/gear/inserts.json", { cache: "no-cache" })
    .then(r => r.json())
    .then(rows => {
      rows.forEach(r => {
        const tr = document.createElement("tr");
        [r.name, r.reduce, r.wear, r.hp, r.price ? r.price.toLocaleString("ru-RU") : "—", r.source || "—"].forEach(v => {
          const td = document.createElement("td");
          td.textContent = v;
          tr.appendChild(td);
        });
        body.appendChild(tr);
      });
    })
    .catch(err => console.error("Ошибка загрузки вставок:", err));
});
