import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AlignView",
  description: "Interactive multiple sequence alignment visualization"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
