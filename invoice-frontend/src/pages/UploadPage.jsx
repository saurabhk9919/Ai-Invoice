import { useState } from "react";

function UploadPage() {
  const [files, setFiles] = useState([]);

  const handleFileChange = (e) => {
    setFiles([...e.target.files]);
  };

  const handleUpload = () => {
    console.log("Files to upload:", files);
  
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

      <button onClick={handleUpload}>
        Upload
      </button>

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