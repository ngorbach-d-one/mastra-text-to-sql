"use client";

import { useEffect, useState } from "react";

interface UserInfo {
  initials: string;
  name: string;
}

let cachedUser: UserInfo | null = null;

export function useUserInitials() {
  const [initials, setInitials] = useState<string>(cachedUser?.initials ?? "A");
  const [name, setName] = useState<string>(cachedUser?.name ?? "");
  const [checked, setChecked] = useState<boolean>(Boolean(cachedUser));

  useEffect(() => {
    if (cachedUser) return;
    async function fetchUser() {
      try {
        const res = await fetch("/.auth/me");
        if (res.ok) {
          const data = await res.json();
          const userDetails =
            data?.clientPrincipal?.userDetails || data?.userDetails || "";
          if (userDetails) {
            setName(userDetails);
            const parts = userDetails
              .split(/[\s@._-]+/)
              .filter(Boolean)
              .slice(0, 2);
            const init = parts
              .map((p: string) => p[0]?.toUpperCase())
              .join("");
            setInitials(init || "A");
            cachedUser = { initials: init || "A", name: userDetails };
          }
        }
      } catch {
        // ignore errors
      } finally {
        setChecked(true);
        if (!cachedUser) {
          cachedUser = { initials: "A", name: "" };
        }
      }
    }
    fetchUser();
  }, []);

  return { initials, name, checked };
}

export function UserAvatar() {
  const { initials, name, checked } = useUserInitials();
  const [showPopup, setShowPopup] = useState(false);

  if (!checked) return null;

  return (
    <div className="relative">
      <div
        className="w-8 h-8 rounded-full bg-white text-purple-700 flex items-center justify-center text-sm font-medium cursor-pointer"
        onClick={() => setShowPopup((prev) => !prev)}
      >
        {initials}
      </div>
      {showPopup && (
        <div className="absolute right-0 mt-2 bg-white text-purple-700 border border-purple-200 rounded-md shadow-md px-3 py-1 text-xs z-50">
          {name || "Anonymous"}
        </div>
      )}
    </div>
  );
}
