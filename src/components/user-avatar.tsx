"use client";

import { useEffect, useState } from "react";

export function UserAvatar() {
  const [initials, setInitials] = useState<string>("A");
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/.auth/me");
        if (res.ok) {
          const data = await res.json();
          const userDetails =
            data?.clientPrincipal?.userDetails || data?.userDetails || "";
          if (userDetails) {
            const parts = userDetails
              .split(/[\s@._-]+/)
              .filter(Boolean)
              .slice(0, 2);
            const init = parts
              .map((p: string) => p[0]?.toUpperCase())
              .join("");
            setInitials(init || "A");
          }
        }
      } catch {
        // ignore errors
      } finally {
        setChecked(true);
      }
    }
    fetchUser();
  }, []);

  if (!checked) return null;

  return (
    <div className="w-8 h-8 rounded-full bg-white text-purple-700 flex items-center justify-center text-sm font-medium">
      {initials}
    </div>
  );
}
