import { Assistant } from "./assistant";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-background text-wrap">
      <header className="w-full py-4 px-6 mb-8 flex fixed top-0 z-50 justify-center items-center bg-background border-b shadow-sm">
        <div className="w-full max-w-5xl flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-foreground">
            Mastra Text-to-SQL Demo: World Cities Population
          </h1>
          <Link
            href="/data"
            className="px-4 py-2 text-sm bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition-colors"
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
