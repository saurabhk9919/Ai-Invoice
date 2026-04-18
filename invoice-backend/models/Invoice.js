const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema({
  filename: String,
  file_path: String,

  raw_text: String,

  structured_data: Object,

  validation_errors: [String],
  confidence: Number,

  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Invoice", invoiceSchema);