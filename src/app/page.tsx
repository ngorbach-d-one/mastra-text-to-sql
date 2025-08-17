import { Assistant } from "./assistant";
import { Navbar } from "@/components/navbar";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <div className="flex flex-1">
        <Assistant />
      </div>
    </main>
  );
}
