import React from "react";
import { Link } from "react-router-dom";
import { useLang } from "../contexts/LanguageContext";

export const Footer = () => {
  const { t, siteName } = useLang();
  const parts = (siteName || "").trim().split(/\s+/);
  const firstLine = parts[0] || "";
  const secondLine = parts.slice(1).join(" ");

  return (
    <footer
      data-testid="site-footer"
      className="border-t mt-24"
      style={{ borderColor: "var(--app-border)" }}
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-12 flex flex-col md:flex-row md:items-end md:justify-between gap-8">
        <div>
          <div
            className="font-display font-black text-4xl md:text-5xl tracking-tighter leading-[0.9] uppercase"
            style={{ color: "var(--app-text)" }}
          >
            {firstLine}
            {secondLine && (
              <>
                <br />
                {secondLine}
              </>
            )}
          </div>
        </div>
        <div
          className="flex flex-col gap-2 text-sm"
          style={{ color: "var(--app-text-soft)" }}
        >
          <Link to="/works" className="hover:!text-[var(--app-text)]">{t.nav.works}</Link>
          <Link to="/exhibitions" className="hover:!text-[var(--app-text)]">{t.nav.exhibitions}</Link>
          <Link to="/about" className="hover:!text-[var(--app-text)]">{t.nav.about}</Link>
          <Link to="/contact" className="hover:!text-[var(--app-text)]">{t.nav.contact}</Link>
        </div>
        <div
          className="text-xs tracking-wide"
          style={{ color: "var(--app-text-dim)" }}
        >
          © {new Date().getFullYear()} {siteName}. {t.footer.rights}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
