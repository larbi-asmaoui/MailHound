import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";

export default function TypeCategories() {
  return (
    <>
      <div className="bg-background-card rounded-xl border border-border shadow p-6">
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
      </div>
    </>
  );
}
