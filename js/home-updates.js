/*
  Copyright (c) 2025-2026 bartholomewlaw
  All Rights Reserved
*/

document.addEventListener('DOMContentLoaded', () => {
    const content = document.getElementById('content');

    // Восстановление сохранённого контента
    const savedContent = localStorage.getItem('wikiContent');
    if (savedContent && content) content.innerHTML = savedContent;

    // Загрузка основной новости
    fetch('data/home/main.json', { cache: "no-cache" })
        .then(res => res.json())
        .then(data => {
            const mainNews = document.getElementById('mainNews');
            if (!mainNews || !data) return;
            if (Array.isArray(data)) {
                mainNews.classList.remove('main-news');
                data.forEach(item => {
                    if (!item || !item.text || !item.date) return;
                    const block = document.createElement('div');
                    block.className = 'main-news';
                    block.innerHTML = `<strong>${item.date}:</strong> ${item.text}`;
                    mainNews.appendChild(block);
                });
            } else if (data.text && data.date) {
                mainNews.innerHTML = `<strong>${data.date}:</strong> ${data.text}`;
            }
        })
        .catch(err => console.error("Ошибка загрузки main.json:", err));

    // Загрузка обновлений
    fetch('data/home/updates.json', { cache: "no-cache" })
        .then(res => res.json())
        .then(data => {
            const updatesList = document.getElementById('updatesList');
            if (updatesList && Array.isArray(data)) {
                data.forEach(update => {
                    const li = document.createElement('li');
                    li.innerHTML = `<strong>${update.date}:</strong> ${update.text}`;
                    updatesList.appendChild(li);
                });
            }
        })
        .catch(err => console.error("Ошибка загрузки updates.json:", err));
});