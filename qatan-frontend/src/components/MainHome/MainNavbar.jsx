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
                className="Main-navbar-signup-btn"
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

      {/* Mobile nav */}
      <div
        className={`Main-mobile-nav ${open ? "open" : ""}`}
      >
        <div className="Main-mobile-nav-menu">
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
              Course
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
          </div>
        </div>
      </div>
    </header>
  );
}
