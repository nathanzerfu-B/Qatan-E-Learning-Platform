import { useNavigate } from 'react-router-dom'
import { useAppContext } from './context/AppContext'
import ThemedText from './ThemedText'
import axios from 'axios'
import { useEffect, useState } from 'react'

export default function AdminApprovals() {
  const { appState, updateCourses, updateApprovals, updateMetrics, addCourseManagementUpdate, darkTheme, approveInstructorApplication, rejectInstructorApplication } = useAppContext()
  const { approvals, metrics } = appState
  const navigate = useNavigate()
  const [pendingCourses, setPendingCourses] = useState([])

  const fetchPending = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`http://localhost:5000/api/courses/admin/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.success) {
        setPendingCourses(response.data.courses)
      }
    } catch (error) {
      console.error('Error fetching pending courses:', error)
    }
  }

  useEffect(() => {
    fetchPending()
  }, [])

  const handleApproveCourse = async (courseId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.post(`http://localhost:5000/api/courses/admin/approve/${courseId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.success) {
        alert(`Course has been approved.`)
        // Refresh pending courses
        fetchPending()
      } else {
        alert('Failed to approve course.')
      }
    } catch (error) {
      console.error('Error approving course:', error)
      alert('Failed to approve course.')
    }
  }

  const handleRejectCourse = async (courseId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.post(`http://localhost:5000/api/courses/admin/reject/${courseId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.success) {
        alert(`Course has been rejected.`)
        // Refresh pending courses
        fetchPending()
      } else {
        alert('Failed to reject course.')
      }
    } catch (error) {
      console.error('Error rejecting course:', error)
      alert('Failed to reject course.')
    }
  }

  const handleApproveItem = async (itemId) => {
    const itemIndex = approvals.pendingOther.findIndex((item) => item.id == itemId)
    if (itemIndex !== -1) {
      const approvedItem = approvals.pendingOther[itemIndex]

      // Check if it's an instructor application
      if (approvedItem.item.startsWith('Instructor Application:')) {
        const success = await approveInstructorApplication(itemId)
        if (success) {
          alert(`Instructor application for "${approvedItem.item.replace('Instructor Application: ', '')}" has been approved.`)
        } else {
          alert('Failed to approve instructor application.')
        }
      } else {
        // Handle other items as before
        const updatedApprovals = { ...approvals, pendingOther: approvals.pendingOther.filter(i => i.id != itemId) }
        updateApprovals(updatedApprovals)

        const updatedMetrics = { ...metrics, pendingApprovals: Math.max(0, metrics.pendingApprovals - 1) }
        updateMetrics(updatedMetrics)

        alert(`Item "${approvedItem.item}" has been approved.`)
      }
    }
  }

  const handleRejectItem = async (itemId) => {
    const itemIndex = approvals.pendingOther.findIndex((item) => item.id == itemId)
    if (itemIndex !== -1) {
      const rejectedItem = approvals.pendingOther[itemIndex]

      // Check if it's an instructor application
      if (rejectedItem.item.startsWith('Instructor Application:')) {
        const success = await rejectInstructorApplication(itemId)
        if (success) {
          alert(`Instructor application for "${rejectedItem.item.replace('Instructor Application: ', '')}" has been rejected.`)
        } else {
          alert('Failed to reject instructor application.')
        }
      } else {
        // Handle other items as before
        const updatedApprovals = { ...approvals, pendingOther: approvals.pendingOther.filter(i => i.id != itemId) }
        updateApprovals(updatedApprovals)

        const updatedMetrics = { ...metrics, pendingApprovals: Math.max(0, metrics.pendingApprovals - 1) }
        updateMetrics(updatedMetrics)

        alert(`Item "${rejectedItem.item}" has been rejected.`)
      }
    }
  }

  const handleViewCourse = (courseId) => {
    navigate(`/admin/approvals/view/${courseId}`)
  }

  return (
    <div className="admin-page-content">
      <h1>Approvals</h1>

      <div className="admin-approval-section">
        <ThemedText as="h3" variant="heading">Pending Course Submissions</ThemedText>
        <table className="admin-data-table" id="pending-courses-table">
          <thead>
            <tr>
              <th>Course Name</th>
              <th>Instructor</th>
              <th>Submission Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingCourses.map((course) => (
              <tr key={course.id}>
                <td><ThemedText variant="value">{course.title}</ThemedText></td>
                <td><ThemedText variant="muted">{course.instructor?.name || 'Unknown'}</ThemedText></td>
                <td><ThemedText variant="muted">{course.createdAt ? new Date(course.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]}</ThemedText></td>
                <td>
                  <button
                    className="admin-btn admin-btn-info admin-btn-small"
                    onClick={() => handleViewCourse(course.id)}
                    style={{
                      backgroundColor: darkTheme ? '#1f2937' : undefined,
                      border: darkTheme ? '1px solid rgba(255,255,255,0.06)' : undefined,
                    }}
                  >
                    <ThemedText variant="info">View</ThemedText>
                  </button>
                  <button className="admin-btn admin-btn-primary admin-btn-small" onClick={() => handleApproveCourse(course.id)}><ThemedText variant="default">Approve</ThemedText></button>
                  <button className="admin-btn admin-btn-danger admin-btn-small" onClick={() => handleRejectCourse(course.id)}><ThemedText variant="default">Reject</ThemedText></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="admin-approval-section">
        <ThemedText as="h3" variant="heading">Instructor Pending Approvals</ThemedText>
        <table className="admin-data-table" id="other-pending-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Submitted By</th>
              <th>Submission Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {approvals.pendingOther.map((item) => (
              <tr key={item.id}>
                <td><ThemedText variant="value">{item.item}</ThemedText></td>
                <td><ThemedText variant="muted">{item.submittedBy}</ThemedText></td>
                <td><ThemedText variant="muted">{item.date}</ThemedText></td>
                <td>
                  <button className="admin-btn admin-btn-primary admin-btn-small" onClick={() => handleApproveItem(item.id)}><ThemedText variant="default">Approve</ThemedText></button>
                  <button className="admin-btn admin-btn-danger admin-btn-small" onClick={() => handleRejectItem(item.id)}><ThemedText variant="default">Reject</ThemedText></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
