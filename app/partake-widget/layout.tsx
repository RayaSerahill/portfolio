import type { Metadata } from "next";
import { Henny_Penny } from "next/font/google";

const hennyPenny = Henny_Penny({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-portfolio-title",
});

export const metadata: Metadata = {
  title: "Partake Upcoming Events Widget - Raya Serahill",
  description: "Build a styled upcoming-events widget powered by Partake event data.",
  openGraph: {
    title: "Partake Upcoming Events Widget - Raya Serahill",
    description: "Build a styled upcoming-events widget powered by Partake event data.",
    url: "https://serahill.net/partake-widget",
    siteName: "Raya Serahill",
    images: [
      {
        url: "https://serahill.net/img/lizzer.png",
        width: 400,
        height: 400,
        alt: "Partake upcoming events widget builder",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Partake Upcoming Events Widget - Raya Serahill",
    description: "Build a styled upcoming-events widget powered by Partake event data.",
    images: ["https://serahill.net/img/lizzer.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  keywords: [
    "Raya Serahill",
    "Partake",
    "FFXIV events",
    "event widget",
    "upcoming events",
  ],
  other: {
    "discord:creator": "@raya",
    "theme-color": "#ff8fbe",
  },
};

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return <div className={hennyPenny.variable}>{children}</div>;
}
