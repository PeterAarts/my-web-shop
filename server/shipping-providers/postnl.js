// FILE: server/shipping-providers/postnl.js

const axios = require('axios');
const Setting = require('../models/Setting');
//const { version } = require('pdfkit');

const version = '1.0.8'; // Define the version of this shipping provider module

// Helper function to determine the shipping zone from a country code
const getZoneForCountry = (countryCode) => {
  const eur1Countries = ["BE", "DK", "DE", "FR", "IT", "LU", "AT", "ES", "GB", "SE"];
  const eur2Countries = ["FI", "HU", "IE", "PL", "PT", "SI", "SK", "CZ"];
  
  if (!countryCode) return 'NL';
  if (countryCode.toUpperCase() === 'NL') return 'NL';
  if (eur1Countries.includes(countryCode.toUpperCase())) return 'EUR1';
  if (eur2Countries.includes(countryCode.toUpperCase())) return 'EUR2';
  return 'ROW'; // Rest of World
};

/**
 * Finds available PostNL shipping rates for a given order.
 * @param {object} address - The customer's shipping address.
 * @param {Array} fittingPackages - A list of possible package sizes.
 * @param {number} totalWeight - The total weight of the order in grams.
 * @param {object} providerConfig - The PostNL configuration from the database.
 * @returns {Promise<Array>} A list of rate objects.
 */
const getRates = async (address, fittingPackages, totalWeight, providerConfig) => {
  const zone = getZoneForCountry(address.countryCode);
  const zoneRates = providerConfig.rateCard[zone];

  if (!zoneRates) {
    console.log(`No rates found for zone: ${zone}`);
    return [];
  }

  const applicableRates = zoneRates.filter(rate => totalWeight <= rate.maxWeight);
  // Group by serviceLevel to find the cheapest for 'Tracked' and 'Untracked'
  const cheapestRatesByServiceLevel = {};
  for (const rate of applicableRates) {
    if (!cheapestRatesByServiceLevel[rate.serviceLevel] || rate.price < cheapestRatesByServiceLevel[rate.serviceLevel].price) {
      cheapestRatesByServiceLevel[rate.serviceLevel] = rate;
    }
  }
  // --- END OF CORRECTION ---

  return Object.values(cheapestRatesByServiceLevel).map(rate => ({
    id: `postnl-${zone}-${rate.productCode}-${rate.serviceLevel}`,
    name: `PostNL - ${rate.packageName} (${rate.serviceLevel}) < ${rate.maxWeight}g`,
    price: rate.price,
    provider: 'postnl'
  }));
};

/**
 * Creates a shipping label by calling the PostNL API.
 * @param {object} order - The full order object, populated with product details.
 * @param {string} productCode - The specific PostNL service code (e.g., '3085').
 * @param {object} providerConfig - The PostNL configuration from the database.
 * @returns {Promise<object>} An object with the label data and tracking number.
 */
const createLabel = async (order, productCode, providerConfig) => {
  const settings = await Setting.getSingleton();
  const { shopAddress } = settings;
  const { customerDetails } = order;

  // --- NEW: Find the active environment from the provider's settings ---
  const activeEnv = providerConfig.environments.find(
    env => env.name === providerConfig.activeEnvironment
  );

  if (!activeEnv) {
    throw new Error(`Active environment "${providerConfig.activeEnvironment}" not found for ${providerConfig.name}.`);
  }
  // --- END NEW SECTION ---

  const totalWeight = order.items.reduce((acc, item) => {
      const weight = item.productId && typeof item.productId.weight === 'number' ? item.productId.weight : 0;
      return acc + (weight * item.quantity);
  }, 0);

  const addressParts = customerDetails.address.split(',').map(p => p.trim());
  if (addressParts.length < 4) {
    throw new Error(`Invalid address format for order ${order.orderNumber}. Expected at least 4 comma-separated parts.`);
  }
  const [streetAndNumber, zipCode, city, countryCode] = addressParts;
  
  const streetParts = streetAndNumber.match(/(.*?)\s*(\d+[A-Za-z]?.*)/);
  const street = streetParts ? streetParts[1].trim() : streetAndNumber;
  const houseNumber = streetParts ? streetParts[2].trim() : '0';

  // UPDATED: Use credentials from the active environment
  const apiRequestData = {
    Customer: {
      CustomerCode: activeEnv.credentials.customerCode,
      CustomerNumber: activeEnv.credentials.customerNumber,
      Address: {
        AddressType: '02',
        CompanyName: shopAddress.name,
        Street: shopAddress.street,
        Zipcode: shopAddress.zipCode.replace(/\s/g, ''),
        City: shopAddress.city,
        Countrycode: shopAddress.countryCode
      }
    },
    Message: {
      MessageID: '1',
      Printertype: 'GraphicFile|PDF'
    },
    Shipments: [{
      Addresses: [{
        AddressType: '01',
        FirstName: customerDetails.name.split(' ')[0],
        Name: customerDetails.name.split(' ').slice(1).join(' '),
        Street: street,
        HouseNr: houseNumber,
        Zipcode: zipCode.replace(/\s/g, ''),
        City: city,
        Countrycode: countryCode
      }],
      Contacts: [{
          ContactType: '01',
          Email: customerDetails.email,
      }],
      Dimension: {
        Weight: totalWeight
      },
      ProductCodeDelivery: productCode,
      Reference: order.orderNumber
    }]
  };

  try {
    console.log(`Sending label request to PostNL (${activeEnv.name}) for order: ${order.orderNumber}`);
    // UPDATED: Use the apiUrl and apiKey from the active environment
    const response = await axios.post(activeEnv.apiUrl, apiRequestData, {
      headers: {
        'Content-Type': 'application/json',
        'apikey': activeEnv.credentials.apiKey
      }
    });

    const shipmentResponse = response.data.ResponseShipments[0];
    if (shipmentResponse && shipmentResponse.Labels && shipmentResponse.Barcode) {
      return {
        labelData: shipmentResponse.Labels[0].Content,
        trackingNumber: shipmentResponse.Barcode
      };
    } else {
      throw new Error('Invalid response structure from PostNL API.');
    }
    
  } catch (error) {
    const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
    console.error(`PostNL API Error for order ${order.orderNumber}:`, errorMessage);
    throw new Error(`Failed to create label with PostNL: ${errorMessage}`);
  }
};

const defaultConfig = {
  description: 'Provider for PostNL services in the Netherlands and abroad.',
  logoUrl: '/assets/postnl-logo.png', // Example path, adjust as needed
  activeEnvironment: 'sandbox',
  version: '1.0.8',
  environments: [
    {
      name: 'production',
      apiUrl: 'https://api.postnl.nl/shipment/v2_2/label',
      credentials: { apiKey: '', apiSecret: '', customerCode: '', customerNumber: '' }
    },
    {
      name: 'sandbox',
      apiUrl: 'https://api-sandbox.postnl.nl/shipment/v2_2/label',
      credentials: { apiKey: '', apiSecret: '', customerCode: '', customerNumber: '' }
    }
  ],
  rateCard: {
    "NL": [
      { "maxWeight": 20, "price": 1.21, "packageName": "Letter Small", "serviceLevel": "Untracked", "productCode": "2928" },
      { "maxWeight": 50, "price": 2.42, "packageName": "Letter Small", "serviceLevel": "Untracked", "productCode": "2928" },
      { "maxWeight": 350, "price": 3.92, "packageName": "Letter Small", "serviceLevel": "Untracked", "productCode": "2928" },
      { "maxWeight": 2000, "price": 4.25, "packageName": "Letterbox", "serviceLevel": "Tracked", "productCode": "2928" },
      { "maxWeight": 10000, "price": 7.95, "packageName": "Medium Parcel", "serviceLevel": "Tracked", "productCode": "3085" },
      { "maxWeight": 23000, "price": 14.5, "packageName": "Large Parcel", "serviceLevel": "Tracked", "productCode": "3085" }
    ],
    "EUR1": [
      { "maxWeight": 350, "price": 7.6, "packageName": "Letter", "serviceLevel": "Untracked", "productCode": "2940" },
      { "maxWeight": 2000, "price": 9.95, "packageName": "Letterbox", "serviceLevel": "Tracked", "productCode": "3550" },
      { "maxWeight": 2000, "price": 14.5, "packageName": "Small Parcel", "serviceLevel": "Tracked", "productCode": "4945" },
      { "maxWeight": 5000, "price": 19.5, "packageName": "Medium Parcel", "serviceLevel": "Tracked", "productCode": "4945" }
    ],
    "EUR2": [
      { "maxWeight": 350, "price": 7.6, "packageName": "Letter", "serviceLevel": "Untracked", "productCode": "2940" },
      { "maxWeight": 2000, "price": 14.5, "packageName": "Letterbox", "serviceLevel": "Tracked", "productCode": "3550" },
      { "maxWeight": 2000, "price": 20, "packageName": "Small Parcel", "serviceLevel": "Tracked", "productCode": "4945" },
      { "maxWeight": 5000, "price": 26, "packageName": "Medium Parcel", "serviceLevel": "Tracked", "productCode": "4945" }
    ],
    "ROW": [
      { "maxWeight": 350, "price": 7.6, "packageName": "Letter", "serviceLevel": "Untracked", "productCode": "2940" },
      { "maxWeight": 2000, "price": 29.5, "packageName": "Letterbox", "serviceLevel": "Tracked", "productCode": "3530" },
      { "maxWeight": 2000, "price": 31, "packageName": "Small Parcel", "serviceLevel": "Tracked", "productCode": "4950" },
      { "maxWeight": 5000, "price": 38, "packageName": "Medium Parcel", "serviceLevel": "Tracked", "productCode": "4950" }
    ]
  }
};

module.exports = {
  key: 'postnl',
  name: 'PostNL',
  version, // Export the version
  defaultConfig, // Export the default config
  getRates,
  createLabel
};