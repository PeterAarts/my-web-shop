// FILE: server/services/shippingSyncService.js (MODIFIED)
// This service scans for local provider files and syncs them with the database.

const fs = require('fs');
const path = require('path');
const ShippingProvider = require('../models/ShippingProvider');

const providersDirectory = path.join(__dirname, '../shipping-providers');

const syncShippingProviders = async () => {
  console.log('--- SHIPPING PROVIDER SYNC SERVICE ---');
  
  try {
    // 1. Scan for local provider files
    const localProviders = [];
    if (!fs.existsSync(providersDirectory)) {
        console.log(` - [SYNC] Directory not found: ${providersDirectory}. Skipping.`);
        return;
    }
    const files = fs.readdirSync(providersDirectory);
    console.log(` - [SYNC] Found ${files.length} files in provider directory: [${files.join(', ')}]`);

    for (const file of files) {
      if (file.endsWith('.js')) {
        try {
            const providerModule = require(path.join(providersDirectory, file));
            
            // Check for the required properties in the provider file
            if (providerModule && providerModule.key && providerModule.name) {
              console.log(` - [SYNC]   ✔️ Valid provider found in ${file}: Key='${providerModule.key}'`);
              localProviders.push({
                  moduleName: providerModule.key,
                  name: providerModule.name,
                  // Read the default rate-fetching method from the provider file
                  usesApiForRates: providerModule.usesApiForRates || false, 
              });
            } else {
              console.log(` - [SYNC]   ⚠️  Skipping ${file}: Does not export 'key' and 'name'.`);
            }
        } catch (e) { console.log(` - [SYNC]   ❌ Error loading ${file}: ${e.message}`); }
      }
    }

    // 2. Compare with database
    const dbProviders = await ShippingProvider.find({});
    const dbModuleNames = dbProviders.map(p => p.moduleName);
    console.log(` - [SYNC] Found ${dbProviders.length} providers in database: [${dbModuleNames.join(', ')}]`);

    const newProviders = localProviders.filter(p => !dbModuleNames.includes(p.moduleName));

    if (newProviders.length > 0) {
      console.log(` - [SYNC] ➕ Found ${newProviders.length} new provider(s) to register: [${newProviders.map(p => p.name).join(', ')}]`);
      
      // CORRECTED: This object now includes all necessary fields to match the model,
      // preventing validation errors.
      const providersToCreate = newProviders.map(p => ({
        name: p.name,
        moduleName: p.moduleName,
        usesApiForRates: p.usesApiForRates,
        isEnabled: false
      }));

      console.log(' - [SYNC] 📝 Attempting to insert these documents:');
      console.log(JSON.stringify(providersToCreate, null, 2));

      try {
        await ShippingProvider.insertMany(providersToCreate);
        console.log(' - [SYNC] ✅ New provider(s) registered successfully.');
      } catch (dbError) {
        console.error('- [SYNC] ❌ DATABASE ERROR during insertMany:', dbError);
      }

    } else {
      console.log(' - [SYNC] 👍 Database is already in sync with local provider files.');
    }
    console.log('--- SYNC SERVICE COMPLETE ---');

  } catch (error) {
    console.error('❌ FATAL ERROR during shipping provider sync:', error);
  }
};

module.exports = { syncShippingProviders };
