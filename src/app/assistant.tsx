"use client";

import { useState } from "react";
import { MastraRuntimeProvider } from "@/app/MastraRuntimeProvider";
import { Thread } from "@/components/assistant-ui/thread";
import { ThreadList } from "@/components/assistant-ui/thread-list";
import { cn } from "@/lib/utils";
import { PanelLeftCloseIcon, PanelLeftOpenIcon } from "@/components/panel-icons";

export const Assistant = () => {
  const [open, setOpen] = useState(false);

  return (
    <MastraRuntimeProvider>
      <div className="flex h-full">
        <aside
          className={cn(
            "border-r bg-muted transition-all duration-300 overflow-hidden h-[calc(100dvh-4.5rem)]",
            open ? "mt-18 w-64 p-4" : "w-0 p-0"
          )}
        >
          {open && <ThreadList />}
        </aside>
        <div className="relative flex-1">
          <button
            onClick={() => setOpen((o) => !o)}
            className="absolute left-0 top-18 z-52 rounded-r-md rounded-l-none border p-1 bg-background hover:bg-muted cursor-pointer"
            aria-label={open ? "Close thread list" : "Open thread list"}
          >
            {open ? (
              <PanelLeftCloseIcon className="h-6 w-6 cursor-pointer" />
            ) : (
              <PanelLeftOpenIcon className="h-6 w-6 cursor-pointer" />
            )}
          </button>
          <Thread />
        </div>
      </div>
    </MastraRuntimeProvider>
  );
};
