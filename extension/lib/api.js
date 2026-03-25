/* ============================================
   API Utilities - Supabase & GAS submission
   ============================================ */

/**
 * Submit survey data to Supabase via REST API.
 * Uses upsert (merge-duplicates) to allow re-submission for the same date.
 */
async function submitToSupabase(config, date, counts, categories) {
  if (!config.supabaseUrl || !config.supabaseKey) {
    throw new Error('Supabase URLまたはキーが設定されていません。');
  }

  const headers = {
    apikey: config.supabaseKey,
    Authorization: `Bearer ${config.supabaseKey}`,
    'Content-Type': 'application/json',
  };

  // 1. Resolve clinic_id
  const clinicRes = await fetch(
    `${config.supabaseUrl}/rest/v1/clinics?code=eq.${encodeURIComponent(config.clinicCode)}&select=id`,
    { headers }
  );
  if (!clinicRes.ok) throw new Error(`クリニック情報の取得に失敗 (${clinicRes.status})`);
  const clinics = await clinicRes.json();
  if (!clinics.length) throw new Error(`クリニック "${config.clinicCode}" が見つかりません。`);
  const clinicId = clinics[0].id;

  // 2. Resolve category number → id mapping from Supabase
  const catRes = await fetch(
    `${config.supabaseUrl}/rest/v1/categories?clinic_id=eq.${clinicId}&is_active=eq.true&select=id,number`,
    { headers }
  );
  if (!catRes.ok) throw new Error(`カテゴリ取得に失敗 (${catRes.status})`);
  const dbCategories = await catRes.json();
  const numberToId = {};
  for (const c of dbCategories) {
    numberToId[c.number] = c.id;
  }

  // 3. Build upsert records
  const records = [];
  for (const cat of categories) {
    const categoryId = numberToId[cat.number];
    if (!categoryId) continue; // skip if not in DB
    records.push({
      clinic_id: clinicId,
      survey_date: date,
      category_id: categoryId,
      count: counts[cat.number] || 0,
      submitted_by: 'chrome-extension',
    });
  }

  if (records.length === 0) throw new Error('送信するカテゴリがありません。');

  // 4. Upsert
  const res = await fetch(`${config.supabaseUrl}/rest/v1/daily_surveys`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify(records),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Supabase送信失敗 (${res.status})${body ? ': ' + body : ''}`);
  }
  return true;
}

/**
 * Delete survey data for a specific date from Supabase.
 */
async function deleteFromSupabase(config, date) {
  if (!config.supabaseUrl || !config.supabaseKey) {
    throw new Error('Supabase URLまたはキーが設定されていません。');
  }

  const headers = {
    apikey: config.supabaseKey,
    Authorization: `Bearer ${config.supabaseKey}`,
  };

  // Resolve clinic_id
  const clinicRes = await fetch(
    `${config.supabaseUrl}/rest/v1/clinics?code=eq.${encodeURIComponent(config.clinicCode)}&select=id`,
    { headers }
  );
  if (!clinicRes.ok) throw new Error(`クリニック情報の取得に失敗 (${clinicRes.status})`);
  const clinics = await clinicRes.json();
  if (!clinics.length) throw new Error(`クリニック "${config.clinicCode}" が見つかりません。`);
  const clinicId = clinics[0].id;

  // Delete records for that date
  const res = await fetch(
    `${config.supabaseUrl}/rest/v1/daily_surveys?clinic_id=eq.${clinicId}&survey_date=eq.${date}`,
    { method: 'DELETE', headers }
  );

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`削除失敗 (${res.status})${body ? ': ' + body : ''}`);
  }
  return true;
}

/**
 * Submit survey data to Google Sheets via GAS Web App.
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
    throw new Error(`Google Sheets送信失敗 (${res.status})`);
  }
  return true;
}
