import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lucky Draw",
  description: "A fair and transparent lucky draw app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div id="sr-status" role="status" aria-live="polite" className="sr-only" />
        <div id="sr-alert" role="alert" aria-live="assertive" className="sr-only" />
        {children}
      </body>
    </html>
  );
}
