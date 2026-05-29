import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement>;

const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function IconHome(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" />
    </svg>
  );
}

export function IconTransactions(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 6h16M4 12h10M4 18h14" />
    </svg>
  );
}

export function IconWallet(props: Props) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="6" width="18" height="14" rx="2" />
      <path d="M3 10h18M16 14h2" />
    </svg>
  );
}

export function IconBudget(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M6 4h12v16H6z" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </svg>
  );
}

export function IconVault(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3 4 7v6c0 5 3.5 7.5 8 9 4.5-1.5 8-4 8-9V7l-8-4Z" />
      <path d="M9.5 12 11 13.5 14.5 10" />
    </svg>
  );
}

export function IconDebts(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3v18M7 8h7a3 3 0 1 1 0 6H9" />
    </svg>
  );
}

export function IconCategories(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 7h7v7H4zM13 7h7v7h-7zM4 16h7v5H4zM13 16h7v5h-7z" />
    </svg>
  );
}
