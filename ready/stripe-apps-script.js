// ─────────────────────────────────────────────────────────
// Google Apps Script — Stripe Payment Backend
// ─────────────────────────────────────────────────────────
//
// SETUP INSTRUCTIONS:
//
// 1. Go to https://script.google.com and create a NEW project
//    (separate from your questionnaire script)
// 2. Delete the default code and paste EVERYTHING below
// 3. Add your Stripe secret key as a Script Property:
//    Project Settings (gear icon) > Script Properties > Add
//    Key: STRIPE_SECRET_KEY  Value: sk_live_...
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

var STRIPE_SECRET_KEY = PropertiesService.getScriptProperties().getProperty('STRIPE_SECRET_KEY');

// Discount codes: CODE → { percent_off OR amount_off (in cents), label }
var DISCOUNT_CODES = {
  'INNER50': { percent_off: 50, label: '50% off applied' },
  'EARLYBIRD': { amount_off: 200000, label: '$2,000 off applied' },
  'RICH': { amount_off: 500000, label: '$5,000 off applied' },
  'TEST': { amount_off: 772600, label: '$7,726 off applied' },
  'INNERCIRCLE': { amount_off: 777200, label: 'Discount applied' },
  'DISCIPLE': { percent_off: 70, label: '70% off applied' },

  // Add more codes as needed
};

function getOrCreateProduct() {
  var props = PropertiesService.getScriptProperties();
  var productId = props.getProperty('STRIPE_PRODUCT_ID');
  if (productId) return productId;

  var response = UrlFetchApp.fetch('https://api.stripe.com/v1/products', {
    method: 'post',
    headers: { 'Authorization': 'Bearer ' + STRIPE_SECRET_KEY },
    contentType: 'application/x-www-form-urlencoded',
    payload: 'name=' + encodeURIComponent("Kiani's Inner Circle")
  });
  var product = JSON.parse(response.getContentText());
  props.setProperty('STRIPE_PRODUCT_ID', product.id);
  return product.id;
}

function doGet(e) {
  var p = e.parameter || {};
  var action = p.action || '';
  var callback = p.callback || '';
  var result = {};

  // ─── Create PaymentIntent (one-time) ───
  if (action === 'create_payment') {
    var amount = parseInt(p.amount) || 699700;
    try {
      var payload = 'amount=' + amount
        + '&currency=usd'
        + '&automatic_payment_methods[enabled]=true'
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

  // ─── Create Subscription ───
  else if (action === 'create_subscription') {
    var amount = parseInt(p.amount) || 84400;
    var interval = p.interval || 'month';
    var intervalCount = parseInt(p.interval_count) || 1;
    var email = p.email || '';

    try {
      var custPayload = 'metadata[source]=kiani.vc';
      if (email) custPayload += '&email=' + encodeURIComponent(email);
      var custResponse = UrlFetchApp.fetch('https://api.stripe.com/v1/customers', {
        method: 'post',
        headers: { 'Authorization': 'Bearer ' + STRIPE_SECRET_KEY },
        contentType: 'application/x-www-form-urlencoded',
        payload: custPayload
      });
      var customer = JSON.parse(custResponse.getContentText());

      var productId = getOrCreateProduct();

      var subPayload = 'customer=' + customer.id
        + '&items[0][price_data][currency]=usd'
        + '&items[0][price_data][unit_amount]=' + amount
        + '&items[0][price_data][recurring][interval]=' + interval
        + '&items[0][price_data][recurring][interval_count]=' + intervalCount
        + '&items[0][price_data][product]=' + productId
        + '&payment_behavior=default_incomplete'
        + '&payment_settings[save_default_payment_method]=on_subscription'
        + '&expand[0]=latest_invoice.payment_intent'
        + '&metadata[source]=kiani.vc';

      var subResponse = UrlFetchApp.fetch('https://api.stripe.com/v1/subscriptions', {
        method: 'post',
        headers: { 'Authorization': 'Bearer ' + STRIPE_SECRET_KEY },
        contentType: 'application/x-www-form-urlencoded',
        payload: subPayload
      });
      var subscription = JSON.parse(subResponse.getContentText());

      result = {
        clientSecret: subscription.latest_invoice.payment_intent.client_secret,
        subscriptionId: subscription.id,
        customerId: customer.id
      };
    } catch (err) {
      result = { error: 'Subscription creation failed: ' + err.message };
    }
  }

  // ─── Create Indicator PaymentIntent ───
  else if (action === 'create_indicator_payment') {
    var amount = parseInt(p.amount) || 0;
    var product = p.product || '';
    var productName = p.product_name || '';
    try {
      var payload = 'amount=' + amount
        + '&currency=usd'
        + '&payment_method_types[0]=card'
        + '&payment_method_types[1]=klarna'
        + '&payment_method_types[2]=affirm'
        + '&metadata[source]=kiani.vc'
        + '&metadata[type]=indicator'
        + '&metadata[product]=' + encodeURIComponent(product)
        + '&metadata[product_name]=' + encodeURIComponent(productName);
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
      var baseAmount = parseInt(p.base_amount) || 699700;
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
      var updatePayload = 'amount=' + newAmt;
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

  // ─── Update Customer (email) ───
  else if (action === 'update_customer') {
    var custId = p.customer_id || '';
    var email = p.email || '';
    try {
      UrlFetchApp.fetch('https://api.stripe.com/v1/customers/' + custId, {
        method: 'post',
        headers: { 'Authorization': 'Bearer ' + STRIPE_SECRET_KEY },
        contentType: 'application/x-www-form-urlencoded',
        payload: 'email=' + encodeURIComponent(email)
      });
      result = { status: 'updated' };
    } catch (err) {
      result = { error: 'Customer update failed: ' + err.message };
    }
  }

  // ─── Update PaymentIntent Metadata (TradingView username) ───
  else if (action === 'update_payment_metadata') {
    var piId = p.pi || '';
    var tvUsername = p.tv_username || '';
    var product = p.product || '';
    try {
      var metaPayload = 'metadata[tv_username]=' + encodeURIComponent(tvUsername)
        + '&metadata[product]=' + encodeURIComponent(product);
      UrlFetchApp.fetch('https://api.stripe.com/v1/payment_intents/' + piId, {
        method: 'post',
        headers: { 'Authorization': 'Bearer ' + STRIPE_SECRET_KEY },
        contentType: 'application/x-www-form-urlencoded',
        payload: metaPayload
      });
      result = { status: 'updated' };
    } catch (err) {
      result = { error: 'Metadata update failed: ' + err.message };
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
