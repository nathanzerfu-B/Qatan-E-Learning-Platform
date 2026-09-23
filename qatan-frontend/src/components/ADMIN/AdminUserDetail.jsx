import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppContext } from './context/AppContext'
import ThemedText from './ThemedText'

export default function AdminUserDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { appState, darkTheme } = useAppContext()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserDetail = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          console.error('Failed to fetch user details');
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchUserDetail();
    }
  }, [id])

  if (!user) {
    return <div className="admin-page-content">User not found</div>
  }

  const handleBack = () => {
    navigate('/admin/users')
  }

  return (
    <div className="admin-page-content">
      <div className="admin-page-header">
        <button className="admin-btn admin-btn-secondary" onClick={handleBack}>← Back to Users</button>
  <h1 id="user-detail-name" style={{ color: darkTheme ? '#e8e8e8' : '#111827' }}>{user.name}</h1>
      </div>

      <div className="admin-detail-grid">
        <div className="admin-detail-card">
          <ThemedText as="h3" variant="heading">Profile Information</ThemedText>
          <div className="admin-detail-item">
            <ThemedText as="label" variant="value">Full Name</ThemedText>
            <ThemedText as="span" id="detail-name" variant="value">{user.name}</ThemedText>
          </div>
          <div className="admin-detail-item">
            <ThemedText as="label" variant="muted">Email</ThemedText>
            <ThemedText as="span" id="detail-email" variant="value">{user.email}</ThemedText>
          </div>
          <div className="admin-detail-item">
            <ThemedText as="label" variant="muted">Role</ThemedText>
            <ThemedText as="span" id="detail-role" variant="value">{user.role}</ThemedText>
          </div>
          <div className="admin-detail-item">
            <ThemedText as="label" variant="muted">Status</ThemedText>
            <ThemedText as="span" id="detail-status" variant="value">{user.status}</ThemedText>
          </div>
          <div className="admin-detail-item">
            <ThemedText as="label" variant="muted">Join Date</ThemedText>
            <ThemedText as="span" id="detail-join-date" variant="value">{user.joinDate}</ThemedText>
          </div>
        </div>

        <div className="admin-detail-card">
          <ThemedText as="h3" variant="heading">Activity Summary</ThemedText>
          <div className="admin-detail-item">
            <ThemedText as="label" id="detail-enrollments-label" variant="muted">{user.role === 'Instructor' ? 'Courses Created' : 'Total Enrollments'}</ThemedText>
            <ThemedText as="span" id="detail-enrollments" variant="value">{user.role === 'Instructor' ? (user.courses || 0) : (user.enrollments || 0)}</ThemedText>
          </div>
          {user.role === 'Student' && (
            <div className="admin-detail-item">
              <ThemedText as="label" id="detail-completed-label" variant="muted">Completed Courses</ThemedText>
              <ThemedText as="span" id="detail-completed" variant="value">{user.completed || 0}</ThemedText>
            </div>
          )}
          <div className="admin-detail-item">
            <ThemedText as="label" variant="muted">Last Login</ThemedText>
            <ThemedText as="span" id="detail-last-login" variant="value">{user.lastLogin || '-'}</ThemedText>
          </div>
        </div>
      </div>

      <div className="admin-detail-section">
        <h3>{user.role === 'Instructor' ? 'Courses Uploaded' : 'Recent Activity'}</h3>
        <table className="admin-data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th id="activity-header-2">{user.role === 'Instructor' ? 'Action' : 'Activity'}</th>
              <th>Course</th>
              <th id="activity-header-4">Status</th>
            </tr>
          </thead>
          <tbody id="user-activity">
            {user.activity && user.activity.length > 0 ? (
              user.activity.map((activity, index) => (
                <tr key={index}>
                  <td>{activity.date}</td>
                  <td>{activity.activity}</td>
                  <td style={{ color: darkTheme ? '#e8e8e8' : '#111827' }}>{activity.course}</td>
                  <td><span className={`admin-status admin-${activity.status.toLowerCase().replace(' ', '-')}`}>{activity.status}</span></td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4">{user.role === 'Instructor' ? 'No courses uploaded' : 'No recent activity'}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
