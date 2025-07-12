import React from "react";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";

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

export default function VerificationResultCard({
  result,
}: {
  result: VerificationResult;
}) {
  const status = getStatus(result);
  const Icon = status.icon;
  return (
    <div
      className={`bg-background-card rounded-xl border border-border shadow p-6 flex items-center space-x-6`}
    >
      <div
        className={`flex items-center justify-center w-16 h-16 rounded-full bg-${status.color}-900/20 border-2 border-${status.color}-700`}
      >
        <Icon className={`w-8 h-8 text-${status.color}-400`} />
      </div>
      <div>
        <div className="text-xl font-bold text-white mb-1">{result.email}</div>
        <div className="text-lg font-semibold mb-1 text-gray-300">
          {status.label}
        </div>
        <div className="text-gray-400 mb-1">{result.reason}</div>
        {result.checkedAt && (
          <div className="text-xs text-gray-500">
            Checked at: {new Date(result.checkedAt).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}
