import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bank-Now Assitant",
  description: "Bank-Now Assistant for ABS Data",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
