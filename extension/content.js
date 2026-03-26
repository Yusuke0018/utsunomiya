/* ============================================
   Content Script - 来院理由アンケート集計
   Runs on デジカル pages to scan patient tables
   ============================================ */

(function () {
  'use strict';

  const HIGHLIGHT_CLASS = 'survey-ext-highlight';
  const HIGHLIGHT_DURATION_MS = 4000;

  // ---- Message Listener ----
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.action === 'scan') {
      const result = scanTable();
      result.date = getDateFromPage();
      sendResponse(result);
    }
    return true;
  });

  // ---- Date Extraction from DOM ----
  function getDateFromPage() {
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      const text = btn.textContent.trim();
      const m = text.match(/(\d{4})\/(\d{2})\/(\d{2})/);
      if (m) {
        return `${m[1]}-${m[2]}-${m[3]}`;
      }
    }
    return null;
  }

  // ---- Table Scanner ----
  function scanTable() {
    // Remove previous highlights
    clearHighlights();

    // Find the reception table
    const tables = [...document.querySelectorAll('table')];
    const table = tables.find(
      (t) => t.innerText.includes('患者氏名')
    );

    if (!table) {
      return {
        success: false,
        error: '受付テーブルが見つかりません。デジカルの受付一覧を表示してください。',
      };
    }

    // 受付メモは13番目のカラム (index 12) 固定
    const MEMO_INDEX = 12;

    // Extract #number tags from each row
    const rows = [...table.querySelectorAll('tr')].slice(1); // skip header
    const counts = {};
    let matchedRows = 0;

    rows.forEach((row) => {
      const cells = row.querySelectorAll('td');
      if (cells.length <= MEMO_INDEX) return;

      const memoCell = cells[MEMO_INDEX];

      // Get memo text: try React fiber (pv.comment) first, fallback to innerText
      let memo = '';
      const fiberKey = Object.keys(memoCell).find(k => k.startsWith('__reactFiber'));
      if (fiberKey) {
        let fiber = memoCell[fiberKey];
        while (fiber) {
          if (fiber.memoizedProps?.pv?.comment) {
            memo = fiber.memoizedProps.pv.comment;
            break;
          }
          fiber = fiber.return;
        }
      }
      if (!memo) {
        memo = memoCell?.innerText?.trim() || '';
      }

      // Normalize fullwidth → halfwidth, then match #number patterns
      const normalized = memo
        .replace(/＃/g, '#')
        .replace(/[０-９]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0));
      const matches = normalized.matchAll(/#(\d+)/g);
      let hasMatch = false;

      for (const m of matches) {
        const num = parseInt(m[1], 10);
        counts[num] = (counts[num] || 0) + 1;
        hasMatch = true;
      }

      if (hasMatch) {
        matchedRows++;
        highlightCell(memoCell);
      }
    });

    return {
      success: true,
      counts,
      totalRows: rows.length,
      matchedRows,
    };
  }

  // ---- Highlight Effects ----
  function highlightCell(cell) {
    cell.classList.add(HIGHLIGHT_CLASS);
    setTimeout(() => {
      cell.classList.remove(HIGHLIGHT_CLASS);
    }, HIGHLIGHT_DURATION_MS);
  }

  function clearHighlights() {
    document.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach((el) => {
      el.classList.remove(HIGHLIGHT_CLASS);
    });
  }
})();
