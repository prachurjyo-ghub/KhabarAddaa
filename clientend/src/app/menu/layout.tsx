import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Menu",
  description:
    "Explore the KhabarAdda menu in Dhanmondi, Dhaka — mains, starters, and chef specials for delivery, takeaway, or dining in.",
  path: "/menu",
});

export default function MenuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
