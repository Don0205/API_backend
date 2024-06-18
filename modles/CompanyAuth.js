// models/CompanyAuth.js
const mongoose = require('mongoose');

const CompanyAuthSchema = new mongoose.Schema({
  company: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  }
});

module.exports = mongoose.model('CompanyAuth', CompanyAuthSchema);