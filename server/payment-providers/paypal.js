// FILE: server/payment-providers/paypal.js
const fetch = require('node-fetch');

// --- Helper Functions ---

/**
 * Gets the base URL for the PayPal API based on the mode.
 * @param {string} mode - 'sandbox' or 'live'.
 * @returns {string} The base API URL.
 */
function getPayPalApiBaseUrl(mode) {
  return mode === 'sandbox' 
    ? 'https://api-m.sandbox.paypal.com' 
    : 'https://api-m.paypal.com';
}

/**
 * Generates an OAuth 2.0 access token from PayPal.
 * @param {string} mode - 'sandbox' or 'live'.
 * @param {object} credentials - The provider's credentials { clientId, clientSecret }.
 * @returns {Promise<string>} The access token.
 */
async function generateAccessToken(mode, credentials) {
  const { clientId, clientSecret } = credentials;
  if (!clientId || !clientSecret) {
    throw new Error('PayPal Client ID or Secret is missing.');
  }
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await fetch(`${getPayPalApiBaseUrl(mode)}/v1/oauth2/token`, {
    method: 'POST',
    body: 'grant_type=client_credentials',
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });
  const data = await response.json();
  return data.access_token;
}


// --- Core Provider Functions ---

/**
 * Creates a PayPal order.
 * The ID of this order is used on the frontend to render the PayPal buttons.
 * @param {number} orderAmount - The total amount for the order.
 * @param {string} currencyCode - The currency code (e.g., 'EUR').
 * @param {object} providerConfig - The full provider configuration from the database.
 * @returns {Promise<object>} The created PayPal order details.
 */
async function createOrder(orderAmount, currencyCode, providerConfig) {
  console.log(`[PayPal] Creating order for ${orderAmount} ${currencyCode} in ${providerConfig.mode} mode.`);
  
  const accessToken = await generateAccessToken(providerConfig.mode, providerConfig.credentials);
  const url = `${getPayPalApiBaseUrl(providerConfig.mode)}/v2/checkout/orders`;

  const payload = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        amount: {
          currency_code: currencyCode,
          value: orderAmount.toFixed(2),
        },
      },
    ],
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (response.ok) {
    console.log('[PayPal] Order created successfully. ID:', data.id);
    return data;
  } else {
    console.error('[PayPal] Failed to create order:', data);
    throw new Error(data.message || 'Failed to create PayPal order.');
  }
}
// Add this new function to the file
/**
 * Captures a payment for a PayPal order.
 * @param {string} orderID - The ID of the PayPal order.
 * @param {object} providerConfig - The full provider configuration.
 * @returns {Promise<object>} The capture details.
 */
async function captureOrder(orderID, providerConfig) {
  const accessToken = await generateAccessToken(providerConfig.mode, providerConfig.credentials);
  const url = `${getPayPalApiBaseUrl(providerConfig.mode)}/v2/checkout/orders/${orderID}/capture`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });
  
  const data = await response.json();
  if (!response.ok) {
    console.error('[PayPal] Failed to capture order:', data);
    throw new Error('Failed to capture PayPal payment.');
  }

  console.log('[PayPal] Payment captured successfully.');
  return data;
}

async function initiate(orderDetails, providerConfig) {
  // This function now wraps the existing createOrder logic
  const paypalOrder = await createOrder(orderDetails.totalAmount, 'EUR', providerConfig);
  return { action: 'pay', paypalOrderID: paypalOrder.id };
}

// Then update module.exports
module.exports = {
  key: 'paypal',
  name: 'PayPal',
  isOnline: true,
  createOrder,
  captureOrder,
  initiate, // <-- Add this
};