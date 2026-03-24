// ─────────────────────────────────────────────────────────
// Google Apps Script — Onboarding Welcome Email Sender
// ─────────────────────────────────────────────────────────
//
// SETUP INSTRUCTIONS:
//
// You have two options:
//
// OPTION A: Add to your EXISTING Apps Script (recommended)
//   1. Open your existing Apps Script (the one from /apply or /journey)
//   2. Add the onboarding email handler to your existing doPost function
//      (see the code block below marked "ADD TO EXISTING doPost")
//   3. Re-deploy with a new version
//
// OPTION B: Create a new standalone Apps Script
//   1. Go to https://script.google.com
//   2. Create a new project
//   3. Paste everything below
//   4. Deploy → New deployment → Web app
//   5. Set "Execute as": Me, "Who has access": Anyone
//   6. Copy the URL and update EMAIL_SCRIPT_URL in /onboarding/index.html
//
// ─────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════
// ADD TO EXISTING doPost — paste this at the TOP of your
// existing doPost(e) function, before any other logic:
// ═══════════════════════════════════════════════════════════
//
//   // Handle onboarding welcome emails
//   if (data.action === 'onboarding_welcome') {
//     return sendOnboardingWelcome(data);
//   }
//
// Then add the sendOnboardingWelcome function below to the same script.
// ═══════════════════════════════════════════════════════════

function sendOnboardingWelcome(data) {
  var name = data.name || 'there';
  var email = data.email || '';
  var tempPassword = data.tempPassword || '';
  var theme = data.theme || 'light';

  if (!email || !tempPassword) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Missing email or password'
    })).setMimeType(ContentService.MimeType.JSON);
  }

  var subject = 'Your account is ready — Daniel Kiani';

  var body = 'Hey ' + name + ',\n\n'
    + 'Welcome! Your account has been created.\n\n'
    + 'Here\'s how to get started:\n\n'
    + '1. Go to https://kiani.vc/dashboard\n'
    + '2. Sign in with your email: ' + email + '\n'
    + '3. Use this temporary password: ' + tempPassword + '\n'
    + '4. You\'ll be prompted to set a new password on your first login.\n\n'
    + 'Once you\'re in, you\'ll have full access to the trading curriculum.\n\n'
    + 'See you inside,\n'
    + 'Daniel Kiani';

  // Theme-aware colors
  var isDark = (theme === 'dark');
  var bg = isDark ? '#0a0a0a' : '#f0ede8';
  var fg = isDark ? '#d4d4d4' : '#1a1a1a';
  var cardBg = isDark ? '#111' : '#e8e4dd';
  var cardBorder = isDark ? '#1f1f1f' : '#d5d0c8';
  var muted = isDark ? '#525252' : '#6b6560';
  var label = isDark ? '#a0a0a0' : '#5a554f';
  var pwBg = isDark ? '#0a0a0a' : '#f0ede8';
  var pwBorder = isDark ? '#1f1f1f' : '#d5d0c8';
  var linkBorder = isDark ? '#333' : '#c0bab2';

  var htmlBody = '<div style="font-family: \'Courier New\', monospace; max-width: 520px; margin: 0 auto; padding: 40px 20px; color: ' + fg + '; background: ' + bg + ';">'
    + '<div style="width: 10px; height: 10px; border-radius: 50%; background: #e85d2a; margin-bottom: 24px;"></div>'
    + '<h1 style="font-size: 18px; font-weight: 400; color: ' + fg + '; margin-bottom: 8px;">Welcome aboard, ' + name + '.</h1>'
    + '<p style="font-size: 13px; color: ' + muted + '; font-weight: 300; margin-bottom: 32px;">Your account is ready.</p>'
    + '<div style="background: ' + cardBg + '; border: 1px solid ' + cardBorder + '; padding: 24px; margin-bottom: 24px;">'
    + '<p style="font-size: 12px; color: ' + label + '; font-weight: 300; margin: 0 0 16px 0;">Sign in at:</p>'
    + '<a href="https://kiani.vc/dashboard" style="color: #e85d2a; font-size: 13px; text-decoration: none; border-bottom: 1px solid ' + linkBorder + ';">kiani.vc/dashboard</a>'
    + '<p style="font-size: 12px; color: ' + label + '; font-weight: 300; margin: 20px 0 8px 0;">Email:</p>'
    + '<p style="font-size: 13px; color: ' + fg + '; font-weight: 400; margin: 0;">' + email + '</p>'
    + '<p style="font-size: 12px; color: ' + label + '; font-weight: 300; margin: 20px 0 8px 0;">Temporary password:</p>'
    + '<p style="font-size: 15px; color: ' + fg + '; font-weight: 400; margin: 0; letter-spacing: 2px; font-family: monospace; background: ' + pwBg + '; padding: 8px 12px; border: 1px solid ' + pwBorder + '; display: inline-block;">' + tempPassword + '</p>'
    + '</div>'
    + '<p style="font-size: 12px; color: ' + muted + '; font-weight: 300; line-height: 1.8;">You\'ll be asked to set a new password when you first sign in.<br>Once you\'re in, you\'ll have full access to the trading curriculum.</p>'
    + '<p style="font-size: 12px; color: ' + muted + '; font-weight: 300; margin-top: 32px;">See you inside,<br><span style="color: ' + label + ';">Daniel Kiani</span></p>'
    + '</div>';

  MailApp.sendEmail({
    to: email,
    subject: subject,
    body: body,
    htmlBody: htmlBody
  });

  // Also log to the sheet if desired
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  sheet.appendRow([
    new Date().toISOString(),
    'onboarding_welcome',
    name,
    email,
    'Email sent'
  ]);

  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    message: 'Welcome email sent to ' + email
  })).setMimeType(ContentService.MimeType.JSON);
}

// ─── Standalone doPost (only if creating a NEW script) ───
function doPost(e) {
  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Invalid JSON'
    })).setMimeType(ContentService.MimeType.JSON);
  }

  if (data.action === 'onboarding_welcome') {
    return sendOnboardingWelcome(data);
  }

  return ContentService.createTextOutput(JSON.stringify({
    status: 'error',
    message: 'Unknown action'
  })).setMimeType(ContentService.MimeType.JSON);
}
