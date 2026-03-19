// ─────────────────────────────────────────────────────────
// Google Apps Script — Student Session Logger → Google Sheets
// ─────────────────────────────────────────────────────────
//
// Tracks every time a student logs into the curriculum,
// including IP address, approximate location, and device info.
// Use this to monitor if access codes are being shared.
//
// SETUP INSTRUCTIONS:
//
// 1. Go to https://sheets.google.com and create a new spreadsheet
// 2. Name it "Course Session Logs"
// 3. In Row 1, add these headers (one per column):
//    A: Timestamp | B: Student | C: Access Code | D: IP Address
//    E: City | F: Region | G: Country | H: Device | I: Browser
//    J: Flagged
//
// 4. Go to Extensions → Apps Script
// 5. Delete the default code and paste EVERYTHING below this comment block
// 6. Click Deploy → New deployment → Web app
// 7. Set "Execute as": Me
// 8. Set "Who has access": Anyone
// 9. Click Deploy and authorize when prompted
// 10. Copy the Web app URL
// 11. Paste it into curriculum/index.html replacing the SESSION_LOG_URL value
//
// The "Flagged" column auto-marks rows when the same student
// logs in from a different IP within a short window.
// ─────────────────────────────────────────────────────────

var ADMIN_KEY = 'dk2026';

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Invalid JSON' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var timestamp = data.timestamp || new Date().toISOString();
  var student = data.student || 'Unknown';
  var code = data.code || '';
  var ip = data.ip || '';
  var city = data.city || '';
  var region = data.region || '';
  var country = data.country || '';
  var device = data.device || '';
  var browser = data.browser || '';

  // ─── Flag detection: same student, different IP within last 24h ───
  var flagged = '';
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    var allData = sheet.getRange(2, 1, lastRow - 1, 10).getValues();
    var cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    for (var i = allData.length - 1; i >= 0; i--) {
      var rowTime = new Date(allData[i][0]);
      if (rowTime < cutoff) break;
      if (allData[i][1] === student && allData[i][3] !== ip && ip !== '') {
        flagged = '⚠ DIFFERENT IP';
        break;
      }
    }
  }

  sheet.appendRow([
    timestamp,
    student,
    code,
    ip,
    city,
    region,
    country,
    device,
    browser,
    flagged
  ]);

  return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : '';
  var callback = (e && e.parameter && e.parameter.callback) ? e.parameter.callback : null;

  // ─── Return all logs (protected by admin key) ───
  if (action === 'all') {
    var key = (e && e.parameter && e.parameter.key) ? e.parameter.key : '';
    if (key !== ADMIN_KEY) {
      var err = JSON.stringify({ status: 'error', message: 'Invalid key' });
      if (callback) return ContentService.createTextOutput(callback + '(' + err + ')').setMimeType(ContentService.MimeType.JAVASCRIPT);
      return ContentService.createTextOutput(err).setMimeType(ContentService.MimeType.JSON);
    }

    var lastRow = sheet.getLastRow();
    var logs = [];
    if (lastRow > 1) {
      var data = sheet.getRange(2, 1, lastRow - 1, 10).getValues();
      for (var i = 0; i < data.length; i++) {
        logs.push({
          timestamp: data[i][0],
          student: data[i][1],
          code: data[i][2],
          ip: data[i][3],
          city: data[i][4],
          region: data[i][5],
          country: data[i][6],
          device: data[i][7],
          browser: data[i][8],
          flagged: data[i][9]
        });
      }
    }
    var json = JSON.stringify({ status: 'ok', logs: logs });
    if (callback) return ContentService.createTextOutput(callback + '(' + json + ')').setMimeType(ContentService.MimeType.JAVASCRIPT);
    return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
  }

  // ─── Summary: unique students and session counts ───
  if (action === 'summary') {
    var key = (e && e.parameter && e.parameter.key) ? e.parameter.key : '';
    if (key !== ADMIN_KEY) {
      var err = JSON.stringify({ status: 'error', message: 'Invalid key' });
      if (callback) return ContentService.createTextOutput(callback + '(' + err + ')').setMimeType(ContentService.MimeType.JAVASCRIPT);
      return ContentService.createTextOutput(err).setMimeType(ContentService.MimeType.JSON);
    }

    var lastRow = sheet.getLastRow();
    var students = {};
    var flags = 0;
    if (lastRow > 1) {
      var data = sheet.getRange(2, 1, lastRow - 1, 10).getValues();
      for (var i = 0; i < data.length; i++) {
        var name = data[i][1];
        if (!students[name]) {
          students[name] = { sessions: 0, ips: [], last_seen: '', flagged: 0 };
        }
        students[name].sessions++;
        if (data[i][3] && students[name].ips.indexOf(data[i][3]) === -1) {
          students[name].ips.push(data[i][3]);
        }
        students[name].last_seen = data[i][0];
        if (data[i][9]) {
          students[name].flagged++;
          flags++;
        }
      }
    }
    var json = JSON.stringify({ status: 'ok', students: students, total_flags: flags });
    if (callback) return ContentService.createTextOutput(callback + '(' + json + ')').setMimeType(ContentService.MimeType.JAVASCRIPT);
    return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
  }

  // ─── Default: return total session count ───
  var lastRow = sheet.getLastRow();
  var count = Math.max(0, lastRow - 1);
  var json = JSON.stringify({ count: count });
  if (callback) return ContentService.createTextOutput(callback + '(' + json + ')').setMimeType(ContentService.MimeType.JAVASCRIPT);
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}
