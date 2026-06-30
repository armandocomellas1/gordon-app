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

function navItems(t, isAdmin) {
  const items = [
    { to: "/", label: t("nav.home"), end: true },
    { to: "/lectures", label: t("nav.lectures") },
    { to: "/stones", label: t("nav.stones") },
    { to: "/account", label: t("nav.account") },
  ];
  if (isAdmin) items.push({ to: "/admin", label: t("nav.admin"), admin: true });
  return items;
}

/* The brand identity is the NAME, not an icon — a gold serif monogram on
   charcoal (ג, the initial of גבריאלוב) keeps the Hebrew-first feel of the
   original site without a generic diamond. */
function Brand() {
  const { t } = useI18n();
  return (
    <Link to="/" className="flex items-center gap-3">
      <span className="brand-mark h-10 w-10 text-lg" aria-hidden>
        ג
      </span>
      <span className="leading-tight">
        <span className="block text-base font-extrabold tracking-wide" style={{ color: "hsl(var(--on-ink))" }}>
          {t("app.title")}
        </span>
        <span className="block text-[10.5px] font-medium tracking-wide" style={{ color: "hsl(var(--gold) / 0.85)" }}>
          {t("app.subtitle")}
        </span>
      </span>
    </Link>
  );
}

export default function Layout({ children }) {
  const { t } = useI18n();
  const { user, isAdmin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const loc = useLocation();

  const items = navItems(t, isAdmin);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header — always the dark charcoal + gold bar of doctorgavrielov.co.il.
          The `dark` class scopes child controls (toggles, buttons) to dark tokens. */}
      <header className="dark site-chrome sticky top-0 z-40 border-b">
        <div className="gold-rule" />
        <div className="container flex h-16 items-center justify-between gap-3">
          <Brand />

          <nav className="hidden items-center gap-1 md:flex">
            {items.map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                end={it.end}
                className={({ isActive }) =>
                  cn("nav-link", isActive && "is-active", it.admin && "text-gold")
                }
              >
                <span className="inline-flex items-center gap-1.5">
                  {it.admin && <ShieldCheck className="h-4 w-4" />}
                  {it.label}
                </span>
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
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
              className="grid h-10 w-10 place-items-center rounded-md md:hidden"
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
            <div className="container flex flex-col gap-1 py-3">
              {items.map((it) => (
                <NavLink
                  key={it.to}
                  to={it.to}
                  end={it.end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn("nav-link", isActive && "is-active", it.admin && "text-gold")
                  }
                >
                  {it.label}
                </NavLink>
              ))}
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
      </header>

      <main className="flex-1" key={loc.pathname}>
        {children}
      </main>

      <footer className="dark site-chrome border-t">
        <div className="gold-rule" />
        <div className="container flex flex-col items-center gap-5 py-8">
          <SocialLinks withLabel />
          <div className="flex w-full flex-col items-center justify-between gap-3 text-sm md:flex-row" style={{ color: "hsl(var(--on-ink) / 0.7)" }}>
            <span>
              © {new Date().getFullYear()} {t("app.title")} · {t("footer.rights")}
            </span>
            <div className="flex items-center gap-3">
              {IS_DEMO && (
                <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: "hsl(var(--gold) / 0.15)", color: "hsl(var(--gold))" }}>
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
