import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import {
  CheckCircle,
  XCircle,
  Download,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import StatsCard from "@/components/StatsCard";
import DataTable from "@/components/DataTable";
import NotFound from "../not_found";
import LoadingSpinner from "@/components/LoadingSpinner";

interface EmailResult {
  email: string;
  isValid: boolean;
  isCatchAll: boolean;
  isRoleBased: boolean;
  isDisposable: boolean;
  smtpResponses: any;
  reason: string;
  checkedAt: string;
  jobId: string;
  status: "valid" | "invalid" | "accept_all";
}

interface ResultsResponse {
  jobId: string;
  fileName: string;
  page: number;
  pageSize: number;
  total: number;
  valid: number;
  invalid: number;
  acceptAll: number;
  results: EmailResult[];
}

export default function ResultsPage() {
  const router = useRouter();
  const { jobId } = router.query;
  const [fileName, setFileName] = useState("");
  const [results, setResults] = useState<EmailResult[]>([]);
  const [total, setTotal] = useState(0);
  const [totalValid, setTotalValid] = useState(0);
  const [totalInvalid, setTotalInvalid] = useState(0);
  const [totalAcceptAll, setTotalAcceptAll] = useState(0);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "any" | "valid" | "invalid" | "accept_all"
  >("any");

  const [selectedType, setSelectedType] = useState<
    "any" | "valid" | "invalid" | "accept_all"
  >("any");

  const fetchResults = async (pageNum: number = 1) => {
    if (!jobId) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/upload/job/${jobId}/results?page=${pageNum}&pageSize=${pageSize}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch results");
      }

      const data: ResultsResponse = await response.json();
      setFileName(data.fileName);
      setResults(data.results);
      setTotal(data.total);
      setTotalValid(data.valid);
      setTotalInvalid(data.invalid);
      setTotalAcceptAll(data.acceptAll);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch results");
      toast.error("Failed to fetch results");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (jobId) {
      fetchResults(page);
    }
  }, [jobId, page]);

  // Calcul des statistiques
  const stats = {
    total: total,
    valid: totalValid,
    invalid: totalInvalid,
    acceptAll: totalAcceptAll,
  };

  // Filtrage des résultats
  const filteredResults = results.filter((result) => {
    const matchesSearch = result.email
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "any" || result.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(total / pageSize);

  const downloadResults = async () => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/upload/job/${jobId}/results/download?type=${selectedType}`,
      { method: "GET" }
    );

    if (!res.ok) throw new Error("Failed to download results");

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `results-${selectedType || "all"}-${jobId}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "valid":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/20 text-green-400 border border-green-700">
            <CheckCircle className="h-3 w-3 mr-1" />
            Valid
          </span>
        );
      case "accept_all":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-900/20 text-yellow-400 border border-yellow-700">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Accept All
          </span>
        );
      case "invalid":
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/20 text-red-400 border border-red-700">
            <XCircle className="h-3 w-3 mr-1" />
            Invalid
          </span>
        );
    }
  };

  if (loading && page === 1) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <NotFound />;
  }

  return (
    <>
      <div className="">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-3xl font-bold text-white">
                Verification Results
              </h1>
              <p className="text-gray-400">List name: {fileName}</p>
            </div>
          </div>

          <button
            onClick={() => router.push("/upload")}
            className="btn-secondary"
          >
            Upload New List
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            label={"Total Emails"}
            value={stats.total}
            color={"text-primary"}
          />

          <StatsCard
            label={"Valid Emails"}
            value={stats.valid}
            color={"text-primary"}
          />

          <StatsCard
            label={"Accept All Emails"}
            value={stats.acceptAll}
            color={"text-yellow-400"}
          />

          <StatsCard
            label={"Invalid Emails"}
            value={stats.invalid}
            color={"text-red-400"}
          />
        </div>

        {/* Download List Card */}
        <div className="bg-background-card border border-border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-6">
            Download List
          </h2>
          <div className="flex flex-col md:flex-row gap-4">
            {/* <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                List Type
              </label>
              <select className="w-full bg-background border border-border rounded-lg px-4 py-2 text-white">
                <option>Select email list</option>
                
              </select>
            </div> */}
            <div className="flex-1">
              {/* <label className="block text-sm font-medium text-gray-400 mb-2">
                List Type
              </label> */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as any)}
                className="input-field pl-10"
              >
                <option>Select List type</option>

                <option value="all">All</option>
                <option value="valid">Valid</option>
                <option value="accept_all">Accept All</option>
                <option value="invalid">Invalid</option>
              </select>
            </div>

            <div>
              <button
                onClick={downloadResults}
                className="bg-primary text-white rounded-lg px-4 py-2 font-semibold"
              >
                {/* <Download className="mr-2" /> */}
                Download Results
              </button>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-background-card rounded-xl shadow p-6 mb-8 border border-border">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search emails..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-white"
              >
                <option value="any">All</option>
                <option value="valid">Valid</option>
                <option value="accept_all">Accept All</option>
                <option value="invalid">Invalid</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-background-card rounded-xl shadow overflow-hidden border border-border">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-lg font-semibold text-white">Email Results</h3>
          </div>

          <DataTable
            columns={[
              {
                key: "email",
                label: "Email",
                className: "font-medium text-white",
              },
              {
                key: "status",
                label: "Status",
                render: (row) => getStatusBadge(row.status),
              },
              // Pour ajouter d'autres colonnes, décommentez ici
              // {
              //   key: "reason",
              //   label: "Reason",
              //   className: "text-gray-400",
              // },
              // {
              //   key: "checkedAt",
              //   label: "Checked At",
              //   render: (row) => new Date(row.checkedAt).toLocaleString(),
              //   className: "text-gray-400",
              // },
            ]}
            data={filteredResults}
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            loading={loading}
            emptyText={
              searchTerm || statusFilter !== "any"
                ? "No results found"
                : undefined
            }
          />
        </div>
      </div>
    </>
  );
}
