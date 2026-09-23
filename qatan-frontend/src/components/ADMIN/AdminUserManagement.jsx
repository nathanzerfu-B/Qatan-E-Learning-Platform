import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from './context/AppContext'
import ThemedText from './ThemedText'

export default function AdminUserManagement() {
  const { appState, updateUsers, updateMetrics, darkTheme, fetchUsers } = useAppContext()
  const { users, metrics } = appState
  const [filteredUsers, setFilteredUsers] = useState(users)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'Instructor'
  })
  const itemsPerPage = 15
  const navigate = useNavigate()

  const filterUsers = useCallback(() => {
    const filtered = users.filter((user) => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            user.email.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesSearch
    })
    setFilteredUsers(filtered)
    setCurrentPage(1)
  }, [users, searchTerm])

  useEffect(() => {
    filterUsers()
  }, [filterUsers])

  const changePage = (direction) => {
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
    if (direction === 'prev' && currentPage > 1) {
      setCurrentPage(currentPage - 1)
    } else if (direction === 'next' && currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const pageInfo = totalPages > 0 ? `Page ${currentPage} of ${totalPages}` : "No items to display"

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
  }

  

  const suspendUser = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'suspended' })
      });

      if (response.ok) {
        const updatedUsers = users.map(user =>
          user.id == userId ? { ...user, status: 'Suspended', lastUpdated: new Date().toISOString() } : user
        );
        updateUsers(updatedUsers);
        alert(`User ${updatedUsers.find(u => u.id == userId).name} has been suspended.`);
      } else {
        alert('Failed to suspend user.');
      }
    } catch (error) {
      console.error('Error suspending user:', error);
      alert('Error suspending user.');
    }
  };

  const activateUser = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'active' })
      });

      if (response.ok) {
        const updatedUsers = users.map(user =>
          user.id == userId ? { ...user, status: 'Active', lastUpdated: new Date().toISOString() } : user
        );
        updateUsers(updatedUsers);
        alert(`User ${updatedUsers.find(u => u.id == userId).name} has been activated.`);
      } else {
        alert('Failed to activate user.');
      }
    } catch (error) {
      console.error('Error activating user:', error);
      alert('Error activating user.');
    }
  };

  const handleNewUserChange = (e) => {
    const { name, value } = e.target
    setNewUser(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const addNewUser = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newUser)
      });

      if (response.ok) {
        const result = await response.json();
        // Refresh users list
        const usersResponse = await fetch('http://localhost:5000/api/users', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          updateUsers(usersData.users);
          updateMetrics({
            ...metrics,
            totalUsers: usersData.users.length
          });
        }
        setNewUser({
          name: '',
          email: '',
          role: 'Instructor'
        })
        setIsModalOpen(false)
        alert('User created successfully! An email with login credentials has been sent.')
      } else {
        const error = await response.json();
        alert(`Failed to create user: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Error creating user. Please try again.');
    }
  }

  return (
    <div className="admin-page-content">
      <div className="admin-page-header">
        <h1>User Management</h1>
        <button className="admin-btn admin-btn-primary" onClick={() => setIsModalOpen(true)}>Add New User</button>
      </div>

      <div className="admin-search-filters">
        <input
          type="text"
          className="admin-search-input"
          placeholder="Search users..."
          value={searchTerm}
          onChange={handleSearch}
        />
        <div className="admin-filter-select-container">
          <select className="admin-filter-select" value={roleFilter} onChange={(e) => {
            setRoleFilter(e.target.value);
            fetchUsers(e.target.value, statusFilter);
          }}>
            <option value="">All Roles</option>
            <option value="Student">Student</option>
            <option value="Instructor">Instructor</option>
          </select>
          <select className="admin-filter-select" value={statusFilter} onChange={(e) => {
            setStatusFilter(e.target.value);
            fetchUsers(roleFilter, e.target.value);
          }}>
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th className="admin-role-header">Role</th>
              <th>Enrollments<br/>/Courses</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="admin-user-info">
                    <img src={`/img/${user.status.toLowerCase()}.png`} alt={user.status} className="admin-status-icon" style={{width: '16px', height: '16px', marginRight: '8px', verticalAlign: 'middle'}} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <ThemedText as="strong" variant="value">{user.name}</ThemedText>
                      {/* Inline email duplicate for mobile — hidden on desktop, shown on small screens */}
                      <span className="admin-user-email-inline"><ThemedText as="span" variant="muted" style={{ fontSize: '12px' }}>{user.email}</ThemedText></span>
                    </div>
                  </div>
                </td>
                <td className="admin-email-column"><ThemedText variant="muted">{user.email}</ThemedText></td>
                <td><span className={`admin-role-badge admin-${user.role.toLowerCase()}`}>{user.role}</span></td>
                <td>
                  {user.role.trim().toLowerCase() === "admin" ? "N/A" : `${user.enrollments || user.courses || 0} ${user.role.trim().toLowerCase() === "instructor" ? "Courses" : "Enrolled"}`}
                </td>
                <td>
                  <button className="admin-btn admin-btn-info admin-btn-small" onClick={() => navigate(`/admin/user-detail/${user.id}`)} disabled={user.role?.toLowerCase() === 'admin'}>View</button>
                  <button className="admin-btn admin-btn-danger admin-btn-small" onClick={() => user.status.toLowerCase() === "active" ? suspendUser(user.id) : activateUser(user.id)} disabled={user.role?.toLowerCase() === 'admin'}>{user.status.toLowerCase() === "active" ? "Suspend" : "Activate"}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="admin-pagination" id="users-pagination">
        <button className="admin-pagination-btn" disabled={currentPage === 1} onClick={() => changePage('prev')}>Previous</button>
        <span className="admin-pagination-info">{pageInfo}</span>
        <button className="admin-pagination-btn" disabled={currentPage === totalPages || totalPages === 0} onClick={() => changePage('next')}>Next</button>
      </div>

      {/* Add User Modal */}
      {isModalOpen && (
        <div className="admin-modal" style={{ display: 'block' }}>
          <div
            className="admin-modal-content"
            style={{ background: darkTheme ? '#1f2937' : 'white', color: darkTheme ? '#e8e8e8' : '#111827' }}
          >
            <div className="admin-modal-header">
              <ThemedText as="h3" variant="heading">Add New User</ThemedText>
              <button className="admin-modal-close" onClick={() => setIsModalOpen(false)}><ThemedText as="span" variant="value">&times;</ThemedText></button>
            </div>
            <form onSubmit={addNewUser}>
              <div className="admin-form-group">
                <label>Name</label>
                <input type="text" name="name" value={newUser.name} onChange={handleNewUserChange} className="admin-form-input" required />
              </div>
              <div className="admin-form-group">
                <label>Email</label>
                <input type="email" name="email" value={newUser.email} onChange={handleNewUserChange} className="admin-form-input" required />
              </div>
              <div className="admin-form-group">
                <label>Role</label>
                <select name="role" value={newUser.role} onChange={handleNewUserChange} className="admin-form-select">
                  <option value="Instructor">Instructor</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div className="admin-modal-actions">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="admin-btn admin-btn-primary">Add User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )

}
