import { useState } from "react";
import UploadPage from "./pages/UploadPage";
import InvoicesPage from "./pages/InvoicesPage";
import InvoiceDetail from "./pages/InvoiceDetail";
import Dashboard from "./pages/Dashboard";

function App() {
  const [activeView, setActiveView] = useState("dashboard");
  const [selectedId, setSelectedId] = useState(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const handleSelectInvoice = (id) => {
    setSelectedId(id);
    setActiveView("detail");
  };

  const handleBackFromDetail = () => {
    setSelectedId(null);
    setActiveView("invoices");
  };

  const handleDataChanged = () => {
    setRefreshToken((value) => value + 1);
  };

  const handleUploadComplete = () => {
    setRefreshToken((value) => value + 1);
    setActiveView("invoices");
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">AI Invoice Document Intelligence System</p>
          <h1>Invoice AI</h1>
          <p className="header-copy">
            Upload PDFs, review extracted data, correct fields, and monitor validation quality.
          </p>
        </div>

        <nav className="app-nav" aria-label="Primary">
          <button
            className={activeView === "dashboard" ? "nav-button active" : "nav-button"}
            onClick={() => setActiveView("dashboard")}
          >
            Dashboard
          </button>
          <button
            className={activeView === "upload" ? "nav-button active" : "nav-button"}
            onClick={() => setActiveView("upload")}
          >
            Upload
          </button>
          <button
            className={activeView === "invoices" ? "nav-button active" : "nav-button"}
            onClick={() => setActiveView("invoices")}
          >
            Invoices
          </button>
        </nav>
      </header>

      <main className="app-main">
        {activeView === "dashboard" ? <Dashboard refreshToken={refreshToken} /> : null}
        {activeView === "upload" ? <UploadPage onUploaded={handleUploadComplete} /> : null}
        {activeView === "invoices" ? (
          <InvoicesPage onSelect={handleSelectInvoice} refreshToken={refreshToken} />
        ) : null}
        {activeView === "detail" && selectedId ? (
          <InvoiceDetail
            id={selectedId}
            onBack={handleBackFromDetail}
            onUpdated={handleDataChanged}
          />
        ) : null}
      </main>
    </div>
  );
}

export default App;