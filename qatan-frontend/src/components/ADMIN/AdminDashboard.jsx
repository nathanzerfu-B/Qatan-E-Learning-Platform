import { useEffect } from 'react'
import { useAppContext } from './context/AppContext'
import { useNavigate } from 'react-router-dom'
import ThemedText from './ThemedText'

export default function AdminDashboard() {
  const { appState } = useAppContext()
  const navigate = useNavigate()

  useEffect(() => {
    // No direct DOM manipulation needed; React handles rendering
  }, [appState])

  if (!appState) {
    return <div className="admin-page-content">Loading...</div>;
  }

  const { metrics = {}, users = [], enrollments = [], progress = [], approvals = {} } = appState;

  // Calculate user counts
  const totalStudents = users.filter(u => u.role?.toLowerCase() === 'student').length;
  const totalInstructors = users.filter(u => u.role?.toLowerCase() === 'instructor').length;
  const totalAdmins = users.filter(u => u.role?.toLowerCase() === 'admin').length;
  const totalUsers = totalStudents + totalInstructors;

  // Get latest 10 users sorted by lastUpdated descending, fallback to joinDate
  const latestUsers = [...users].sort((a, b) => {
    const aDate = new Date(a.lastUpdated || a.joinDate || '1970-01-01');
    const bDate = new Date(b.lastUpdated || b.joinDate || '1970-01-01');
    return bDate - aDate;
  }).slice(0, 10);

  // Calculate enrollment metrics
  const totalEnrollments = enrollments.length;
  const completedCourses = metrics.completedCourses || 0;
  const activeStudents = new Set(progress.filter(p => p.status === 'in_progress').map(p => p.studentId)).size;

  // Use activeCourses count from backend metrics instead of progress calculation
  const activeCourses = metrics.activeCourses || 0;

  // Calculate pending instructor applications
  const pendingInstructorApplications = approvals.pendingOther?.length || 0;

  return (
    <div className="admin-page-content">
  <ThemedText as="h1" variant="heading">Dashboard</ThemedText>

      <div className="admin-metrics-grid">
        <div className="admin-metric-card">
          <div className="admin-metric-label">Total Users</div>
          <div className="admin-metric-value" id="total-users">{totalUsers.toLocaleString()}</div>
        </div>
        <div className="admin-metric-card">
          <div className="admin-metric-label">Total Students</div>
          <div className="admin-metric-value">{totalStudents.toLocaleString()}</div>
        </div>
        <div className="admin-metric-card">
          <div className="admin-metric-label">Total Instructors</div>
          <div className="admin-metric-value">{totalInstructors.toLocaleString()}</div>
        </div>
        <div className="admin-metric-card">
          <div className="admin-metric-label">Total Admins</div>
          <div className="admin-metric-value">{totalAdmins.toLocaleString()}</div>
        </div>
        <div className="admin-metric-card">
          <div className="admin-metric-label">Total Course</div>
          <div className="admin-metric-value" id="active-courses">{activeCourses.toLocaleString()}</div>
        </div>
        <div className="admin-metric-card">
          <div className="admin-metric-label">System Uptime</div>
          <div className="admin-metric-value" id="system-uptime">{metrics.systemUptime || 'N/A'}</div>
        </div>
        <div className="admin-metric-card">
          <div className="admin-metric-label">Pending Approvals</div>
          <div className="admin-metric-value" id="pending-approvals">{metrics.pendingApprovals || 0}</div>
        </div>
        <div className="admin-metric-card">
          <div className="admin-metric-label">Total Enrollments</div>
          <div className="admin-metric-value">{totalEnrollments.toLocaleString()}</div>
        </div>
        <div className="admin-metric-card">
          <div className="admin-metric-label">Completed Courses</div>
          <div className="admin-metric-value">{completedCourses.toLocaleString()}</div>
        </div>
        <div className="admin-metric-card">
          <div className="admin-metric-label">Active Students</div>
          <div className="admin-metric-value">{activeStudents.toLocaleString()}</div>
        </div>
        <div className="admin-metric-card">
          <div className="admin-metric-label">Pending Instructor Applications</div>
          <div className="admin-metric-value">{pendingInstructorApplications.toLocaleString()}</div>
        </div>
      </div>

      <div className="admin-dashboard-tables">
        <div className="admin-table-section">
          <ThemedText as="h3" variant="heading">Recent Activity</ThemedText>
          <table className="admin-data-table">
            <thead>
              <tr>
                <ThemedText as="th" variant="default">User</ThemedText>
                <ThemedText as="th" variant="default">Role</ThemedText>
                <ThemedText as="th" variant="default">Actions</ThemedText>
              </tr>
            </thead>
            <tbody>
              {latestUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <img
                      src={`/img/${user.status?.toLowerCase() || 'active'}.png`}
                      alt={user.status}
                      className="admin-status-icon"
                      style={{ width: 16, height: 16, marginRight: 8, verticalAlign: 'middle' }}
                    />
                    {user.name}
                  </td>
                  <td>
                    <span className={`admin-role-badge admin-${user.role?.toLowerCase() || ''}`}>{user.role}</span>
                  </td>
                  <td>
                    <button className="admin-btn-small" onClick={() => navigate(`user-detail/${user.id}`)} disabled={user.role?.toLowerCase() === 'admin'}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
