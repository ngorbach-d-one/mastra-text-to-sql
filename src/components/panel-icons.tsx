import type { LucideProps } from "lucide-react";

export const PanelLeftCloseIcon = (props: LucideProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M3 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H3V3Z" />
    <path d="M9 3v18" />
    <path d="m16 15-3-3 3-3" />
  </svg>
);

export const PanelLeftOpenIcon = (props: LucideProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M3 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H3V3Z" />
    <path d="M9 3v18" />
    <path d="m14 9 3 3-3 3" />
  </svg>
);
