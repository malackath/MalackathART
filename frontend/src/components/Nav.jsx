import React, { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useLang } from "../contexts/LanguageContext";
import { Menu, X } from "lucide-react";

export const Nav = () => {
  const { t, lang, toggle } = useLang();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const links = [
    { to: "/works", label: t.nav.works, id: "nav-works" },
    { to: "/exhibitions", label: t.nav.exhibitions, id: "nav-exhibitions" },
    { to: "/about", label: t.nav.about, id: "nav-about" },
    { to: "/contact", label: t.nav.contact, id: "nav-contact" },
  ];

  // Hide nav on admin panel
  if (location.pathname.startsWith("/admin")) return null;

  return (
    <header
      data-testid="site-header"
      className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-[#050505]/70 border-b border-white/10"
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 h-16 md:h-20 flex items-center justify-between">
        <Link
          to="/"
          data-testid="nav-logo"
          className="font-display tracking-tighter text-lg md:text-xl font-medium hover:text-white/70 transition-colors"
        >
          ELENA CRUZ
        </Link>

        <nav className="hidden md:flex items-center gap-10">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              data-testid={l.id}
              className={({ isActive }) =>
                `text-sm tracking-wide uppercase transition-colors ${
                  isActive ? "text-white" : "text-white/60 hover:text-white"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <button
            data-testid="lang-toggle"
            onClick={toggle}
            className="text-xs tracking-[0.2em] uppercase text-white/70 hover:text-white transition-colors border border-white/20 px-3 py-1.5"
          >
            {lang === "es" ? "EN" : "ES"}
          </button>
          <button
            data-testid="nav-mobile-toggle"
            className="md:hidden text-white"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-white/10 bg-[#050505]">
          <div className="px-6 py-6 flex flex-col gap-4">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                data-testid={`${l.id}-mobile`}
                className={({ isActive }) =>
                  `text-base uppercase tracking-wide ${
                    isActive ? "text-white" : "text-white/60"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default Nav;
