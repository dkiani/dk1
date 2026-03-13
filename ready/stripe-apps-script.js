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
//    - Use the key starting with "sk_live_" for production
//    - Use "sk_test_" for testing first
// 4. Set up your discount codes in the DISCOUNT_CODES object
// 5. Deploy → New deployment → Web app
// 6. Execute as: Me
// 7. Who has access: Anyone
// 8. Copy the Web app URL
// 9. Paste it into ready/index.html replacing PASTE_YOUR_STRIPE_APPS_SCRIPT_URL_HERE
//
// ─────────────────────────────────────────────────────────

var STRIPE_SECRET_KEY = 'sk_test_PASTE_YOUR_KEY_HERE';

// Discount codes: CODE → { percent_off OR amount_off (in cents), label }
var DISCOUNT_CODES = {
  'INNER50': { percent_off: 50, label: '50% off applied' },
  'EARLYBIRD': { amount_off: 200000, label: '$2,000 off applied' },
  // Add more codes as needed
};

function doPost(e) {
  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonResponse({ error: 'Invalid JSON' });
  }

  var action = data.action;

  // ─── Create PaymentIntent ───
  if (action === 'create_payment') {
    var amount = data.amount || 777700; // default $7,777
    try {
      var response = UrlFetchApp.fetch('https://api.stripe.com/v1/payment_intents', {
        method: 'post',
        headers: {
          'Authorization': 'Bearer ' + STRIPE_SECRET_KEY
        },
        payload: {
          'amount': amount,
          'currency': 'usd',
          'payment_method_types[]': ['card', 'klarna', 'affirm'],
          'metadata[source]': 'kiani.vc'
        }
      });
      var pi = JSON.parse(response.getContentText());
      return jsonResponse({ clientSecret: pi.client_secret, id: pi.id });
    } catch (err) {
      return jsonResponse({ error: 'Payment creation failed: ' + err.message });
    }
  }

  // ─── Validate Discount Code ───
  if (action === 'validate_discount') {
    var code = (data.code || '').toUpperCase();
    var discount = DISCOUNT_CODES[code];

    if (!discount) {
      return jsonResponse({ valid: false });
    }

    var baseAmount = 777700;
    var newAmount = baseAmount;

    if (discount.percent_off) {
      newAmount = Math.round(baseAmount * (1 - discount.percent_off / 100));
    } else if (discount.amount_off) {
      newAmount = Math.max(0, baseAmount - discount.amount_off);
    }

    return jsonResponse({
      valid: true,
      amount: newAmount,
      label: discount.label || 'Discount applied'
    });
  }

  // ─── Update PaymentIntent Amount ───
  if (action === 'update_payment') {
    var clientSecret = data.clientSecret || '';
    var piId = clientSecret.split('_secret_')[0];
    var newAmt = data.amount;

    try {
      var response = UrlFetchApp.fetch('https://api.stripe.com/v1/payment_intents/' + piId, {
        method: 'post',
        headers: {
          'Authorization': 'Bearer ' + STRIPE_SECRET_KEY
        },
        payload: {
          'amount': newAmt
        }
      });
      return jsonResponse({ status: 'updated' });
    } catch (err) {
      return jsonResponse({ error: 'Update failed: ' + err.message });
    }
  }

  return jsonResponse({ error: 'Unknown action' });
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return ContentService.createTextOutput('Stripe backend is running.')
    .setMimeType(ContentService.MimeType.TEXT);
}
