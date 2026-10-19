/*
  Copyright (c) 2025-2026 bartholomewlaw
  All Rights Reserved
*/

const content = document.getElementById('content');

document.addEventListener('DOMContentLoaded', () => {
    // Восстанавливаем сохранённый контент, если есть
    const savedContent = localStorage.getItem('wikiContent');
    if (savedContent && content) {
        content.innerHTML = savedContent;
    }
});