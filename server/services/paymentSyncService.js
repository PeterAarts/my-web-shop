// FILE: server/services/paymentSyncService.js

const fs = require('fs');
const path = require('path');
const PaymentProvider = require('../models/PaymentProvider');

const providersDirectory = path.join(__dirname, '../payment-providers');

const syncPaymentProviders = async () => {
  console.log('--- PAYMENT PROVIDER SYNC SERVICE ---');
  
  try {
    const localProviders = [];
    if (!fs.existsSync(providersDirectory)) {
        console.log(` - [SYNC] Directory not found: ${providersDirectory}. Skipping.`);
        return;
    }
    const files = fs.readdirSync(providersDirectory);

    for (const file of files) {
      if (file.endsWith('.js')) {
        const providerModule = require(path.join(providersDirectory, file));
        if (providerModule && providerModule.key && providerModule.name) {
          localProviders.push({
              moduleName: providerModule.key,
              name: providerModule.name,
              isOnline: providerModule.isOnline !== undefined ? providerModule.isOnline : true,
          });
        }
      }
    }

    const dbProviders = await PaymentProvider.find({});
    const dbModuleNames = dbProviders.map(p => p.moduleName);
    const newProviders = localProviders.filter(p => !dbModuleNames.includes(p.moduleName));

    if (newProviders.length > 0) {
      console.log(` - [SYNC] ➕ Found ${newProviders.length} new payment provider(s) to register.`);
      
      const providersToCreate = newProviders.map(p => ({
        name: p.name,
        moduleName: p.moduleName,
        isOnline: p.isOnline,
      }));
      
      await PaymentProvider.insertMany(providersToCreate);
      console.log(' - [SYNC] ✅ New payment provider(s) registered successfully.');
    } else {
      console.log(' - [SYNC] 👍 Payment database is already in sync.');
    }
    console.log('--- SYNC SERVICE COMPLETE ---');

  } catch (error) {
    console.error('❌ FATAL ERROR during payment provider sync:', error);
  }
};

module.exports = { syncPaymentProviders };