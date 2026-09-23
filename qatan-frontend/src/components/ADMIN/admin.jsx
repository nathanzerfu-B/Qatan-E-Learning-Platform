import { Routes, Route } from 'react-router-dom'
import './admin.css'
import { AppProvider } from './context/AppContext'
import AdminLayout from './AdminLayout'
import AdminDashboard from './AdminDashboard'
import AdminUserManagement from './AdminUserManagement'
import AdminCourseManagement from './AdminCourseManagement'
import AdminUserDetail from './AdminUserDetail'
import AdminCourseDetail from './AdminCourseDetail'
import AdminApprovals from './AdminApprovals'
import AdminReports from './AdminReports'
import AdminSettings from './AdminSettings'
import AdminReviewLesson from './AdminReviewLesson'

export default function Admin() {
  return (
    <AppProvider>
      <Routes>
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUserManagement />} />
          <Route path="user-detail/:id" element={<AdminUserDetail />} />
          <Route path="courses" element={<AdminCourseManagement />} />
          <Route path="course-detail/:id" element={<AdminCourseDetail />} />
          <Route path="approvals" element={<AdminApprovals />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
        <Route path="approvals/view/:courseId" element={<AdminReviewLesson />} />
      </Routes>
    </AppProvider>
  )
}
