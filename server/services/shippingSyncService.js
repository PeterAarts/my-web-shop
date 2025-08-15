// FILE: server/services/shippingSyncService.js

const fs = require('fs');
const path = require('path');
const semver = require('semver'); // NEW: Import the version comparison library
const ShippingProvider = require('../models/ShippingProvider');

const providersDirectory = path.join(__dirname, '../shipping-providers');

const syncShippingProviders = async () => {
  console.log('--- SHIPPING PROVIDER SYNC SERVICE (v2) ---');
  
  try {
    // 1. Scan local provider files for their full configuration
    const localProviders = [];
    if (!fs.existsSync(providersDirectory)) {
        console.log(`[SYNC] Directory not found: ${providersDirectory}. Skipping.`);
        return;
    }
    const files = fs.readdirSync(providersDirectory);

    for (const file of files) {
      if (file.endsWith('.js')) {
        try {
          const providerModule = require(path.join(providersDirectory, file));
          // Ensure the module exports all necessary parts for the sync to work
          if (providerModule && providerModule.key && providerModule.name && providerModule.version && providerModule.defaultConfig) {
            localProviders.push(providerModule);
          }
        } catch (e) { console.log(`[SYNC] Error loading ${file}: ${e.message}`); }
      }
    }

    // 2. Get all providers from the database to compare against
    const dbProviders = await ShippingProvider.find({});
    const dbProviderMap = new Map(dbProviders.map(p => [p.moduleName, p]));

    // 3. Iterate through each local provider file and decide whether to create or update
    for (const local of localProviders) {
      const dbProvider = dbProviderMap.get(local.key);

      if (!dbProvider) {
        // --- Case 1: New Provider Found ---
        console.log(`[SYNC] ➕ Registering new provider: ${local.name} (v${local.version})`);
        const newProviderData = {
          moduleName: local.key,
          name: local.name,
          version: local.version,
          ...local.defaultConfig
        };
        await ShippingProvider.create(newProviderData);

      } else if (semver.gt(local.version, dbProvider.version)) {
        // --- Case 2: Newer Version Found in File ---
        console.log(`[SYNC] ⬆️ Updating provider ${local.name} from v${dbProvider.version} to v${local.version}`);
        
        // This is a "smart update". It overwrites defaults but preserves user settings.
        const updatedConfig = {
          ...local.defaultConfig, // Start with the new defaults from the file
          isEnabled: dbProvider.isEnabled, // Keep the user's enabled/disabled choice
          activeEnvironment: dbProvider.activeEnvironment, // Keep the user's active env choice
          version: local.version // Set the new version number
        };
        
        // Carefully merge credentials so users don't have to re-enter their API keys.
        updatedConfig.environments.forEach(newEnv => {
          const oldEnv = dbProvider.environments.find(e => e.name === newEnv.name);
          if (oldEnv) {
            // If an environment with the same name existed, keep its credentials
            newEnv.credentials = oldEnv.credentials;
          }
        });

        await ShippingProvider.updateOne({ _id: dbProvider._id }, updatedConfig);
      }
    }
    
    console.log('[SYNC] 👍 Sync service complete.');

  } catch (error) {
    console.error('❌ FATAL ERROR during shipping provider sync:', error);
  }
};

module.exports = { syncShippingProviders };
