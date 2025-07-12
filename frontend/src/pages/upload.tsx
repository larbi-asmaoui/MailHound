import React, { useState, useRef, useCallback } from "react";
import { useRouter } from "next/router";

// @ts-ignore
import Papa from "papaparse";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Download,
  FolderOpen,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { Listbox } from "@headlessui/react";
import Modal from "../components/Modal";
import AlertToast from "../components/AlertToast";
import LoadingSpinner from "../components/LoadingSpinner";
import TypeCategories from "@/components/TypeCategories";

interface JobStatus {
  status: "pending" | "processing" | "done" | "failed";
  progress: number;
  total: number;
  processed: number;
  valid: number;
  risky: number;
  invalid: number;
}

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [emailCol, setEmailCol] = useState<string>("");
  const [background, setBackground] = useState(false);
  const [error, setError] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<"error" | "success" | "info">(
    "error"
  );
  const [toastMessage, setToastMessage] = useState("");
  const [showProgressModal, setShowProgressModal] = useState(false);

  // Helper: simple email regex
  function isValidEmail(email: string) {
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  }

  // Nouvelle fonction pour sélectionner une colonne et vérifier son contenu
  function handleSelectEmailCol(col: string) {
    // Vérifie si la colonne contient au moins un email valide
    const hasValid = data.some((row) =>
      isValidEmail((row[col] || "").toString().trim())
    );
    if (!hasValid) {
      setToastType("error");
      setToastMessage(
        "Emails error: you must provide at least one valid email address"
      );
      setShowToast(true);
      return;
    }
    setEmailCol(col);
  }

  // Dropzone logic
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError("");
    setData([]);
    setColumns([]);
    setEmailCol("");
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
        // Check for at least one valid email in any column
        let found = false;
        for (const row of previewRows) {
          for (const col of fields) {
            if (isValidEmail((row[col] || "").toString().trim())) {
              found = true;
              break;
            }
          }
          if (found) break;
        }
        if (!found) {
          setToastType("error");
          setToastMessage(
            "Emails error: you must provide at least one valid email address"
          );
          setShowToast(true);
          setData([]);
          setColumns([]);
          setEmailCol("");
          return;
        }
        setData(previewRows);
        setColumns(fields);
        setEmailCol(fields?.[0] || "");
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
    disabled: verifying,
  });

  // Start bulk verification: send file/config to backend, handle async job
  const handleStart = async () => {
    setError("");
    setJobId(null);
    setJobStatus(null);
    setResultUrl(null);
    setVerifying(true);
    if (!file || !emailCol) {
      setError("Please select a file and the email column.");
      setVerifying(false);
      return;
    }
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("emailCol", emailCol);
      formData.append("background", background ? "true" : "false");
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3009/api";
      const res = await fetch(`${apiUrl}/bulk-verify`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Server error during upload");
      const data = await res.json();
      if (data.jobId) {
        // Rediriger vers la page de résultats
        router.push(`/results/${data.jobId}`);
      } else {
        setError("No job ID returned from server");
        setVerifying(false);
        setShowProgressModal(false);
      }
    } catch (err: any) {
      setError(err.message || "Network error");
      setVerifying(false);
      setShowProgressModal(false);
    }
  };

  // Poll job status for async jobs
  // const pollJobStatus = (jobId: string, apiUrl: string) => {
  //   if (pollingRef.current) clearInterval(pollingRef.current);
  //   pollingRef.current = setInterval(async () => {
  //     try {
  //       const res = await fetch(`${apiUrl}/bulk-verify/${jobId}/status`);
  //       if (!res.ok) throw new Error("Failed to get job status");
  //       const status = await res.json();
  //       setJobStatus(status);
  //       if (status.status === "done" || status.status === "failed") {
  //         clearInterval(pollingRef.current!);
  //         setVerifying(false);
  //         setShowProgressModal(false);
  //         if (status.status === "done") {
  //           setResultUrl(`${apiUrl}/bulk-verify/${jobId}/result`);
  //         } else {
  //           setError("Bulk verification failed.");
  //         }
  //       }
  //     } catch (err) {
  //       setError("Error polling job status");
  //       setVerifying(false);
  //       setShowProgressModal(false);
  //       clearInterval(pollingRef.current!);
  //     }
  //   }, 2000);
  // };

  // Cleanup polling on unmount
  // React.useEffect(() => {
  //   return () => {
  //     if (pollingRef.current) clearInterval(pollingRef.current);
  //   };
  // }, []);

  // Handler for Validate in modal
  const handleValidate = () => {
    setShowModal(false);
    setShowProgressModal(true);
    handleStart();
  };

  const reset = () => {
    setFile(null);
    setData([]);
    setColumns([]);
    setEmailCol("");
    // setBackground(false);
  };

  React.useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">
        Bulk Email Verification
      </h1>
      <div className="bg-background-card rounded-xl border border-border shadow p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">
          Upload a file (.csv, .txt)
        </h2>
        {/* Dropzone area */}
        <div
          {...getRootProps()}
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl transition-colors duration-200 cursor-pointer mb-4 h-40 w-full
            border-gray-400 bg-muted
            ${isDragActive ? "border-primary bg-background" : ""}
            ${verifying ? "opacity-60 pointer-events-none" : ""}`}
        >
          <input {...getInputProps()} />
          <FolderOpen className="w-10 h-10 text-gray-400 mb-2" />
          <span className="text-gray-300 font-medium">
            {file ? file.name : "Select a file"}
          </span>
          <span className="text-xs text-gray-500 mt-1">
            Drag & drop or click to select
          </span>
        </div>
        {error && <div className="text-red-400 mb-2">{error}</div>}
        {/* Modal for column mapping and preview */}
        <Modal
          open={showModal}
          onClose={() => {
            setShowModal(false);
            reset();
          }}
          title="Select Email Column"
        >
          <div>
            <label className="block mb-1 text-white">
              Select the email column:
            </label>
            <Listbox value={emailCol} onChange={handleSelectEmailCol}>
              <div className="relative">
                <Listbox.Button className="input-field w-full cursor-pointer text-left pl-3">
                  {emailCol || "Select column"}
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
                        onClick={() => handleSelectEmailCol(col)}
                        className={
                          (col === emailCol
                            ? "bg-primary/10 text-primary border-b-2 border-primary "
                            : "bg-background-card text-gray-400 border-b border-border ") +
                          "px-4 py-2 text-left whitespace-nowrap overflow-hidden text-ellipsis max-w-xs cursor-pointer select-none transition-colors duration-150 hover:bg-primary/20"
                        }
                      >
                        <span className="flex items-center gap-1">
                          {col}
                          {col === emailCol && (
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
                            (col === emailCol
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
                  reset();
                }}
                type="button"
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleValidate}
                type="button"
                disabled={!emailCol}
              >
                Validate
              </button>
            </div>
          </div>
        </Modal>
        {/* End Modal */}
        <Modal
          open={showProgressModal && verifying}
          onClose={() => {}}
          title="Verifying Emails"
        >
          <LoadingSpinner text="Verifying emails, please wait..." />
        </Modal>
        {/* Only show the rest if modal is closed and file is selected */}
        {!showModal && file && (
          <>
            {/* TODO: add background verification */}
            {/* <div className="flex items-center mb-4 mt-4">
              <input
                type="checkbox"
                id="background"
                checked={background}
                onChange={(e) => setBackground(e.target.checked)}
                className="mr-2"
                disabled={verifying}
              />
              <label htmlFor="background" className="text-white">
                Verify in background (async)
              </label>
            </div> */}
            <button
              className="btn-primary"
              onClick={handleStart}
              disabled={!file || !emailCol || verifying}
            >
              {verifying ? "Verifying..." : "Start Verification"}
            </button>
          </>
        )}
        {/* {verifying && jobStatus && (
          <div className="mt-6">
            <div className="mb-2 text-white font-medium">
              Progress: {jobStatus.processed} / {jobStatus.total} emails
            </div>
            <div className="w-full bg-gray-800 rounded-full h-3 mb-2">
              <div
                className="bg-primary h-3 rounded-full transition-all duration-500"
                style={{ width: `${jobStatus.progress}%` }}
              ></div>
            </div>
            <div className="flex gap-6 mt-2">
              <span className="text-green-400">Valid: {jobStatus.valid}</span>
              <span className="text-yellow-400">Risky: {jobStatus.risky}</span>
              <span className="text-red-400">Invalid: {jobStatus.invalid}</span>
            </div>
          </div>
        )}
        {resultUrl && (
          <div className="mt-6 flex items-center gap-4">
            <a
              href={resultUrl}
              className="btn-primary flex items-center gap-2"
              download
            >
              <Download className="w-5 h-5" /> Download Results
            </a>
          </div>
        )} */}
      </div>

      <TypeCategories />
      {showToast && (
        <AlertToast
          type={toastType}
          message={toastMessage}
          onClose={() => setShowToast(false)}
        />
      )}
      {/* <Modal
        open={showProgressModal}
        onClose={() => {}}
        title="Vérification en cours"
      >
        <div className="flex flex-col items-center justify-center min-h-[120px]">
          <div className="mb-2 text-white font-medium text-lg">
            {jobStatus
              ? `Progression : ${jobStatus.processed} / ${jobStatus.total} emails`
              : "Initialisation..."}
          </div>
          <div className="w-full bg-gray-800 rounded-full h-3 mb-2">
            <div
              className="bg-primary h-3 rounded-full transition-all duration-500"
              style={{ width: jobStatus ? `${jobStatus.progress}%` : "0%" }}
            ></div>
          </div>
          <div className="flex gap-6 mt-2">
            <span className="text-green-400">
              Valides : {jobStatus?.valid ?? 0}
            </span>
            <span className="text-yellow-400">
              Risky : {jobStatus?.risky ?? 0}
            </span>
            <span className="text-red-400">
              Invalides : {jobStatus?.invalid ?? 0}
            </span>
          </div>
          <div className="mt-4 text-gray-400 text-sm">
            Merci de patienter, la vérification est en cours...
          </div>
        </div>
      </Modal> */}
    </div>
  );
}
