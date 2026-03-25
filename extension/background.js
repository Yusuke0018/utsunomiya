/* ============================================
   Background Service Worker - 来院理由アンケート集計
   ============================================ */

// Set default settings on install
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.sync.set({
      supabaseUrl: 'https://dstucelzcwaihytjllqz.supabase.co',
      supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzdHVjZWx6Y3dhaWh5dGpsbHF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ0MzY5MSwiZXhwIjoyMDkwMDE5NjkxfQ.9pgx54dvpkyED1bRPiv8fffeFuohIdvigU82VKvwMUM',
      gasUrl: '',
      clinicCode: 'utsunomiya-la',
      categories: [
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
      ],
    });
  }
});
