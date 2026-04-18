import { useEffect, useState } from "react";
import { getInvoices } from "../services/api";

function Dashboard({ refreshToken }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, [refreshToken]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getInvoices();
      setInvoices(response.data || []);
    } catch (err) {
      console.error(err);
      setError("Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  const totalInvoices = invoices.length;
  const failedValidations = invoices.filter(
    (invoice) => (invoice.validation_errors?.length || 0) > 0
  ).length;
  const extractionSuccessCount = invoices.filter((invoice) => invoice.extraction_success).length;
  const extractionSuccessRate = totalInvoices
    ? ((extractionSuccessCount / totalInvoices) * 100).toFixed(1)
    : "0.0";
  const averageConfidence = totalInvoices
    ? (
        invoices.reduce((sum, invoice) => sum + (Number(invoice.confidence) || 0), 0) /
        totalInvoices
      ).toFixed(2)
    : "0.00";
  const averageProcessingTime = totalInvoices
    ? (
        invoices.reduce(
          (sum, invoice) => sum + (Number(invoice.processing_time_ms) || 0),
          0
        ) / totalInvoices
      ).toFixed(0)
    : "0";

  const validationIssues = invoices.filter(
    (invoice) => (invoice.validation_errors?.length || 0) > 0
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Monitoring</p>
          <h2>Dashboard</h2>
          <p className="page-subtitle">
            Basic processing health and validation status for the invoice pipeline.
          </p>
        </div>
      </div>

      {loading ? <div className="card">Loading dashboard...</div> : null}
      {error ? <div className="card error-card">{error}</div> : null}

      {!loading && !error ? (
        <>
          <div className="metrics-grid">
            <article className="metric-card">
              <span className="metric-label">Total invoices processed</span>
              <strong className="metric-value">{totalInvoices}</strong>
            </article>

            <article className="metric-card">
              <span className="metric-label">Average confidence score</span>
              <strong className="metric-value">{averageConfidence}</strong>
            </article>

            <article className="metric-card">
              <span className="metric-label">Failed validations</span>
              <strong className="metric-value">{failedValidations}</strong>
            </article>

            <article className="metric-card">
              <span className="metric-label">Avg processing time</span>
              <strong className="metric-value">{averageProcessingTime} ms</strong>
            </article>

            <article className="metric-card">
              <span className="metric-label">Extraction success rate</span>
              <strong className="metric-value">{extractionSuccessRate}%</strong>
            </article>
          </div>

          <section className="card section-card">
            <div className="section-header">
              <div>
                <h3>Error Report</h3>
                <p>Validation issues grouped by invoice.</p>
              </div>
            </div>

            {validationIssues.length === 0 ? (
              <div className="empty-state">No validation errors found.</div>
            ) : (
              <div className="error-report-list">
                {validationIssues.map((invoice) => (
                  <article key={invoice._id} className="error-report-item">
                    <div className="error-report-top">
                      <strong>{invoice.filename}</strong>
                      <span className="badge badge-danger">
                        {invoice.validation_errors.length} issue
                        {invoice.validation_errors.length === 1 ? "" : "s"}
                      </span>
                    </div>
                    <ul className="clean-list">
                      {invoice.validation_errors.map((errorText, index) => (
                        <li key={index} className="error-line">
                          {errorText}
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}

export default Dashboard;
