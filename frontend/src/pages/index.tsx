import { useState } from "react";
import {
  Mail,
  BarChart3,
  Users,
  Flame,
  ShieldCheck,
  Tool,
  Upload,
  Settings,
  KeyRound,
  PieChart,
  DollarSign,
  MessageCircle,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from "lucide-react";

const metrics = [
  {
    label: "Emails Verified Today",
    value: 124,
    icon: CheckCircle,
    color: "text-primary",
  },
  {
    label: "Total Emails Verified",
    value: 10234,
    icon: Mail,
    color: "text-primary",
  },
  { label: "Good", value: 9000, icon: CheckCircle, color: "text-green-400" },
  { label: "Risky", value: 800, icon: AlertTriangle, color: "text-yellow-400" },
  { label: "Bad", value: 434, icon: XCircle, color: "text-red-400" },
];

const dashboardCards = [
  {
    title: "Validate",
    description: "Single email validation or validate an entire list.",
    icon: Mail,
    action: "Validate New List",
    inputPlaceholder: "email@example.com",
    href: "/upload",
    stats: "0",
    statsLabel: "Total Validations",
  },
  {
    title: "Score",
    description:
      "See how active and valuable your list is. Score your catch-all email addresses now.",
    icon: BarChart3,
    action: "Score New List",
    href: "/score",
  },
  {
    title: "Inbox & Server Test",
    description:
      "Test to make sure your emails reach the inbox and that your mail server is set up correctly.",
    icon: MessageCircle,
    action: "New Test",
    href: "/inbox-test",
  },
  {
    title: "Blacklist Monitor",
    description: "Monitor your domain and IPs for blacklists.",
    icon: ShieldCheck,
    action: "Add New Monitor",
    href: "/blacklist",
  },
  {
    title: "Quick Stats",
    description: "See stats about your contacts, removals, and fixes.",
    icon: PieChart,
    action: null,
    href: null,
  },
  {
    title: "Email Finder",
    description:
      "Find a verified email address based on their name and company domain.",
    icon: Users,
    action: "Find Email",
    href: "/finder",
  },
  {
    title: "Domain Search",
    description: "Find email address patterns at any company.",
    icon: Mail,
    action: "Search",
    href: "/domain-search",
  },
  {
    title: "DMARC Monitor",
    description: "Monitor your domain for DMARC compliance.",
    icon: ShieldCheck,
    action: "Upgrade Now",
    href: "/dmarc",
  },
  {
    title: "Warmup",
    description: "Warm up your inbox for better deliverability.",
    icon: Flame,
    action: "Upgrade Now",
    href: "/warmup",
  },
];

export default function Dashboard() {
  return (
    <main className="flex-1">
      <div>
        <div className="sticky top-0 z-20 bg-background pb-4 mb-8 border-b border-border">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        </div>
        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-10">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="bg-background-card rounded-xl shadow p-6 flex flex-col items-center border border-border"
            >
              <metric.icon className={`w-7 h-7 mb-2 ${metric.color}`} />
              <div className="text-2xl font-bold text-white mb-1">
                {metric.value}
              </div>
              <div className="text-sm text-gray-400 text-center">
                {metric.label}
              </div>
            </div>
          ))}
        </div>
        <div className="mb-8">
          <span className="text-2xl font-semibold text-primary">
            Welcome back!
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboardCards.map((card) => (
            <div
              key={card.title}
              className="bg-background-card rounded-xl shadow-lg p-6 flex flex-col justify-between min-h-[180px] border border-border"
            >
              <div className="flex items-center mb-4">
                <card.icon className="w-8 h-8 text-primary mr-3" />
                <h2 className="text-lg font-semibold text-white">
                  {card.title}
                </h2>
              </div>
              <p className="text-gray-400 mb-4 flex-1">{card.description}</p>
              {card.inputPlaceholder && (
                <input
                  type="text"
                  placeholder={card.inputPlaceholder}
                  className="input-field mb-2"
                />
              )}
              {card.stats && (
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold text-primary">
                    {card.stats}
                  </span>
                  <span className="text-xs text-gray-400">
                    {card.statsLabel}
                  </span>
                </div>
              )}
              {card.action && (
                <a
                  href={card.href}
                  className="btn-primary w-full text-center mt-2"
                >
                  {card.action}
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
