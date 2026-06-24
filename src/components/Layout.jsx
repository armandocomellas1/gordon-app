import { Link, NavLink, useLocation } from "react-router-dom";
import { Gem, LogOut, ShieldCheck, Menu, X } from "lucide-react";
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

export default function Layout({ children }) {
  const { t } = useI18n();
  const { user, isAdmin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const loc = useLocation();

  const items = navItems(t, isAdmin);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="container flex h-16 items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-primary to-purple-700 text-white">
              <Gem className="h-5 w-5" />
            </span>
            <span className="leading-none">
              <span className="block text-sm font-extrabold">{t("app.title")}</span>
              <span className="block text-[11px] text-muted-foreground">{t("app.subtitle")}</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {items.map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                end={it.end}
                className={({ isActive }) =>
                  cn(
                    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground",
                    it.admin && "text-primary"
                  )
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
              onClick={() => setOpen((v) => !v)}
              aria-label="Menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="border-t border-border bg-background md:hidden">
            <div className="container flex flex-col gap-1 py-3">
              {items.map((it) => (
                <NavLink
                  key={it.to}
                  to={it.to}
                  end={it.end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "rounded-md px-3 py-2 text-sm font-medium",
                      isActive ? "bg-secondary" : "text-muted-foreground"
                    )
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

      <footer className="border-t border-border/70 py-8">
        <div className="container flex flex-col items-center gap-5">
          <SocialLinks withLabel />
          <div className="flex w-full flex-col items-center justify-between gap-3 text-sm text-muted-foreground md:flex-row">
            <span>
              © {new Date().getFullYear()} {t("app.title")} · {t("footer.rights")}
            </span>
            <div className="flex items-center gap-3">
              {IS_DEMO && (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                  {t("footer.demo")}
                </span>
              )}
              <a href="https://www.doctorgavrielov.co.il" target="_blank" rel="noreferrer" className="hover:text-foreground">
                doctorgavrielov.co.il
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
