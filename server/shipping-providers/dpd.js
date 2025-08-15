// FILE: server/shipping-providers/dpd.js

const axios = require('axios');
const Setting = require('../models/Setting');

// --- DPD Provider Configuration ---
const version = '1.0.0';

const defaultConfig = {
  description: 'Provider for DPD parcel services within Europe.',
  logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/DPD_logo_%282015%29.svg/2560px-DPD_logo_%282015%29.svg.png',
  isEnabled: false, // Disabled by default until configured
  activeEnvironment: 'sandbox',
  environments: [
    { 
      name: 'production', 
      apiUrl: 'https://api.dpd.com/shipping/v1/label', // Note: This is an example URL
      credentials: { apiKey: '', apiSecret: '', customerCode: '', customerNumber: '' }
    },
    { 
      name: 'sandbox', 
      apiUrl: 'https://api-sandbox.dpd.com/shipping/v1/label', // Note: This is an example URL
      credentials: { apiKey: '', apiSecret: '', customerCode: '', customerNumber: '' }
    }
  ],
  rateCard: {
    "NL": [
      { "maxWeight": 1000, "price": 5.25, "packageName": "DPD Home", "serviceLevel": "Standard", "productCode": "1330" },
      { "maxWeight": 10000, "price": 6.50, "packageName": "DPD Home", "serviceLevel": "Standard", "productCode": "1330" },
      { "maxWeight": 20000, "price": 10.75, "packageName": "DPD Home", "serviceLevel": "Standard", "productCode": "1330" },
      { "maxWeight": 1000, "price": 4.25, "packageName": "DPD ParcelShop", "serviceLevel": "Pickup", "productCode": "1352" },
      { "maxWeight": 10000, "price": 5.50, "packageName": "DPD ParcelShop", "serviceLevel": "Pickup", "productCode": "1352" }
    ],
    "BE-LU": [
      { "maxWeight": 1000, "price": 7.75, "packageName": "DPD Home", "serviceLevel": "Standard", "productCode": "1330" },
      { "maxWeight": 10000, "price": 9.75, "packageName": "DPD Home", "serviceLevel": "Standard", "productCode": "1330" },
      { "maxWeight": 20000, "price": 13.50, "packageName": "DPD Home", "serviceLevel": "Standard", "productCode": "1330" }
    ],
    "DE": [
      { "maxWeight": 1000, "price": 8.00, "packageName": "DPD Home", "serviceLevel": "Standard", "productCode": "1330" },
      { "maxWeight": 10000, "price": 10.25, "packageName": "DPD Home", "serviceLevel": "Standard", "productCode": "1330" },
      { "maxWeight": 20000, "price": 14.00, "packageName": "DPD Home", "serviceLevel": "Standard", "productCode": "1330" }
    ],
    "EU": [
        { "maxWeight": 1000, "price": 11.00, "packageName": "DPD Classic", "serviceLevel": "Standard", "productCode": "1330" },
        { "maxWeight": 5000, "price": 15.50, "packageName": "DPD Classic", "serviceLevel": "Standard", "productCode": "1330" },
        { "maxWeight": 10000, "price": 19.50, "packageName": "DPD Classic", "serviceLevel": "Standard", "productCode": "1330" },
        { "maxWeight": 20000, "price": 25.00, "packageName": "DPD Classic", "serviceLevel": "Standard", "productCode": "1330" }
    ]
  }
};

// --- DPD Specific Helper Functions ---
const getDpdZone = (countryCode) => {
  const beLuCountries = ["BE", "LU"];
  const deCountries = ["DE"];
  const euCountries = ["AT", "BG", "HR", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "PL", "PT", "RO", "SK", "SI", "ES", "SE"];
  
  if (!countryCode || countryCode.toUpperCase() === 'NL') return 'NL';
  if (beLuCountries.includes(countryCode.toUpperCase())) return 'BE-LU';
  if (deCountries.includes(countryCode.toUpperCase())) return 'DE';
  if (euCountries.includes(countryCode.toUpperCase())) return 'EU';
  return null; // No service for Rest of World in this example
};


// --- Standard Provider Functions ---

const getRates = async (address, fittingPackages, totalWeight, providerConfig) => {
  const zone = getDpdZone(address.countryCode);
  if (!zone) return []; // Return empty if no zone matches

  const zoneRates = providerConfig.rateCard[zone];
  if (!zoneRates) return [];
  
  const applicableRates = zoneRates.filter(rate => totalWeight <= rate.maxWeight);

  // Find the cheapest rate for each unique service level
  const cheapestRates = {};
  for (const rate of applicableRates) {
      if (!cheapestRates[rate.serviceLevel] || rate.price < cheapestRates[rate.serviceLevel].price) {
          cheapestRates[rate.serviceLevel] = rate;
      }
  }

  return Object.values(cheapestRates).map(rate => ({
    id: `dpd-${zone}-${rate.productCode}-${rate.serviceLevel}`,
    name: `DPD - ${rate.packageName} (${rate.serviceLevel})`,
    price: rate.price,
    provider: 'dpd'
  }));
};

const createLabel = async (order, productCode, providerConfig) => {
  // ... (This section would contain the actual DPD API call logic)
  throw new Error('DPD label creation is not yet implemented. Please replace the mock code.');
};

module.exports = {
  key: 'dpd',
  name: 'DPD',
  version,
  defaultConfig,
  getRates,
  createLabel
};
