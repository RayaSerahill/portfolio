import type { ReactNode } from "react";
import "../neko/assets/css/neko.css";

const hexItems = [
  {
    title: "Quiet Confidence",
    description: "A gentle, flowing idle animation with subtle swaying movements",
    image: "/velvet/portfolio1.png",
    alt: "",
    link: ""
  },
  {
    title: "Quiet Confidence",
    description: "A gentle, flowing idle animation with subtle swaying movements",
    image: "/velvet/portfolio1.png",
    alt: "",
    link: ""
  },
  {
    title: "Quiet Confidence",
    description: "A gentle, flowing idle animation with subtle swaying movements",
    image: "/velvet/portfolio1.png",
    alt: "",
    link: ""
  },
  {
    title: "Quiet Confidence",
    description: "A gentle, flowing idle animation with subtle swaying movements",
    image: "/velvet/portfolio1.png",
    alt: "",
    link: ""
  },
] as const;

export default function ModsPage() {
  return (
    <>
      <div className="max-w-2xl mx-auto px-4 raya-container">
        <h1 className={"text-center"}>My FFXIV Mods</h1>
        <div className={"flex flex-col gap-4 mt-8 cute-border"}>
          <a className={"back-to-front"} href={"/"}> &lt;-- Back to front page</a>
          <div className={"hex-container"}>
            {hexItems.map((item, index) => (
              <div className={"hex-item"}>
                <img srcSet={item.image}  alt={item.alt}/>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}