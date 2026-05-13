import React from "react";
import { Link } from "react-router-dom";
import { useLang } from "../contexts/LanguageContext";

export const Footer = () => {
  const { t } = useLang();
  return (
    <footer
      data-testid="site-footer"
      className="border-t border-white/10 mt-24"
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-12 flex flex-col md:flex-row md:items-end md:justify-between gap-8">
        <div>
          <div className="font-display text-4xl md:text-5xl tracking-tighter leading-none">
            ELENA<br />CRUZ
          </div>
          <p className="mt-4 text-sm text-white/50 max-w-xs">
            Estudio entre Madrid y Buenos Aires.
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm text-white/60">
          <Link to="/works" className="hover:text-white">{t.nav.works}</Link>
          <Link to="/exhibitions" className="hover:text-white">{t.nav.exhibitions}</Link>
          <Link to="/about" className="hover:text-white">{t.nav.about}</Link>
          <Link to="/contact" className="hover:text-white">{t.nav.contact}</Link>
        </div>
        <div className="text-xs text-white/40 tracking-wide">
          © {new Date().getFullYear()} Elena Cruz. {t.footer.rights}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
