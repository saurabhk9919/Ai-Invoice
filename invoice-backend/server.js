require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const { PDFParse } = require("pdf-parse");
const Groq = require("groq-sdk");
const path = require("path");

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

      console.log("Extracted Text:\n", pdfData.text);
      console.log("AI OUTPUT:\n", structuredData);

      results.push({
        filename: file.filename,
        raw_text: pdfData.text.substring(0, 200),
        structured: structuredData,
      });
    }

    res.json({
      message: "Processed",
      results,
    });
  } catch (error) {
    console.error("Document processing failed:", error);
    res.status(500).json({
      message: "Failed to process uploaded invoice PDF(s)",
    });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});