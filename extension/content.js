(function () {
  'use strict';

  const DEFAULTS = {
    enabled: true,
    autoSelect: true,
    showNames: true,
    showPanel: true,
    defaultMode: 'individual',
    panelPosition: null
  };

  let settings = { ...DEFAULTS };
  let observer = null;
  let dragCleanup = null;

  function isVisible(el) {
    if (!el.offsetParent && window.getComputedStyle(el).position !== 'fixed') return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function simulateClick(el) {
    if (!el) return;
    ['mousedown', 'mouseup', 'click'].forEach(type => {
      el.dispatchEvent(new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        view: window,
        ctrlKey: true,
        metaKey: true,
        shiftKey: false
      }));
    });
  }

  function isSelected(card) {
    return card.classList.contains('selected') ||
           card.classList.contains('is-selected') ||
           card.getAttribute('aria-selected') === 'true' ||
           card.querySelector('input[type="checkbox"]:checked') != null;
  }

  function selectCard(card) {
    const checkbox = card.querySelector('input[type="checkbox"]');
    if (checkbox) {
      if (!checkbox.checked) simulateClick(checkbox);
      return;
    }
    const cover = card.querySelector('.photos-files_img-cover-inner') || card.querySelector('img[data-fileid]');
    if (cover) simulateClick(cover);
  }

  function deselectCard(card) {
    const checkbox = card.querySelector('input[type="checkbox"]');
    if (checkbox) {
      if (checkbox.checked) simulateClick(checkbox);
      return;
    }
    const cover = card.querySelector('.photos-files_img-cover-inner') || card.querySelector('img[data-fileid]');
    if (cover) simulateClick(cover);
  }

  function clearMarkers() {
    document.querySelectorAll('[data-gsc-marked]').forEach(el => {
      el.style.outline = '';
      el.removeAttribute('data-gsc-marked');
    });
  }

  function clearSelection() {
    clearMarkers();
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

  function runCount(mode, autoSelect) {
    clearMarkers();
    const outlineColor = mode === 'team' ? '3px solid #2563eb' : '3px solid #ef4444';
    const cards = Array.from(document.querySelectorAll('.file-sorter_box_thumb'));
    const seen = new Set();
    const matches = [];

    cards.forEach(card => {
      if (!isVisible(card)) return;
      const scissors = card.querySelector('button[title="Clip"]');
      if (!scissors || !scissors.classList.contains('bg-green')) return;

      const isIndividual = !!card.querySelector('span[title="With Order"] .fa-shopping-cart');
      const isTeam = !!card.querySelector('span[title="Tagged"] .fa-object-group');
      const matchesMode = mode === 'team' ? (isTeam && !isIndividual) : (isIndividual && !isTeam);
      if (!matchesMode) return;

      const inner = card.querySelector('.photos-files_img-cover-inner');
      const img = card.querySelector('img[data-fileid]');
      const key = (inner && inner.getAttribute('title')) || (img && img.getAttribute('data-fileid')) || null;
      if (!key || seen.has(key)) return;

      seen.add(key);
      matches.push({ card, name: key });
      card.style.outline = outlineColor;
      card.setAttribute('data-gsc-marked', '1');
      if (autoSelect) selectCard(card);
    });

    console.log(`${mode === 'team' ? 'Team' : 'Individual'} clipped photos:`, matches.length);
    console.log(matches.map(m => m.name));
    return { count: matches.length, names: matches.map(m => m.name) };
  }

  function removePanel() {
    clearMarkers();
    if (dragCleanup) { dragCleanup(); dragCleanup = null; }
    const panel = document.getElementById('gsc-panel');
    if (panel) panel.remove();
  }

  function addStyles() {
    if (document.getElementById('gsc-style')) return;
    const style = document.createElement('style');
    style.id = 'gsc-style';
    style.textContent = `
      #gsc-panel{position:fixed;top:16px;right:16px;z-index:999999;width:332px;background:#f5f5f2;border:1px solid #cfcfca;border-radius:8px;box-shadow:0 10px 28px rgba(0,0,0,.10);font-family:"JetBrains Mono",monospace;overflow:hidden;user-select:none;color:#171717}
      #gsc-panel *{box-sizing:border-box}#gsc-panel button{font:inherit}#gsc-header{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:13px 14px;background:#171717;color:#f5f5f2;cursor:grab;position:relative;overflow:hidden;border-bottom:1px solid #2d2d2d}
      #gsc-header:after{content:"";position:absolute;right:-45px;top:-70px;width:150px;height:150px;border-radius:50%;background:rgba(226,182,32,.16);pointer-events:none}#gsc-header:active{cursor:grabbing}
      #gsc-title{display:flex;align-items:center;gap:9px;font-size:12px;font-weight:700;letter-spacing:-.2px;position:relative;z-index:1}#gsc-title-emoji{font-size:16px;line-height:1;filter:grayscale(1)}
      #gsc-title-sub{display:block;font-size:7px;font-weight:700;opacity:.6;letter-spacing:1px;margin-top:3px;text-transform:uppercase}
      #gsc-collapse{background:#2a2a2a;border:1px solid #414141;color:#e2b620;width:24px;height:24px;border-radius:4px;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;z-index:2}
      #gsc-body{padding:13px}.gsc-default{margin-bottom:9px;padding:7px 9px;border:1px solid #d8d8d2;background:#fafaf7;border-radius:4px;color:#666;font-size:8px;font-weight:700;text-align:center}
      #gsc-actions{display:grid;gap:7px}.gsc-btn{width:100%;padding:10px 12px;border:1px solid #cfcfca;border-radius:4px;cursor:pointer;font-size:9px;font-weight:700;letter-spacing:0;transition:transform .1s,background .15s,border-color .15s}.gsc-btn:active{transform:scale(.99)}
      #gsc-run-btn{background:#e2b620;color:#171717;border-color:#c8a01c}#gsc-run-btn:hover{background:#d9ad1d}
      #gsc-run-team-btn{background:#e9ecef;color:#27313a;border-color:#c6ccd1}#gsc-run-team-btn:hover{background:#e1e4e7}
      #gsc-clear-btn{background:#fff;color:#8a4141;border-color:#ddc4c4}.gsc-btn.secondary{box-shadow:none}.gsc-btn.secondary:hover{background:#f7eeee}
      #gsc-status{font-size:8px;font-weight:700;color:#777;text-align:center;min-height:14px;margin-top:8px}
      #gsc-results{display:none;margin-top:11px;padding-top:11px;border-top:1px solid #dfdfd9}.gsc-count{display:flex;align-items:center;justify-content:space-between;padding:9px 11px;border-radius:4px;background:#fafaf7;border:1px solid #d8d8d2}.gsc-count.team{background:#f0f2f4;border-color:#ccd2d7}.gsc-count-label{font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#777}.gsc-count.team .gsc-count-label{color:#58626b}.gsc-count-value{font-size:21px;font-weight:700;color:#171717}.gsc-count.team .gsc-count-value{color:#34424e}
      #gsc-names{max-height:210px;overflow:auto;display:flex;flex-direction:column;gap:4px;margin-top:8px}.gsc-name{font-size:8px;font-weight:600;color:#444;padding:7px 8px;background:#fbfbf8;border-radius:3px;border-left:2px solid #e2b620;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.gsc-name.team{border-left-color:#7e8a93}
      #gsc-panel.gsc-hidden-names #gsc-names{display:none}
      #gsc-panel.gsc-collapsed{width:220px}.gsc-collapsed #gsc-body{display:none}.gsc-collapsed #gsc-collapse:after{content:"+"}.gsc-collapsed #gsc-collapse{font-size:0}.gsc-collapsed #gsc-collapse:after{font-size:14px}
    `;
    document.head.appendChild(style);
  }

  function createPanel() {
    if (document.getElementById('gsc-panel') || !settings.enabled || !settings.showPanel) return;
    addStyles();

    const panel = document.createElement('div');
    panel.id = 'gsc-panel';
    if (!settings.showNames) panel.classList.add('gsc-hidden-names');
    panel.innerHTML = `
      <div id="gsc-header">
        <div id="gsc-title"><span id="gsc-title-emoji">✂️</span><span><span>Meilong Scissors</span><span id="gsc-title-sub">Photo selection utility</span></span></div>
        <button id="gsc-collapse" title="Collapse">−</button>
      </div>
      <div id="gsc-body">
        <div class="gsc-default">Default scan: ${settings.defaultMode === 'team' ? 'Team photos' : 'Individual photos'}</div>
        <div id="gsc-actions">
          <button id="gsc-run-btn" class="gsc-btn">✂️ Select Individual Clipped</button>
          <button id="gsc-run-team-btn" class="gsc-btn">✂️ Select Team Clipped</button>
          <button id="gsc-clear-btn" class="gsc-btn secondary">🧹 Clear Selected</button>
        </div>
        <div id="gsc-status"></div>
        <div id="gsc-results">
          <div id="gsc-count-row" class="gsc-count"><span class="gsc-count-label">Matches</span><span id="gsc-count-value" class="gsc-count-value">0</span></div>
          <div id="gsc-names"></div>
        </div>
      </div>
    `;
    document.body.appendChild(panel);

    if (settings.panelPosition && Number.isFinite(settings.panelPosition.left) && Number.isFinite(settings.panelPosition.top)) {
      panel.style.right = 'auto';
      panel.style.left = Math.max(0, Math.min(window.innerWidth - panel.offsetWidth, settings.panelPosition.left)) + 'px';
      panel.style.top = Math.max(0, Math.min(window.innerHeight - panel.offsetHeight, settings.panelPosition.top)) + 'px';
    }

    const header = panel.querySelector('#gsc-header');
    let dragging = false, offsetX = 0, offsetY = 0;
    header.addEventListener('mousedown', e => {
      if (e.target.closest('#gsc-collapse')) return;
      dragging = true;
      const rect = panel.getBoundingClientRect();
      offsetX = e.clientX - rect.left; offsetY = e.clientY - rect.top;
      panel.style.right = 'auto'; panel.style.left = rect.left + 'px'; panel.style.top = rect.top + 'px';
      e.preventDefault();
    });
    const onMove = e => {
      if (!dragging) return;
      const maxLeft = Math.max(0, window.innerWidth - panel.offsetWidth);
      const maxTop = Math.max(0, window.innerHeight - panel.offsetHeight);
      panel.style.left = Math.min(Math.max(0, e.clientX - offsetX), maxLeft) + 'px';
      panel.style.top = Math.min(Math.max(0, e.clientY - offsetY), maxTop) + 'px';
    };
    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      const rect = panel.getBoundingClientRect();
      chrome.storage.local.set({ panelPosition: { left: rect.left, top: rect.top } });
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    dragCleanup = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    const collapse = panel.querySelector('#gsc-collapse');
    collapse.addEventListener('click', () => panel.classList.toggle('gsc-collapsed'));

    const results = panel.querySelector('#gsc-results');
    const countRow = panel.querySelector('#gsc-count-row');
    const countValue = panel.querySelector('#gsc-count-value');
    const names = panel.querySelector('#gsc-names');
    const status = panel.querySelector('#gsc-status');

    function renderResults(mode, result) {
      countRow.classList.toggle('team', mode === 'team');
      countValue.textContent = result.count;
      names.innerHTML = settings.showNames ? result.names.map(n => `<div class="gsc-name${mode === 'team' ? ' team' : ''}" title="${escapeHtml(n)}">${escapeHtml(n)}</div>`).join('') : '';
      panel.classList.toggle('gsc-hidden-names', !settings.showNames);
      results.style.display = 'block';
      status.textContent = `${result.count} ${mode === 'team' ? 'team' : 'individual'} match${result.count === 1 ? '' : 'es'} found${settings.autoSelect ? ' and selected' : ''}.`;
    }

    panel.querySelector('#gsc-run-btn').addEventListener('click', () => renderResults('individual', runCount('individual', settings.autoSelect)));
    panel.querySelector('#gsc-run-team-btn').addEventListener('click', () => renderResults('team', runCount('team', settings.autoSelect)));
    panel.querySelector('#gsc-clear-btn').addEventListener('click', () => {
      const cleared = clearSelection();
      results.style.display = 'none';
      status.textContent = cleared > 0 ? `Cleared ${cleared} selection${cleared === 1 ? '' : 's'}.` : 'Nothing selected to clear.';
    });

    // Visually prioritize the selected default mode.
    const defaultBtn = settings.defaultMode === 'team' ? panel.querySelector('#gsc-run-team-btn') : panel.querySelector('#gsc-run-btn');
    defaultBtn.style.boxShadow = settings.defaultMode === 'team' ? '0 5px 13px rgba(37,99,235,.38)' : '0 5px 13px rgba(209,157,0,.38)';
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  }

  async function loadSettings() {
    settings = await new Promise(resolve => chrome.storage.local.get(DEFAULTS, resolve));
  }

  function installObserver() {
    if (observer || !document.body) return;
    observer = new MutationObserver(() => {
      if (settings.enabled && settings.showPanel) createPanel();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  chrome.storage.onChanged.addListener(async (changes, area) => {
    if (area !== 'local') return;
    Object.keys(changes).forEach(key => { settings[key] = changes[key].newValue; });
    if (!settings.enabled || !settings.showPanel) removePanel();
    else {
      removePanel();
      createPanel();
    }
  });

  (async function init() {
    await loadSettings();
    if (settings.enabled && settings.showPanel) createPanel();
    installObserver();
  })();
})();
