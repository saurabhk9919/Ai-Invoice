import { useEffect, useState } from "react";
import axios from "axios";

function InvoicesPage({ onSelect }) {
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await axios.get("http://localhost:5000/documents");
      setInvoices(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Processed Invoices</h2>

      {invoices.length === 0 ? (
        <p>No invoices yet</p>
      ) : (
        <ul>
          {invoices.map((inv) => (
            <li
              key={inv._id}
              style={{ cursor: "pointer", marginBottom: "10px" }}
              onClick={() => onSelect(inv._id)}
            >
              <strong>{inv.filename}</strong> <br />
              Confidence: {inv.confidence}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default InvoicesPage;