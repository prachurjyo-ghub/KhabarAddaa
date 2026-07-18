import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Account",
  description: "Your KhabarAdda orders and reservations.",
  path: "/account",
  noIndex: true,
});

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
