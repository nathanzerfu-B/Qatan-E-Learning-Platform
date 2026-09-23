import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppContext } from './context/AppContext'
import ThemedText from './ThemedText'

export default function AdminCourseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { appState } = useAppContext()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCourseDetail = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/courses/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          // Transform course data to match frontend expectations
          const enrollmentsCount = data.course.enrollments?.length || 0;
          const recentStudents = data.course.enrollments?.slice(0, 5).map(enrollment => ({
            name: enrollment.student.name,
            enrolledDate: enrollment.createdAt.toString().split('T')[0]
          })) || [];

          const transformedCourse = {
            id: data.course.id,
            title: data.course.title,
            instructor: data.course.instructor.name,
            status: data.course.status === 'published' ? 'Active' : data.course.status,
            enrollments: enrollmentsCount,
            rating: null,
            completion: null,
            revenue: data.course.price ? data.course.price * enrollmentsCount : null,
            createdDate: data.course.createdAt.toString().split('T')[0],
            description: data.course.description,
            price: data.course.price,
            modules: data.course.modules || [],
            recentStudents: recentStudents
          };
          setCourse(transformedCourse);
        } else {
          console.error('Failed to fetch course details');
        }
      } catch (error) {
        console.error('Error fetching course details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCourseDetail();
    }
  }, [id])

  if (!course) {
    return <div className="admin-page-content">Course not found</div>
  }

  const handleBack = () => {
    navigate('/admin/courses')
  }

  return (
    <div className="admin-page-content">
      <div className="admin-page-header">
        <button className="admin-btn admin-btn-secondary" onClick={handleBack}>← Back to Courses</button>
        <ThemedText as="h1" id="course-detail-name" className="admin-title-right" variant="heading">{course.title}</ThemedText>
      </div>

      <div className="admin-detail-grid">
        <div className="admin-detail-card">
          <ThemedText as="h3" variant="heading">Course Information</ThemedText>
          <div className="admin-detail-item">
            <ThemedText as="label" variant="muted">Course Title</ThemedText>
            <ThemedText as="span" id="detail-title" variant="value">{course.title}</ThemedText>
          </div>
          <div className="admin-detail-item">
            <ThemedText as="label" variant="muted">Instructor</ThemedText>
            <ThemedText as="span" id="detail-instructor" variant="value">{course.instructor}</ThemedText>
          </div>
          <div className="admin-detail-item">
            <ThemedText as="label" variant="muted">Status</ThemedText>
            <ThemedText as="span" id="detail-course-status" variant="value">{course.status}</ThemedText>
          </div>
          <div className="admin-detail-item">
            <ThemedText as="label" variant="muted">Created Date</ThemedText>
            <ThemedText as="span" id="detail-created" variant="value">{course.createdDate}</ThemedText>
          </div>
        </div>

        <div className="admin-detail-card">
          <ThemedText as="h3" variant="heading">Statistics</ThemedText>
          <div className="admin-detail-item">
            <ThemedText as="label" variant="muted">Total Enrollments</ThemedText>
            <ThemedText as="span" id="detail-total-enrollments" variant="value">{course.enrollments}</ThemedText>
          </div>
          <div className="admin-detail-item">
            <ThemedText as="label" variant="muted">Average Rating</ThemedText>
            <ThemedText as="span" id="detail-rating" variant="value">{course.rating}</ThemedText>
          </div>
          <div className="admin-detail-item">
            <ThemedText as="label" variant="muted">Completion Rate</ThemedText>
            <ThemedText as="span" id="detail-completion" variant="value">{course.completion ? course.completion + '%' : '-'}</ThemedText>
          </div>
          <div className="admin-detail-item">
            <ThemedText as="label" variant="muted">Revenue</ThemedText>
            <ThemedText as="span" id="detail-revenue" variant="value">{course.revenue ? '$' + course.revenue.toLocaleString() : '-'}</ThemedText>
          </div>
        </div>
      </div>



      <div className="admin-detail-section">
        <ThemedText as="h3" variant="heading">Recently Enrolled Students</ThemedText>
        <div className="admin-detail-grid">
          {course.recentStudents && course.recentStudents.length > 0 ? (
            course.recentStudents.map((s, i) => (
              <div className="admin-detail-card" key={i}>
                <div className="admin-detail-item">
                  <ThemedText as="label" variant="muted">Name</ThemedText>
                  <ThemedText as="span" variant="value">{s.name}</ThemedText>
                </div>
                <div className="admin-detail-item">
                  <ThemedText as="label" variant="muted">Enrolled</ThemedText>
                  <ThemedText as="span" variant="value">{s.enrolledDate}</ThemedText>
                </div>
              </div>
            ))
          ) : (
            <ThemedText as="p" variant="default">No recent students</ThemedText>
          )}
        </div>
      </div>
    </div>
  )
}
