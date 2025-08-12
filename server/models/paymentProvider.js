// FILE: server/models/PaymentProvider.js

const mongoose = require('mongoose');

const PaymentProviderSchema = new mongoose.Schema({
  name: { // User-friendly name, e.g., "PayPal"
    type: String,
    required: true,
  },
  moduleName: { // Unique key linking to the file, e.g., "paypal"
    type: String,
    unique: true,
    lowercase: true,
  },
  isEnabled: { // Admin can toggle this provider on/off for the checkout
    type: Boolean,
    default: false,
  },
  isOnline: { // True for API-based payments (PayPal), false for offline (Bank Transfer)
    type: Boolean,
    default: true,
  },
  mode: { // To switch between 'sandbox' and 'live' environments
    type: String,
    enum: ['sandbox', 'live'],
    default: 'sandbox',
  },
  credentials: {
    clientId: { type: String, default: '' },
    clientSecret: { type: String, default: '' },
  },
  instructions: { // For displaying bank details or other manual payment info
    type: String,
    default: '',
  },
  requiresRegistration: {
    type: Boolean,
    default: false,
    description: "If true, this payment option is only available to logged-in users."
  }
}, { timestamps: true });

module.exports = mongoose.model('PaymentProvider', PaymentProviderSchema);