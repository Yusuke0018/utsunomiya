// GAS Web App for survey data backup to Google Sheets

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const { clinic_code, date, counts } = data;

    if (!clinic_code || !date || !counts) {
      return ContentService.createTextOutput(JSON.stringify({ error: 'Missing required fields' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const d = new Date(date);
    const sheetName = `${d.getFullYear()}年${d.getMonth() + 1}月`;

    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      // Header row
      const headers = ['日付', 'Google', 'Yahoo', 'AI', 'Youtube', '家族・友人の紹介',
                       '看板・のぼり', 'チラシ', '新聞折込', '情報誌', 'ラジオ',
                       '医療機関からの紹介', 'その他', '合計', '送信日時'];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    // Build row data
    const categories = [1,2,3,4,5,6,7,8,9,10,11,12];
    const values = categories.map(n => counts[n] || 0);
    const total = values.reduce((a, b) => a + b, 0);
    const now = new Date().toLocaleString('ja-JP');
    const row = [date, ...values, total, now];

    // Check if date already exists (overwrite)
    const dataRange = sheet.getDataRange();
    const allData = dataRange.getValues();
    let existingRow = -1;
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][0] === date) {
        existingRow = i + 1;
        break;
      }
    }

    if (existingRow > 0) {
      sheet.getRange(existingRow, 1, 1, row.length).setValues([row]);
    } else {
      sheet.appendRow(row);
    }

    // Sort by date
    if (sheet.getLastRow() > 1) {
      sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn())
        .sort({column: 1, ascending: true});
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService.createTextOutput('Survey Analytics GAS Web App is running.')
    .setMimeType(ContentService.MimeType.TEXT);
}
