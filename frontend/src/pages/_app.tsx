import type { AppProps } from "next/app";
import { Toaster } from "react-hot-toast";
import "../styles/globals.css";
import DashboardLayout from "../layouts/DashboardLayout";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className="dark">
      <DashboardLayout>
        <Component {...pageProps} />
        <Toaster position="top-right" />
      </DashboardLayout>
    </div>
  );
}
