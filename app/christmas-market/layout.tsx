import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Christmas Market | Raya Serahill",
  description:
    "Custom necklaces and chokers by Raya Serahill: your text, your logo, or both, in five metal finishes.",
  openGraph: {
    title: "Raya Serahill at the Christmas Market",
    description:
      "Custom necklaces and chokers with your text, your logo, or both, in five metal finishes.",
    images: ["https://serahill.net/img/lizzer.png"],
  },
  other: {
    "theme-color": "#ec7fa6",
  },
};

export default function ChristmasMarketLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
