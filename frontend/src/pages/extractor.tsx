import React, { useState, useCallback } from "react";
import { Globe, Download, FolderOpen } from "lucide-react";
import Papa from "papaparse";
import { useDropzone } from "react-dropzone";
import Modal from "../components/Modal";
import AlertToast from "../components/AlertToast";
import LoadingSpinner from "../components/LoadingSpinner";
import { Listbox } from "@headlessui/react";

interface ExtractedEmail {
  email: string;
  domain: string;
  site: string;
}

const PAGE_SIZE = 20;

export default function Extractor() {
  // Textarea pour sites web (extraction simple)
  const [textarea, setTextarea] = useState("");
  // Upload pour bulk extract
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [urlCol, setUrlCol] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<"error" | "success" | "info">(
    "error"
  );
  const [toastMessage, setToastMessage] = useState("");
  // Résultats bulk extract
  const [bulkResults, setBulkResults] = useState<ExtractedEmail[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState("");
  const [bulkPage, setBulkPage] = useState(1);

  // Résultats extraction simple (textarea)
  const [simpleResults, setSimpleResults] = useState<ExtractedEmail[]>([]);
  const [simpleLoading, setSimpleLoading] = useState(false);
  const [simpleError, setSimpleError] = useState("");

  // Upload CSV/TXT pour bulk extract
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setBulkError("");
    setData([]);
    setColumns([]);
    setUrlCol("");
    const f = acceptedFiles[0];
    if (!f) return;
    if (
      !["text/csv", "text/plain", "application/vnd.ms-excel"].includes(
        f.type
      ) &&
      !f.name.endsWith(".csv") &&
      !f.name.endsWith(".txt")
    ) {
      setFile(null);
      setToastType("error");
      setToastMessage(
        "Unsupported file type. Please upload a CSV or TXT file."
      );
      setShowToast(true);
      return;
    }
    setFile(f);
    Papa.parse(f, {
      header: true,
      skipEmptyLines: true,
      complete: (results: any) => {
        const previewRows = results.data.slice(0, 5);
        const fields = results.meta.fields || [];
        // Check for at least one valid URL in any column
        let found = false;
        for (const row of previewRows) {
          for (const col of fields) {
            if ((row[col] || "").toString().trim().startsWith("http")) {
              found = true;
              break;
            }
          }
          if (found) break;
        }
        if (!found) {
          setToastType("error");
          setToastMessage("Aucune URL valide trouvée dans le fichier.");
          setShowToast(true);
          setData([]);
          setColumns([]);
          setUrlCol("");
          return;
        }
        setData(previewRows);
        setColumns(fields);
        setUrlCol(fields?.[0] || "");
        setShowModal(true); // Open modal after valid file upload
      },
      error: () => {
        setToastType("error");
        setToastMessage("Error parsing the file.");
        setShowToast(true);
      },
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"], "text/plain": [".txt"] },
    multiple: false,
  });

  function handleSelectUrlCol(col: string) {
    const hasValid = data.some((row) =>
      (row[col] || "").toString().trim().startsWith("http")
    );
    if (!hasValid) {
      setToastType("error");
      setToastMessage("Aucune URL valide trouvée dans cette colonne.");
      setShowToast(true);
      return;
    }
    setUrlCol(col);
  }

  // Extraction simple (textarea)
  const handleSimpleExtract = async () => {
    setSimpleError("");
    setSimpleResults([]);
    setSimpleLoading(true);
    const lines = textarea
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const urls = lines.filter((l) => l.startsWith("http"));
    if (urls.length === 0) {
      setSimpleError("Aucune URL valide trouvée.");
      setSimpleLoading(false);
      return;
    }
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3009/api";
    const allResults: ExtractedEmail[] = [];
    for (const site of urls) {
      try {
        const response = await fetch(`${apiUrl}/extract`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ website: site }),
        });
        if (!response.ok) continue;
        const data = await response.json();
        if (data.emails && Array.isArray(data.emails)) {
          for (const em of data.emails) {
            allResults.push({ ...em, site });
          }
        }
      } catch (e) {
        // ignore erreur pour ce site
      }
    }
    setSimpleResults(allResults);
    setSimpleLoading(false);
  };

  // Extraction bulk (upload)
  const handleBulkExtract = async () => {
    setBulkError("");
    setBulkResults([]);
    setBulkLoading(true);
    setBulkPage(1);
    if (!file || !urlCol) {
      setBulkError("Veuillez sélectionner un fichier et la colonne URL.");
      setBulkLoading(false);
      return;
    }
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("websiteCol", urlCol);
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3009/api";
      const response = await fetch(`${apiUrl}/bulk-extract`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Erreur lors de l'extraction");
      const data = await response.json();
      setBulkResults(data.results || []);
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setBulkLoading(false);
    }
  };

  // Pagination bulk
  const totalBulkPages = Math.ceil(bulkResults.length / PAGE_SIZE);
  const pagedBulkResults = bulkResults.slice(
    (bulkPage - 1) * PAGE_SIZE,
    bulkPage * PAGE_SIZE
  );

  // Téléchargement CSV bulk
  const downloadBulkResults = () => {
    if (!bulkResults || bulkResults.length === 0) return;
    const csvContent = [
      "email,domain,site",
      ...bulkResults.map((r) => `${r.email},${r.domain},${r.site}`),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk_extracted_emails.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <main className="flex-1 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Extraction d'Emails depuis des Sites
          </h1>
          <p className="text-gray-400">
            Collez vos URLs de sites ou uploadez un fichier, puis lancez
            l'extraction.
          </p>
        </div>

        {/* Extraction simple (textarea) */}
        <div className="bg-background-card rounded-xl p-6 border border-border mb-6">
          <label className="block text-white mb-2">
            Collez vos URLs de sites (une par ligne) :
          </label>
          <textarea
            value={textarea}
            onChange={(e) => setTextarea(e.target.value)}
            rows={6}
            className="input-field w-full mb-4"
            placeholder="https://site1.com\nhttps://site2.com"
          />
          <div className="flex justify-end">
            <button
              className="btn-primary"
              onClick={handleSimpleExtract}
              disabled={simpleLoading}
            >
              {simpleLoading ? "Extraction en cours..." : "Extraire"}
            </button>
          </div>
          {simpleError && (
            <div className="text-red-400 text-sm mt-2">{simpleError}</div>
          )}
        </div>

        {/* Résultats extraction simple */}
        {simpleResults && simpleResults.length > 0 && (
          <div className="mt-8">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-semibold text-white">
                Résultats (Extraction simple)
              </h2>
              <button
                onClick={() => {
                  const csvContent = [
                    "email,domain,site",
                    ...simpleResults.map(
                      (r) => `${r.email},${r.domain},${r.site}`
                    ),
                  ].join("\n");
                  const blob = new Blob([csvContent], { type: "text/csv" });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "simple_extracted_emails.csv";
                  a.click();
                  window.URL.revokeObjectURL(url);
                }}
                className="btn-secondary flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Télécharger CSV
              </button>
            </div>
            <div className="overflow-x-auto rounded-lg border border-border bg-background-card">
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-primary">Email</th>
                    <th className="px-4 py-2 text-left text-primary">
                      Domaine
                    </th>
                    <th className="px-4 py-2 text-left text-primary">Site</th>
                  </tr>
                </thead>
                <tbody>
                  {simpleResults.map((r, i) => (
                    <tr
                      key={i}
                      className={
                        i % 2 === 0 ? "bg-background-card" : "bg-muted"
                      }
                    >
                      <td className="px-4 py-2 text-gray-300">{r.email}</td>
                      <td className="px-4 py-2 text-gray-400">{r.domain}</td>
                      <td className="px-4 py-2 text-gray-400">{r.site}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Upload fichier CSV/TXT pour bulk extract */}
        <div className="bg-background-card rounded-xl p-6 border border-border mb-6">
          <h2 className="text-lg font-semibold text-white mb-2">
            Upload fichier (.csv, .txt) contenant des URLs
          </h2>
          <div
            {...getRootProps()}
            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl transition-colors duration-200 cursor-pointer mb-4 h-32 w-full
              border-gray-400 bg-muted
              ${isDragActive ? "border-primary bg-background" : ""}`}
          >
            <input {...getInputProps()} />
            <FolderOpen className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-gray-300 font-medium">
              {file ? file.name : "Sélectionnez un fichier"}
            </span>
            <span className="text-xs text-gray-500 mt-1">
              Glissez-déposez ou cliquez pour sélectionner
            </span>
          </div>
        </div>

        {/* Modal pour sélection colonne URL */}
        <Modal
          open={showModal}
          onClose={() => {
            setShowModal(false);
            setFile(null);
            setData([]);
            setColumns([]);
            setUrlCol("");
          }}
          title="Sélectionnez la colonne URL"
        >
          <div>
            <label className="block mb-1 text-white">
              Sélectionnez la colonne contenant les URLs :
            </label>
            <Listbox value={urlCol} onChange={handleSelectUrlCol}>
              <div className="relative">
                <Listbox.Button className="input-field w-full cursor-pointer text-left pl-3">
                  {urlCol || "Sélectionnez une colonne"}
                </Listbox.Button>
                <Listbox.Options className="absolute z-10 mt-1 w-full bg-background-card border border-primary rounded-lg shadow-lg max-h-60 overflow-auto">
                  {columns.map((col) => (
                    <Listbox.Option
                      key={col}
                      value={col}
                      className={({ active, selected }) =>
                        `px-4 py-2 text-left cursor-pointer ${
                          active ? "bg-primary/20 text-primary" : "text-white"
                        } ${selected ? "bg-primary/40" : ""}`
                      }
                    >
                      {col}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </div>
            </Listbox>
            <div className="overflow-y-auto hide-scrollbar max-h-56 rounded-lg shadow border border-border bg-background-card mt-2">
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    {columns.map((col) => (
                      <th
                        key={col}
                        onClick={() => handleSelectUrlCol(col)}
                        className={
                          (col === urlCol
                            ? "bg-primary/10 text-primary border-b-2 border-primary "
                            : "bg-background-card text-gray-400 border-b border-border ") +
                          "px-4 py-2 text-left whitespace-nowrap overflow-hidden text-ellipsis max-w-xs cursor-pointer select-none transition-colors duration-150 hover:bg-primary/20"
                        }
                      >
                        <span className="flex items-center gap-1">
                          {col}
                          {col === urlCol && (
                            <svg
                              className="w-4 h-4 text-primary"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, i) => (
                    <tr
                      key={i}
                      className={
                        i % 2 === 0 ? "bg-background-card" : "bg-muted"
                      }
                    >
                      {columns.map((col) => (
                        <td
                          key={col}
                          className={
                            (col === urlCol
                              ? "bg-primary/10 text-primary border-b-2 border-primary "
                              : "bg-background-card text-gray-400 border-b border-border ") +
                            "px-4 py-2 text-left whitespace-nowrap overflow-hidden text-ellipsis max-w-xs"
                          }
                        >
                          {row[col]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowModal(false);
                  setFile(null);
                  setData([]);
                  setColumns([]);
                  setUrlCol("");
                }}
                type="button"
              >
                Annuler
              </button>
              <button
                className="btn-primary"
                onClick={handleBulkExtract}
                type="button"
                disabled={!urlCol || bulkLoading}
              >
                Extraire
              </button>
            </div>
          </div>
        </Modal>

        {/* Résultats bulk extract paginés */}
        {bulkLoading && <LoadingSpinner text="Extraction en cours..." />}
        {bulkError && (
          <div className="text-red-400 text-sm mt-2">{bulkError}</div>
        )}
        {bulkResults && bulkResults.length > 0 && (
          <div className="mt-8">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-semibold text-white">
                Résultats (Bulk Extract)
              </h2>
              <button
                onClick={downloadBulkResults}
                className="btn-secondary flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Télécharger CSV
              </button>
            </div>
            <div className="overflow-x-auto rounded-lg border border-border bg-background-card">
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-primary">Email</th>
                    <th className="px-4 py-2 text-left text-primary">
                      Domaine
                    </th>
                    <th className="px-4 py-2 text-left text-primary">Site</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedBulkResults.map((r, i) => (
                    <tr
                      key={i}
                      className={
                        i % 2 === 0 ? "bg-background-card" : "bg-muted"
                      }
                    >
                      <td className="px-4 py-2 text-gray-300">{r.email}</td>
                      <td className="px-4 py-2 text-gray-400">{r.domain}</td>
                      <td className="px-4 py-2 text-gray-400">{r.site}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {totalBulkPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-4">
                <button
                  className="btn-secondary px-3 py-1"
                  onClick={() => setBulkPage((p) => Math.max(1, p - 1))}
                  disabled={bulkPage === 1}
                >
                  Précédent
                </button>
                <span className="text-white">
                  Page {bulkPage} / {totalBulkPages}
                </span>
                <button
                  className="btn-secondary px-3 py-1"
                  onClick={() =>
                    setBulkPage((p) => Math.min(totalBulkPages, p + 1))
                  }
                  disabled={bulkPage === totalBulkPages}
                >
                  Suivant
                </button>
              </div>
            )}
          </div>
        )}

        {showToast && (
          <AlertToast
            type={toastType}
            message={toastMessage}
            onClose={() => setShowToast(false)}
          />
        )}
      </div>
    </main>
  );
}
