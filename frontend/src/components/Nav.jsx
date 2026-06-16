import React, { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useLang } from "../contexts/LanguageContext";
import { useTheme } from "../contexts/ThemeContext";
import CatalogButton from "./CatalogButton";
import { Menu, X, Sun, Moon, Instagram } from "lucide-react";

export const Nav = () => {
  const { t, lang, toggle, siteName } = useLang();
  const { theme, toggle: toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const links = [
    { to: "/works", label: t.nav.works, id: "nav-works" },
    { to: "/exhibitions", label: t.nav.exhibitions, id: "nav-exhibitions" },
    { to: "/about", label: t.nav.about, id: "nav-about" },
    { to: "/contact", label: t.nav.contact, id: "nav-contact" },
  ];

  if (location.pathname.startsWith("/admin")) return null;

  return (
    <header
      data-testid="site-header"
      className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl border-b"
      style={{ backgroundColor: "var(--app-header-bg)", borderColor: "var(--app-border)" }}
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 h-16 md:h-20 flex items-center justify-between">
        <Link
          to="/"
          data-testid="nav-logo"
          className="font-display font-black tracking-tighter text-lg md:text-xl uppercase transition-colors"
          style={{ color: "var(--app-text)" }}
        >
          {siteName || "·"}
        </Link>

        <nav className="hidden md:flex items-center gap-10">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              data-testid={l.id}
              style={({ isActive }) => ({
                color: isActive ? "var(--app-text)" : "var(--app-text-soft)",
              })}
              className="text-sm tracking-wide uppercase font-medium transition-colors hover:!text-[var(--app-text)]"
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden sm:block">
            <CatalogButton compact />
          </div>

          {/* Instagram link */}
          <a
            href="https://instagram.com/bernardoarnelli"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="p-1.5 md:p-2 transition-all hover:scale-105 border"
            style={{
              color: "var(--app-text-soft)",
              borderColor: "var(--app-border-strong)",
            }}
          >
            <Instagram size={14} />
          </a>

          <button
            data-testid="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="text-xs uppercase border p-1.5 md:p-2 transition-all hover:scale-105"
            style={{
              color: "var(--app-text-soft)",
              borderColor: "var(--app-border-strong)",
            }}
          >
            {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          <div className="relative group">
            <button
              className="text-xs tracking-[0.2em] uppercase transition-colors border px-2.5 py-1.5 md:px-3 flex items-center gap-1.5"
              style={{ color: "var(--app-gold)", borderColor: "var(--app-gold)" }}
            >
              🔒
            </button>
            {/* Invisible bridge to prevent gap */}
            <div className="absolute right-0 top-full h-2 w-full" />
            <div className="absolute right-0 top-full pt-2 hidden group-hover:flex flex-col z-50 min-w-[160px]">
              <div className="border" style={{ backgroundColor: "var(--app-bg)", borderColor: "var(--app-border)" }}>
                <Link to="/admin"
                  className="block px-4 py-2.5 text-xs tracking-[0.15em] uppercase hover:bg-white/5 transition-colors"
                  style={{ color: "var(--app-gold)" }}>
                  Panel admin
                </Link>
              </div>
            </div>
          </div>

          <button
            data-testid="lang-toggle"
            onClick={toggle}
            className="text-xs tracking-[0.2em] uppercase transition-colors border px-2.5 py-1.5 md:px-3"
            style={{
              color: "var(--app-text-soft)",
              borderColor: "var(--app-border-strong)",
            }}
          >
            {lang === "es" ? "EN" : "ES"}
          </button>

          <button
            data-testid="nav-mobile-toggle"
            className="md:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
            style={{ color: "var(--app-text)" }}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div
          className="md:hidden border-t"
          style={{ backgroundColor: "var(--app-bg)", borderColor: "var(--app-border)" }}
        >
          <div className="px-6 py-6 flex flex-col gap-4">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                data-testid={`${l.id}-mobile`}
                style={({ isActive }) => ({
                  color: isActive ? "var(--app-text)" : "var(--app-text-soft)",
                })}
                className="text-base uppercase tracking-wide"
              >
                {l.label}
              </NavLink>
            ))}
            <a
              href="https://instagram.com/bernardoarnelli"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-base uppercase tracking-wide"
              style={{ color: "var(--app-text-soft)" }}
            >
              <Instagram size={16} /> Instagram
            </a>
            <div className="pt-4">
              <CatalogButton compact />
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Nav;
