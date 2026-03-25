/* ============================================
   Options Script - 来院理由アンケート集計
   ============================================ */

(function () {
  'use strict';

  let categories = [];

  // ---- DOM References ----
  const $supabaseUrl = document.getElementById('supabaseUrl');
  const $supabaseKey = document.getElementById('supabaseKey');
  const $gasUrl = document.getElementById('gasUrl');
  const $clinicCode = document.getElementById('clinicCode');
  const $categoryList = document.getElementById('categoryListContainer');
  const $newCatNumber = document.getElementById('newCatNumber');
  const $newCatName = document.getElementById('newCatName');
  const $addCatBtn = document.getElementById('addCatBtn');
  const $saveBtn = document.getElementById('saveBtn');
  const $saveStatus = document.getElementById('saveStatus');

  // ---- Init ----
  async function init() {
    await loadSettings();
    renderCategories();
    bindEvents();
  }

  async function loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(
        ['supabaseUrl', 'supabaseKey', 'gasUrl', 'clinicCode', 'categories'],
        (result) => {
          $supabaseUrl.value = result.supabaseUrl || '';
          $supabaseKey.value = result.supabaseKey || '';
          $gasUrl.value = result.gasUrl || '';
          $clinicCode.value = result.clinicCode || 'utsunomiya-la';
          categories = result.categories || [];
          resolve();
        }
      );
    });
  }

  // ---- Events ----
  function bindEvents() {
    $saveBtn.addEventListener('click', handleSave);
    $addCatBtn.addEventListener('click', handleAddCategory);

    // Enter key on add fields
    $newCatName.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleAddCategory();
    });

    // Password toggle
    document.querySelectorAll('.toggle-visibility').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = document.getElementById(btn.dataset.target);
        if (target.type === 'password') {
          target.type = 'text';
        } else {
          target.type = 'password';
        }
      });
    });
  }

  // ---- Category Rendering ----
  function renderCategories() {
    $categoryList.innerHTML = '';

    categories.forEach((cat, index) => {
      const row = document.createElement('div');
      row.className = `cat-row ${cat.is_active ? '' : 'inactive'}`;
      row.dataset.index = index;

      row.innerHTML = `
        <input
          type="text"
          class="cat-row-number"
          value="#${cat.number}"
          readonly
          tabindex="-1"
          aria-label="カテゴリ番号"
        >
        <input
          type="text"
          class="cat-row-name"
          value="${escapeAttr(cat.name)}"
          data-index="${index}"
          placeholder="カテゴリ名"
          aria-label="カテゴリ名"
        >
        <div class="cat-row-actions">
          <button
            class="cat-action-btn active-toggle ${cat.is_active ? 'is-active' : 'is-inactive'}"
            data-index="${index}"
            title="${cat.is_active ? '無効にする' : '有効にする'}"
            aria-label="${cat.is_active ? '無効にする' : '有効にする'}"
          >${cat.is_active ? '&#10003;' : '&#10007;'}</button>
          <button
            class="cat-action-btn"
            data-action="up"
            data-index="${index}"
            title="上に移動"
            aria-label="上に移動"
            ${index === 0 ? 'disabled' : ''}
          >&#9650;</button>
          <button
            class="cat-action-btn"
            data-action="down"
            data-index="${index}"
            title="下に移動"
            aria-label="下に移動"
            ${index === categories.length - 1 ? 'disabled' : ''}
          >&#9660;</button>
          <button
            class="cat-action-btn delete"
            data-action="delete"
            data-index="${index}"
            title="削除"
            aria-label="削除"
          >&#10005;</button>
        </div>
      `;

      $categoryList.appendChild(row);
    });

    // Bind category row events
    $categoryList.querySelectorAll('.cat-row-name').forEach((input) => {
      input.addEventListener('change', (e) => {
        const idx = parseInt(e.target.dataset.index, 10);
        categories[idx].name = e.target.value.trim();
      });
    });

    $categoryList.querySelectorAll('.active-toggle').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.dataset.index, 10);
        categories[idx].is_active = !categories[idx].is_active;
        renderCategories();
      });
    });

    $categoryList.querySelectorAll('[data-action="up"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.dataset.index, 10);
        if (idx > 0) {
          [categories[idx - 1], categories[idx]] = [categories[idx], categories[idx - 1]];
          renderCategories();
        }
      });
    });

    $categoryList.querySelectorAll('[data-action="down"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.dataset.index, 10);
        if (idx < categories.length - 1) {
          [categories[idx], categories[idx + 1]] = [categories[idx + 1], categories[idx]];
          renderCategories();
        }
      });
    });

    $categoryList.querySelectorAll('[data-action="delete"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.dataset.index, 10);
        const name = categories[idx].name;
        if (confirm(`「${name}」を削除しますか？`)) {
          categories.splice(idx, 1);
          renderCategories();
        }
      });
    });
  }

  // ---- Add Category ----
  function handleAddCategory() {
    const number = parseInt($newCatNumber.value, 10);
    const name = $newCatName.value.trim();

    if (!number || number < 1) {
      $newCatNumber.focus();
      return;
    }
    if (!name) {
      $newCatName.focus();
      return;
    }

    // Check duplicate number
    if (categories.some((c) => c.number === number)) {
      alert(`#${number} は既に使用されています。`);
      $newCatNumber.focus();
      return;
    }

    categories.push({ number, name, is_active: true });
    renderCategories();

    $newCatNumber.value = '';
    $newCatName.value = '';
    $newCatNumber.focus();
  }

  // ---- Save ----
  function handleSave() {
    const settings = {
      supabaseUrl: $supabaseUrl.value.trim().replace(/\/+$/, ''),
      supabaseKey: $supabaseKey.value.trim(),
      gasUrl: $gasUrl.value.trim(),
      clinicCode: $clinicCode.value.trim() || 'utsunomiya-la',
      categories: categories,
    };

    chrome.storage.sync.set(settings, () => {
      if (chrome.runtime.lastError) {
        showSaveStatus('error', '保存に失敗しました: ' + chrome.runtime.lastError.message);
      } else {
        showSaveStatus('success', '設定を保存しました。');
      }
    });
  }

  function showSaveStatus(type, message) {
    $saveStatus.textContent = message;
    $saveStatus.className = `save-status ${type}`;
    setTimeout(() => {
      $saveStatus.textContent = '';
      $saveStatus.className = 'save-status';
    }, 3000);
  }

  // ---- Utility ----
  function escapeAttr(str) {
    return str.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ---- Start ----
  document.addEventListener('DOMContentLoaded', init);
})();
