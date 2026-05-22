import type { Metadata } from "next";
import { Henny_Penny } from "next/font/google";

const hennyPenny = Henny_Penny({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-portfolio-title",
});

export const metadata: Metadata = {
  title: "Raya Serahill - Portfolio",
  description: "A cute archive of Raya Serahill's FFXIV mods, animations, accessories, and creative work.",
  openGraph: {
    title: "Raya Serahill - Portfolio",
    description: "A cute archive of Raya Serahill's FFXIV mods, animations, accessories, and creative work.",
    url: "https://serahill.net/portfolio",
    siteName: "Raya Serahill",
    images: [
      {
        url: "https://serahill.net/img/lizzer.png",
        width: 400,
        height: 400,
        alt: "Raya Serahill portfolio",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Raya Serahill - Portfolio",
    description: "A cute archive of Raya Serahill's FFXIV mods, animations, accessories, and creative work.",
    images: ["https://serahill.net/img/lizzer.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  keywords: [
    "Raya Serahill",
    "portfolio",
    "FFXIV mods",
    "XIV Mod Archive",
    "software developer",
    "designer",
  ],
  other: {
    "discord:creator": "@raya",
    "theme-color": "#ff8fbe",
  },
};

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return <div className={hennyPenny.variable}>{children}</div>;
}
