// FILE: server/models/ShippingProvider.js

const mongoose = require('mongoose');

const ShippingProviderSchema = new mongoose.Schema({
  name: { // The user-friendly name, e.g., "PostNL"
    type: String,
    required: true,
  },
  moduleName: { // The unique key linking to the file, e.g., "postnl"
    type: String,
    unique: true,
    lowercase: true,
    default: 'new-provider',
  },
  isEnabled: { // The admin can toggle this provider on/off
    type: Boolean,
    default: false,
  },
  usesApiForRates: { // True if rates are fetched live, false if using the 'rates' table
    type: Boolean,
    default: false,
  },
  apiUrl: { // URL for label generation or live rate fetching
    type: String,
    default: '',
  },
  credentials: {
    apiKey: { type: String, default: '' },
    apiSecret: { type: String, default: '' },
    customerCode: { type: String, default: '' },
    customerNumber: { type: String, default: '' },
    collectionLocation: { type: String, default: '' },
  },
  rateCard: { 
    type: Object,  
    default: {
          "NL": [
            { "maxWeight": 2000, "price": 4.95, "packageName": "Letterbox", "serviceLevel": "Tracked", "productCode": "2928" },
            { "maxWeight": 10000, "price": 7.95, "packageName": "Medium Parcel", "serviceLevel": "Tracked", "productCode": "3085" },
            { "maxWeight": 23000, "price": 14.50, "packageName": "Large Parcel", "serviceLevel": "Tracked", "productCode": "3085" }
          ]}
  }
}, { timestamps: true });

// ADDED: Mongoose pre-save hook for new documents.
// This is a more robust way to ensure default objects are created.
ShippingProviderSchema.pre('save', function(next) {
  // If this is a new document and the 'rates' field has not been set,
  // initialize it as an empty object before saving.
  if (this.isNew && !this.rates) {
    this.rates = {};
  }
  next();
});

module.exports = mongoose.model('ShippingProvider', ShippingProviderSchema);
