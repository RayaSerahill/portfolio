import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Eorzean Summer Festival | Raya Serahill",
  description:
    "Bid on a development commission from Raya Serahill: websites, FFXIV plugins, and custom tools.",
  openGraph: {
    title: "Raya Serahill at the Eorzean Summer Festival",
    description:
      "A summer developer auction for websites, FFXIV plugins, and custom tools.",
    images: ["https://serahill.net/img/color_nobg.webp"],
  },
};

export default function EorzeanFestivalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
