/*
  Copyright (c) 2025-2026 bartholomewlaw
  All Rights Reserved
*/

// Подсветка активной вкладки
document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('nav ul li a');
    tabs.forEach(tab => {
        if (tab.href === window.location.href) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
});
