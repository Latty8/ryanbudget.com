"use client";

import dynamic from "next/dynamic";

export const ChangelogModal = dynamic(
  () => import("@/components/fintech/changelog-modal").then((m) => ({ default: m.ChangelogModal })),
  { ssr: false }
);
