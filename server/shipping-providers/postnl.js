// FILE: server/shipping-providers/postnl.js
// This provider is now a simple rate-lookup module.

/**
 * Creates a shipping label by calling the external PostNL API.
 * @param {object} order - The full order object from your database.
 * @param {string} productCode - The PostNL product code for the chosen shipping method.
 * @param {object} providerConfig - The provider's configuration from the database (contains apiUrl, credentials).
 * @returns {Promise<object>} A promise that resolves to an object with { trackingNumber, labelData }.
 */
async function createLabel(order, productCode, providerConfig) {
  // 1. Map your order data to the PostNL API's expected format.
  // This is an example; you will need to map your actual order address fields.
  const postnlPayload = {
    Customer: {
      CustomerCode: providerConfig.credentials.customerCode, // Assumes you add these to the model
      CustomerNumber: providerConfig.credentials.customerNumber,
      CollectionLocation: providerConfig.credentials.collectionLocation,
      Address: { /* Your sender address details */ }
    },
    Message: {
      MessageID: "1",
      Printertype: "GraphicFile|PDF"
    },
    Shipments: [
      {
        Addresses: [
          {
            AddressType: "01", // Recipient address
            FirstName: order.shippingAddress.firstName,
            Name: order.shippingAddress.lastName,
            Street: order.shippingAddress.street,
            HouseNr: order.shippingAddress.houseNumber,
            Zipcode: order.shippingAddress.zipCode,
            City: order.shippingAddress.city,
            Countrycode: order.shippingAddress.countryCode
          }
        ],
        Dimension: { Weight: order.totalWeight }, // Assumes totalWeight is on the order
        ProductCodeDelivery: productCode,
        Reference: order._id.toString() // Use your internal order ID as the reference
      }
    ]
  };

  const payloadString = JSON.stringify(postnlPayload);
  const { hostname, pathname } = new URL(providerConfig.apiUrl);

  const options = {
    hostname: hostname,
    path: pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payloadString),
      'apikey': providerConfig.credentials.apiKey
    }
  };

  // 2. Use the built-in `https` module to make the API call, wrapped in a Promise.
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => {
        responseBody += chunk;
      });

      res.on('end', () => {
        try {
          const responseJson = JSON.parse(responseBody);
          if (res.statusCode === 200 && responseJson.ResponseShipments) {
            // 3. On success, parse the response and return a standardized object.
            const shipment = responseJson.ResponseShipments[0];
            resolve({
              trackingNumber: shipment.Barcode,
              labelData: shipment.Labels[0].Content // This is the Base64 encoded PDF
            });
          } else {
            // On API error, reject with the details.
            reject(new Error(`PostNL API Error (${res.statusCode}): ${responseBody}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse PostNL API response: ${e.message}`));
        }
      });
    });

    req.on('error', (e) => {
      // Handle network errors
      reject(new Error(`Network request failed: ${e.message}`));
    });

    // Write the payload to the request and send it.
    req.write(payloadString);
    req.end();
  });
}


/**
 * Finds the correct shipping rate from a pre-defined rate table.
 * This version selects only the single cheapest "Tracked" and "Untracked" option overall.
 * @param {object} address - The destination address (to determine the zone).
 * @param {Array<object>} fittingPackages - An array of package objects that fit the order.
 * @param {number} totalWeight - The total weight of the order in grams.
 * @param {object} providerConfig - The configuration for this provider from the database.
 * @returns {Promise<Array>} A promise that resolves to the filtered list of rate objects.
 */
async function getRates(address, fittingPackages, totalWeight, providerConfig) {
  // 1. Define Shipping Zones
  const ZONES = {
    EUR1: ['BE', 'DE', 'DK','FR', 'IT', 'LU', 'ES','SE', 'AT'],
    EUR2: ['FI', 'IE', 'PL', 'PT', 'GB','NO', 'CZ', 'HU', 'SK', 'SI', 'HR', 'RO', 'BG', 'LT', 'LV', 'EE'],
  };

  // 2. Determine the Shipping Zone from the address
  let zoneKey = 'ROW'; // Default to Rest of World
  if (address.countryCode === 'NL') {
    zoneKey = 'NL';
  } else if (ZONES.EUR1.includes(address.countryCode.toUpperCase())) {
    zoneKey = 'EUR1';
  } else if (ZONES.EUR2.includes(address.countryCode.toUpperCase())) {
    zoneKey = 'EUR2';
  }

  // 3. Look up the rates for the determined zone
  const zoneRates = providerConfig.rateCard[zoneKey];
  if (!zoneRates || zoneRates.length === 0) {
    return []; // No rates are defined for this zone
  }

  // 4. Find ALL rates that match ANY of the fitting packages and can handle the weight
  const fittingPackageNames = new Set(fittingPackages.map(p => p.name));
  const allMatchingRates = zoneRates.filter(rate => {
    const isCorrectPackage = fittingPackageNames.has(rate.packageName);
    const isSufficientWeight = totalWeight <= rate.maxWeight;
    return isCorrectPackage && isSufficientWeight;
  });

  if (allMatchingRates.length === 0) {
    return [];
  }

  // 5. Find the single cheapest tracked and untracked options from ALL possibilities
  const finalRates = [];
  
  const allUntracked = allMatchingRates.filter(r => r.serviceLevel === 'Untracked').sort((a, b) => a.price - b.price);
  const allTracked = allMatchingRates.filter(r => r.serviceLevel === 'Tracked').sort((a, b) => a.price - b.price);

  if (allUntracked.length > 0) {
    finalRates.push(allUntracked[0]); // Add the absolute cheapest untracked option
  }
  if (allTracked.length > 0) {
    finalRates.push(allTracked[0]); // Add the absolute cheapest tracked option
  }

  // 6. Format the final list for the client
  return finalRates.map(rate => ({
    id: `${providerConfig.moduleName}-${zoneKey}-${rate.productCode}-${rate.serviceLevel}`,
    name: `${providerConfig.name} - ${rate.packageName} (${rate.serviceLevel})  < ${rate.maxWeight}g`,
    price: rate.price
  }));
}
/**
 * Provides metadata about this shipping provider.
 * This function is called at server startup to sync with the database.
 * @returns {object} An object containing the provider's registration details.
 */
function register() {
  return {
    name: 'PostNL', // The user-friendly name
    moduleName: 'postnl', // The unique key linking to this file
    usesApiForRates: false, // This provider uses a local rate table
  };
}

const defaultRates = {
  "NL": [
    { "maxWeight": 20,    "price": 1.21,  "packageName": "Letter Small",  "serviceLevel": "Untracked",  "productCode": "2928" },
    { "maxWeight": 50,    "price": 2.42,  "packageName": "Letter Small",  "serviceLevel": "Untracked",  "productCode": "2928" },
    { "maxWeight": 350,   "price": 3.92,  "packageName": "Letter Small",  "serviceLevel": "Untracked",  "productCode": "2928" },
    { "maxWeight": 2000,  "price": 4.25,  "packageName": "Letterbox",     "serviceLevel": "Tracked",    "productCode": "2928" },
    { "maxWeight": 10000, "price": 7.95,  "packageName": "Medium Parcel", "serviceLevel": "Tracked",    "productCode": "3085" },
    { "maxWeight": 23000, "price": 14.50, "packageName": "Large Parcel",  "serviceLevel": "Tracked",    "productCode": "3085" }
  ],
  "EUR1": [
    { "maxWeight": 20,    "price": 1.90,  "packageName": "Letter",       "serviceLevel": "Untracked",  "productCode": "2928" },
    { "maxWeight": 50,    "price": 3.80,  "packageName": "Letter",       "serviceLevel": "Untracked",  "productCode": "2928" },
    { "maxWeight": 100,   "price": 5.70,  "packageName": "Letter",       "serviceLevel": "Untracked",  "productCode": "2928" },
    { "maxWeight": 350,   "price": 7.60,  "packageName": "Letter",       "serviceLevel": "Untracked",  "productCode": "2928" },
    { "maxWeight": 2000,  "price": 9.80,  "packageName": "Letterbox",     "serviceLevel": "Untracked",  "productCode": "2940" },
    { "maxWeight": 2000,  "price": 12.00, "packageName": "Letterbox",     "serviceLevel": "Tracked",    "productCode": "3550" },
    { "maxWeight": 2000,  "price": 14.50, "packageName": "Small Parcel",  "serviceLevel": "Tracked",    "productCode": "4945" },
    { "maxWeight": 5000,  "price": 19.50, "packageName": "Medium Parcel", "serviceLevel": "Tracked",    "productCode": "4945" },
    { "maxWeight": 10000, "price": 25.00, "packageName": "Medium Parcel", "serviceLevel": "Tracked",    "productCode": "4945" }
  ],
  "EUR2": [
    { "maxWeight": 20,    "price": 1.90,  "packageName": "Letter",       "serviceLevel": "Untracked",  "productCode": "2928" },
    { "maxWeight": 50,    "price": 3.80,  "packageName": "Letter",       "serviceLevel": "Untracked",  "productCode": "2928" },
    { "maxWeight": 100,   "price": 5.70,  "packageName": "Letter",       "serviceLevel": "Untracked",  "productCode": "2928" },
    { "maxWeight": 350,   "price": 7.60,  "packageName": "Letter",       "serviceLevel": "Untracked",  "productCode": "2928" },
    { "maxWeight": 2000,  "price": 9.80,  "packageName": "Letterbox",     "serviceLevel": "Untracked",  "productCode": "2940" },
    { "maxWeight": 2000,  "price": 14.50, "packageName": "Letterbox",     "serviceLevel": "Tracked",    "productCode": "3550" },
    { "maxWeight": 2000,  "price": 20.00, "packageName": "Small Parcel",  "serviceLevel": "Tracked",    "productCode": "4945" },
    { "maxWeight": 5000,  "price": 26.00, "packageName": "Medium Parcel", "serviceLevel": "Tracked",    "productCode": "4945" },
    { "maxWeight": 10000, "price": 32.00, "packageName": "Medium Parcel", "serviceLevel": "Tracked",    "productCode": "4945" }
  ],
  "ROW": [
    { "maxWeight": 20,    "price": 1.90,  "packageName": "Letter",       "serviceLevel": "Untracked",  "productCode": "2928" },
    { "maxWeight": 50,    "price": 3.80,  "packageName": "Letter",       "serviceLevel": "Untracked",  "productCode": "2928" },
    { "maxWeight": 100,   "price": 5.70,  "packageName": "Letter",       "serviceLevel": "Untracked",  "productCode": "2928" },
    { "maxWeight": 350,   "price": 7.60,  "packageName": "Letter",       "serviceLevel": "Untracked",  "productCode": "2928" },
    { "maxWeight": 2000,  "price": 9.80,  "packageName": "Letterbox",     "serviceLevel": "Untracked",  "productCode": "2940" },
    { "maxWeight": 2000,  "price": 12.00, "packageName": "Letterbox",     "serviceLevel": "Tracked",    "productCode": "3550" },
    { "maxWeight": 2000,  "price": 19.00, "packageName": "Letterbox",     "serviceLevel": "Untracked",  "productCode": "2940" },
    { "maxWeight": 2000,  "price": 29.50, "packageName": "Letterbox",     "serviceLevel": "Tracked",    "productCode": "3530" },
    { "maxWeight": 2000,  "price": 31.00, "packageName": "Small Parcel",  "serviceLevel": "Tracked",    "productCode": "4950" },
    { "maxWeight": 5000,  "price": 38.00, "packageName": "Medium Parcel", "serviceLevel": "Tracked",    "productCode": "4950" },
    { "maxWeight": 10000, "price": 62.00, "packageName": "Medium Parcel", "serviceLevel": "Tracked",    "productCode": "4950" }
  ]
};
 
module.exports = {
  key: 'postnl',
  name: 'PostNL',
  getRates,createLabel 
};
