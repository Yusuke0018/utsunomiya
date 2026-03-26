/* ============================================
   Popup Script - 来院理由アンケート集計
   ============================================ */

(function () {
  'use strict';

  // ---- State ----
  let config = {};
  let categories = [];
  let currentCounts = {};
  let lastSubmitResult = { supabase: false, gas: false };

  // ---- DOM References ----
  const $clinicCode = document.getElementById('clinicCode');
  const $surveyDate = document.getElementById('surveyDate');
  const $scanBtn = document.getElementById('scanBtn');
  const $resultsSection = document.getElementById('resultsSection');
  const $categoryList = document.getElementById('categoryList');
  const $totalCount = document.getElementById('totalCount');
  const $submitSection = document.getElementById('submitSection');
  const $submitBtn = document.getElementById('submitBtn');
  const $statusSection = document.getElementById('statusSection');
  const $statusMessage = document.getElementById('statusMessage');
  const $loadingOverlay = document.getElementById('loadingOverlay');
  const $deleteBtn = document.getElementById('deleteBtn');
  const $openOptions = document.getElementById('openOptions');

  // ---- Initialisation ----
  async function init() {
    await restoreDate();
    await loadConfig();
    await loadCategories();
    bindEvents();
  }

  async function restoreDate() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['lastSurveyDate'], (result) => {
        if (result.lastSurveyDate) {
          $surveyDate.value = result.lastSurveyDate;
        } else {
          const now = new Date();
          const yyyy = now.getFullYear();
          const mm = String(now.getMonth() + 1).padStart(2, '0');
          const dd = String(now.getDate()).padStart(2, '0');
          $surveyDate.value = `${yyyy}-${mm}-${dd}`;
        }
        resolve();
      });
    });
  }

  async function loadConfig() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(
        ['supabaseUrl', 'supabaseKey', 'gasUrl', 'clinicCode', 'categories'],
        (result) => {
          config = {
            supabaseUrl: result.supabaseUrl || 'https://dstucelzcwaihytjllqz.supabase.co',
            supabaseKey: result.supabaseKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzdHVjZWx6Y3dhaWh5dGpsbHF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ0MzY5MSwiZXhwIjoyMDkwMDE5NjkxfQ.9pgx54dvpkyED1bRPiv8fffeFuohIdvigU82VKvwMUM',
            gasUrl: result.gasUrl || 'https://script.google.com/macros/s/AKfycbym-nnS5YIiG-60-ZSkk-6exzlRqKCJWNwJQRyH6OB35nkyTu7OwUULdhlNvPAt7i67/exec',
            clinicCode: result.clinicCode || 'utsunomiya-la',
          };
          $clinicCode.textContent = config.clinicCode;

          if (result.categories && result.categories.length > 0) {
            categories = result.categories;
          }
          resolve();
        }
      );
    });
  }

  async function loadCategories() {
    // If categories are already loaded from storage, use them
    if (categories.length > 0) return;

    // Try to fetch from Supabase if configured
    if (config.supabaseUrl && config.supabaseKey) {
      try {
        const res = await fetch(
          `${config.supabaseUrl}/rest/v1/categories?is_active=eq.true&order=sort_order.asc`,
          {
            headers: {
              apikey: config.supabaseKey,
              Authorization: `Bearer ${config.supabaseKey}`,
            },
          }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.length > 0) {
            categories = data.map((c) => ({
              id: c.id,
              number: c.number,
              name: c.name,
              is_active: c.is_active,
            }));
            // Cache locally
            chrome.storage.sync.set({ categories });
            return;
          }
        }
      } catch (_) {
        // Supabase fetch failed, use defaults
      }
    }

    // Default categories
    categories = [
      { number: 1, name: 'Google', is_active: true },
      { number: 2, name: 'Yahoo', is_active: true },
      { number: 3, name: 'AI', is_active: true },
      { number: 4, name: 'Youtube', is_active: true },
      { number: 5, name: '家族・友人の紹介', is_active: true },
      { number: 6, name: '看板・のぼり', is_active: true },
      { number: 7, name: 'チラシ', is_active: true },
      { number: 8, name: '新聞折込', is_active: true },
      { number: 9, name: '情報誌', is_active: true },
      { number: 10, name: 'ラジオ', is_active: true },
      { number: 11, name: '医療機関からの紹介', is_active: true },
      { number: 12, name: 'その他', is_active: true },
    ];
    chrome.storage.sync.set({ categories });
  }

  // ---- Events ----
  function bindEvents() {
    $scanBtn.addEventListener('click', handleScan);
    $submitBtn.addEventListener('click', handleSubmit);
    $deleteBtn.addEventListener('click', handleDelete);
    $surveyDate.addEventListener('change', () => {
      chrome.storage.local.set({ lastSurveyDate: $surveyDate.value });
    });
    $openOptions.addEventListener('click', (e) => {
      e.preventDefault();
      chrome.runtime.openOptionsPage();
    });
  }

  // ---- Scan ----
  async function handleScan() {
    $scanBtn.disabled = true;
    hideStatus();
    showLoading();

    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab) {
        showStatus('error', 'アクティブなタブが見つかりません。');
        return;
      }

      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'scan',
      });

      if (response && response.success) {
        currentCounts = response.counts || {};
        if (response.date) {
          $surveyDate.value = response.date;
          chrome.storage.local.set({ lastSurveyDate: response.date });
        }
        renderResults();
        const dateLabel = response.date || $surveyDate.value;
        showStatus('info', `${dateLabel}：${response.totalRows}行スキャン、${response.matchedRows}件検出`);
      } else {
        const errMsg = response?.error || 'テーブルが見つかりません。デジカルの受付一覧画面を開いてください。';
        showStatus('error', errMsg);
      }
    } catch (err) {
      showStatus(
        'error',
        'コンテンツスクリプトに接続できません。デジカルのページを開いて再読み込みしてください。'
      );
    } finally {
      $scanBtn.disabled = false;
      hideLoading();
    }
  }

  // ---- Render Results ----
  function renderResults() {
    $categoryList.innerHTML = '';

    const activeCategories = categories.filter((c) => c.is_active);
    activeCategories.forEach((cat) => {
      const count = currentCounts[cat.number] || 0;
      const row = document.createElement('div');
      row.className = 'category-row';
      row.innerHTML = `
        <span class="category-number">#${cat.number}</span>
        <span class="category-name">${escapeHtml(cat.name)}</span>
        <input
          type="number"
          class="category-count-input"
          data-number="${cat.number}"
          value="${count}"
          min="0"
          max="999"
          aria-label="${cat.name}の件数"
        >
      `;
      $categoryList.appendChild(row);
    });

    // Listen for manual edits
    $categoryList.querySelectorAll('.category-count-input').forEach((input) => {
      input.addEventListener('input', () => {
        const num = parseInt(input.dataset.number, 10);
        currentCounts[num] = parseInt(input.value, 10) || 0;
        updateTotal();
      });
    });

    updateTotal();
    $resultsSection.style.display = '';
    $submitSection.style.display = '';
  }

  function updateTotal() {
    const total = Object.values(currentCounts).reduce((s, v) => s + v, 0);
    $totalCount.textContent = total;
  }

  // ---- Submit ----
  async function handleSubmit() {
    if (!config.supabaseUrl && !config.gasUrl) {
      showStatus('error', '送信先が設定されていません。設定画面でSupabase URLまたはGAS URLを入力してください。');
      return;
    }

    $submitBtn.disabled = true;
    showLoading();
    hideStatus();

    const date = $surveyDate.value;
    const activeCategories = categories.filter((c) => c.is_active);
    const results = { supabase: null, gas: null };

    // Parallel submission
    const promises = [];

    if (config.supabaseUrl && config.supabaseKey) {
      promises.push(
        submitToSupabase(config, date, currentCounts, activeCategories)
          .then(() => { results.supabase = true; })
          .catch((err) => { results.supabase = err.message; })
      );
    }

    if (config.gasUrl) {
      promises.push(
        submitToGAS(config, date, currentCounts)
          .then(() => { results.gas = true; })
          .catch((err) => { results.gas = err.message; })
      );
    }

    await Promise.allSettled(promises);
    lastSubmitResult = results;

    hideLoading();
    displaySubmitResult(results);
    $submitBtn.disabled = false;
  }

  function displaySubmitResult(results) {
    const parts = [];
    let hasError = false;
    let allOk = true;

    if (results.supabase === true) {
      parts.push('Supabase: 送信完了');
    } else if (results.supabase !== null) {
      parts.push(`Supabase: エラー - ${results.supabase}`);
      hasError = true;
      allOk = false;
    }

    if (results.gas === true) {
      parts.push('Google Sheets: 送信完了');
    } else if (results.gas !== null) {
      parts.push(`Google Sheets: エラー - ${results.gas}`);
      hasError = true;
      allOk = false;
    }

    if (allOk && parts.length > 0) {
      showStatus('success', parts.join('\n'));
    } else if (hasError && parts.some((p) => p.includes('送信完了'))) {
      showStatus('partial', parts.join('\n'), true);
    } else if (hasError) {
      showStatus('error', parts.join('\n'), true);
    }
  }

  // ---- Delete ----
  async function handleDelete() {
    const date = $surveyDate.value;
    if (!date) {
      showStatus('error', '日付を選択してください。');
      return;
    }
    if (!confirm(`${date} のデータを削除しますか？\nこの操作は取り消せません。`)) return;

    $deleteBtn.disabled = true;
    showLoading();
    hideStatus();

    try {
      await deleteFromSupabase(config, date);
      showStatus('success', `${date} のデータを削除しました。`);
    } catch (err) {
      showStatus('error', `削除失敗: ${err.message}`);
    } finally {
      $deleteBtn.disabled = false;
      hideLoading();
    }
  }

  // ---- Retry ----
  function handleRetry() {
    handleSubmit();
  }

  // ---- Status ----
  function showStatus(type, message, showRetry = false) {
    $statusSection.style.display = '';
    $statusMessage.className = `status-message status-${type}`;
    let html = escapeHtml(message).replace(/\n/g, '<br>');
    if (showRetry) {
      html += '<br><button class="retry-btn" id="retryBtn">再試行</button>';
    }
    $statusMessage.innerHTML = html;

    if (showRetry) {
      document.getElementById('retryBtn').addEventListener('click', handleRetry);
    }
  }

  function hideStatus() {
    $statusSection.style.display = 'none';
    $statusMessage.innerHTML = '';
  }

  // ---- Loading ----
  function showLoading() {
    $loadingOverlay.style.display = 'flex';
  }

  function hideLoading() {
    $loadingOverlay.style.display = 'none';
  }

  // ---- Utility ----
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ---- Start ----
  document.addEventListener('DOMContentLoaded', init);
})();
