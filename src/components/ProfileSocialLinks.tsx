"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./ProfileSocialLinks.module.css";

type Network = "email" | "instagram" | "discord" | "linkedin";
type Contact = { network: Network; label: string; account: string; href?: string; copy?: boolean };
type Props = {
  email?: string | null;
  instagram?: string | null;
  discord?: string | null;
  linkedin?: string | null;
  english?: boolean;
};

function socialUrl(value: string, hosts: string[]): URL | null {
  try {
    const raw = /^https?:\/\//i.test(value) ? value : "https://" + value;
    const url = new URL(raw);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.port || !hosts.includes(url.hostname.toLowerCase())) return null;
    url.protocol = "https:";
    url.search = "";
    url.hash = "";
    return url;
  } catch {
    return null;
  }
}

function instagramContact(raw: string | null | undefined): Contact | null {
  const value = raw?.trim();
  if (!value) return null;
  const handle = value.replace(/^@/, "");
  if (/^[a-zA-Z0-9._]{1,30}$/.test(handle)) {
    return { network: "instagram", label: "Instagram", account: "@" + handle, href: "https://www.instagram.com/" + encodeURIComponent(handle) + "/" };
  }
  const url = socialUrl(value, ["instagram.com", "www.instagram.com", "m.instagram.com"]);
  if (!url) return null;
  const name = url.pathname.split("/").filter(Boolean)[0];
  const account = name && !["p", "reel", "reels", "stories", "explore"].includes(name)
    ? "@" + name : "instagram.com" + url.pathname.replace(/\/$/, "");
  return { network: "instagram", label: "Instagram", account, href: url.toString() };
}

function discordContact(raw: string | null | undefined): Contact | null {
  const value = raw?.trim();
  if (!value) return null;
  if (/^\d{17,20}$/.test(value)) {
    return { network: "discord", label: "Discord", account: value, href: "https://discord.com/users/" + value };
  }
  const url = socialUrl(value, ["discord.com", "www.discord.com", "discordapp.com", "www.discordapp.com", "discord.gg", "www.discord.gg"]);
  if (url) {
    const userId = url.pathname.match(/^\/users\/(\d{17,20})\/?$/)?.[1];
    return { network: "discord", label: "Discord", account: userId || url.hostname.replace(/^www\./, "") + url.pathname.replace(/\/$/, ""), href: url.toString() };
  }
  // Discord usernames do not have a public profile URL. Copy the supplied handle.
  return { network: "discord", label: "Discord", account: value, copy: true };
}

function linkedinContact(raw: string | null | undefined): Contact | null {
  const value = raw?.trim();
  if (!value) return null;
  const url = socialUrl(value, ["linkedin.com", "www.linkedin.com", "m.linkedin.com"]);
  if (!url) return null;
  const segments = url.pathname.split("/").filter(Boolean);
  let account = segments[segments.length - 1] || "linkedin.com";
  try { account = decodeURIComponent(account); } catch { /* Keep malformed escapes as plain text. */ }
  return { network: "linkedin", label: "LinkedIn", account, href: url.toString() };
}

function NetworkIcon({ network }: { network: Network }) {
  if (network === "instagram") return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>;
  if (network === "discord") return <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515c-.211.375-.457.881-.627 1.283a18.39 18.39 0 0 0-5.417 0 13.58 13.58 0 0 0-.635-1.283A19.73 19.73 0 0 0 3.864 4.37C.773 8.948-.065 13.413.354 17.815a19.9 19.9 0 0 0 5.993 3.03c.483-.659.914-1.359 1.287-2.095a12.9 12.9 0 0 1-2.027-.987c.17-.124.337-.253.498-.386 3.91 1.808 8.157 1.808 12.02 0 .164.133.331.262.499.386a12.98 12.98 0 0 1-2.031.989c.373.735.804 1.435 1.287 2.092a19.84 19.84 0 0 0 6.002-3.03c.49-5.103-.838-9.528-3.565-13.444ZM8.02 15.12c-1.174 0-2.137-1.072-2.137-2.378 0-1.307.943-2.38 2.137-2.38 1.194 0 2.157 1.083 2.137 2.38 0 1.306-.943 2.378-2.137 2.378Zm7.897 0c-1.175 0-2.137-1.072-2.137-2.378 0-1.307.942-2.38 2.137-2.38 1.194 0 2.156 1.083 2.136 2.38 0 1.306-.942 2.378-2.136 2.378Z" /></svg>;
  if (network === "linkedin") return <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM3.3 8.5h3.4V21H3.3ZM9.2 8.5h3.3v1.7c.7-1.3 2-2 3.5-2 3.5 0 4.2 2.3 4.2 5.3V21h-3.4v-6.7c0-1.6-.1-3-1.9-3-1.9 0-2.3 1.4-2.3 2.9V21H9.2Z" /></svg>;
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7 8 6 8-6" /></svg>;
}

function ActionIcon({ copy }: { copy?: boolean }) {
  return copy ? <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V4H4v12h4" /></svg>
    : <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7M7 7h10v10" /></svg>;
}

export default function ProfileSocialLinks({ email, instagram, discord, linkedin, english = false }: Props) {
  const [feedback, setFeedback] = useState("");
  const [copyFailed, setCopyFailed] = useState(false);
  const [copying, setCopying] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyBusy = useRef(false);
  useEffect(() => () => { if (timeout.current) clearTimeout(timeout.current); }, []);

  const contacts: Contact[] = [];
  const address = email?.trim();
  if (address && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
    contacts.push({ network: "email", label: "Email", account: address, href: "mailto:" + encodeURIComponent(address) });
  }
  for (const contact of [instagramContact(instagram), discordContact(discord), linkedinContact(linkedin)]) {
    if (contact) contacts.push(contact);
  }

  const copyHandle = async (account: string) => {
    if (copyBusy.current) return;
    copyBusy.current = true;
    setCopying(true);
    if (timeout.current) clearTimeout(timeout.current);
    try {
      await navigator.clipboard.writeText(account);
      setCopyFailed(false);
      setFeedback(english ? "Discord username copied." : "Pseudo Discord copié.");
      timeout.current = setTimeout(() => setFeedback(""), 4000);
    } catch {
      setCopyFailed(true);
      setFeedback(english ? "Copy this Discord username manually:" : "Copiez ce pseudo Discord manuellement :");
    } finally {
      copyBusy.current = false;
      setCopying(false);
    }
  };

  if (!contacts.length) return null;

  return <div className={styles.root}>
    <ul className={styles.list}>
      {contacts.map(contact => {
        const actionLabel = contact.copy ? (english ? "Copy username" : "Copier le pseudo")
          : contact.network === "email" ? (english ? "Send an email" : "Envoyer un email") : (english ? "Open profile" : "Ouvrir le profil");
        const content = <>
          <span className={styles.icon}><NetworkIcon network={contact.network} /></span>
          <span className={styles.labels} aria-hidden="true">
            <span className={styles.networkLabel}>{contact.label}</span>
            <span className={styles.accountLabel}>{contact.account}</span>
          </span>
          <span className={styles.action}><ActionIcon copy={contact.copy} /></span>
        </>;
        const className = styles.item + " " + styles[contact.network];
        const accessibleName = contact.label + " : " + contact.account + ". " + actionLabel;
        return <li key={contact.network}>
          {contact.copy ? <button type="button" className={className} onClick={() => void copyHandle(contact.account)} aria-label={accessibleName} aria-busy={copying}>{content}</button>
            : <a className={className} href={contact.href} target={contact.network === "email" ? undefined : "_blank"} rel={contact.network === "email" ? undefined : "noopener noreferrer"} aria-label={accessibleName}>{content}</a>}
        </li>;
      })}
    </ul>
    <div className={styles.feedback} role="status" aria-live="polite" aria-atomic="true">
      {feedback}
      {copyFailed && <span className={styles.manualCopy}>{discord?.trim()}</span>}
    </div>
  </div>;
}
