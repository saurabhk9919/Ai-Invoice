import { useEffect, useMemo, useState } from "react";
import { getInvoices } from "../services/api";

function InvoicesPage({ onSelect, refreshToken }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetchInvoices();
  }, [refreshToken]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getInvoices();
      setInvoices(response.data || []);
    } catch (err) {
      console.error(err);
      setError("Unable to load processed invoices.");
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = useMemo(() => {
    const term = query.trim().toLowerCase();

    if (!term) {
      return invoices;
    }

    return invoices.filter((invoice) => {
      const filenameMatch = invoice.filename?.toLowerCase().includes(term);
      const vendorMatch = invoice.structured_data?.vendor_name?.toLowerCase().includes(term);
      const invoiceNumberMatch = invoice.structured_data?.invoice_number?.toLowerCase().includes(term);
      return filenameMatch || vendorMatch || invoiceNumberMatch;
    });
  }, [invoices, query]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Processed</p>
          <h2>Invoices</h2>
          <p className="page-subtitle">
            Browse all processed invoices and open one to review or correct it.
          </p>
        </div>

        <input
          className="input search-input"
          type="text"
          placeholder="Search by filename, vendor, or invoice number"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      {loading ? <div className="card">Loading invoices...</div> : null}
      {error ? <div className="card error-card">{error}</div> : null}

      {!loading && !error ? (
        <>
          <div className="summary-row">
            <span className="summary-pill">Total: {filteredInvoices.length}</span>
            <span className="summary-pill">Showing: {filteredInvoices.length}</span>
          </div>

          {filteredInvoices.length === 0 ? (
            <div className="card empty-state">No invoices found.</div>
          ) : (
            <div className="invoice-list">
              {filteredInvoices.map((invoice) => (
                <button
                  key={invoice._id}
                  className="invoice-row"
                  onClick={() => onSelect(invoice._id)}
                >
                  <div>
                    <strong>{invoice.filename}</strong>
                    <div className="row-subtitle">
                      {invoice.structured_data?.vendor_name || "Unknown vendor"}
                      {invoice.structured_data?.invoice_number
                        ? ` • ${invoice.structured_data.invoice_number}`
                        : ""}
                    </div>
                  </div>

                  <div className="row-meta">
                    <span className="badge badge-neutral">
                      Confidence {Number(invoice.confidence || 0).toFixed(2)}
                    </span>
                    <span className={invoice.validation_errors?.length ? "badge badge-danger" : "badge badge-success"}>
                      {invoice.validation_errors?.length ? `${invoice.validation_errors.length} issues` : "Validated"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

export default InvoicesPage;