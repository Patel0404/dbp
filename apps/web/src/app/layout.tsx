import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
import { TopBar } from "@/components/TopBar";
import { ComplianceBanner } from "@/components/ComplianceBanner";

export const metadata: Metadata = {
  title: "DBP — Smarter Sports Picks",
  description: "Mobile-first sports betting advisory with transparent recommendations.",
  manifest: "/manifest.json",
  applicationName: "DBP",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0b1020",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <div className="mx-auto max-w-md flex flex-col min-h-screen">
          <TopBar />
          <ComplianceBanner />
          <main className="flex-1 px-4 pb-28 pt-2">{children}</main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
