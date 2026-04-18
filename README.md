# 🧾 AI Document Intelligence System

## 🚀 Overview

This project is an **AI-powered Document Intelligence System** that processes invoice PDFs, extracts structured data, validates it, and exposes results via APIs and a user interface.

It is designed to handle **real-world invoice variations** including:

- Different layouts  
- Multiple field names (Invoice No, Bill ID, Inv #)  
- Missing fields  
- Multi-page invoices  

---

## 🌐 Live Demo

- 🖥️ Frontend (Main App): https://ai-invoice-1-o100.onrender.com  
- ⚙️ Backend API: https://ai-invoice-g6cp.onrender.com  

### 🔗 Project Repository
- GitHub: https://github.com/saurabhk9919/ai-invoice

## 🎯 Features

### 📥 Document Processing

- Upload single or multiple invoice PDFs  
- Extract raw text from PDFs  
- AI-based structured data extraction using LLM  

### 🧠 AI Extraction

Extract fields:

- vendor_name  
- invoice_number  
- invoice_date  
- currency  
- total_amount  
- tax_amount  
- line_items  

### ✅ Validation Layer

- Validate sum(line_items) ≈ total_amount  
- Normalize date format (ISO)  
- Detect missing fields  
- Generate confidence score  

### 🔁 Reprocessing

Re-run extraction for any invoice using:

```
POST /reprocess/:id
```

### 🗄️ Storage

- Store original PDF  
- Store structured JSON  
- Store validation results & confidence score  
- Store prompt version  

### 🌐 REST APIs

- `POST /documents` → Upload invoice(s)  
- `GET /documents` → List all invoices  
- `GET /documents/:id` → Get invoice details  
- `POST /reprocess/:id` → Reprocess invoice  

### 🖥️ Frontend

- Upload invoices  
- View processed invoices  
- View extracted structured data  
- Display validation errors  
- Show confidence score  
- Manual correction UI (basic)  
- Dashboard (basic metrics)  

---

## 🛠️ Tech Stack

### Backend

- Node.js  
- Express.js  
- MongoDB Atlas (Cloud Database)  
- Mongoose  
- pdf-parse  
- Groq API (LLM)  

### Frontend

- React.js (Vite)  
- Axios  
- CSS (custom styling)  

---

## 📁 Project Structure

```
invoice-ai/
│
├── invoice-backend/
│   ├── models/
│   ├── config/
│   ├── uploads/
│   ├── server.js
│   └── .env
│
├── invoice-frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   └── services/
│   └── package.json
│
└── README.md
```

---

## ⚙️ Setup Instructions

### 1️⃣ Clone Repository

```
git clone <your-repo-link>
cd invoice-ai
```

---

### 2️⃣ Backend Setup

```
cd invoice-backend
npm install
```

#### 🔐 Create `.env` file

```
MONGO_URI=your_mongodb_atlas_connection_string
GROQ_API_KEY=your_groq_api_key
```

#### ▶️ Run Backend

```
npm start
```

Server runs on:

```
http://localhost:5000
```

---

### 3️⃣ Frontend Setup

```
cd invoice-frontend
npm install
npm run dev
```

Frontend runs on:

```
http://localhost:5173
```

---

## 🔌 API Endpoints

### 📤 Upload Invoice

```
POST /documents
```

### 📄 Get All Invoices

```
GET /documents
```

### 📄 Get Single Invoice

```
GET /documents/:id
```

### 🔁 Reprocess Invoice

```
POST /reprocess/:id
```

---

## 📊 Example Output JSON

<img width="992" height="508" alt="image" src="https://github.com/user-attachments/assets/4d04a59e-4e94-47ab-8584-c23cb6b844bb" />


```json
{
  "vendor_name": "DEMO - Sliced Invoices",
  "invoice_number": "INV-3337",
  "invoice_date": "January 25, 2016",
  "currency": "USD",
  "total_amount": 93.5,
  "tax_amount": 8.5,
  "line_items": [
    {
      "description": "Web Design",
      "quantity": 1,
      "unit_price": 85,
      "line_total": 85
    }
  ]
}
```

---

## 🧠 Prompt Versioning

Each extraction stores:

```
prompt_version: "v1"
```

This allows:

- Tracking improvements  
- Reprocessing with updated prompts  

---

## 📈 Dashboard Metrics (Basic)

- Total invoices processed  
- Average confidence score  
- Validation failures count  

---

## 🔮 Future Improvements

- OCR support (Tesseract)  
- Better table parsing  
- Advanced UI with charts  
- Authentication system  
- Deployment (Render / Vercel)  

---

## 👨‍💻 Author

**Saurabh Kashyap**
