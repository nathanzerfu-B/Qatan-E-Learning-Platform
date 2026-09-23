import { useState } from 'react'
import AdminNavigation from './AdminNavigation'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAppContext } from './context/AppContext'

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { darkTheme, toggleTheme } = useAppContext()
  const navigate = useNavigate()

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

  return (
    <div className={`admin-container ${darkTheme ? 'admin-dark-theme' : ''}`}>
      <AdminNavigation 
        sidebarOpen={sidebarOpen} 
        toggleSidebar={toggleSidebar} 
        darkTheme={darkTheme} 
        toggleTheme={toggleTheme} 
      />
      
      <div id="main-content" className="admin-main-content">
        <div className="admin-page-content">
          <button className="admin-btn-small admin-btn-back" onClick={() => navigate('/')}>← Back to Main</button>
          <Outlet />
        </div>
      </div>

      {sidebarOpen && <div className="admin-sidebar-overlay" onClick={toggleSidebar}></div>}
    </div>
  )
}
