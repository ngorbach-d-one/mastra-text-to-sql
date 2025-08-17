import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bank-Now Assistant",
  description: "Bank-Now assistant for exploring ABS data",
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
