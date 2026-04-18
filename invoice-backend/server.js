const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const app = express();

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

// Upload API
app.post("/documents", upload.array("files"), (req, res) => {
  const files = req.files;

  const fileData = files.map((file) => ({
    filename: file.filename,
    path: file.path,
  }));

  res.json({
    message: "Files uploaded successfully",
    files: fileData,
  });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});