/*
  Copyright (c) 2025-2026 bartholomewlaw
  All Rights Reserved
*/

document.addEventListener("DOMContentLoaded", function () {

    let allRecipes = [];
    let currentGroup = null;

    const container = document.getElementById("crafting-recipes");
    const categoriesEl = document.getElementById("crafting-categories");
    const searchInput = document.getElementById("craftingSearch");

    // =========================
    // Загрузка: index.json -> группы по столам
    // =========================
    async function loadAllData() {
        const index = await fetch("data/crafting/index.json").then(r => r.json());

        const allBtn = document.createElement("button");
        allBtn.className = "category-button active";
        allBtn.textContent = "Все";
        allBtn.addEventListener("click", () => selectGroup(null, allBtn));
        categoriesEl.appendChild(allBtn);

        for (const bench of index) {
            if (!bench.groups.length) continue;

            const block = document.createElement("div");
            block.className = "bench-block";
            block.innerHTML = `<div class="bench-title">${bench.name}</div>`;
            const row = document.createElement("div");
            row.className = "bench-groups";

            for (const group of bench.groups) {
                const data = await fetch(`data/crafting/${group.id}.json`).then(r => r.json());
                data.forEach(item => {
                    item.group = group.id;
                    item.groupName = group.name;
                    item.bench = bench.name;
                });
                allRecipes.push(...data);

                const btn = document.createElement("button");
                btn.className = "category-button";
                btn.textContent = `${group.name} (${group.count})`;
                btn.addEventListener("click", () => selectGroup(group.id, btn));
                row.appendChild(btn);
            }

            block.appendChild(row);
            categoriesEl.appendChild(block);
        }

        render();
    }

    function selectGroup(id, btn) {
        currentGroup = id;
        categoriesEl.querySelectorAll(".category-button").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        render();
    }

    // =========================
    // Отрисовка карточек
    // =========================
    function render() {
        const query = searchInput.value.trim().toLowerCase();
        const recipes = allRecipes.filter(r =>
            (!currentGroup || r.group === currentGroup) &&
            (!query || r.item_name.toLowerCase().includes(query) ||
                r.assemble.some(x => x.name.toLowerCase().includes(query)))
        );

        container.innerHTML = "";

        if (recipes.length === 0) {
            container.innerHTML = "<p>Ничего не найдено.</p>";
            return;
        }

        recipes.forEach(recipe => {
            const div = document.createElement("div");
            div.classList.add("recipe");

            const pic = recipe.image
                ? `<img src="images/crafting/${recipe.image}" alt="${recipe.item_name}" loading="lazy">`
                : `<div class="recipe-noimg">⚙</div>`;

            div.innerHTML = `
                ${pic}
                <h3>${recipe.item_name}</h3>
                <div class="recipe-group">${recipe.groupName}</div>
            `;

            div.addEventListener("click", () => openModal(recipe));
            container.appendChild(div);
        });
    }

    // =========================
    // МОДАЛКА
    // =========================
    function amount(x) {
        return x.kind === "count" ? `${x.amount} шт.` : x.amount;
    }

    function openModal(recipe) {
        const overlay = document.getElementById("modalOverlay");
        const content = document.getElementById("modalContent");

        const assembleHTML = recipe.assemble
            .map(x => `<li>${x.name}: ${amount(x)}</li>`)
            .join("");

        const disassembleHTML = recipe.assemble
            .map(x => {
                const half = Math.floor(x.amount * 0.5);
                return half > 0 ? `<li>${x.name}: ${x.kind === "count" ? half + " шт." : half}</li>` : "";
            })
            .join("");

        const need = recipe.requires && recipe.requires.length
            ? `<div class="modal-requires">Нужно надеть: ${recipe.requires.join(", ")}</div>`
            : "";

        content.innerHTML = `
            <button class="close-button" onclick="closeModal()">Закрыть</button>

            <div class="modal-title">${recipe.item_name}</div>

            <div class="modal-description">
                ${recipe.bench} → ${recipe.groupName}
                ${need}
            </div>

            <div class="modal-grid">
                <div class="modal-column">
                    <h3>Крафт</h3>
                    <ul>${assembleHTML}</ul>
                </div>

                <div class="modal-column">
                    <h3>Разборка (50%)</h3>
                    <ul>${disassembleHTML}</ul>
                </div>
            </div>
        `;

        overlay.classList.add("active");
        document.body.style.overflow = "hidden";
    }

    window.closeModal = function () {
        const overlay = document.getElementById("modalOverlay");
        if (!overlay) return;
        overlay.classList.remove("active");
        document.body.style.overflow = "";
    };

    const overlay = document.getElementById("modalOverlay");
    if (overlay) {
        overlay.addEventListener("click", function (e) {
            if (e.target === overlay) closeModal();
        });
    }

    searchInput.addEventListener("input", render);

    loadAllData().catch(e => {
        console.error("Ошибка загрузки рецептов:", e);
        container.innerHTML = "<p>Не удалось загрузить рецепты.</p>";
    });

});
