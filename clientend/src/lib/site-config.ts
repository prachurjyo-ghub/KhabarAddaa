/** Public site settings from NEXT_PUBLIC_* env vars. */

function env(key: string, fallback = "") {
  const value = process.env[key];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export const siteConfig = {
  sessionHours: env("NEXT_PUBLIC_SESSION_HOURS", "Open daily · 11:00 – 22:00"),
  address: env("NEXT_PUBLIC_RESTAURANT_ADDRESS", "Dhaka, Bangladesh"),
  phone: env("NEXT_PUBLIC_MANAGER_PHONE", "01700000000"),
  email: env("NEXT_PUBLIC_CONTACT_EMAIL", ""),
  developer: {
    name: env("NEXT_PUBLIC_DEVELOPER_NAME", "Golam Azizul Hakim"),
    label: env("NEXT_PUBLIC_DEVELOPER_LABEL", "Developed by"),
  },
  links: {
    website: env("NEXT_PUBLIC_DEV_WEBSITE_URL"),
    github: env("NEXT_PUBLIC_DEV_GITHUB_URL"),
    linkedin: env("NEXT_PUBLIC_DEV_LINKEDIN_URL"),
    facebook: env("NEXT_PUBLIC_DEV_FACEBOOK_URL"),
    instagram: env("NEXT_PUBLIC_DEV_INSTAGRAM_URL"),
    email: env("NEXT_PUBLIC_DEV_EMAIL"),
  },
};

export type SiteLinkKey = keyof typeof siteConfig.links;

export function getActiveSiteLinks() {
  return (
    Object.entries(siteConfig.links) as Array<[SiteLinkKey, string]>
  ).filter(([, href]) => Boolean(href));
}
