import { Assistant } from "./assistant";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-background text-wrap">
      <header className="w-full py-4 px-6 mb-8 flex fixed top-0 z-50 justify-center items-center bg-gradient-to-r from-purple-900 via-fuchsia-700 to-pink-600 text-white shadow-sm">
        <div className="w-full max-w-7xl flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Image
              src="/bank-now-logo.svg"
              alt="Bank Now logo"
              width={40}
              height={40}
            />
            <h1 className="text-2xl font-semibold">Chat with ABS Data</h1>
          </div>
          <Link
            href="/data"
            className="px-4 py-2 text-sm bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-md transition-colors"
          >
            View Dataset
          </Link>
        </div>
      </header>
      <div className="w-full h-dvh px-6">
        <Assistant />
      </div>
    </main>
  );
}
