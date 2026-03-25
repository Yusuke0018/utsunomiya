/* ============================================
   Background Service Worker - 来院理由アンケート集計
   ============================================ */

// Set default settings on install
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.sync.set({
      supabaseUrl: '',
      supabaseKey: '',
      gasUrl: '',
      clinicCode: 'utsunomiya-la',
      categories: [
        { number: 1, name: 'ホームページ', is_active: true },
        { number: 2, name: '通りがかり', is_active: true },
        { number: 3, name: '看板', is_active: true },
        { number: 4, name: '紹介', is_active: true },
        { number: 5, name: 'SNS', is_active: true },
        { number: 6, name: 'Google検索', is_active: true },
        { number: 7, name: 'Googleマップ', is_active: true },
        { number: 8, name: 'その他', is_active: true },
      ],
    });
  }
});
