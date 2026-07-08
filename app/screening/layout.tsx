import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Screening",
};

export default function ScreeningLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
