import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import ThemedText from './ThemedText'

export default function AdminNavigation({ sidebarOpen, toggleSidebar, darkTheme, toggleTheme }) {
  const location = useLocation()
  const { logout } = useAuth()

  const navItems = [
    { path: '', label: 'Dashboard', icon: 'dashboard' },
    { path: 'users', label: 'Users', icon: 'users' },
    { path: 'courses', label: 'Courses', icon: 'course' },
    { path: 'approvals', label: 'Approvals', icon: 'approvals' },
    { path: 'reports', label: 'Reports', icon: 'report' },
    { path: 'settings', label: 'Settings', icon: 'settings' },
    { path: 'logout', label: 'Logout', icon: 'logout' },
  ]

  return (
    <>
      <button className={`admin-mobile-menu-toggle ${sidebarOpen ? 'admin-active' : ''}`} onClick={toggleSidebar}>
        <span></span>
        <span></span>
        <span></span>
      </button>

      <aside className={`admin-sidebar ${sidebarOpen ? 'admin-open' : ''}`}>
        <div className="admin-sidebar-header">
          <h2>Admin Panel</h2>
          <label className="admin-switch">
            <input type="checkbox" checked={darkTheme} onChange={toggleTheme} />
            <span className="admin-slider"></span>
            <span className="admin-decoration"></span>
          </label>
        </div>

        <nav className="admin-nav-menu">
          {navItems.map((item) => {
            const basePath = '/admin';
            const fullPath = `${basePath}${item.path ? `/${item.path}` : ''}`;
            const isActive = location.pathname === fullPath || location.pathname === `${fullPath}/`;
            let iconName;

            // Handle special cases for image naming with exact filenames
            if (isActive) {
              switch (item.icon) {
                case 'users':
                  iconName = 'users-hover-blue';
                  break;
                case 'approvals':
                  iconName = 'approvals-hover-blue';
                  break;
                case 'settings':
                  iconName = 'settings-hover-blue';
                  break;
                case 'course':
                  iconName = 'courses-hover-blue';
                  break;
                case 'report':
                  iconName = 'reports-hover-blue';
                  break;
                case 'logout':
                  iconName = 'logout-hover-blue';
                  break;
                default:
                  iconName = `${item.icon}-hover-blue`;
              }
            } else {
              switch (item.icon) {
                case 'approvals':
                  iconName = 'approvals-gray';
                  break;
                case 'course':
                  iconName = 'courses-gray';
                  break;
                case 'report':
                  iconName = 'reports-gray';
                  break;
                case 'logout':
                  iconName = 'logout-grey';
                  break;
                default:
                  iconName = `${item.icon}-gray`;
              }
            }

            if (item.path === 'logout') {
              return (
                <div
                  key={item.path}
                  className={`admin-nav-item ${isActive ? 'admin-active' : ''}`}
                  onClick={() => {
                    logout();
                    toggleSidebar();
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <span className="admin-nav-icon">
                    <img
                      src={`/img/${iconName.toLowerCase()}.png`}
                      alt={item.label}
                      className="admin-nav-icon-img"
                    />
                  </span>
                  <ThemedText className="admin-nav-text" variant={isActive ? 'info' : 'default'}>
                    {item.label}
                  </ThemedText>
                </div>
              );
            }

            return (
              <Link
                key={item.path}
                to={fullPath}
                className={`admin-nav-item ${isActive ? 'admin-active' : ''}`}
                onClick={toggleSidebar}
              >
                <span className="admin-nav-icon">
                  <img
                    src={`/img/${iconName.toLowerCase()}.png`}
                    alt={item.label}
                    className="admin-nav-icon-img"
                  />
                </span>
                <ThemedText className="admin-nav-text" variant={isActive ? 'info' : 'default'}>
                  {item.label}
                </ThemedText>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  )
}
