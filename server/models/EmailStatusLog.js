const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema({
  orderId:          { type: mongoose.Schema.Types.ObjectId,ref: 'Order',},
  orderNumber:      { type: String,},
  recipient:        { type: String, required: true },
  subject:          { type: String, required: true },
  templateSlug:     { type: String, required: true },
  status:           { type: String, required: true,enum: ['sent', 'failed'],},
  errorMessage: { type: String }, // Will only exist if status is 'failed'
}, { timestamps: true });

module.exports = mongoose.model('EmailLog', emailLogSchema);