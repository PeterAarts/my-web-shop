// FILE: server/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const AddressSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  street: { type: String, trim: true },
  city: { type: String, trim: true },
  postalCode: { type: String, trim: true },
  countryCode: { type: String, trim: true },
}, { _id: false });

const UserSchema = new mongoose.Schema({
  username:           {type: String,required: true,unique: true,trim: true,},
  email:              {type: String,required: true,unique: true,lowercase: true,trim: true,},
  password:           {type: String,required: true,select: false,},
  role:               {type: String,enum: ['customer', 'reviewer', 'admin'],default: 'customer',},
  shippingAddress:    {type: AddressSchema,default: null},
  isVerified:         {type: Boolean,default: false,},
  newsletterSubscribed: {type: Boolean,default: false,},
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
}, { timestamps: true });

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to generate email verification token
UserSchema.methods.generateVerificationToken = function() {
  const token = crypto.randomBytes(20).toString('hex');
  this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return token;
};

// Method to generate password reset token
UserSchema.methods.generatePasswordResetToken = function() {
  const token = crypto.randomBytes(20).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  this.passwordResetExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
  return token;
};

module.exports = mongoose.model('User', UserSchema);