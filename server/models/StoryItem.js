// FILE: server/models/StoryItem.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const storyItemSchema = new Schema({
  title:      {type: String,required: true,trim: true},
  content:    {type: String,required: true},
  image:      {path: { type: String },text: { type: String }},
  displayLocations: [{type: String,enum: ['front-page','about-page','productdetail-page','checkout-page' ]}],
  startDate:  {type: Date,default: Date.now},
  endDate:    {type: Date,default: null}
}, { timestamps: true });

const StoryItem = mongoose.model('StoryItem', storyItemSchema);

module.exports = StoryItem;
