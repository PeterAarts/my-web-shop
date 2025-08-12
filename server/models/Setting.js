// FILE: server/models/Setting.js
// This model holds global shop settings, including the sender address.

const mongoose = require('mongoose');

// This is the schema for a reusable address block
const AddressSchema = new mongoose.Schema({
  name: { type: String, required: true },
  street: { type: String, required: true },
  zipCode: { type: String, required: true },
  city: { type: String, required: true },
  countryCode: { type: String, required: true, uppercase: true, trim: true, maxlength: 2 }, // e.g., NL
}, { _id: false });

const PackageDefinitionSchema = new mongoose.Schema({
  name: { type: String, required: true },       // e.g., "Letterbox"
  length: { type: Number, required: true },    // in cm
  width: { type: Number, required: true },     // in cm
  height: { type: Number, required: true },    // in cm
  maxWeight: { type: Number, required: true }, // in grams
}, { _id: false });



const settingsSchema = new mongoose.Schema({
  shopTitle:                { type: String, default: 'My Custom Shop' },
  shopSubtitle:             { type: String, default: '' },
  headerImageUrl:           { type: String, default: '' },
  faviconUrl:               { type: String, default: '' },
  instagramUrl:             { type: String, default: '' },
  facebookUrl:              { type: String, default: '' },
  twitterUrl:               { type: String, default: '' },
  shopRemark:               { type: String, default: '' },
  footerText:               { type: String, default: '' },
  productsPerRow:           { type: Number, default: 4 },
  rowsPerPage:              { type: Number, default: 0 },
  enableStockLimit:         { type: Boolean, default: false },
  hideOutOfStockProducts:   { type: Boolean, default: true },
  hideExpiredProducts:      { type: Boolean, default: true },
  allowShopRegistration:    { type: Boolean, default: true }, 
  businessDetails: {
    bankAccountName:         { type: String, default: '' },
    bankAccountNumber:       { type: String, default: '' },
    bic:                     { type: String, default: '' },
    chamberOfCommerceNumber: { type: String, default: '' },
    vatNumber:               { type: String, default: '' },
    payPalEmail:             { type: String, default: '' }
  },
  productSettings: {
    skuGeneration:  {type: String,enum: ['manual', 'automatic'],default: 'manual',},
    skuPrefix:      {type: String,trim: true,default: 'ITEM-',},
    skuNextNumber:  {type: Number,default: 10001,}
  },
  // --- LAYOUT FIELDS ---
  pageLayout: { type: String, enum: ['full-width', 'contained'], default: 'contained' },
  contentMaxWidth: { type: Number, default: 1300 },

  // --- THEME COLOR FIELDS ---
  siteBackgroundColor: { type: String, default: '#D3D3E2' },
  siteTextColor: { type: String, default: '#212529' },
  primaryColor: { type: String, default: '#9D9DCC' },
  secondaryColor:{ type: String, default: '#444444'},
  cardBackgroundColor: { type: String, default: '#ffffff' },
  productBackgroundColor: { type: String, default: '#ffffff' },


  // Display options
  showProductDescription: { type: Boolean, default: true },
  showProductPrice: { type: Boolean, default: true }, 
  showProductImage: { type: Boolean, default: true },
  showProductAddToCart: { type: Boolean, default: true },
  showProductCategory: { type: Boolean, default: true },
  showProductTags: { type: Boolean, default: true },
  showProductRating: { type: Boolean, default: false },  
  showProductStock: { type: Boolean, default: true },
  showProductReviews: { type: Boolean, default: false },
  showProductSearch: { type: Boolean, default: false },  
  showProductFilter: { type: Boolean, default: true },
  showProductSort: { type: Boolean, default: false },  
  showProductPagination: { type: Boolean, default: true },
  showProductDimensions: { type: Boolean, default: true },

  archiveOrdersDays: { type: Number, default: 30 },
  archiveOrdersStatuses: { type: [String], default: ['shipped', 'cancelled'] },
  
  // --- Shop Address for Shipping ---
  shopAddress: {
    type: AddressSchema,
  },
  shippingPackages: {
      type: [PackageDefinitionSchema],
      default: [
          { name: 'Letterbox', length: 38, width: 26.5, height: 3.2, maxWeight: 2000 },
          { name: 'Small Parcel', length: 34, width: 28, height: 12, maxWeight: 3000 },
          { name: 'Medium Parcel', length: 100, width: 50, height: 50, maxWeight: 10000 },
      ]
  },
  // Payment settings
  bankTransferReservationDays: {type: Number,default: 7}

});


// Helper function to easily get the single settings document
settingsSchema.statics.getSingleton = async function () {
  return this.findOne();
};

module.exports = mongoose.model('Setting', settingsSchema);