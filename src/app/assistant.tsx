"use client";

import { useState } from "react";
import { MastraRuntimeProvider } from "@/app/MastraRuntimeProvider";
import { Thread } from "@/components/assistant-ui/thread";
import { ThreadList } from "@/components/assistant-ui/thread-list";
import { cn } from "@/lib/utils";
import {
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
} from "lucide-react";

export const Assistant = () => {
  const [open, setOpen] = useState(false);

  return (
    <MastraRuntimeProvider>
      <div className="flex h-full">
        <aside
          className={cn(
            "border-r bg-muted transition-all duration-300 overflow-hidden",
            open ? "w-64 p-4" : "w-0 p-0",
          )}
        >
          {open && <ThreadList />}
        </aside>
        <div className="relative flex-1">
          <button
            onClick={() => setOpen((o) => !o)}
            className="absolute left-2 top-2 z-50 rounded-md border p-1 bg-background hover:bg-muted"
            aria-label={open ? "Close thread list" : "Open thread list"}
          >
            {open ? (
              <PanelLeftCloseIcon className="h-4 w-4" />
            ) : (
              <PanelLeftOpenIcon className="h-4 w-4" />
            )}
          </button>
          <Thread />
        </div>
      </div>
    </MastraRuntimeProvider>
  );
};
