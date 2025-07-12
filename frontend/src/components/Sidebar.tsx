import Link from "next/link";
import { useRouter } from "next/router";
import {
  Mail,
  BarChart3,
  Upload,
  ShieldCheck,
  DollarSign,
  PieChart,
  icons,
} from "lucide-react";

const sidebarLinks = [
  { label: "Dashboard", icon: PieChart, href: "/" },
  { label: "Single Email", icon: Mail, href: "/single" },
  { label: "Bulk Upload", icon: Upload, href: "/upload" },
  { label: "Score", icon: ShieldCheck, href: "/score" },
  { label: "Recent Lists", icon: BarChart3, href: "/lists" },
  // { label: "Catch-all", icon: ShieldCheck, href: "/catchall" },
  // { label: "Upgrade", icon: DollarSign, href: "/upgrade" },
];

export default function Sidebar() {
  const router = useRouter();
  return (
    <aside className="fixed top-0 left-0 w-64 h-screen bg-background-sidebar border-r border-gray-800 flex flex-col py-6 px-2 z-50">
      <div className="flex items-center h-16 px-4 mb-8">
        <span className="text-2xl font-bold text-primary">Verifier</span>
      </div>
      <nav className="flex-1">
        <ul className="space-y-1">
          {sidebarLinks.map((link) => {
            const isActive = router.pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors cursor-pointer ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-gray-300 hover:bg-gray-800 hover:text-primary"
                  }`}
                >
                  <link.icon className="w-5 h-5 mr-3" />
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="mt-auto p-4 border-t border-gray-800 flex items-center space-x-3">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-background font-bold">
          T
        </div>
        <div>
          <div className="text-sm font-semibold text-white">Tarik</div>
          <div className="text-xs text-gray-400">Pro Plan</div>
        </div>
      </div>
    </aside>
  );
}
