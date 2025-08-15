// FILE: server/shipping-providers/dhl.js

// --- DHL Provider Configuration ---
const version = '1.0.0'; // Start with version 1.0.0

// The defaultConfig object is automatically read by your shippingSyncService
// when the server starts. This will create the initial DHL entry in your database.
const defaultConfig = {
  description: 'Provider for DHL Parcel services for simple home delivery.',
  logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo_of_the_Deutsche_Post_DHL_Group.svg',
  isEnabled: false, // Always set to false by default. Enable it in your admin panel later.
  activeEnvironment: 'sandbox',
  environments: [
    { 
      name: 'production', 
      apiUrl: 'https://api.dhl.com/shipping/v1/shipments', // Note: This is an example URL
      credentials: { apiKey: '', apiSecret: '' }
    },
    { 
      name: 'sandbox', 
      apiUrl: 'https://api-sandbox.dhl.com/shipping/v1/shipments', // Note: This is an example URL
      credentials: { apiKey: '', apiSecret: '' }
    }
  ],
  // This is a simple rate card for home delivery only, as you requested.
  // It's structured by country code for easy extension.
  rateCard: {
    "NL": [
      { "maxWeight": 2000, "price": 6.45 },
      { "maxWeight": 10000, "price": 7.50 },
      { "maxWeight": 20000, "price": 11.25 }
    ],
    "BE": [
      { "maxWeight": 2000, "price": 9.00 },
      { "maxWeight": 10000, "price": 12.50 },
      { "maxWeight": 20000, "price": 15.00 }
    ],
    "DE": [
      { "maxWeight": 2000, "price": 9.50 },
      { "maxWeight": 10000, "price": 13.00 },
      { "maxWeight": 20000, "price": 16.50 }
    ],
  }
};

/**
 * Finds the single, cheapest applicable DHL rate for a given order.
 * @param {object} address - The customer's shipping address.
 * @param {Array} fittingPackages - A list of possible package sizes (not used in this simple version).
 * @param {number} totalWeight - The total weight of the order in grams.
 * @param {object} providerConfig - The DHL configuration from the database.
 * @returns {Promise<Array>} A list containing zero or one rate object.
 */
const getRates = async (address, fittingPackages, totalWeight, providerConfig) => {
  const countryCode = address.countryCode.toUpperCase();
  const zoneRates = providerConfig.rateCard[countryCode];

  // If there are no rates defined for the destination country, return an empty array.
  if (!zoneRates) {
    return [];
  }
  
  // Find all rates where the order's weight is within the limit.
  const applicableRates = zoneRates.filter(rate => totalWeight <= rate.maxWeight);

  // If no rate is applicable (e.g., order is too heavy), return empty.
  if (applicableRates.length === 0) {
    return [];
  }

  // Find the cheapest rate among the applicable ones (the first one after sorting).
  applicableRates.sort((a, b) => a.price - b.price);
  const cheapestRate = applicableRates[0];

  // Return the rate in the standard format your system expects.
  return [{
    id: `dhl-${countryCode}-home-delivery`, // A unique ID for this rate
    name: 'DHL Parcel (Home Delivery)',
    price: cheapestRate.price,
    provider: 'dhl' // The key of this provider
  }];
};

/**
 * Creates a shipping label. For now, this is a placeholder.
 * You would replace this with a real call to the DHL API.
 */
const createLabel = async (order, productCode, providerConfig) => {
  // In a real implementation, you would use a library like 'axios' to call the
  // DHL API endpoint with the order data and credentials from providerConfig.
  
  console.log('--- MOCK DHL LABEL CREATION ---');
  console.log(`Order: ${order.orderNumber}`);
  console.log('Provider Config Used:', providerConfig.activeEnvironment);

  // For now, we will throw an error to prevent creating a real label,
  // clearly indicating that it's not implemented yet.
  throw new Error('DHL label creation is not yet implemented. This is a placeholder.');

  // A real implementation would return an object like this:
  /*
  return {
    labelData: 'BASE64_ENCODED_PDF_STRING_FROM_DHL',
    trackingNumber: 'JD1234567890'
  };
  */
};

// This is the standard export "contract" that your shippingRoutes.js and
// shippingSyncService.js expect every provider to have.
module.exports = {
  key: 'dhl',
  name: 'DHL',
  version,
  defaultConfig,
  getRates,
  createLabel
};