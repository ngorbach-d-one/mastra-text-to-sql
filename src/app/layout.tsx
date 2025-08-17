import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mastra Text to SQL",
  description: "Cities Population Information",
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
