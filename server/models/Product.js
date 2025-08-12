// File: server/models/Product.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const imageSchema = new Schema({
  path: {type: String,required: true},
  text: {type: String,trim: true,default: ''}
}, { _id: false });

const productSchema = new Schema({
  name:          {type: String,required: true,trim: true,unique: true},
  sku:           {type: String, required: true, unique: true, trim: true },
  description:   {type: String,required: true},
  price:         {type: Number,required: true,min: 0},
  stockQuantity: {type: Number,required: true,min: 0,default: 0},
  images: [imageSchema],
  stockLimit: { type: Number, default: 0 },
  category: { type: String, trim: true },
  tags: [{ type: String, trim: true }], 
  weight: {type: Number,required: true},
  dimensions: {
    length: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true }
  },
  expiresAt: {type: Date,default: null},
  active: { type: Boolean, default: true, index: true }
}, {
  timestamps: true
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
