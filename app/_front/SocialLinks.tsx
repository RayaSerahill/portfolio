"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { Github, Instagram, Mail } from "lucide-react";
import styles from "./front.module.css";

const socialLinks = [
    {
        href: "https://www.instagram.com/raya_serahill/",
        name: "Instagram",
        hint: "Cute things, photos, and little glimpses into my world",
        Icon: Instagram,
    },
    {
        href: "mailto:rayaserahill@gmail.com",
        name: "Email",
        hint: "A bit slower than Discord, but still a way to reach me",
        Icon: Mail,
    },
    {
        href: "https://github.com/RayaSerahill",
        name: "Github",
        hint: "Projects, experiments, and headaches",
        Icon: Github,
    },
];

export default function SocialLinks() {
    const [tooltip, setTooltip] = useState({ visible: false, text: "", x: 0, y: 0 });

    const show = (text: string, e: MouseEvent<HTMLAnchorElement>) =>
        setTooltip({ visible: true, text, x: e.clientX, y: e.clientY });
    const hide = () => setTooltip((prev) => ({ ...prev, visible: false }));

    useEffect(() => {
        const onMove = (e: globalThis.MouseEvent) =>
            setTooltip((prev) => (prev.visible ? { ...prev, x: e.clientX, y: e.clientY } : prev));
        window.addEventListener("mousemove", onMove);
        return () => window.removeEventListener("mousemove", onMove);
    }, []);

    return (
        <>
            <ul className={styles.socialList}>
                {socialLinks.map(({ href, name, hint, Icon }) => (
                    <li key={href}>
                        <a
                            href={href}
                            className={styles.socialLink}
                            target={href.startsWith("http") ? "_blank" : undefined}
                            rel={href.startsWith("http") ? "noreferrer" : undefined}
                            onMouseEnter={(e) => show(`${name} — ${hint}`, e)}
                            onMouseLeave={hide}
                        >
                            <span className={styles.socialIcon} aria-hidden="true">
                                <Icon size={22} strokeWidth={1.75} />
                            </span>
                            <span>
                                <span className={styles.socialName}>{name}</span>
                                <span className={styles.socialHint}>{hint}</span>
                            </span>
                        </a>
                    </li>
                ))}
            </ul>

            <div
                className={`${styles.tooltip} ${tooltip.visible ? styles.tooltipVisible : ""}`}
                style={{ left: tooltip.x + 18, top: tooltip.y + 18 }}
                aria-hidden="true"
            >
                {tooltip.text}
            </div>
        </>
    );
}
