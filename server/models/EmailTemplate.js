const mongoose = require('mongoose');

const EmailTemplateSchema = new mongoose.Schema({
  name:       {type: String,required: true,trim: true,description: "A human-readable name for the admin panel, e.g., 'Order Confirmation'"},
  slug:       {type: String,required: true,unique: true,trim: true,description: "A unique identifier used in the code, e.g., 'order-confirmation'"},
  subject:    {type: String,required: true,description: "The email subject line. Can contain EJS variables, e.g., 'Order Confirmation for order #<%= orderId %>'"},
  body:       {type: String,required: true,description: "The full EJS/HTML content of the email."},
  isActive:   {type: Boolean,default: true}
}, { timestamps: true });

module.exports = mongoose.model('EmailTemplate', EmailTemplateSchema);