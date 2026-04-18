import { useEffect, useState } from "react";
import axios from "axios";

function InvoiceDetail({ id, onBack }) {
  const [invoice, setInvoice] = useState(null);

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/documents/${id}`
      );
      setInvoice(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReprocess = async () => {
    try {
      await axios.post(`http://localhost:5000/reprocess/${id}`);
      alert("Reprocessed!");
      fetchInvoice();
    } catch (err) {
      console.error(err);
    }
  };

  if (!invoice) return <p>Loading...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <button onClick={onBack}>Back</button>
      <button onClick={handleReprocess}>Reprocess</button>

      <h2>Invoice Detail</h2>

      <pre>
        {JSON.stringify(invoice.structured_data, null, 2)}
      </pre>

      <h3>Validation Errors</h3>
      {invoice.validation_errors.length === 0 ? (
        <p>No errors</p>
      ) : (
        <ul>
          {invoice.validation_errors.map((err, i) => (
            <li key={i}>{err}</li>
          ))}
        </ul>
      )}

      <p>Confidence: {invoice.confidence}</p>
    </div>
  );
}

export default InvoiceDetail;