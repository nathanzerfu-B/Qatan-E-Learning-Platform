import { useState, useEffect, useContext } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { InstructorContext } from './Instructor';

const InstructorDashboard = () => {
  const { darkMode, toggleDarkMode, handleLogout } = useContext(InstructorContext);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const navigate = useNavigate();

  // Removed duplicate data fetching - handled in Instructor.jsx context

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isMobile) {
    return (
      <div className={`instructor-container ${darkMode ? 'dark' : ''}`}>
        {/* Mobile overlay */}
        {isMobileMenuOpen && (
          <div className="mobile-overlay" onClick={() => setIsMobileMenuOpen(false)} />
        )}

        {/* Mobile Sidebar */}
        <Sidebar
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          isMobileMenuOpen={isMobileMenuOpen}
          toggleMobileMenu={toggleMobileMenu}
          handleLogout={handleLogout}
          className={`instructor-sidebar ${darkMode ? 'dark' : ''} ${isMobileMenuOpen ? 'open' : ''}`}
        />

        {/* Mobile Content */}
        <div className={`instructor-content ${darkMode ? 'dark' : ''}`}>
          {/* Mobile hamburger button */}
          <button className="mobile-menu-button" onClick={toggleMobileMenu}>
            <span></span>
            <span></span>
            <span></span>
          </button>

          <button style={{ backgroundColor: 'rgba(59, 130, 246, 0.8)', color: '#ffffff', border: '1px solid rgba(59,130,246,0.2)', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', marginBottom: '20px' }} onClick={() => navigate('/')}>← Back to Main</button>

          <Outlet />
        </div>
      </div>
    );
  }

  return (
    <div className={`instructor-container ${darkMode ? 'dark' : ''}`}>
      {/* Desktop Sidebar */}
      <Sidebar
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        handleLogout={handleLogout}
        className={`instructor-sidebar ${darkMode ? 'dark' : ''}`}
      />

      {/* Desktop Content */}
      <div className={`instructor-content ${darkMode ? 'dark' : ''}`}>
        <button style={{ backgroundColor: 'rgba(59, 130, 246, 0.8)', color: '#ffffff', border: '1px solid rgba(59,130,246,0.2)', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', marginBottom: '20px' }} onClick={() => navigate('/')}>← Back to Main</button>
        <Outlet />
      </div>
    </div>
  );
};

export default InstructorDashboard;
