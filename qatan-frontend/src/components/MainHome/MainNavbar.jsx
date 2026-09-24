import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const loc = useLocation();

  const { user, logout, isAuthenticated, darkMode, setDarkMode } = useAuth();

  const getDashboardPath = (role) => {
    if (role?.toLowerCase() === 'admin') return '/admin/dashboard';
    if (role?.toLowerCase() === 'student') return '/student/home';
    if (role?.toLowerCase() === 'instructor') return '/instructor/dashboard';
    return '/';
  };

  useEffect(() => {
    setOpen(false);
  }, [loc.pathname]);

  useEffect(() => {
    document.body.classList.toggle('dark', darkMode);
  }, [darkMode]);

  return (
    <header className={`Main-navbar ${darkMode ? "dark" : ""}`}>
      <div className="Main-navbar-container">
        <div className="Main-navbar-logo">
          <Link
            to="/"
            className={`Main-navbar-logo-link ${darkMode ? "dark" : ""}`}
            aria-label="Qatan logo"
          >
            Qatan.
          </Link>
        </div>

        <nav className="Main-navbar-nav">
          <Link
            to="/"
            className={`Main-navbar-link ${darkMode ? "dark" : ""}`}
          >
            Home
          </Link>
          <Link
            to="/courses"
            className={`Main-navbar-link ${darkMode ? "dark" : ""}`}
          >
            Courses
          </Link>
          {isAuthenticated() && (
            <Link
              to={getDashboardPath(user.role)}
              className={`Main-navbar-link ${darkMode ? "dark" : ""}`}
            >
              Dashboard
            </Link>
          )}
          <Link
            to="/about"
            className={`Main-navbar-link ${darkMode ? "dark" : ""}`}
          >
            About
          </Link>
        </nav>

        <div className="Main-navbar-actions">
          {isAuthenticated() ? (
            <button
              onClick={logout}
              className="Main-navbar-login-btn"
            >
              Logout
            </button>
          ) : (
            <>
              <Link
                to="/login"
                state={{ from: loc }}
                className="Main-navbar-login-btn"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="Main-navbar-signup-btn hidden sm:inline-block"
              >
                Sign Up
              </Link>
            </>
          )}

          <button
            className={`Main-navbar-dark-toggle`}
            onClick={() => setDarkMode(!darkMode)}
            aria-label="Toggle dark mode"
            title="Toggle dark mode"
          >
            {darkMode ? "☀️" : "🌙"}
          </button>

          <button
            className={`Main-navbar-menu-toggle`}
            onClick={() => setOpen((o) => !o)}
            aria-label="menu"
          >
            ☰
          </button>
        </div>
      </div>

      {/* Mobile nav backdrop */}
      {open && (
        <div
          className="Main-mobile-nav-backdrop"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile nav drawer */}
      <div
        className={`Main-mobile-nav ${open ? "open" : ""}`}
      >
        <div className="Main-mobile-nav-menu">
          <div className="flex justify-between items-center pb-3 border-b border-[#a8b2d2]/40 dark:border-[#4b5563]/40 mb-2">
            <span className="font-bold text-lg text-foreground">Menu</span>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground text-sm font-bold"
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>

          <div className="Main-mobile-nav-list">
            <Link
              to="/"
              className="Main-mobile-nav-link"
              onClick={() => setOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/courses"
              className="Main-mobile-nav-link"
              onClick={() => setOpen(false)}
            >
              Courses
            </Link>
            {isAuthenticated() && (
              <Link
                to={getDashboardPath(user.role)}
                className="Main-mobile-nav-link"
                onClick={() => setOpen(false)}
              >
                Dashboard
              </Link>
            )}
            <Link
              to="/about"
              className="Main-mobile-nav-link"
              onClick={() => setOpen(false)}
            >
              About
            </Link>

            <div className="pt-3 mt-1 border-t border-[#a8b2d2]/40 dark:border-[#4b5563]/40">
              {isAuthenticated() ? (
                <button
                  onClick={() => {
                    setOpen(false);
                    logout();
                  }}
                  className="w-full text-left Main-mobile-nav-link text-red-500 font-semibold"
                >
                  Logout ({user?.name || "Account"})
                </button>
              ) : (
                <div className="flex flex-col gap-2 pt-1">
                  <Link
                    to="/login"
                    state={{ from: loc }}
                    className="w-full text-center py-2 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-sm"
                    onClick={() => setOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="w-full text-center py-2 px-4 rounded-xl border border-primary text-primary hover:bg-primary/10 text-sm font-semibold transition-colors"
                    onClick={() => setOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
