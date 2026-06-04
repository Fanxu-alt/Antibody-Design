import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Antibody Design",
  description:
    "A unified framework for antigen-specific antibody design operating in sequence space.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
