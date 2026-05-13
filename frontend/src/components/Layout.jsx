import React from "react";
import Nav from "./Nav";
import Footer from "./Footer";
import { useLocation } from "react-router-dom";

export const Layout = ({ children }) => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  return (
    <div
      className={isAdmin ? "min-h-screen theme-dark" : "min-h-screen"}
      style={{ backgroundColor: "var(--app-bg)", color: "var(--app-text)" }}
    >
      <Nav />
      <main className={isAdmin ? "" : "pt-16 md:pt-20"}>{children}</main>
      {!isAdmin && <Footer />}
    </div>
  );
};

export default Layout;
