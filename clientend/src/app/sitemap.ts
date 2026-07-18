import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site-config";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";

type MenuItem = { slug: string; updatedAt?: string };

async function fetchMenuSlugs(): Promise<MenuItem[]> {
  try {
    const res = await fetch(`${API_URL}/menu/public`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as {
      success?: boolean;
      data?: { items?: MenuItem[] };
    };
    return json.data?.items || [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/menu"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/book"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  const items = await fetchMenuSlugs();
  const menuRoutes: MetadataRoute.Sitemap = items
    .filter((i) => i.slug)
    .map((i) => ({
      url: absoluteUrl(`/menu/${i.slug}`),
      lastModified: i.updatedAt ? new Date(i.updatedAt) : now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

  return [...staticRoutes, ...menuRoutes];
}
