import { useState } from "react";
import { uploadInvoices } from "../services/api";

function UploadPage({ onUploaded }) {
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [results, setResults] = useState([]);

  const handleFileChange = (event) => {
    setFiles(Array.from(event.target.files || []));
    setMessage("");
    setResults([]);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setMessage("Please choose one or more PDF files.");
      return;
    }

    try {
      setIsUploading(true);
      setMessage("Uploading and processing invoices...");
      setResults([]);

      const response = await uploadInvoices(files);
      const uploadedResults = response.results || [];

      setResults(uploadedResults);
      setMessage(response.message || "Upload complete.");
      setFiles([]);
      onUploaded?.();
    } catch (err) {
      console.error(err);
      setMessage("Upload failed. Please try again.");
      setResults([]);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Upload</p>
          <h2>Upload invoices</h2>
          <p className="page-subtitle">
            Add one PDF or multiple PDFs to extract invoice data automatically.
          </p>
        </div>
      </div>

      <section className="card">
        <div className="upload-controls">
          <label className="file-picker">
            <input
              type="file"
              accept="application/pdf"
              multiple
              onChange={handleFileChange}
            />
            <span>Select PDF files</span>
          </label>

          <button className="button button-primary" onClick={handleUpload} disabled={isUploading}>
            {isUploading ? "Processing..." : "Upload invoices"}
          </button>
        </div>

        <p className="helper-text">
          {files.length > 0 ? `${files.length} file(s) selected` : "No files selected yet"}
        </p>

        {message ? <p className="status-message">{message}</p> : null}

        {files.length > 0 ? (
          <div className="selected-files">
            {files.map((file) => (
              <div key={file.name} className="selected-file-item">
                {file.name}
              </div>
            ))}
          </div>
        ) : null}
      </section>

      {results.length > 0 ? (
        <section className="card section-card">
          <div className="section-header">
            <div>
              <h3>Processing results</h3>
              <p>Structured data returned by the extraction pipeline.</p>
            </div>
          </div>

          <div className="results-grid">
            {results.map((result) => (
              <article key={result.id || result.filename} className="result-card">
                <div className="result-card-header">
                  <strong>{result.filename}</strong>
                  <span className={result.validation_errors?.length ? "badge badge-danger" : "badge badge-success"}>
                    {result.validation_errors?.length ? "Has issues" : "Valid"}
                  </span>
                </div>
                <p className="confidence-line">Confidence: {Number(result.confidence || 0).toFixed(2)}</p>
                <pre className="json-preview">{JSON.stringify(result.structured, null, 2)}</pre>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

export default UploadPage;