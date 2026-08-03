import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "TOGO AI - AI Product Design Engine",
  description: "TOGO AI（图狗）是一个AI产品设计智能平台。",
  keywords: ["TOGO AI", "图狗", "AI Product Design Engine", "AI产品设计", "Amazon product design"],
  icons: {
    icon: "/brand/togo-logo.png",
    shortcut: "/brand/togo-logo.png",
    apple: "/brand/togo-logo.png"
  },
  openGraph: {
    title: "TOGO AI - AI Product Design Engine",
    description: "TOGO AI（图狗）是一个AI产品设计智能平台。",
    images: ["/brand/togo-logo.png"],
    siteName: "TOGO AI"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
