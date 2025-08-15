// File: server/models/Order.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderItemSchema = new Schema({
  productId:  {type: mongoose.Schema.Types.ObjectId,ref: 'Product',required: true},
  name:       {type: String, required: true },
  price:      {type: Number, required: true },
  quantity:   {type: Number, required: true }
}, { _id: false });

// NEW: A sub-schema for individual payment events (payment, refund, status change)
const paymentDetailsSchema = new Schema({
  paymentMethod:      { type: String },
  paymentStatus:      { type: String, required: true, enum: ['pending', 'paid', 'rejected', 'refunded'], default: 'pending' },
  paymentDate:        { type: Date },
  paymentTransactionId: { type: String }
}, { _id: false });

const shippingDetailsSchema = new Schema({
  // NEW: Added shippingMethodId to store the rate ID from the provider
  shippingMethodId:   { type: String, default: '' }, 
  provider:           { type: String, default: '' },
  trackingNumber:     { type: String, default: '' },
  labelUrl:           { type: String, default: '' },
  labelFormat:        { type: String, default: '' },
  shippingMethodName: { type: String, default: '' },
  shippingCost:       { type: Number, default: 0 }
}, { _id: false });  

const orderSchema = new Schema({
  user:             { type: mongoose.Schema.Types.ObjectId,required: false,ref: 'User'},
  orderNumber:      { type: String,required: true,unique: true},
  customerDetails:  {
    name:       { type: String, required: true },
    email:      { type: String, required: true },
    address:    { type: String, required: true }
  },
  items: [orderItemSchema],
  totalAmount:      { type: Number,required: true},
  status:           { type: String,required: true,
    enum: [
      'created', 
      'received', 
      'processing', 
      'ready for shipment', 
      'pending payment', 
      'shipped', 
      'cancelled'
    ],
    default: 'created'
  },
  paymentDetails:       { type: paymentDetailsSchema,default: () => ({})},
  shippingDetails:      { type: shippingDetailsSchema,default: () => ({})},
  reservationExpiresAt: { type: Date},
  viewToken:            { type: String },
  viewTokenExpires:     { type: Date },
  picklistFilename:     { type: String, default: '' },
  active:               { type: Boolean, default: true, index: true }
}, {
  timestamps: true
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;