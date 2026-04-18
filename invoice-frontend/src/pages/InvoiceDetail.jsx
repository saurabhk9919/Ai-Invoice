import { useEffect, useMemo, useState } from "react";
import { getInvoice, reprocessInvoice, updateInvoice } from "../services/api";

const emptyForm = {
  vendor_name: "",
  invoice_number: "",
  invoice_date: "",
  currency: "",
  total_amount: "",
  tax_amount: "",
  line_items: "[]",
};

const fieldLabels = {
  vendor_name: "Vendor name",
  invoice_number: "Invoice number",
  invoice_date: "Invoice date",
  currency: "Currency",
  total_amount: "Total amount",
  tax_amount: "Tax amount",
};

function toFormState(data) {
  return {
    vendor_name: data?.vendor_name || "",
    invoice_number: data?.invoice_number || "",
    invoice_date: data?.invoice_date || "",
    currency: data?.currency || "",
    total_amount: data?.total_amount ?? "",
    tax_amount: data?.tax_amount ?? "",
    line_items: JSON.stringify(data?.line_items || [], null, 2),
  };
}

function getValidationErrors(structuredData) {
  const requiredFields = [
    "vendor_name",
    "invoice_number",
    "invoice_date",
    "currency",
    "total_amount",
    "tax_amount",
    "line_items",
  ];

  return requiredFields.reduce((errors, field) => {
    const value = structuredData[field];

    if (
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)
    ) {
      errors.push(`Missing field: ${field}`);
    }

    return errors;
  }, []);
}

function InvoiceDetail({ id, onBack, onUpdated }) {
  const [invoice, setInvoice] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      setMessage("");
      const response = await getInvoice(id);
      setInvoice(response);
      setFormData(toFormState(response.structured_data));
    } catch (err) {
      console.error(err);
      setMessage("Unable to load invoice detail.");
    } finally {
      setLoading(false);
    }
  };

  const structuredPreview = useMemo(() => {
    const lineItems = (() => {
      try {
        return JSON.parse(formData.line_items || "[]");
      } catch {
        return [];
      }
    })();

    return {
      vendor_name: formData.vendor_name,
      invoice_number: formData.invoice_number,
      invoice_date: formData.invoice_date,
      currency: formData.currency,
      total_amount: formData.total_amount,
      tax_amount: formData.tax_amount,
      line_items: lineItems,
    };
  }, [formData]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage("");

      let parsedLineItems = [];
      try {
        parsedLineItems = JSON.parse(formData.line_items || "[]");
      } catch {
        setMessage("Line items must be valid JSON.");
        return;
      }

      const structured_data = {
        vendor_name: formData.vendor_name.trim(),
        invoice_number: formData.invoice_number.trim(),
        invoice_date: formData.invoice_date.trim(),
        currency: formData.currency.trim(),
        total_amount: formData.total_amount,
        tax_amount: formData.tax_amount,
        line_items: parsedLineItems,
      };

      const validation_errors = getValidationErrors(structured_data);
      const confidence = validation_errors.length
        ? Math.max(0, (7 - validation_errors.length) / 7)
        : 1;

      const response = await updateInvoice(id, {
        structured_data,
        validation_errors,
        confidence,
      });

      setInvoice(response.data);
      setFormData(toFormState(response.data.structured_data));
      setMessage("Corrections saved successfully.");
      onUpdated?.();
    } catch (err) {
      console.error(err);
      setMessage("Unable to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleReprocess = async () => {
    try {
      setSaving(true);
      setMessage("");
      await reprocessInvoice(id);
      fetchInvoice();
      setMessage("Reprocessed successfully.");
      onUpdated?.();
    } catch (err) {
      console.error(err);
      setMessage("Reprocess failed.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="page"><div className="card">Loading invoice...</div></div>;
  }

  if (!invoice) {
    return <div className="page"><div className="card">Invoice not found.</div></div>;
  }

  const validationErrors = invoice.validation_errors || [];
  const confidence = Number(invoice.confidence || 0).toFixed(2);

  return (
    <div className="page">
      <div className="page-header detail-header">
        <div>
          <p className="eyebrow">Invoice Detail</p>
          <h2>{invoice.filename}</h2>
          <p className="page-subtitle">
            Review extracted values, correct them manually, or reprocess the original PDF.
          </p>
        </div>

        <div className="header-actions">
          <button className="button button-secondary" onClick={onBack}>
            Back
          </button>
          <button className="button button-secondary" onClick={handleReprocess} disabled={saving}>
            Reprocess
          </button>
          <button className="button button-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save corrections"}
          </button>
        </div>
      </div>

      {message ? <div className="card status-banner">{message}</div> : null}

      <div className="detail-grid">
        <section className="card section-card">
          <div className="section-header">
            <div>
              <h3>Structured fields</h3>
              <p>Edit extracted invoice data below.</p>
            </div>
          </div>

          <div className="form-grid">
            {Object.keys(fieldLabels).map((field) => (
              <label key={field} className="field">
                <span>{fieldLabels[field]}</span>
                <input
                  className="input"
                  type="text"
                  name={field}
                  value={formData[field]}
                  onChange={handleChange}
                />
              </label>
            ))}

            <label className="field field-full">
              <span>Line items (JSON)</span>
              <textarea
                className="textarea"
                name="line_items"
                rows="12"
                value={formData.line_items}
                onChange={handleChange}
              />
            </label>
          </div>
        </section>

        <section className="card section-card">
          <div className="section-header">
            <div>
              <h3>Monitoring</h3>
              <p>Confidence and validation status for this invoice.</p>
            </div>
          </div>

          <div className="metrics-grid metrics-grid-single">
            <article className="metric-card">
              <span className="metric-label">Confidence score</span>
              <strong className="metric-value">{confidence}</strong>
            </article>
          </div>

          <div className="mini-summary">
            <div>
              <span className="mini-label">Prompt version</span>
              <strong>{invoice.prompt_version || "-"}</strong>
            </div>
            <div>
              <span className="mini-label">Status</span>
              <strong>{validationErrors.length ? "Needs review" : "Validated"}</strong>
            </div>
          </div>

          <div className="section-divider" />

          <h4 className="subsection-title">Validation errors</h4>
          {validationErrors.length === 0 ? (
            <div className="empty-state">No validation errors.</div>
          ) : (
            <ul className="error-list">
              {validationErrors.map((error, index) => (
                <li key={index} className="error-item">
                  {error}
                </li>
              ))}
            </ul>
          )}

          <div className="section-divider" />

          <h4 className="subsection-title">Preview</h4>
          <pre className="json-preview compact">{JSON.stringify(structuredPreview, null, 2)}</pre>
        </section>
      </div>
    </div>
  );
}

export default InvoiceDetail;