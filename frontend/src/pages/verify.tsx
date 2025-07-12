import { useState } from "react";
import Head from "next/head";
import {
  Mail,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import toast from "react-hot-toast";

interface VerificationResult {
  email: string;
  status: "valid" | "invalid" | "accept_all";
  bounceType?: "hard" | "soft" | null;
  reason?: string;
  checkedAt: string;
}

export default function VerifyPage() {
  const [email, setEmail] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setIsVerifying(true);
    setResult(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: email.trim() }),
        }
      );

      if (!response.ok) {
        throw new Error("Verification failed");
      }

      const data = await response.json();
      setResult(data);

      if (data.status === "valid") {
        toast.success("Email is valid!");
      } else {
        toast.error(`Email is invalid: ${data.reason}`);
      }
    } catch (error) {
      console.error("Verification error:", error);
      toast.error("Failed to verify email");
    } finally {
      setIsVerifying(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "valid":
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case "accept_all":
        return <AlertCircle className="h-8 w-8 text-yellow-500" />;
      case "invalid":
      default:
        return <XCircle className="h-8 w-8 text-red-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "valid":
        return "text-green-600 bg-green-100 border-green-200";
      case "accept_all":
        return "text-yellow-600 bg-yellow-100 border-yellow-200";
      case "invalid":
      default:
        return "text-red-600 bg-red-100 border-red-200";
    }
  };

  return (
    <>
      <Head>
        <title>Verify Email - Email Verifier</title>
        <meta name="description" content="Verify a single email address" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Verify Email Address
            </h1>
            <p className="text-lg text-gray-600">
              Check if an email address is valid and deliverable
            </p>
          </div>

          {/* Verification Form */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address..."
                    className="input-field pl-10"
                    disabled={isVerifying}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isVerifying || !email.trim()}
                className="btn-primary w-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isVerifying ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify Email
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Results */}
          {result && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Verification Results
              </h2>

              <div className="space-y-6">
                {/* Status */}
                <div
                  className={`flex items-center p-4 rounded-lg border ${getStatusColor(
                    result.status
                  )}`}
                >
                  {getStatusIcon(result.status)}
                  <div className="ml-4">
                    <h3 className="text-lg font-medium">
                      {result.status === "valid"
                        ? "Email is Valid"
                        : result.status === "accept_all"
                        ? "Email is Accept All"
                        : "Email is Invalid"}
                    </h3>
                    <p className="text-sm opacity-80">{result.reason}</p>
                  </div>
                </div>

                {/* Details */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </h4>
                    <p className="text-gray-900">{result.email}</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Status
                    </h4>
                    <p className="text-gray-900">
                      {result.status === "valid"
                        ? "Valid"
                        : result.status === "accept_all"
                        ? "Accept All"
                        : "Invalid"}
                    </p>
                  </div>

                  {result.bounceType && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Bounce Type
                      </h4>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          result.bounceType === "hard"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {result.bounceType} bounce
                      </span>
                    </div>
                  )}

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Checked At
                    </h4>
                    <p className="text-gray-900">
                      {new Date(result.checkedAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Reason */}
                {result.reason && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Reason
                    </h4>
                    <p className="text-gray-900">{result.reason}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Features */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              What We Check
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Syntax Validation
                    </h3>
                    <p className="text-sm text-gray-600">
                      Verify email format follows RFC standards
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900">MX Records</h3>
                    <p className="text-sm text-gray-600">
                      Check if domain has mail exchange records
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Disposable Detection
                    </h3>
                    <p className="text-sm text-gray-600">
                      Identify temporary email services
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Role-based Detection
                    </h3>
                    <p className="text-sm text-gray-600">
                      Identify generic email addresses
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Catch-all Detection
                    </h3>
                    <p className="text-sm text-gray-600">
                      Identify domains that accept all emails
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Bounce Detection
                    </h3>
                    <p className="text-sm text-gray-600">
                      Identify hard and soft bounces
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
