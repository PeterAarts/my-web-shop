// FILE: server/models/PaymentProvider.js

const mongoose = require('mongoose');

const PaymentProviderSchema = new mongoose.Schema({
  name:               { type: String,    required: true,  },
  moduleName:         { type: String,    unique: true,    lowercase: true,  },
  isEnabled:          { type: Boolean,   default: false,  },
  isOnline:           { type: Boolean,   default: true,  },
  mode:               { type: String,    enum: ['sandbox', 'live'],    default: 'sandbox'  },
  credentials:        { 
                          clientId:     { type: String, default: '' },
                          clientSecret: { type: String, default: '' },
                        },  
  instructions:         { type: String,    default: '',  },
  requiresRegistration: { type: Boolean,    default: false, description: "If true, this payment option is only available to logged-in users."  }
}, { timestamps: true });


module.exports = mongoose.model('PaymentProvider', PaymentProviderSchema);
