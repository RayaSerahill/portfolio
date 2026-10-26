import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import styles from "./_front/front.module.css";
import SocialLinks from "./_front/SocialLinks";

const projects = [
    {
        href: "https://github.com/RayaSerahill/Moonlace",
        title: "Moonlace",
        desc: "A Linux-first desktop app for browsing, previewing, and editing FFXIV models and Penumbra mods, on Linux and Windows",
    },
    {
        href: "https://serahill.net/stats/raya",
        title: "BlackJack Stats",
        desc: "A little page for me and a friend to display stats about our shared hobby of blackjack hosting",
    },
    {
        href: "https://github.com/RayaSerahill/BetterDiscordRichpresence",
        title: "Better discord rich presence",
        desc: "A FFXIV plugin to show your in game status on your discord activity :3",
    },
    {
        href: "https://github.com/RayaSerahill/sbjstats",
        title: "Stats uploader",
        desc: "Another FFXIV plugin, this one uploads blackjack stats from the game live to my website",
    },
    {
        href: "https://www.xivmodarchive.com/user/299088",
        title: "XIV Mod Archive",
        desc: "Some visual mods I have released publicly for FFXIV. Not all are public releases",
    },
    {
        href: "https://serahill.net/partake-widget",
        title: "Partake widget",
        desc: "A widget that allows FFXIV venues to showcase their newest events on their website with a simple customizable iframe",
    },
];

function DiscordMark({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
            <path
                fill="currentColor"
                d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"
            />
        </svg>
    );
}

export default function HomePage() {
    return (
        <div className={styles.root}>
            <div className={styles.ambient} aria-hidden="true" />

            <Link href="/" className={styles.wordmark}>
                Raya
            </Link>

            <main>
                <section className={styles.hero}>
                    <div className={styles.heroText}>
                        <p className={styles.eyebrow}>webmistress · developer · modder</p>
                        <h1 className={styles.name}>Raya Serahill</h1>
                        <p className={styles.lede}>
                            Heya! My name is Raya. Born in 1999, Finnish, a virgo, <em>she/her</em>.
                            Just a girly with a passion to learn new things.
                        </p>
                        <p>
                            I’m the webmistress of this website. This page is a small profile with links to my
                            other projects and pages. I have a lot of hobbies and interests, but the ones I want
                            to share here are modeling, video games, and programming. I also have a soft spot for
                            cute things.
                        </p>
                        <p>
                            I’m a website developer by profession, and everything else I do is just hobbies for
                            fun. I do try to keep myself busy with things I enjoy :3
                        </p>
                        <div className={styles.ctas}>
                            <a href="/portfolio" className={styles.btnPrimary}>
                                Mods portfolio <ArrowUpRight size={16} />
                            </a>
                            <a href="#socials" className={styles.btnGhost}>
                                Say hi
                            </a>
                        </div>
                    </div>

                    <div className={styles.heroArt}>
                        <Image
                            src="/img/ah.png"
                            alt="Raya Serahill: pink-haired catgirl in black lace and chains, looking down at the camera"
                            width={1024}
                            height={1536}
                            priority
                            quality={90}
                            sizes="(max-width: 900px) 100vw, 45vw"
                            className={styles.art}
                        />
                    </div>
                </section>

                <section id="socials" className={styles.section}>
                    <div className={styles.sectionHead}>
                        <p className={styles.overline}>Where to find me</p>
                        <h2 className={styles.h2}>Socials</h2>
                    </div>

                    <div className={styles.socialsGrid}>
                        <SocialLinks />

                        <aside className={styles.discordCard}>
                            <div className={styles.discordHandle}>
                                <DiscordMark className={styles.discordMark} />
                                <div>
                                    <strong>Raya</strong>
                                    <br />
                                    <span>on Discord</span>
                                </div>
                            </div>
                            <h3>Important!</h3>
                            <p>
                                I use Discord mostly, so if you want to reach out to me, that’s the best way to do
                                it. I also have an email, but I don’t check it as often. Github is where I post my
                                projects and Instagram is for fun and cute things.
                            </p>
                        </aside>
                    </div>
                </section>

                <section id="projects" className={styles.section}>
                    <div className={styles.sectionHead}>
                        <p className={styles.overline}>Things I’ve built</p>
                        <h2 className={styles.h2}>Projects</h2>
                    </div>

                    <ul className={styles.projectList}>
                        {projects.map((p) => (
                            <li key={p.href}>
                                <a
                                    href={p.href}
                                    className={styles.project}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <span>
                                        <span className={styles.projectTitle}>{p.title}</span>
                                        <span className={styles.projectDesc}>{p.desc}</span>
                                    </span>
                                    <ArrowUpRight size={20} className={styles.projectArrow} />
                                </a>
                            </li>
                        ))}
                    </ul>
                </section>
            </main>

            <footer className={styles.footer}>
                <div className={styles.prideLine} aria-hidden="true" />
                <p>Personally made by me &copy; 2026 Raya</p>
            </footer>
        </div>
    );
}
