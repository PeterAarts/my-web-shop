// FILE: server/models/ShippingProvider.js

const mongoose = require('mongoose');

// NEW: A sub-schema for a single environment's configuration
const EnvironmentSchema = new mongoose.Schema({
  name: { type: String, required: true, enum: ['production', 'sandbox'], default: 'production' },
  apiUrl: { type: String, default: '' },
  credentials: {
    apiKey:             { type: String, default: '' },
    apiSecret:          { type: String, default: '' },
    customerCode:       { type: String, default: '' },
    customerNumber:     { type: String, default: '' },
    collectionLocation: { type: String, default: '' },
  }
}, { _id: false });


const ShippingProviderSchema = new mongoose.Schema({
  name:           { type: String, required: true  },
  description:    { type: String, default: '' },
  logoUrl:        { type: String, default: '' },
  moduleName:     { type: String, unique: true, lowercase: true, default: 'new-provider' },
  isEnabled:      { type: Boolean, default: true },
  usesApiForRates:{ type: Boolean, default: false },
  
  activeEnvironment: { type: String, enum: ['production', 'sandbox'], default: 'production' },
  environments: { type: [EnvironmentSchema], default: () => ([{ name: 'production' }, { name: 'sandbox' }]) },
  version: { type: String, default: '1.0.0' },
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

ShippingProviderSchema.pre('save', function(next) {
  if (this.isNew && !this.rates) {
    this.rates = {};
  }
  next();
});

module.exports = mongoose.model('ShippingProvider', ShippingProviderSchema);
