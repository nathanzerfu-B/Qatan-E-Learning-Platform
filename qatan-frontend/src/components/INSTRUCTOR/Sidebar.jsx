import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({
  darkMode,
  toggleDarkMode,
  isMobileMenuOpen,
  toggleMobileMenu,
  handleLogout,
  className,
}) => {
  const location = useLocation();

  const isActive = (path) => location.pathname === `/instructor/dashboard${path}`;

  const handleLogoutClick = () => {
    if (isMobileMenuOpen) toggleMobileMenu();
    handleLogout();
  };

  return (
    <div className={`instructor-sidebar ${className}`}>
      <div className="instructor-sidebar-header">
        <h2>Instructor Panel</h2>
        <label className="instructor-switch">
          <input type="checkbox" checked={darkMode} onChange={toggleDarkMode} />
          <span className="instructor-slider"></span>
          <span className="instructor-decoration"></span>
        </label>
      </div>

      <nav className="instructor-sidebar-nav">
        <Link
          to="/instructor/dashboard/home"
          className={`instructor-nav-item ${isActive('/home') ? 'active' : ''}`}
          onClick={isMobileMenuOpen ? toggleMobileMenu : undefined}
        >
          <span className="instructor-nav-icon">
            <img
              src={isActive('/home') ? '/img/dashboard-hover-blue.png' : '/img/dashboard-gray.png'}
              alt="Home"
            />
          </span>
          <span className="instructor-nav-text">Home</span>
        </Link>

        <Link
          to="/instructor/dashboard/courses"
          className={`instructor-nav-item ${isActive('/courses') ? 'active' : ''}`}
          onClick={isMobileMenuOpen ? toggleMobileMenu : undefined}
        >
          <span className="instructor-nav-icon">
            <img
              src={isActive('/courses') ? '/img/courses-hover-blue.png' : '/img/courses-gray.png'}
              alt="Courses"
            />
          </span>
          <span className="instructor-nav-text">Courses</span>
        </Link>

        <Link
          to="/instructor/dashboard/quizzes"
          className={`instructor-nav-item ${isActive('/quizzes') ? 'active' : ''}`}
          onClick={isMobileMenuOpen ? toggleMobileMenu : undefined}
        >
          <span className="instructor-nav-icon">
            <img
              src={isActive('/quizzes') ? '/img/quizzes-hover-blue.png' : '/img/quizzes-gray.png'}
              alt="Quizzes"
            />
          </span>
          <span className="instructor-nav-text">Quizzes</span>
        </Link>

        <Link
          to="/instructor/dashboard/students"
          className={`instructor-nav-item ${isActive('/students') ? 'active' : ''}`}
          onClick={isMobileMenuOpen ? toggleMobileMenu : undefined}
        >
          <span className="instructor-nav-icon">
            <img
              src={isActive('/students') ? '/img/users-hover-blue.png' : '/img/users-gray.png'}
              alt="Students"
            />
          </span>
          <span className="instructor-nav-text">Students</span>
        </Link>

        <Link
          to="/instructor/dashboard/analytics"
          className={`instructor-nav-item ${isActive('/analytics') ? 'active' : ''}`}
          onClick={isMobileMenuOpen ? toggleMobileMenu : undefined}
        >
          <span className="instructor-nav-icon">
            <img
              src={isActive('/analytics') ? '/img/reports-hover-blue.png' : '/img/reports-gray.png'}
              alt="Analytics"
            />
          </span>
          <span className="instructor-nav-text">Analytics</span>
        </Link>

        <Link
          to="/instructor/dashboard/settings"
          className={`instructor-nav-item ${isActive('/settings') ? 'active' : ''}`}
          onClick={isMobileMenuOpen ? toggleMobileMenu : undefined}
        >
          <span className="instructor-nav-icon">
            <img
              src={isActive('/settings') ? '/img/settings-hover-blue.png' : '/img/settings-gray.png'}
              alt="Settings"
            />
          </span>
          <span className="instructor-nav-text">Settings</span>
        </Link>

        <button className="instructor-nav-item logout-btn" onClick={handleLogoutClick}>
          <span className="instructor-nav-icon">
            <img src="/img/logout-grey.png" alt="Logout" />
          </span>
          <span className="instructor-nav-text">Logout</span>
        </button>
      </nav>
    </div>
  );
};

export default Sidebar;
