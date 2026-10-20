/*
  Copyright (c) 2025-2026 bartholomewlaw
  All Rights Reserved
*/

const grid = document.getElementById("furnitureGrid");

fetch("data/furniture/furniture.json", { cache: "no-cache" })
    .then(res => res.json())
    .then(data => {
        data.forEach(item => {
            const card = document.createElement("div");
            card.className = "furniture-card";

            card.innerHTML = `
                <img src="${item.image}" alt="${item.name}">
                <h3>${item.name}</h3>
                <p class="description">${item.description}</p>
                <div class="price">${item.price}</div>
            `;

            grid.appendChild(card);
        });
    })
    .catch(err => console.error("Ошибка загрузки фурнитуры:", err));