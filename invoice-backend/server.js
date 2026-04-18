require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const { PDFParse } = require("pdf-parse");
const Groq = require("groq-sdk");
const path = require("path");
const connectDB = require("./config/db");
const Invoice = require("./models/Invoice");

const app = express();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

app.use(cors());
app.use(express.json());

// Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

connectDB();

async function extractInvoiceData(text) {
  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: "Extract structured invoice data in JSON format.",
      },
      {
        role: "user",
        content: `
Extract the following fields:

vendor_name
invoice_number
invoice_date
currency
total_amount
tax_amount
line_items (description, quantity, unit_price, line_total)

Return STRICT JSON:
- Use double quotes
- No single quotes
- No explanation
- No markdown

Invoice text:
${text}
        `,
      },
    ],
  });

  let output = response.choices[0].message.content;

  output = output.replace(/```json/g, "").replace(/```/g, "").trim();


  output = output.replace(/(\w+):/g, '"$1":').replace(/'/g, '"');

  try {
    const parsed = JSON.parse(output);

    return parsed; 
  } catch (err) {
    console.error("JSON parse failed:", output);
    return { error: "Invalid JSON", raw: output };
  }
}

function validateInvoice(data) {
  const requiredFields = [
    "vendor_name",
    "invoice_number",
    "invoice_date",
    "currency",
    "total_amount",
    "tax_amount",
    "line_items",
  ];

  const validatedData = data && typeof data === "object" ? data : {};
  const errors = [];

  if (validatedData.error) {
    errors.push(validatedData.error);
  }

  for (const field of requiredFields) {
    if (
      validatedData[field] === undefined ||
      validatedData[field] === null ||
      validatedData[field] === ""
    ) {
      errors.push(`Missing field: ${field}`);
    }
  }

  const confidence = Math.max(0, requiredFields.length - errors.length) / requiredFields.length;

  return {
    validatedData,
    errors,
    confidence,
  };
}

// Upload API
app.post("/documents", upload.array("files"), async (req, res) => {
  try {
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const results = [];

    for (const file of files) {
      const dataBuffer = fs.readFileSync(file.path);

      const parser = new PDFParse({ data: dataBuffer });
      const pdfData = await parser.getText();
      const structuredData = await extractInvoiceData(pdfData.text);
      const validation = validateInvoice(structuredData);

      console.log("[DB] Saving invoice:", file.filename);
      const savedInvoice = await Invoice.create({
        filename: file.filename,
        file_path: file.path,
        raw_text: pdfData.text,
        structured_data: validation.validatedData,
        validation_errors: validation.errors,
        confidence: validation.confidence,
      });
      console.log("[DB] Saved invoice _id:", savedInvoice._id.toString());

      console.log("Extracted Text:\n", pdfData.text);
      console.log("AI OUTPUT:\n", structuredData);

      results.push({
        id: savedInvoice._id,
        saved: true,
        filename: file.filename,
        structured: validation.validatedData,
        validation_errors: validation.errors,
        confidence: validation.confidence,
      });
    }

    res.json({
      message: "Processed and saved to MongoDB",
      saved_count: results.length,
      results,
    });
  } catch (error) {
    console.error("Document processing failed:", error);
    res.status(500).json({
      message: "Failed to process uploaded invoice PDF(s)",
    });
  }
});

app.get("/documents", async (req, res) => {
  try {
    const invoices = await Invoice.find().sort({ created_at: -1 });

    res.json({
      count: invoices.length,
      data: invoices,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching documents" });
  }
});

app.get("/documents/:id", async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ message: "Not found" });
    }

    res.json(invoice);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching document" });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});