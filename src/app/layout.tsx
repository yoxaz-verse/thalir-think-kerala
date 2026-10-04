import type { Metadata } from "next";
import "@fontsource-variable/figtree";
import "@fontsource-variable/newsreader";
import "@fontsource-variable/noto-sans-malayalam";
import "./globals.css";
import { siteConfig } from "@/lib/site-config";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: { default: siteConfig.name, template: `%s — ${siteConfig.shortName}` },
  description: "Kerala's independent ecosystem for founders, investors, mentors, institutions and partners.",
  applicationName: siteConfig.name,
  icons: { icon: "/icon.svg" },
  openGraph: { type: "website", siteName: siteConfig.name, title: siteConfig.name, description: "Where bold ideas take root.", images: ["/opengraph-image"] },
  twitter: { card: "summary_large_image" }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth"><body>{children}{siteConfig.analyticsEnabled && siteConfig.privacyCopyApproved ? <Analytics/> : null}</body></html>; }
