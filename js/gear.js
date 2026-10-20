/*
  Copyright (c) 2025-2026 bartholomewlaw
  All Rights Reserved
*/

document.addEventListener("DOMContentLoaded", () => {
  const jsonFiles = {
    "Kits": "data/gear/Kits.json",
    "Backpacks": "data/gear/Backpacks.json"
  };

  const roman = ["", "I", "II", "III", "IV", "V", "VI", "VII"];

  function tierText(kit) {
    const t = kit.tiers || [];
    if (!t.length) return "";
    const a = t[0], b = t[t.length - 1];
    return a === b ? `Тир ${roman[a]}` : `Тир ${roman[a]}–${roman[b]}`;
  }

  function loadInserts() {
    const body = document.querySelector("#inserts-table tbody");
    if (!body) return;
    fetch("data/gear/inserts.json")
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
  }

  const kitsGrid = document.getElementById("kits-grid");
  const categoryBtns = document.querySelectorAll(".category-btn");
  const modal = document.getElementById("kitModal");
  const modalClose = document.getElementById("modalClose");
  const modalKitName = document.getElementById("modalKitName");
  const modalKitCategory = document.getElementById("modalKitCategory");
  const modalRanks = document.getElementById("modalRankButtons");
  const modalMainImage = document.getElementById("modalMainImage");
  const modalDesc = document.getElementById("modalDesc");
  const modalStats = document.getElementById("modalStats");
  const modalSlots = document.getElementById("modalSlots");

  let allKits = {};
  let currentCategory = "all";
  let currentKit = null;
  let currentVariant = null;
  let currentImageIndex = 0;

  // Tooltip для слотов
  const slotTooltip = document.createElement("div");
  slotTooltip.className = "slot-tooltip";
  document.body.appendChild(slotTooltip);
  Object.assign(slotTooltip.style, {
    position: "absolute",
    display: "none",
    background: "rgba(0,0,0,0.9)",
    color: "#fff",
    padding: "6px 10px",
    borderRadius: "6px",
    fontSize: "14px",
    pointerEvents: "none",
    zIndex: "10000",
    maxWidth: "220px",
    textAlign: "center",
  });

  function showSlotTooltip(target, text) {
    slotTooltip.textContent = text;
    const rect = target.getBoundingClientRect();
    slotTooltip.style.top = (window.scrollY + rect.top - slotTooltip.offsetHeight - 6) + "px";
    slotTooltip.style.left = (window.scrollX + rect.left + rect.width / 2 - slotTooltip.offsetWidth / 2) + "px";
    slotTooltip.style.display = "block";
  }

  function hideSlotTooltip() {
    slotTooltip.style.display = "none";
  }

  // Категории
  categoryBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      categoryBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentCategory = btn.dataset.cat;
      renderKits();
    });
  });

  function loadAllKits() {
    const promises = Object.entries(jsonFiles).map(([cat, file]) =>
      fetch(file)
        .then(r => r.json())
        .then(data => allKits[cat] = data)
        .catch(err => console.error(`Ошибка загрузки ${file}:`, err))
    );
    Promise.all(promises).then(renderKits);
  }

  function renderKits() {
    kitsGrid.innerHTML = "";
    Object.entries(allKits).forEach(([cat, kits]) => {
      if (currentCategory === "Backpacks" && cat !== "Backpacks") return;
      if (currentCategory !== "all" && currentCategory !== "Backpacks" && cat !== "Kits") return;
      kits.forEach(kit => {
        if (cat === "Kits" && currentCategory !== "all" && currentCategory !== "Backpacks"
            && !(kit.tiers || []).includes(Number(currentCategory))) return;
        const card = document.createElement("div");
        card.className = "kit-card";
        card.innerHTML = `
          <img src="${kit.variants?.[0]?.images?.[0] || ''}" alt="${kit.name}">
          <h3>${kit.name}</h3>
          <div class="kit-tier">${cat === "Kits" ? tierText(kit) : "Рюкзак"}</div>`;
        card.addEventListener("click", () => openModal(kit, cat));
        kitsGrid.appendChild(card);
      });
    });
  }

  function openModal(kit, cat) {
    currentKit = kit;
    modalKitName.textContent = kit.name;
    modalKitCategory.textContent = cat === "Kits" ? tierText(kit) : "Рюкзаки и экзоскелеты";
    modalRanks.innerHTML = "";
    modalSlots.innerHTML = "";
    hideSlotTooltip();
    currentImageIndex = 0;

    kit.variants?.forEach((v, idx) => {
      const btn = document.createElement("button");
      btn.textContent = v.rank || `Вариант ${idx+1}`;
      btn.addEventListener("click", () => selectVariant(v));
      modalRanks.appendChild(btn);
      if(idx===0) btn.classList.add("active");
    });

    if(kit.variants?.[0]) selectVariant(kit.variants[0]);
    modal.classList.remove("hidden");
  }

  function selectVariant(v) {
    currentVariant = v;

    // Активная кнопка ранга
    Array.from(modalRanks.children).forEach(b => b.classList.remove("active"));
    const activeBtn = Array.from(modalRanks.children).find(
      b => b.textContent.trim() === (v.rank || 'Вариант 1')
    );
    if (activeBtn) activeBtn.classList.add("active");

    // Основное изображение и описание
    modalMainImage.src = v.images?.[0] || "";
    modalDesc.innerHTML = v.description ? `<h3>Описание:</h3><p>${v.description}</p>` : "";

    // Характеристики
    modalStats.innerHTML = "<h3>Характеристики:</h3>";
    const ul = document.createElement("ul");
    Object.entries(v.stats||{}).forEach(([k,val])=>{
      const li = document.createElement("li");
      li.textContent = `${k}: ${val}`;
      ul.appendChild(li);
    });
    modalStats.appendChild(ul);

    // Слоты
    modalSlots.innerHTML = "";
    hideSlotTooltip();
    (v.slots||[]).forEach(slot=>{
      Object.keys(slot).filter(k=>k!=="description"&&k!=="images").forEach(key=>{
        if(slot[key]===1){
          const wrap=document.createElement("div");
          wrap.className="slot-circle";
          const img=document.createElement("img");
          img.src=slot.images?.[0]||"";
          img.alt=key;
          img.title="";
          wrap.appendChild(img);

          // Tooltip при клике
          wrap.addEventListener("click", (e)=>{
            e.stopPropagation();
            if(slotTooltip.style.display==="block") hideSlotTooltip();
            else showSlotTooltip(wrap, slot.description || key);
          });

          modalSlots.appendChild(wrap);
        }
      });
    });

    // Создание навигации по фото под картинкой
    let navContainer = document.getElementById("modalImgNavContainer");
    if(!navContainer) {
      navContainer = document.createElement("div");
      navContainer.id = "modalImgNavContainer";
      navContainer.className = "modal-img-nav-container";
      modalMainImage.parentNode.appendChild(navContainer);
    }
    navContainer.innerHTML = "";

    const imgPrevBtn = document.createElement("button");
    const imgNextBtn = document.createElement("button");
    imgPrevBtn.textContent = "‹";
    imgNextBtn.textContent = "›";
    imgPrevBtn.className = imgNextBtn.className = "modal-img-nav";

    navContainer.appendChild(imgPrevBtn);
    navContainer.appendChild(imgNextBtn);

    imgPrevBtn.addEventListener("click", e => {
      e.stopPropagation();
      if(!currentVariant?.images?.length) return;
      currentImageIndex--;
      if(currentImageIndex < 0) currentImageIndex = currentVariant.images.length - 1;
      updateMainImage();
    });

    imgNextBtn.addEventListener("click", e => {
      e.stopPropagation();
      if(!currentVariant?.images?.length) return;
      currentImageIndex++;
      if(currentImageIndex >= currentVariant.images.length) currentImageIndex = 0;
      updateMainImage();
    });

    updateMainImage();
  }

  function updateMainImage() {
    if(!currentVariant?.images?.length) {
      modalMainImage.src = "";
      return;
    }
    if(currentImageIndex < 0) currentImageIndex = currentVariant.images.length - 1;
    if(currentImageIndex >= currentVariant.images.length) currentImageIndex = 0;
    modalMainImage.src = currentVariant.images[currentImageIndex];
  }

  // Закрытие модального окна
  modalClose.addEventListener("click", ()=> modal.classList.add("hidden"));
  modal.addEventListener("click", e=> { if(e.target===modal) modal.classList.add("hidden"); });

  // Закрытие тултипа при клике в любом месте
  document.addEventListener("click", hideSlotTooltip);

  // Клик на фото - полноэкран
  modalMainImage.addEventListener("click", ()=>{
    const src = modalMainImage.src;
    if(!src) return;
    const overlay = document.createElement("div");
    Object.assign(overlay.style,{
      position:"fixed",top:"0",left:"0",width:"100%",height:"100%",
      backgroundColor:"rgba(0,0,0,0.92)",display:"flex",
      alignItems:"center",justifyContent:"center",zIndex:9999,
      cursor:"zoom-out",overflow:"hidden"
    });
    const img = document.createElement("img");
    img.src=src;
    Object.assign(img.style,{maxWidth:"94%",maxHeight:"94%",borderRadius:"8px",transform:"scale(1)",transition:"transform 0.1s"});
    let scale=1;
    overlay.addEventListener("wheel", e=>{
      e.preventDefault();
      scale *= e.deltaY<0?1.1:0.9;
      scale=Math.min(Math.max(scale,0.2),5);
      img.style.transform=`scale(${scale})`;
    });
    overlay.appendChild(img);
    overlay.addEventListener("click",()=>overlay.remove());
    document.body.appendChild(overlay);
  });

  loadAllKits();
  loadInserts();
});