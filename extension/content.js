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
      sendResponse(result);
    }
    // Return true to allow async sendResponse if needed in future
    return true;
  });

  // ---- Table Scanner ----
  function scanTable() {
    // Remove previous highlights
    clearHighlights();

    // Find the patient list table containing both 患者メモ and 患者氏名
    const tables = [...document.querySelectorAll('table')];
    const table = tables.find(
      (t) =>
        t.innerText.includes('患者メモ') && t.innerText.includes('患者氏名')
    );

    if (!table) {
      return {
        success: false,
        error:
          'テーブルが見つかりません。「患者メモ」列と「患者氏名」列を含む受付一覧を表示してください。',
      };
    }

    // Dynamically find the memo column index
    const headerRow = table.querySelector('tr');
    if (!headerRow) {
      return { success: false, error: 'テーブルのヘッダー行が見つかりません。' };
    }

    const headers = [...headerRow.querySelectorAll('th, td')].map((cell) =>
      cell.textContent.trim()
    );
    const memoIndex = headers.findIndex(
      (h) => h.includes('患者メモ') || h === 'メモ'
    );

    if (memoIndex === -1) {
      return {
        success: false,
        error: '「患者メモ」列が見つかりません。列のヘッダーを確認してください。',
      };
    }

    // Extract #number tags from each row
    const rows = [...table.querySelectorAll('tr')].slice(1); // skip header
    const counts = {};
    let matchedRows = 0;

    rows.forEach((row) => {
      const cells = row.querySelectorAll('td');
      if (cells.length <= memoIndex) return;

      const memoCell = cells[memoIndex];
      const memo = memoCell?.innerText?.trim() || '';

      // Match all #number patterns in the memo (supports multiple tags)
      const matches = memo.matchAll(/#(\d+)/g);
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
