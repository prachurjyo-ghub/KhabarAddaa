import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site-config";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";

type MenuItem = {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  price?: number;
};

async function fetchItem(slug: string): Promise<MenuItem | null> {
  try {
    const res = await fetch(`${API_URL}/menu/public/${encodeURIComponent(slug)}`, {
      next: { revalidate: 1800 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      success?: boolean;
      data?: { item?: MenuItem };
    };
    return json.data?.item || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = await fetchItem(slug);
  if (!item) {
    return buildMetadata({
      title: "Menu item",
      description: "Dish details from the KhabarAdda menu in Dhanmondi, Dhaka.",
      path: `/menu/${slug}`,
    });
  }

  const description =
    item.description?.trim() ||
    `Order ${item.name} from KhabarAdda in Dhanmondi, Dhaka.`;

  return buildMetadata({
    title: item.name,
    description,
    path: `/menu/${item.slug}`,
    image: item.image || undefined,
  });
}

export default async function MenuItemLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await fetchItem(slug);

  const jsonLd = item
    ? {
        "@context": "https://schema.org",
        "@type": "MenuItem",
        name: item.name,
        description:
          item.description ||
          `${item.name} from KhabarAdda, Dhanmondi, Dhaka.`,
        image: item.image ? absoluteUrl(item.image) : undefined,
        offers: item.price
          ? {
              "@type": "Offer",
              price: item.price,
              priceCurrency: "BDT",
              availability: "https://schema.org/InStock",
            }
          : undefined,
        url: absoluteUrl(`/menu/${item.slug}`),
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
