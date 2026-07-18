import type { Metadata } from "next";
import { absoluteUrl, siteConfig } from "@/lib/site-config";

type PageSeo = {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
};

export function buildMetadata({
  title,
  description = siteConfig.description,
  path = "/",
  image = siteConfig.ogImage,
  noIndex = false,
}: PageSeo): Metadata {
  const url = absoluteUrl(path);
  const imageUrl = absoluteUrl(image);
  const fullTitle =
    title === siteConfig.name
      ? `${siteConfig.name} | ${siteConfig.tagline}`
      : `${title} | ${siteConfig.name}`;

  return {
    title: fullTitle,
    description,
    alternates: { canonical: url },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      type: "website",
      locale: "en_BD",
      url,
      siteName: siteConfig.name,
      title: fullTitle,
      description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${siteConfig.name} — ${siteConfig.address}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [imageUrl],
    },
  };
}

export function restaurantJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    telephone: siteConfig.phone,
    image: absoluteUrl(siteConfig.ogImage),
    servesCuisine: ["Bangladeshi", "International"],
    address: {
      "@type": "PostalAddress",
      streetAddress: siteConfig.addressLocality,
      addressLocality: siteConfig.addressLocality,
      addressRegion: siteConfig.addressRegion,
      addressCountry: siteConfig.addressCountry,
    },
    geo: {
      "@type": "GeoCoordinates",
      // Approximate Dhanmondi center — refine when you have exact pin
      latitude: 23.7465,
      longitude: 90.376,
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      opens: "11:00",
      closes: "22:00",
    },
    acceptsReservations: true,
    priceRange: "৳৳",
  };
}
