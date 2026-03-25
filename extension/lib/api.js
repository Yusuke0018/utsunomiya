/* ============================================
   API Utilities - Supabase & GAS submission
   ============================================ */

/**
 * Submit survey data to Supabase via REST API.
 * Uses upsert (merge-duplicates) to allow re-submission for the same date.
 *
 * @param {Object} config - { supabaseUrl, supabaseKey, clinicCode }
 * @param {string} date - ISO date string (YYYY-MM-DD)
 * @param {Object} counts - { [categoryNumber]: count }
 * @param {Array} categories - [{ id, number, name, is_active }]
 * @returns {Promise<boolean>}
 */
async function submitToSupabase(config, date, counts, categories) {
  if (!config.supabaseUrl || !config.supabaseKey) {
    throw new Error('Supabase URLまたはキーが設定されていません。');
  }

  // 1. Resolve clinic_id from clinic code
  const clinicRes = await fetch(
    `${config.supabaseUrl}/rest/v1/clinics?code=eq.${encodeURIComponent(config.clinicCode)}&select=id`,
    {
      headers: {
        apikey: config.supabaseKey,
        Authorization: `Bearer ${config.supabaseKey}`,
      },
    }
  );

  if (!clinicRes.ok) {
    throw new Error(`クリニック情報の取得に失敗しました (${clinicRes.status})`);
  }

  const clinics = await clinicRes.json();
  if (!clinics || clinics.length === 0) {
    throw new Error(`クリニックコード "${config.clinicCode}" が見つかりません。`);
  }
  const clinicId = clinics[0].id;

  // 2. Build upsert records
  const records = categories.map((cat) => ({
    clinic_id: clinicId,
    survey_date: date,
    category_id: cat.id,
    count: counts[cat.number] || 0,
    submitted_by: 'chrome-extension',
  }));

  // 3. Upsert to daily_surveys
  const res = await fetch(`${config.supabaseUrl}/rest/v1/daily_surveys`, {
    method: 'POST',
    headers: {
      apikey: config.supabaseKey,
      Authorization: `Bearer ${config.supabaseKey}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify(records),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(
      `Supabaseへの送信に失敗しました (${res.status})${body ? ': ' + body : ''}`
    );
  }

  return true;
}

/**
 * Submit survey data to Google Sheets via GAS Web App.
 *
 * @param {Object} config - { gasUrl, clinicCode }
 * @param {string} date - ISO date string (YYYY-MM-DD)
 * @param {Object} counts - { [categoryNumber]: count }
 * @returns {Promise<boolean>}
 */
async function submitToGAS(config, date, counts) {
  if (!config.gasUrl) {
    throw new Error('GAS URLが設定されていません。');
  }

  const res = await fetch(config.gasUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clinic_code: config.clinicCode,
      date: date,
      counts: counts,
    }),
  });

  if (!res.ok) {
    throw new Error(`Google Sheetsへの送信に失敗しました (${res.status})`);
  }

  return true;
}
