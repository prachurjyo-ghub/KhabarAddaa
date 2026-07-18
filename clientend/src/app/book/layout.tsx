import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Reserve a table",
  description:
    "Book a table at KhabarAdda in Dhanmondi, Dhaka. Choose your date, party size, and time online.",
  path: "/book",
});

export default function BookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
