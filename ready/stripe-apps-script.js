// ─────────────────────────────────────────────────────────
// Google Apps Script — Stripe Payment Backend
// ─────────────────────────────────────────────────────────
//
// SETUP INSTRUCTIONS:
//
// 1. Go to https://script.google.com and create a NEW project
//    (separate from your questionnaire script)
// 2. Delete the default code and paste EVERYTHING below
// 3. Replace STRIPE_SECRET_KEY with your Stripe secret key
//    - Find it at: https://dashboard.stripe.com/apikeys
//    - Use "sk_live_" for production, "sk_test_" for testing
// 4. Set up your discount codes in the DISCOUNT_CODES object
// 5. Deploy → New deployment → Web app
// 6. Execute as: Me  |  Who has access: Anyone
// 7. Copy the Web app URL into ready/index.html
//
// IMPORTANT: All requests come via doGet (JSONP) to avoid CORS.
// After ANY code change, redeploy as a NEW version.
// ─────────────────────────────────────────────────────────

var STRIPE_SECRET_KEY = 'sk_test_PASTE_YOUR_KEY_HERE';

// Discount codes: CODE → { percent_off OR amount_off (in cents), label }
var DISCOUNT_CODES = {
  'INNER50': { percent_off: 50, label: '50% off applied' },
  'EARLYBIRD': { amount_off: 200000, label: '$2,000 off applied' },
  'RICH': { amount_off: 500000, label: '$5,000 off applied' },
  'TEST': { amount_off: 772600, label: '$7,726 off applied' },
  'INNERCIRCLE': { amount_off: 777200, label: 'Discount applied' },

  // Add more codes as needed
};

function doGet(e) {
  var p = e.parameter || {};
  var action = p.action || '';
  var callback = p.callback || '';
  var result = {};

  // ─── Create PaymentIntent ───
  if (action === 'create_payment') {
    var amount = parseInt(p.amount) || 777700;
    try {
      var payload = 'amount=' + amount
        + '&currency=usd'
        + '&payment_method_types[]=card'
        + '&payment_method_types[]=klarna'
        + '&payment_method_types[]=affirm'
        + '&metadata[source]=kiani.vc';
      var response = UrlFetchApp.fetch('https://api.stripe.com/v1/payment_intents', {
        method: 'post',
        headers: { 'Authorization': 'Bearer ' + STRIPE_SECRET_KEY },
        contentType: 'application/x-www-form-urlencoded',
        payload: payload
      });
      var pi = JSON.parse(response.getContentText());
      result = { clientSecret: pi.client_secret, id: pi.id };
    } catch (err) {
      result = { error: 'Payment creation failed: ' + err.message };
    }
  }

  // ─── Validate Discount Code ───
  else if (action === 'validate_discount') {
    var code = (p.code || '').toUpperCase();
    var discount = DISCOUNT_CODES[code];

    if (!discount) {
      result = { valid: false };
    } else {
      var baseAmount = 777700;
      var newAmount = baseAmount;
      if (discount.percent_off) {
        newAmount = Math.round(baseAmount * (1 - discount.percent_off / 100));
      } else if (discount.amount_off) {
        newAmount = Math.max(0, baseAmount - discount.amount_off);
      }
      result = { valid: true, amount: newAmount, label: discount.label || 'Discount applied' };
    }
  }

  // ─── Update PaymentIntent Amount ───
  else if (action === 'update_payment') {
    var piId = p.pi || '';
    var newAmt = parseInt(p.amount) || 0;
    try {
      // Affirm requires min $50, Klarna min ~$1; use card-only for low amounts
      var updatePayload = 'amount=' + newAmt;
      if (newAmt < 5000) {
        updatePayload += '&payment_method_types[]=card';
      } else {
        updatePayload += '&payment_method_types[]=card'
          + '&payment_method_types[]=klarna'
          + '&payment_method_types[]=affirm';
      }
      UrlFetchApp.fetch('https://api.stripe.com/v1/payment_intents/' + piId, {
        method: 'post',
        headers: { 'Authorization': 'Bearer ' + STRIPE_SECRET_KEY },
        contentType: 'application/x-www-form-urlencoded',
        payload: updatePayload
      });
      result = { status: 'updated' };
    } catch (err) {
      result = { error: 'Update failed: ' + err.message };
    }
  }

  else {
    result = { error: 'Unknown action' };
  }

  // Return JSONP or JSON
  var json = JSON.stringify(result);
  if (callback) {
    return ContentService.createTextOutput(callback + '(' + json + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}
