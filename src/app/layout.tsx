import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "术后滴眼液助手",
  description: "帮助近视手术患者按时、按顺序完成恢复期滴眼液流程。",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "滴眼助手",
    statusBarStyle: "default"
  }
};

export const viewport: Viewport = {
  themeColor: "#f7fafc",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
