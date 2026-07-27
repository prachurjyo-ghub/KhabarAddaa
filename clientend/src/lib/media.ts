import { API_URL } from "@/lib/api";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export function getAssetOrigin() {
  const explicit = process.env.NEXT_PUBLIC_ASSET_ORIGIN?.trim();
  if (explicit) return trimTrailingSlash(explicit);
  return trimTrailingSlash(API_URL).replace(/\/api\/v1\/?$/, "");
}

/** Resolve portable `/uploads/...` paths and repair old localhost upload URLs. */
export function resolveMediaUrl(imagePath?: string | null) {
  const value = String(imagePath || "").trim();
  if (!value) return "";

  if (value.startsWith("data:") || value.startsWith("blob:")) return value;

  if (value.startsWith("http://") || value.startsWith("https://")) {
    try {
      const parsed = new URL(value);
      if (parsed.pathname.startsWith("/uploads/")) {
        return `${getAssetOrigin()}${parsed.pathname}`;
      }
    } catch {
      return value;
    }
    return value;
  }

  if (!value.startsWith("/uploads/")) return value;
  return `${getAssetOrigin()}${value}`;
}
