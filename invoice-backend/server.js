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

const uploadDir = process.env.UPLOAD_DIR || "uploads";

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
}));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

connectDB();

async function extractInvoiceData(text) {
  const PROMPT_VERSION = "v1";

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

    return {
      data: parsed,
      prompt_version: PROMPT_VERSION,
    };
  } catch (err) {
    console.error("JSON parse failed:", output);
    return {
      data: { error: "Invalid JSON", raw: output },
      prompt_version: PROMPT_VERSION,
    };
  }
}

function toNumber(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.-]/g, "").trim();
    if (!cleaned) {
      return null;
    }
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) {
    return date.toISOString().slice(0, 10);
  }

  const ddmmyyyy = /^([0-3]?\d)[/.-]([0-1]?\d)[/.-](\d{4})$/;
  const match = String(value).trim().match(ddmmyyyy);
  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const normalized = new Date(Date.UTC(year, month - 1, day));

  if (
    normalized.getUTCFullYear() !== year ||
    normalized.getUTCMonth() !== month - 1 ||
    normalized.getUTCDate() !== day
  ) {
    return null;
  }

  return normalized.toISOString().slice(0, 10);
}

function normalizeLineItems(lineItems) {
  if (!Array.isArray(lineItems)) {
    return [];
  }

  return lineItems.map((item) => {
    const quantity = toNumber(item?.quantity);
    const unitPrice = toNumber(item?.unit_price);
    const lineTotal = toNumber(item?.line_total);

    const calculatedLineTotal =
      lineTotal !== null
        ? lineTotal
        : quantity !== null && unitPrice !== null
          ? Number((quantity * unitPrice).toFixed(2))
          : null;

    return {
      description: item?.description || "",
      quantity,
      unit_price: unitPrice,
      line_total: calculatedLineTotal,
    };
  });
}

function calculateLineItemsTotal(lineItems) {
  return lineItems.reduce((sum, item) => {
    return sum + (item.line_total ?? 0);
  }, 0);
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

  const validatedData = data && typeof data === "object" ? { ...data } : {};
  const errors = [];

  if (validatedData.error) {
    errors.push(validatedData.error);
  }

  validatedData.total_amount = toNumber(validatedData.total_amount);
  validatedData.tax_amount = toNumber(validatedData.tax_amount);

  const normalizedDate = normalizeDate(validatedData.invoice_date);
  if (validatedData.invoice_date && !normalizedDate) {
    errors.push("Invalid field: invoice_date format");
  }
  validatedData.invoice_date = normalizedDate || validatedData.invoice_date || "";

  validatedData.line_items = normalizeLineItems(validatedData.line_items);

  for (const field of requiredFields) {
    if (
      validatedData[field] === undefined ||
      validatedData[field] === null ||
      validatedData[field] === ""
    ) {
      errors.push(`Missing field: ${field}`);
    }
  }

  if (Array.isArray(validatedData.line_items) && validatedData.line_items.length > 0) {
    const lineItemsTotal = calculateLineItemsTotal(validatedData.line_items);
    if (validatedData.total_amount !== null) {
      const difference = Math.abs(lineItemsTotal - validatedData.total_amount);
      const tolerance = Math.max(0.01, Math.abs(validatedData.total_amount) * 0.02);
      if (difference > tolerance) {
        errors.push(
          `Line item total mismatch: line_items=${lineItemsTotal.toFixed(2)}, total_amount=${validatedData.total_amount.toFixed(2)}`
        );
      }
    }
  }

  const totalChecks = requiredFields.length + 2;
  const confidence = Math.max(0, (totalChecks - errors.length) / totalChecks);

  const extractionSuccess = errors.length === 0;

  return {
    validatedData,
    errors,
    confidence,
    extractionSuccess,
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
      const processingStartedAt = Date.now();
      const dataBuffer = fs.readFileSync(file.path);

      const parser = new PDFParse({ data: dataBuffer });
      const pdfData = await parser.getText();
      const result = await extractInvoiceData(pdfData.text);
      const structuredData = result.data;
      const promptVersion = result.prompt_version;
      const validation = validateInvoice(structuredData);
      const processingTimeMs = Date.now() - processingStartedAt;

      console.log("[DB] Saving invoice:", file.filename);
      const savedInvoice = await Invoice.create({
        filename: file.filename,
        file_path: file.path,
        raw_text: pdfData.text,
        structured_data: validation.validatedData,
        validation_errors: validation.errors,
        confidence: validation.confidence,
        extraction_success: validation.extractionSuccess,
        processing_time_ms: processingTimeMs,
        prompt_version: promptVersion,
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
        extraction_success: validation.extractionSuccess,
        processing_time_ms: processingTimeMs,
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

app.put("/documents/:id", async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ message: "Not found" });
    }

    const {
      structured_data,
      validation_errors,
      confidence,
      raw_text,
      prompt_version,
    } = req.body;

    if (structured_data !== undefined) {
      invoice.structured_data = structured_data;
    }

    if (validation_errors !== undefined) {
      invoice.validation_errors = validation_errors;
    }

    if (confidence !== undefined) {
      invoice.confidence = confidence;
    }

    if (raw_text !== undefined) {
      invoice.raw_text = raw_text;
    }

    if (prompt_version !== undefined) {
      invoice.prompt_version = prompt_version;
    }

    await invoice.save();

    res.json({
      message: "Invoice updated successfully",
      data: invoice,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating document" });
  }
});

app.post("/reprocess/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await Invoice.findById(id);

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const dataBuffer = fs.readFileSync(invoice.file_path);
    const processingStartedAt = Date.now();

    const parser = new PDFParse({ data: dataBuffer });
    const pdfData = await parser.getText();

    const result = await extractInvoiceData(pdfData.text);
    const structuredData = result.data;

    const validation = validateInvoice(structuredData);
    const processingTimeMs = Date.now() - processingStartedAt;

    invoice.raw_text = pdfData.text;
    invoice.structured_data = validation.validatedData;
    invoice.validation_errors = validation.errors;
    invoice.confidence = validation.confidence;
    invoice.extraction_success = validation.extractionSuccess;
    invoice.processing_time_ms = processingTimeMs;
    invoice.prompt_version = result.prompt_version;

    await invoice.save();

    res.json({
      message: "Reprocessed successfully",
      data: invoice,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Reprocess failed" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});