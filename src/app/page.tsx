import { Assistant } from "./assistant";
import Link from "next/link";
import Image from "next/image";

export default async function Home() {
  let initials = "";

  try {
    const res = await fetch("/.auth/me", { cache: "no-store" });
    const data = await res.json();
    const userDetails = data?.clientPrincipal?.userDetails as string | undefined;
    if (userDetails) {
      const parts = userDetails
        .replace(/@.*$/, "")
        .split(/[^A-Za-z0-9]+/)
        .filter(Boolean);
      initials = parts
        .slice(0, 2)
        .map((p) => p[0])
        .join("")
        .toUpperCase();
    }
  } catch {
    // Ignore errors fetching user info; avatar will be empty
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-background text-wrap">
      <header className="relative w-full py-4 px-6 mb-8 flex fixed top-0 z-50 justify-center items-center bg-gradient-to-r from-purple-900 via-fuchsia-700 to-pink-600 text-white shadow-sm">
        <Image
          src="/bank-now-logo.svg"
          alt="Bank Now logo"
          width={40}
          height={40}
          className="absolute left-6 top-1/2 -translate-y-1/2"
        />
        <div className="w-full max-w-7xl flex justify-between items-center">
          <h1 className="text-2xl font-semibold">Chat with ABS Data</h1>
          <div className="flex items-center gap-4">
            <Link
              href="/data"
              className="px-4 py-2 text-sm bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-md transition-colors"
            >
              View Dataset
            </Link>
            <div className="w-9 h-9 flex items-center justify-center rounded-full bg-secondary text-secondary-foreground font-medium">
              {initials || ""}
            </div>
          </div>
        </div>
      </header>
      <div className="w-full h-dvh">
        <Assistant />
      </div>
    </main>
  );
}
