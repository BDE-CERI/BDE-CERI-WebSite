"use client";

import Image from "next/image";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import styles from "./MobileNavigation.module.css";

export type NavigationLink = {
  href: string;
  label: string;
  icon: string;
  description: string;
};

type MobileNavigationProps = {
  links: NavigationLink[];
  pathname: string;
  lang: string;
  theme: string;
  onToggleTheme: () => void;
  onToggleLanguage: () => Promise<void>;
  member?: { first_name: string; last_name: string; photo_url?: string } | null;
  signedIn: boolean;
};

type ScrollLock = {
  scrollY: number;
  styles: Pick<CSSStyleDeclaration, "position" | "top" | "left" | "right" | "width" | "overflow" | "paddingRight" | "transition">;
};

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;
const dockRoutes = ["/", "/evenement", "/boutique"];

function isCurrentRoute(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
}

function Icon({ name, className = "" }: { name: string; className?: string }) {
  return <span aria-hidden="true" className={"material-symbols-outlined " + className}>{name}</span>;
}

export default function MobileNavigation({
  links,
  pathname,
  lang,
  theme,
  onToggleTheme,
  onToggleLanguage,
  member,
  signedIn,
}: MobileNavigationProps) {
  const mounted = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  const [isOpen, setIsOpen] = useState(false);
  const [changingLanguage, setChangingLanguage] = useState(false);
  const [languageError, setLanguageError] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const restoreFocusRef = useRef(true);
  const closingTimerRef = useRef<number | null>(null);
  const scrollLockRef = useRef<ScrollLock | null>(null);
  const menuId = useId();
  const titleId = useId();
  const english = lang === "en";
  const copy = english ? {
    menu: "Menu",
    open: "Open the menu",
    close: "Close the menu",
    navigation: "Main navigation",
    title: "Explore the CERI",
    subtitle: "Events, the team and everything happening at the BDE.",
    highlights: "What's happening",
    association: "The BDE",
    contact: "Stay in touch",
    more: "More to explore",
    here: "You are here",
    preferences: "Your preferences",
    language: "Language",
    changeLanguage: "Switch to French",
    languageError: "Language could not be changed. Please try again.",
    appearance: "Appearance",
    light: "Light mode",
    dark: "Dark mode",
    account: "Your space",
    profile: "My profile",
    profileDescription: "Your member space",
    settings: "Account settings",
    settingsDescription: "Email, password and preferences",
    home: "Home",
    events: "Events",
    shop: "Shop",
  } : {
    menu: "Menu",
    open: "Ouvrir le menu",
    close: "Fermer le menu",
    navigation: "Navigation principale",
    title: "Explorez le CERI",
    subtitle: "Les événements, l’équipe et toute la vie du BDE.",
    highlights: "À la une",
    association: "Le BDE",
    contact: "Gardons le contact",
    more: "À découvrir",
    here: "Vous êtes ici",
    preferences: "Vos préférences",
    language: "Langue",
    changeLanguage: "Passer en anglais",
    languageError: "Le changement de langue a échoué. Réessayez.",
    appearance: "Apparence",
    light: "Mode clair",
    dark: "Mode sombre",
    account: "Votre espace",
    profile: "Mon profil",
    profileDescription: "Votre espace membre",
    settings: "Paramètres du compte",
    settingsDescription: "E-mail, mot de passe et préférences",
    home: "Accueil",
    events: "Événements",
    shop: "Boutique",
  };

  const restorePage = useCallback(() => {
    const saved = scrollLockRef.current;
    if (!saved) return;
    scrollLockRef.current = null;
    Object.assign(document.body.style, saved.styles);
    window.scrollTo(0, saved.scrollY);
  }, []);

  const closeMenu = useCallback((immediately = false, restoreFocus = true) => {
    const dialog = dialogRef.current;
    if (!dialog?.open) return;
    restoreFocusRef.current = restoreFocus;
    if (closingTimerRef.current !== null) window.clearTimeout(closingTimerRef.current);
    if (immediately || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      restorePage();
      dialog.close();
      return;
    }
    dialog.dataset.closing = "true";
    closingTimerRef.current = window.setTimeout(() => {
      closingTimerRef.current = null;
      if (dialog.open) dialog.close();
    }, 180);
  }, [restorePage]);

  const openMenu = useCallback((trigger: HTMLButtonElement) => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open || window.matchMedia("(min-width: 1024px)").matches) return;
    returnFocusRef.current = trigger;
    restoreFocusRef.current = true;
    delete dialog.dataset.closing;

    const body = document.body;
    scrollLockRef.current = {
      scrollY: window.scrollY,
      styles: {
        position: body.style.position,
        top: body.style.top,
        left: body.style.left,
        right: body.style.right,
        width: body.style.width,
        overflow: body.style.overflow,
        paddingRight: body.style.paddingRight,
        transition: body.style.transition,
      },
    };
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const currentPadding = Number.parseFloat(window.getComputedStyle(body).paddingRight) || 0;
    Object.assign(body.style, {
      transition: "none",
      position: "fixed",
      top: "-" + window.scrollY + "px",
      left: "0",
      right: "0",
      width: "100%",
      overflow: "hidden",
      paddingRight: currentPadding + scrollbarWidth + "px",
    });
    try {
      dialog.showModal();
      setIsOpen(true);
    } catch {
      restorePage();
      returnFocusRef.current = null;
      trigger.focus({ preventScroll: true });
    }
  }, [restorePage]);

  const handleDialogClose = useCallback(() => {
    if (closingTimerRef.current !== null) {
      window.clearTimeout(closingTimerRef.current);
      closingTimerRef.current = null;
    }
    if (dialogRef.current) delete dialogRef.current.dataset.closing;
    restorePage();
    setIsOpen(false);
    const trigger = returnFocusRef.current || triggerRef.current;
    returnFocusRef.current = null;
    if (restoreFocusRef.current && trigger?.isConnected && trigger.getClientRects().length) trigger.focus({ preventScroll: true });
  }, [restorePage]);

  useEffect(() => {
    closeMenu(true, false);
  }, [pathname, closeMenu]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const handleBreakpoint = () => {
      if (desktop.matches) closeMenu(true, false);
    };
    desktop.addEventListener("change", handleBreakpoint);
    return () => desktop.removeEventListener("change", handleBreakpoint);
  }, [closeMenu]);

  useEffect(() => {
    const dialog = dialogRef.current;
    return () => {
      if (closingTimerRef.current !== null) window.clearTimeout(closingTimerRef.current);
      dialog?.close();
      restorePage();
    };
  }, [mounted, restorePage]);

  const switchLanguage = async () => {
    setChangingLanguage(true);
    setLanguageError(false);
    try {
      await onToggleLanguage();
    } catch {
      setLanguageError(true);
    } finally {
      setChangingLanguage(false);
    }
  };

  const dockLinks = dockRoutes.map((href, index) => {
    const link = links.find((item) => item.href === href);
    return {
      href,
      label: [copy.home, copy.events, copy.shop][index],
      icon: link?.icon || ["home", "event", "storefront"][index],
      description: link?.description || "",
    };
  });
  const knownRoutes = ["/", "/evenement", "/boutique", "/poles", "/esport", "/equipe", "/contact"];
  const groups = [
    { label: copy.highlights, items: links.filter((link) => dockRoutes.includes(link.href)) },
    { label: copy.association, items: links.filter((link) => ["/poles", "/esport", "/equipe"].includes(link.href)) },
    { label: copy.contact, items: links.filter((link) => link.href === "/contact") },
    { label: copy.more, items: links.filter((link) => !knownRoutes.includes(link.href)) },
  ].filter((group) => group.items.length);
  const menuActive = isOpen || !dockLinks.some((link) => isCurrentRoute(pathname, link.href));
  const fullName = member ? [member.first_name, member.last_name].filter(Boolean).join(" ") : "";
  const initials = member ? ((member.first_name?.[0] || "") + (member.last_name?.[0] || "")) : "";

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-label={copy.open}
        aria-haspopup="dialog"
        aria-controls={menuId}
        aria-expanded={isOpen}
        onClick={(event) => openMenu(event.currentTarget)}
      >
        <Icon name="menu" />
        <span>{copy.menu}</span>
      </button>

      {mounted && createPortal(
        <>
          <nav className={styles.dock} data-theme={theme} aria-label={copy.navigation}>
            {dockLinks.map((link) => {
              const active = isCurrentRoute(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={styles.dockItem}
                  data-active={active || undefined}
                  aria-current={active ? "page" : undefined}
                  onClick={() => closeMenu(true, false)}
                >
                  <Icon name={link.icon} className={styles.dockIcon} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
            <button
              type="button"
              className={styles.dockItem}
              data-active={menuActive || undefined}
              aria-haspopup="dialog"
              aria-controls={menuId}
              aria-expanded={isOpen}
              onClick={(event) => openMenu(event.currentTarget)}
            >
              <Icon name={isOpen ? "close" : "grid_view"} className={styles.dockIcon} />
              <span>{copy.menu}</span>
            </button>
          </nav>

          <dialog
            ref={dialogRef}
            id={menuId}
            className={styles.dialog}
            data-theme={theme}
            aria-labelledby={titleId}
            onClose={handleDialogClose}
            onCancel={(event) => {
              event.preventDefault();
              closeMenu();
            }}
            onClick={(event) => {
              if (event.target !== event.currentTarget) return;
              const bounds = event.currentTarget.getBoundingClientRect();
              if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) {
                closeMenu();
              }
            }}
          >
            <div className={styles.sheet}>
              <div className={styles.handle} aria-hidden="true" />
              <header className={styles.sheetHeader}>
                <div>
                  <p className={styles.eyebrow}>BDE CERI</p>
                  <h2 id={titleId}>{copy.title}</h2>
                  <p className={styles.subtitle}>{copy.subtitle}</p>
                </div>
                <button type="button" className={styles.closeButton} aria-label={copy.close} onClick={() => closeMenu()}>
                  <Icon name="close" />
                </button>
              </header>

              <div className={styles.sheetContent}>
                <nav aria-label={copy.navigation}>
                  {groups.map((group) => (
                    <section className={styles.group} key={group.label} aria-label={group.label}>
                      <h3 className={styles.groupLabel}>{group.label}</h3>
                      <div className={styles.linkList}>
                        {group.items.map((link) => {
                          const active = isCurrentRoute(pathname, link.href);
                          return (
                            <Link
                              key={link.href}
                              href={link.href}
                              className={styles.menuLink}
                              data-active={active || undefined}
                              aria-current={active ? "page" : undefined}
                              onClick={() => closeMenu(true, false)}
                            >
                              <span className={styles.linkIcon}><Icon name={link.icon} /></span>
                              <span className={styles.linkCopy}>
                                <span className={styles.linkLabel}>{link.label}</span>
                                <span className={styles.linkDescription}>{active ? copy.here : link.description}</span>
                              </span>
                              <Icon name={active ? "check_circle" : "arrow_forward"} className={styles.linkArrow} />
                            </Link>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </nav>

                {signedIn && (
                  <section className={styles.group} aria-label={copy.account}>
                    <h3 className={styles.groupLabel}>{copy.account}</h3>
                    <div className={styles.linkList}>
                      <Link href="/profil?section=profile" className={styles.menuLink} onClick={() => closeMenu(true, false)}>
                        <span className={styles.avatar}>
                          {member?.photo_url ? (
                            <Image src={member.photo_url} alt="" width={44} height={44} className={styles.avatarImage} />
                          ) : initials ? (
                            <span>{initials}</span>
                          ) : <Icon name="person" />}
                        </span>
                        <span className={styles.linkCopy}>
                          <span className={styles.linkLabel}>{fullName || copy.profile}</span>
                          <span className={styles.linkDescription}>{copy.profileDescription}</span>
                        </span>
                        <Icon name="arrow_forward" className={styles.linkArrow} />
                      </Link>
                      <Link href="/profil?section=settings" className={styles.menuLink} onClick={() => closeMenu(true, false)}>
                        <span className={styles.linkIcon}><Icon name="settings" /></span>
                        <span className={styles.linkCopy}>
                          <span className={styles.linkLabel}>{copy.settings}</span>
                          <span className={styles.linkDescription}>{copy.settingsDescription}</span>
                        </span>
                        <Icon name="arrow_forward" className={styles.linkArrow} />
                      </Link>
                    </div>
                  </section>
                )}

                <section className={styles.preferences} aria-label={copy.preferences}>
                  <h3 className={styles.groupLabel}>{copy.preferences}</h3>
                  <div className={styles.preferenceGrid}>
                    <button
                      type="button"
                      className={styles.preferenceButton}
                      onClick={switchLanguage}
                      disabled={changingLanguage}
                      aria-label={copy.changeLanguage}
                      aria-busy={changingLanguage}
                    >
                      <Icon name="translate" />
                      <span className={styles.preferenceCopy}>
                        <span className={styles.preferenceLabel}>{copy.language}</span>
                        <span className={styles.languageChoices}>
                          <span data-active={!english || undefined}>FR</span>
                          <span aria-hidden="true">/</span>
                          <span data-active={english || undefined}>EN</span>
                        </span>
                      </span>
                      <Icon name="swap_horiz" className={styles.preferenceArrow} />
                    </button>
                    <button
                      type="button"
                      className={styles.preferenceButton}
                      onClick={onToggleTheme}
                      aria-label={theme === "dark" ? copy.light : copy.dark}
                    >
                      <Icon name={theme === "dark" ? "light_mode" : "dark_mode"} />
                      <span className={styles.preferenceCopy}>
                        <span className={styles.preferenceLabel}>{copy.appearance}</span>
                        <span className={styles.preferenceValue}>{theme === "dark" ? copy.dark : copy.light}</span>
                      </span>
                    </button>
                  </div>
                  {languageError && <p className={styles.error} role="alert">{copy.languageError}</p>}
                </section>
              </div>
            </div>
          </dialog>
        </>,
        document.body
      )}
    </>
  );
}
