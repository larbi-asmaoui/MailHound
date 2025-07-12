import React, { useState } from "react";
import {
  ArrowUpRight,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from "lucide-react";

import TypeCategories from "../components/TypeCategories";
import LoadingSpinner from "@/components/LoadingSpinner";
import Modal from "@/components/Modal";
import VerificationResultCard from "@/components/VerificationResultCard";

interface VerificationResult {
  email: string;
  status: "valid" | "invalid" | "accept_all";
  reason: string;
  bounceType?: string | null;
  isDisposable?: boolean;
  isRoleBased?: boolean;
  checkedAt?: string;
}

type Status = {
  color: string;
  label: string;
  icon: React.ElementType;
};

function getStatus(result: VerificationResult): Status {
  switch (result.status) {
    case "valid":
      return { color: "green", label: "Good", icon: CheckCircle };
    case "accept_all":
      return {
        color: "yellow",
        label: "Risky (Catch-all)",
        icon: AlertTriangle,
      };
    case "invalid":
    default:
      if (result.bounceType === "hard")
        return { color: "red", label: "Bad", icon: XCircle };
      if (result.bounceType === "soft")
        return { color: "yellow", label: "Risky", icon: AlertTriangle };
      return { color: "red", label: "Bad", icon: XCircle };
  }
}

export default function SingleEmailPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3009/api";

      const res = await fetch(`${apiUrl}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("Erreur serveur");
      const data = await res.json();
      setResult(data);
      setShowModal(true);
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">
        Single Email Verification
      </h1>
      <form
        onSubmit={handleVerify}
        className="bg-background-card rounded-xl border border-border shadow p-6 mb-8"
      >
        <h2 className="text-xl font-semibold text-white mb-4">
          Enter Email Address
        </h2>
        <div className="mb-6 flex items-center space-x-2">
          <input
            type="email"
            placeholder="email@example.com"
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />
          <button
            type="submit"
            className="btn-primary"
            disabled={loading || !email.trim()}
          >
            {loading ? "Checking..." : "Verify"}
          </button>
        </div>
        {error && <div className="text-red-400 mt-4">{error}</div>}
      </form>
      <Modal open={loading} onClose={() => {}} title="Verifying Emails">
        <LoadingSpinner text="Verifying email, please wait..." />
      </Modal>
      <Modal
        open={showModal && !!result}
        onClose={() => setShowModal(false)}
        title="Verification Result"
      >
        {result && <VerificationResultCard result={result} />}
      </Modal>
      {/* <div className="bg-background-card rounded-xl border border-border shadow p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Types of Categories
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-green-700 bg-green-900/10 p-4">
            <div className="flex items-center mb-2">
              <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
              <span className="font-bold text-green-300">Good</span>
            </div>
            <span className="text-green-200">
              Emails that are valid and safe to send to.
            </span>
          </div>
          <div className="rounded-lg border border-yellow-700 bg-yellow-900/10 p-4">
            <div className="flex items-center mb-2">
              <AlertTriangle className="w-5 h-5 mr-2 text-yellow-400" />
              <span className="font-bold text-yellow-300">Risky</span>
            </div>
            <span className="text-yellow-200">
              Unknown or catch-all emails. Send at your own risk.
            </span>
          </div>
          <div className="rounded-lg border border-red-700 bg-red-900/10 p-4">
            <div className="flex items-center mb-2">
              <XCircle className="w-5 h-5 mr-2 text-red-400" />
              <span className="font-bold text-red-300">Bad</span>
            </div>
            <span className="text-red-200">
              Invalid emails that you shouldn't send to.
            </span>
          </div>
        </div>
      </div> */}

      <TypeCategories />
    </div>
  );
}
