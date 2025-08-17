"use client";

import Link from "next/link";
import Image from "next/image";
import { UserAvatar } from "./user-avatar";
import { Button } from "./ui/button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/bank-now-logo.svg" alt="Bank Now logo" width={32} height={32} />
          <span className="text-lg font-semibold text-foreground">Chat with ABS Data</span>
        </Link>
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/data">View Dataset</Link>
          </Button>
          <UserAvatar />
        </div>
      </div>
    </header>
  );
}

