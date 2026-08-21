// ==UserScript==
// @name         Meilong Scissors Counter (Individual Photos Only)
// @namespace    sportsinfocus-meilong-scissors
// @version      3.4
// @description  Highlights, counts, auto-selects, and clears selection of individual (non-team) photos with the "Clip" scissors icon on the Sports In Focus portal gallery. Draggable panel with emoji icon and refined banana-yellow design.
// @match        https://portal.sportsinfocus.com.au/events/view/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  function isVisible(el) {
    if (!el.offsetParent && window.getComputedStyle(el).position !== 'fixed') return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  // Fires a full mousedown/mouseup/click sequence, since some UI frameworks
  // (React/Vue click handlers) only fire on real event sequences, not a bare .click()
  // ctrlKey/metaKey are set so the site treats this as a multi-select click
  // (a plain click on this site replaces the current selection with just this item)
  function simulateClick(el) {
    if (!el) return;
    ['mousedown', 'mouseup', 'click'].forEach(type => {
      el.dispatchEvent(new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        view: window,
        ctrlKey: true,
        metaKey: true,   // covers Mac (Cmd) in case the site checks metaKey instead
        shiftKey: false
      }));
    });
  }

  // Returns true if the card appears selected on the site.
  // Checks the most common indicators; adjust here if the site uses a
  // different marker for "selected" (e.g. a specific class or attribute).
  function isSelected(card) {
    return card.classList.contains('selected') ||
           card.classList.contains('is-selected') ||
           card.getAttribute('aria-selected') === 'true' ||
           card.querySelector('input[type="checkbox"]:checked') != null;
  }

  // Attempts to select a card by clicking the most likely selection target.
  // Tries a checkbox first (most reliable), then falls back to the image cover.
  function selectCard(card) {
    const checkbox = card.querySelector('input[type="checkbox"]');
    if (checkbox) {
      if (!checkbox.checked) simulateClick(checkbox);
      return;
    }
    const cover = card.querySelector('.photos-files_img-cover-inner') || card.querySelector('img[data-fileid]');
    if (cover) {
      simulateClick(cover);
    }
  }

  // Deselects a card by clicking its checkbox (if checked) or its cover with
  // the same ctrl/meta modifiers, which toggles selection off on this site.
  function deselectCard(card) {
    const checkbox = card.querySelector('input[type="checkbox"]');
    if (checkbox) {
      if (checkbox.checked) simulateClick(checkbox);
      return;
    }
    const cover = card.querySelector('.photos-files_img-cover-inner') || card.querySelector('img[data-fileid]');
    if (cover) {
      simulateClick(cover);
    }
  }

  function clearSelection() {
    // Clear our own red outline markers
    document.querySelectorAll('[data-gsc-marked]').forEach(el => {
      el.style.outline = '';
      el.removeAttribute('data-gsc-marked');
    });

    // Deselect anything the site currently shows as selected
    const cards = Array.from(document.querySelectorAll('.file-sorter_box_thumb'));
    let cleared = 0;
    cards.forEach(card => {
      if (!isVisible(card)) return;
      if (isSelected(card)) {
        deselectCard(card);
        cleared++;
      }
    });
    return cleared;
  }

  function runCount(autoSelect) {
    document.querySelectorAll('[data-gsc-marked]').forEach(el => {
      el.style.outline = '';
      el.removeAttribute('data-gsc-marked');
    });

    const cards = Array.from(document.querySelectorAll('.file-sorter_box_thumb'));
    const seen = new Set();
    const matches = [];

    cards.forEach(card => {
      if (!isVisible(card)) return;

      const scissors = card.querySelector('button[title="Clip"]');
      if (!scissors) return;
      if (!scissors.classList.contains('bg-green')) return;

      const isIndividual = !!card.querySelector('span[title="With Order"] .fa-shopping-cart');
      const isTeam = !!card.querySelector('span[title="Tagged"] .fa-object-group');
      if (!isIndividual || isTeam) return;

      const inner = card.querySelector('.photos-files_img-cover-inner');
      const img = card.querySelector('img[data-fileid]');
      const key = (inner && inner.getAttribute('title'))
        || (img && img.getAttribute('data-fileid'))
        || null;

      if (!key || seen.has(key)) return;
      seen.add(key);

      matches.push({ card, name: key });
      card.style.outline = '3px solid red';
      card.setAttribute('data-gsc-marked', '1');

      if (autoSelect) {
        selectCard(card);
      }
    });

    console.log('Individual photos with clipped (Meilong Scissors) icon:', matches.length);
    console.log(matches.map(m => m.name));
    return { count: matches.length, names: matches.map(m => m.name) };
  }

  function addButton() {
    if (document.getElementById('gsc-panel')) return;

    // Inject font + base styles once
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

      #gsc-panel {
        position: fixed;
        top: 16px;
        right: 16px;
        z-index: 999999;
        width: 320px;
        background: #ffffff;
        border-radius: 16px;
        box-shadow: 0 12px 40px rgba(74,59,6,0.16), 0 2px 8px rgba(0,0,0,0.06);
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        overflow: hidden;
        user-select: none;
        border: 1px solid rgba(0,0,0,0.05);
        transition: box-shadow 0.2s ease;
      }
      #gsc-panel:hover {
        box-shadow: 0 16px 48px rgba(74,59,6,0.2), 0 2px 8px rgba(0,0,0,0.08);
      }
      #gsc-panel * {
        box-sizing: border-box;
      }
      #gsc-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 16px 18px;
        background: linear-gradient(135deg, #ffd94d 0%, #f7c331 45%, #e8b923 100%);
        color: #4a3b06;
        cursor: grab;
        position: relative;
        overflow: hidden;
      }
      #gsc-header::after {
        content: '';
        position: absolute;
        top: -60%;
        right: -20%;
        width: 140px;
        height: 140px;
        background: radial-gradient(circle, rgba(255,255,255,0.35), transparent 70%);
        pointer-events: none;
      }
      #gsc-header:active {
        cursor: grabbing;
      }
      #gsc-title {
        display: flex;
        align-items: center;
        gap: 9px;
        font-size: 15.5px;
        font-weight: 700;
        letter-spacing: 0.1px;
        z-index: 1;
      }
      #gsc-title-emoji {
        font-size: 19px;
        line-height: 1;
        filter: drop-shadow(0 1px 1px rgba(0,0,0,0.12));
      }
      #gsc-collapse {
        background: rgba(74,59,6,0.14);
        border: none;
        color: #4a3b06;
        width: 26px;
        height: 26px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.15s ease, transform 0.15s ease;
        z-index: 1;
      }
      #gsc-collapse:hover {
        background: rgba(74,59,6,0.26);
        transform: scale(1.06);
      }
      #gsc-body {
        padding: 18px;
      }
      #gsc-run-btn {
        width: 100%;
        padding: 13px 16px;
        background: linear-gradient(135deg, #ffd94d, #f2b705);
        color: #4a3b06;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        font-family: inherit;
        font-size: 14.5px;
        font-weight: 700;
        letter-spacing: 0.2px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        box-shadow: 0 2px 6px rgba(226,169,4,0.35);
        transition: background 0.15s ease, transform 0.1s ease, box-shadow 0.15s ease;
      }
      #gsc-run-btn:hover {
        background: linear-gradient(135deg, #ffe066, #d9a504);
        box-shadow: 0 4px 10px rgba(226,169,4,0.42);
      }
      #gsc-run-btn:active {
        transform: scale(0.98);
      }
      #gsc-clear-btn {
        width: 100%;
        padding: 11px 16px;
        margin-top: 9px;
        background: #fff;
        color: #b91c1c;
        border: 1.5px solid #f3d4d4;
        border-radius: 10px;
        cursor: pointer;
        font-family: inherit;
        font-size: 13.5px;
        font-weight: 600;
        letter-spacing: 0.2px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        transition: background 0.15s ease, border-color 0.15s ease, transform 0.1s ease;
      }
      #gsc-clear-btn:hover {
        background: #fef2f2;
        border-color: #f5b5b5;
      }
      #gsc-clear-btn:active {
        transform: scale(0.98);
      }
      #gsc-status {
        margin-top: 11px;
        font-size: 12px;
        font-weight: 500;
        color: #8b7a2e;
        text-align: center;
        min-height: 16px;
      }
      #gsc-results {
        margin-top: 16px;
        display: none;
        animation: gsc-fade-in 0.25s ease;
      }
      @keyframes gsc-fade-in {
        from { opacity: 0; transform: translateY(-4px); }
        to { opacity: 1; transform: translateY(0); }
      }
      #gsc-count-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 12px;
        margin-bottom: 10px;
        background: linear-gradient(135deg, #fff9e6, #fff4d1);
        border-radius: 10px;
        border: 1px solid #f5e6ad;
      }
      #gsc-count-label {
        font-size: 11.5px;
        font-weight: 700;
        color: #a67c00;
        text-transform: uppercase;
        letter-spacing: 0.6px;
      }
      #gsc-count-value {
        font-size: 24px;
        font-weight: 800;
        color: #8a6600;
      }
      #gsc-names {
        max-height: 240px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      #gsc-names::-webkit-scrollbar {
        width: 6px;
      }
      #gsc-names::-webkit-scrollbar-thumb {
        background: #e6d488;
        border-radius: 3px;
      }
      .gsc-name-item {
        font-size: 13px;
        font-weight: 500;
        color: #4b4735;
        padding: 7px 11px;
        background: #fbfaf5;
        border-radius: 7px;
        border-left: 3px solid #f2b705;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .gsc-name-item::before {
        content: '🖼️';
        font-size: 11px;
        opacity: 0.7;
      }
    `;
    document.head.appendChild(style);

    const panel = document.createElement('div');
    panel.id = 'gsc-panel';
    panel.innerHTML = `
      <div id="gsc-header">
        <div id="gsc-title">
          <span id="gsc-title-emoji">✂️</span>
          <span>Meilong Scissors</span>
        </div>
        <button id="gsc-collapse" title="Collapse">&#8722;</button>
      </div>
      <div id="gsc-body">
        <button id="gsc-run-btn">✂️ Select Clipped</button>
        <button id="gsc-clear-btn">🧹 Clear Selected</button>
        <div id="gsc-status"></div>
        <div id="gsc-results">
          <div id="gsc-count-row">
            <span id="gsc-count-label">Matches</span>
            <span id="gsc-count-value">0</span>
          </div>
          <div id="gsc-names"></div>
        </div>
      </div>
    `;
    document.body.appendChild(panel);

    // --- Dragging ---
    const header = panel.querySelector('#gsc-header');
    let dragging = false, offsetX = 0, offsetY = 0;

    header.addEventListener('mousedown', (e) => {
      if (e.target.id === 'gsc-collapse') return;
      dragging = true;
      const rect = panel.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      panel.style.right = 'auto';
      panel.style.left = rect.left + 'px';
      panel.style.top = rect.top + 'px';
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      let newLeft = e.clientX - offsetX;
      let newTop = e.clientY - offsetY;
      const maxLeft = window.innerWidth - panel.offsetWidth;
      const maxTop = window.innerHeight - panel.offsetHeight;
      newLeft = Math.min(Math.max(0, newLeft), maxLeft);
      newTop = Math.min(Math.max(0, newTop), maxTop);
      panel.style.left = newLeft + 'px';
      panel.style.top = newTop + 'px';
    });

    document.addEventListener('mouseup', () => {
      dragging = false;
    });

    // --- Collapse toggle ---
    const body = panel.querySelector('#gsc-body');
    const collapseBtn = panel.querySelector('#gsc-collapse');
    let collapsed = false;
    collapseBtn.addEventListener('click', () => {
      collapsed = !collapsed;
      body.style.display = collapsed ? 'none' : 'block';
      collapseBtn.innerHTML = collapsed ? '&#43;' : '&#8722;';
    });

    // --- Run button ---
    const runBtn = panel.querySelector('#gsc-run-btn');
    const results = panel.querySelector('#gsc-results');
    const countValue = panel.querySelector('#gsc-count-value');
    const namesContainer = panel.querySelector('#gsc-names');
    const statusEl = panel.querySelector('#gsc-status');

    runBtn.addEventListener('click', () => {
      const result = runCount(true);
      countValue.textContent = result.count;
      namesContainer.innerHTML = result.names
        .map(n => `<div class="gsc-name-item">${n}</div>`)
        .join('');
      results.style.display = 'block';
      statusEl.textContent = '';
    });

    // --- Clear button ---
    const clearBtn = panel.querySelector('#gsc-clear-btn');
    clearBtn.addEventListener('click', () => {
      const cleared = clearSelection();
      results.style.display = 'none';
      statusEl.textContent = cleared > 0
        ? `Cleared ${cleared} selection${cleared === 1 ? '' : 's'}.`
        : 'Nothing selected to clear.';
    });
  }

  window.addEventListener('load', () => {
    setTimeout(addButton, 1500);
  });

  const observer = new MutationObserver(() => addButton());
  observer.observe(document.body, { childList: true, subtree: true });
})();
