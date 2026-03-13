// ─────────────────────────────────────────────────────────
// Google Apps Script — Questionnaire → Google Sheets
// ─────────────────────────────────────────────────────────
//
// SETUP INSTRUCTIONS:
//
// 1. Go to https://sheets.google.com and create a new spreadsheet
// 2. Name it something like "Journey Responses"
// 3. In Row 1, add these headers (one per column):
//    A: Timestamp | B: Name | C: Instagram | D: Trading Experience
//    E: Life Changes | F: 90-Day Success | G: Mentorship Cost | H: Ready
//
// 4. Go to Extensions → Apps Script
// 5. Delete the default code and paste EVERYTHING below this comment block
// 6. Click Deploy → New deployment
// 7. Select type: "Web app"
// 8. Set "Execute as": Me
// 9. Set "Who has access": Anyone
// 10. Click Deploy and authorize when prompted
// 11. Copy the Web app URL
// 12. Paste it into journey/index.html replacing PASTE_YOUR_GOOGLE_APPS_SCRIPT_URL_HERE
//
// That's it! Responses will now appear in your spreadsheet.
// ─────────────────────────────────────────────────────────

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Invalid JSON' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  sheet.appendRow([
    data.timestamp || new Date().toISOString(),
    data.name || '',
    data.instagram || '',
    data.trading_experience || '',
    data.life_changes || '',
    data.ninety_day_success || '',
    data.mentorship_cost || '',
    data.ready || ''
  ]);

  return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return ContentService.createTextOutput('Questionnaire endpoint is running.')
    .setMimeType(ContentService.MimeType.TEXT);
}
