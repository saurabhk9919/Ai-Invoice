const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema({
  filename: String,
  file_path: String,

  raw_text: String,

  structured_data: Object,
  prompt_version: String,

  validation_errors: [String],
  confidence: Number,
  extraction_success: Boolean,
  processing_time_ms: Number,

  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Invoice", invoiceSchema);