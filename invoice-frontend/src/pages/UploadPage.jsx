import { useState } from "react";
import axios from "axios";

function UploadPage() {
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [results, setResults] = useState([]);

  const handleFileChange = (e) => {
    setFiles([...e.target.files]);
    setStatusMessage("");
    setResults([]);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setStatusMessage("Please select at least one PDF file before uploading.");
      return;
    }

    const formData = new FormData();

    files.forEach((file) => {
      formData.append("files", file);
    });

    try {
      setIsUploading(true);
      setStatusMessage("");

      const res = await axios.post("http://localhost:5000/documents", formData);

      console.log(res.data);
      setStatusMessage(res.data?.message || "Upload successful.");
      setResults(res.data?.results || []);
      setFiles([]);
    } catch (err) {
      console.error(err);
      setStatusMessage("Upload failed. Please try again.");
      setResults([]);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Upload Invoices</h2>

      <input
        type="file"
        multiple
        accept="application/pdf"
        onChange={handleFileChange}
      />

      <br /><br />

      <button onClick={handleUpload} disabled={isUploading}>
        {isUploading ? "Uploading..." : "Upload"}
      </button>

      {statusMessage ? <p>{statusMessage}</p> : null}

      {results.length > 0 ? (
        <div>
          <h3>Extracted Text Preview</h3>
          <ul>
            {results.map((result) => (
              <li key={result.filename}>
                <strong>{result.filename}</strong>
                <div>{result.text}</div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div>
        <h3>Selected Files:</h3>
        <ul>
          {files.map((file, index) => (
            <li key={index}>{file.name}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default UploadPage;