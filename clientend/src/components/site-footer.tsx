import type { ElementType } from "react";
import Link from "next/link";
import {
  FiFacebook,
  FiGithub,
  FiGlobe,
  FiInstagram,
  FiLinkedin,
  FiMail,
} from "react-icons/fi";
import { getActiveSiteLinks, siteConfig, type SiteLinkKey } from "@/lib/site-config";

const LINK_META: Record<
  SiteLinkKey,
  { label: string; icon: ElementType }
> = {
  website: { label: "Website", icon: FiGlobe },
  github: { label: "GitHub", icon: FiGithub },
  linkedin: { label: "LinkedIn", icon: FiLinkedin },
  facebook: { label: "Facebook", icon: FiFacebook },
  instagram: { label: "Instagram", icon: FiInstagram },
  email: { label: "Email", icon: FiMail },
};

function hrefFor(key: SiteLinkKey, value: string) {
  if (key === "email") {
    return value.startsWith("mailto:") ? value : `mailto:${value}`;
  }
  return value;
}

export function SiteFooter() {
  const links = getActiveSiteLinks();
  const developerName = siteConfig.developer.name;
  const developerLabel = siteConfig.developer.label;

  return (
    <footer className="mt-8 border-t border-[var(--outline-variant)] bg-[#080808] text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[0.04em] text-[var(--gold-bright)]">
            KhabarAdda
          </p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/55">
            A journey of flavor, artistry, and refined ambiance — crafted for
            the discerning palate.
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--gold)]/70">
            Explore
          </p>
          <div className="mt-4 flex flex-col gap-2 text-sm font-medium">
            <Link
              href="/menu"
              className="text-white/70 hover:text-[var(--gold-bright)]"
            >
              Menu
            </Link>
            <Link
              href="/book"
              className="text-white/70 hover:text-[var(--gold-bright)]"
            >
              Reserve a table
            </Link>
            <Link
              href="/login"
              className="text-white/70 hover:text-[var(--gold-bright)]"
            >
              Account
            </Link>
          </div>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--gold)]/70">
            Session
          </p>
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            {siteConfig.sessionHours}
            <br />
            {siteConfig.address}
            {siteConfig.phone ? (
              <>
                <br />
                <a
                  href={`tel:${siteConfig.phone}`}
                  className="hover:text-[var(--gold-bright)]"
                >
                  {siteConfig.phone}
                </a>
              </>
            ) : null}
            {siteConfig.email ? (
              <>
                <br />
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="hover:text-[var(--gold-bright)]"
                >
                  {siteConfig.email}
                </a>
              </>
            ) : null}
          </p>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-5">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} KhabarAdda. Culinary excellence, served
            warm.
          </p>

          <div className="flex flex-col items-center gap-2 md:items-end">
            <p className="text-xs text-white/55">
              {developerLabel}{" "}
              <span className="font-semibold text-[var(--gold-bright)]">
                {developerName}
              </span>
            </p>
            {links.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-2">
                {links.map(([key, value]) => {
                  const meta = LINK_META[key];
                  const Icon = meta.icon;
                  return (
                    <a
                      key={key}
                      href={hrefFor(key, value)}
                      target={key === "email" ? undefined : "_blank"}
                      rel={key === "email" ? undefined : "noopener noreferrer"}
                      aria-label={meta.label}
                      title={meta.label}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--gold)]/30 text-[var(--gold)] transition-colors hover:border-[var(--gold)] hover:bg-[var(--gold)]/10 hover:text-[var(--gold-bright)]"
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
