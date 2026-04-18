import { useState } from "react";
import UploadPage from "./pages/UploadPage";
import InvoicesPage from "./pages/InvoicesPage";
import InvoiceDetail from "./pages/InvoiceDetail";

function App() {
  const [selectedId, setSelectedId] = useState(null);

  return (
    <div>
      <h1>Invoice AI System</h1>

      <UploadPage />

      {!selectedId ? (
        <InvoicesPage onSelect={setSelectedId} />
      ) : (
        <InvoiceDetail
          id={selectedId}
          onBack={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}

export default App;