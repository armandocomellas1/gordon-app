import { Link, NavLink, useLocation } from "react-router-dom";
import { LogOut, ShieldCheck, Menu, X } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/i18n";
import { useAuth } from "@/hooks/useAuth";
import { IS_DEMO } from "@/api/base44Client";
import LanguageSwitch from "./LanguageSwitch";
import SocialLinks from "./SocialLinks";
import ThemeToggle from "./ThemeToggle";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

// Menu mirrors english.doctorgavrielov.co.il. Items without a page yet
// (Store, Stone Apothecary, Clinic) are shown but inert ("coming soon").
function mainMenu(t) {
  return [
    { to: "/", label: t("nav.crystalHealing"), end: true },
    { to: "/about", label: t("nav.about") },
    { soon: true, label: t("nav.store") },
    { to: "/stones", label: t("nav.crystalSecrets") },
    { to: "/lectures", label: t("nav.courses") },
    { soon: true, label: t("nav.apothecary") },
    { soon: true, label: t("nav.clinic") },
    { to: "/contact", label: t("nav.contact") },
    { to: "/company-policy", label: t("nav.policy") },
  ];
}

function MenuLink({ item, t, onClick }) {
  if (item.soon) {
    return (
      <span className="nav-soon" title={t("common.soon")}>
        {item.label}
      </span>
    );
  }
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onClick}
      className={({ isActive }) => cn("nav-link", isActive && "is-active")}
    >
      {item.label}
    </NavLink>
  );
}

export default function Layout({ children }) {
  const { t } = useI18n();
  const { user, isAdmin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const loc = useLocation();

  const items = mainMenu(t);

  return (
    <div className="flex min-h-screen flex-col">
      {/* The `dark` class scopes child controls to dark tokens so they stay
          legible on the charcoal chrome, whatever the page theme. */}
      <header className="dark">
        {/* Banner — gold serif name + the doctor's photo, like the original site. */}
        <div className="site-banner">
          <div className="container flex items-center justify-between gap-4 py-3 md:py-5">
            <Link to="/" className="min-w-0">
              <span
                className="block font-display text-sm font-bold leading-tight md:text-lg"
                style={{ color: "#e9c860", textShadow: "0 1px 2px rgba(0,0,0,.5)" }}
              >
                {t("banner.welcome")}
              </span>
              <span className="banner-title block text-2xl md:text-4xl lg:text-5xl">
                {t("banner.name")}
              </span>
            </Link>
            <img
              src="/dr-gavrielov.jpg"
              alt={t("instructor.name")}
              className="h-16 w-auto rounded-md object-cover shadow-md ring-1 ring-[hsl(var(--gold)/0.4)] sm:h-24 md:h-32"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          </div>
        </div>

        {/* Navigation bar — dark charcoal with white→gold links. */}
        <div className="site-chrome sticky top-0 z-40 border-b">
          <div className="gold-rule" />
          <div className="container flex items-center gap-2 py-1.5">
            <nav className="hidden flex-wrap items-center gap-0.5 md:flex">
              {items.map((it) => (
                <MenuLink key={it.label} item={it} t={t} />
              ))}
              {user && (
                <NavLink
                  to="/account"
                  className={({ isActive }) => cn("nav-link", isActive && "is-active")}
                >
                  {t("nav.account")}
                </NavLink>
              )}
              {isAdmin && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) => cn("nav-link is-active", !isActive && "text-gold")}
                >
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {t("nav.admin")}
                  </span>
                </NavLink>
              )}
            </nav>

            <div className="ms-auto flex items-center gap-2">
              <ThemeToggle />
              <LanguageSwitch className="hidden sm:inline-flex" />
              {user ? (
                <Button variant="ghost" size="sm" onClick={logout} className="hidden md:inline-flex">
                  <LogOut className="h-4 w-4" />
                  {t("nav.logout")}
                </Button>
              ) : (
                <Button asChild size="sm" className="hidden md:inline-flex">
                  <Link to="/login">{t("nav.login")}</Link>
                </Button>
              )}
              <button
                className="grid h-9 w-9 place-items-center rounded-md md:hidden"
                style={{ color: "hsl(var(--on-ink))" }}
                onClick={() => setOpen((v) => !v)}
                aria-label="Menu"
              >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {open && (
            <div className="border-t bg-ink md:hidden">
              <div className="container flex flex-col gap-0.5 py-3">
                {items.map((it) => (
                  <MenuLink key={it.label} item={it} t={t} onClick={() => setOpen(false)} />
                ))}
                {user && (
                  <NavLink to="/account" onClick={() => setOpen(false)} className="nav-link">
                    {t("nav.account")}
                  </NavLink>
                )}
                {isAdmin && (
                  <NavLink to="/admin" onClick={() => setOpen(false)} className="nav-link text-gold">
                    {t("nav.admin")}
                  </NavLink>
                )}
                <div className="mt-2 flex items-center justify-between">
                  <LanguageSwitch />
                  {user ? (
                    <Button variant="ghost" size="sm" onClick={logout}>
                      <LogOut className="h-4 w-4" />
                      {t("nav.logout")}
                    </Button>
                  ) : (
                    <Button asChild size="sm">
                      <Link to="/login" onClick={() => setOpen(false)}>
                        {t("nav.login")}
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1" key={loc.pathname}>
        {children}
      </main>

      <footer className="dark site-chrome border-t">
        <div className="gold-rule" />
        <div className="container flex flex-col items-center gap-5 py-8">
          <SocialLinks withLabel />
          <div
            className="flex w-full flex-col items-center justify-between gap-3 text-sm md:flex-row"
            style={{ color: "hsl(var(--on-ink) / 0.7)" }}
          >
            <span>
              © {new Date().getFullYear()} {t("app.title")} · {t("footer.rights")}
            </span>
            <div className="flex items-center gap-3">
              {IS_DEMO && (
                <span
                  className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                  style={{ background: "hsl(var(--gold) / 0.15)", color: "hsl(var(--gold))" }}
                >
                  {t("footer.demo")}
                </span>
              )}
              <a
                href="https://www.doctorgavrielov.co.il"
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-gold"
              >
                doctorgavrielov.co.il
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
