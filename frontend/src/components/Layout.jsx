import React from "react";
import Nav from "./Nav";
import Footer from "./Footer";
import CatalogButton from "./CatalogButton";
import { useLocation } from "react-router-dom";

export const Layout = ({ children }) => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <Nav />
      <main className={isAdmin ? "" : "pt-16 md:pt-20"}>{children}</main>
      {!isAdmin && <Footer />}
      {!isAdmin && <CatalogButton />}
    </div>
  );
};

export default Layout;
