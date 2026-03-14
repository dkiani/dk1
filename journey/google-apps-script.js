// ─────────────────────────────────────────────────────────
// Google Apps Script — Questionnaire → Google Sheets
// ─────────────────────────────────────────────────────────
//
// SETUP INSTRUCTIONS:
//
// 1. Go to https://sheets.google.com and create a new spreadsheet
// 2. Name it something like "Journey Responses"
// 3. In Row 1, add these headers (one per column):
//    A: Session ID | B: Timestamp | C: Name | D: Instagram
//    E: Trading Experience | F: Why Trading | G: 90-Day Success
//    H: Mentorship Cost | I: Ready
//
// 4. Go to Extensions → Apps Script
// 5. Delete the default code and paste EVERYTHING below this comment block
// 6. Click Deploy → New deployment → Web app
// 7. Set "Execute as": Me
// 8. Set "Who has access": Anyone
// 9. Click Deploy and authorize when prompted
// 10. Copy the Web app URL
// 11. Paste it into journey/index.html replacing PASTE_YOUR_GOOGLE_APPS_SCRIPT_URL_HERE
//
// Each answer syncs immediately. If someone drops off midway,
// you'll still see their partial responses. Rows are identified
// by session_id so repeated syncs update the same row.
//
// To enable email notifications, set your email below.
// ─────────────────────────────────────────────────────────

var NOTIFY_EMAIL = '';  // ← Put your email here for notifications, or leave blank to disable

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Invalid JSON' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var sessionId = data.session_id || '';
  var row = findRowBySessionId(sheet, sessionId);

  var values = [
    sessionId,
    data.timestamp || new Date().toISOString(),
    data.name || '',
    data.instagram || '',
    data.trading_experience || '',
    data.why_trading || '',
    data.ninety_day_success || '',
    data.mentorship_cost || '',
    data.ready || ''
  ];

  if (row > 0) {
    // Update existing row
    sheet.getRange(row, 1, 1, values.length).setValues([values]);
  } else {
    // New respondent — append row
    sheet.appendRow(values);
  }

  // Send email when the final answer (ready) comes in
  if (NOTIFY_EMAIL && data.ready) {
    var subject = 'New Journey Response — ' + (data.name || 'Unknown');
    var body = 'New questionnaire submission:\n\n'
      + 'Name: ' + (data.name || '—') + '\n'
      + 'Instagram: ' + (data.instagram || '—') + '\n'
      + 'Trading Experience: ' + (data.trading_experience || '—') + '\n'
      + 'Why Trading: ' + (data.why_trading || '—') + '\n'
      + '90-Day Success: ' + (data.ninety_day_success || '—') + '\n'
      + 'Mentorship Cost: ' + (data.mentorship_cost || '—') + '\n'
      + 'Ready: ' + (data.ready || '—') + '\n\n'
      + 'Submitted: ' + (data.timestamp || new Date().toISOString());

    MailApp.sendEmail(NOTIFY_EMAIL, subject, body);
  }

  return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function findRowBySessionId(sheet, sessionId) {
  if (!sessionId) return -1;
  var data = sheet.getRange(1, 1, sheet.getLastRow(), 1).getValues();
  for (var i = data.length - 1; i >= 0; i--) {
    if (data[i][0] === sessionId) return i + 1;
  }
  return -1;
}

// ─── ADMIN KEY ───
// Change this to a secret passphrase. Used to access all responses via ?action=all&key=YOUR_KEY
var ADMIN_KEY = 'dk2026';

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : '';
  var callback = (e && e.parameter && e.parameter.callback) ? e.parameter.callback : null;

  // ─── Return all responses (protected by admin key) ───
  if (action === 'all') {
    var key = (e && e.parameter && e.parameter.key) ? e.parameter.key : '';
    if (key !== ADMIN_KEY) {
      var err = JSON.stringify({ status: 'error', message: 'Invalid key' });
      if (callback) return ContentService.createTextOutput(callback + '(' + err + ')').setMimeType(ContentService.MimeType.JAVASCRIPT);
      return ContentService.createTextOutput(err).setMimeType(ContentService.MimeType.JSON);
    }

    var lastRow = sheet.getLastRow();
    var responses = [];
    if (lastRow > 1) {
      var data = sheet.getRange(2, 1, lastRow - 1, 9).getValues();
      for (var i = 0; i < data.length; i++) {
        responses.push({
          session_id: data[i][0],
          timestamp: data[i][1],
          name: data[i][2],
          instagram: data[i][3],
          trading_experience: data[i][4],
          why_trading: data[i][5],
          ninety_day_success: data[i][6],
          mentorship_cost: data[i][7],
          ready: data[i][8]
        });
      }
    }
    var json = JSON.stringify({ status: 'ok', responses: responses });
    if (callback) return ContentService.createTextOutput(callback + '(' + json + ')').setMimeType(ContentService.MimeType.JAVASCRIPT);
    return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
  }

  // ─── Default: return count ───
  var lastRow = sheet.getLastRow();
  var count = Math.max(0, lastRow - 1);
  var json = JSON.stringify({ count: count });

  if (callback) {
    return ContentService.createTextOutput(callback + '(' + json + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}
