import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Self-hosted Fraunces (SIL Open Font License; see src/app/fonts/OFL-LICENSE.txt).
// The files are part of the build, so the app never touches the network.
const fraunces = localFont({
  src: [
    {
      path: "./fonts/fraunces-latin-standard-normal.woff2",
      weight: "100 900",
      style: "normal",
    },
    {
      path: "./fonts/fraunces-latin-standard-italic.woff2",
      weight: "100 900",
      style: "italic",
    },
  ],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ledger",
  description: "pages and chapters as they actually happen",
};

export const viewport: Viewport = {
  themeColor: "#FAF7F1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fraunces.variable}>
      <body className="bg-paper font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
