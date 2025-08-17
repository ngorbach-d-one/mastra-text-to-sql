"use client";

import { useEffect, useState } from "react";

export function UserAvatar() {
  const [initials, setInitials] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/.auth/me");
        if (!res.ok) return;
        const data = await res.json();
        const userDetails =
          data?.clientPrincipal?.userDetails || data?.userDetails || "";
        if (userDetails) {
          const parts = userDetails
            .split(/[\s@._-]+/)
            .filter(Boolean)
            .slice(0, 2);
          const init = parts.map((p) => p[0]?.toUpperCase()).join("");
          setInitials(init || null);
        }
      } catch {
        // ignore errors
      }
    }
    fetchUser();
  }, []);

  if (!initials) return null;

  return (
    <div className="w-8 h-8 rounded-full bg-white text-purple-700 flex items-center justify-center text-sm font-medium">
      {initials}
    </div>
  );
}
