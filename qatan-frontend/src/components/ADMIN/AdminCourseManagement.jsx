import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from './context/AppContext'

export default function AdminCourseManagement() {
  const { addCourseManagementUpdate, darkTheme } = useAppContext()
  const [courses, setCourses] = useState([])
  const [filteredCourses, setFilteredCourses] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const itemsPerPage = 15
  const navigate = useNavigate()

  const fetchCoursesLocal = async (status = '') => {
    setIsLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams()
      if (status && status !== 'All Statuses') {
        if (status === 'Active') {
          params.append('status', 'published')
        } else if (status === 'Pending Approval') {
          params.append('status', 'pending_approval')
        } else {
          params.append('status', status.toLowerCase())
        }
      }
      const url = `http://localhost:5000/api/courses${params.toString() ? '?' + params.toString() : ''}`
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        const transformedCourses = data.courses.map(course => ({
          id: course.id,
          title: course.title,
          instructor: course.instructor.name,
          status: course.status === 'published' ? 'Active' : course.status === 'pending_approval' ? 'Pending for Approval' : course.status,
          enrollments: course.enrollments?.length || 0,
          rating: null,
          completion: null,
          revenue: course.price ? course.price * (course.enrollments?.length || 0) : null,
          createdDate: course.createdAt.toString().split('T')[0],
          featured: false,
          modules: course.modules || []
        }))
        setCourses(transformedCourses)
      } else {
        setError('Failed to fetch courses')
        console.error('Failed to fetch courses')
      }
    } catch (error) {
      setError('Error fetching courses')
      console.error('Error fetching courses:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterCourses = useCallback(() => {
    const filtered = courses.filter((course) => {
      const matchesSearch =
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.instructor.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesSearch
    })
    setFilteredCourses(filtered)
    setCurrentPage(1)
  }, [courses, searchTerm])

  useEffect(() => {
    setStatusFilter('')
    fetchCoursesLocal()
  }, [])

  useEffect(() => {
    filterCourses()
  }, [filterCourses])

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
  }

  const handleFilterChange = (e) => {
    const value = e.target.value
    setStatusFilter(value)
    fetchCoursesLocal(value)
  }

  const handleToggleFeatured = (courseId) => {
    const courseIndex = courses.findIndex((c) => c.id === courseId)
    if (courseIndex === -1) return

    const course = courses[courseIndex]
    if (course.status !== "published") {
      alert("Only Active courses can be featured.")
      return
    }

    const newFeatured = !course.featured
    const updatedCourses = [...courses]
    updatedCourses[courseIndex] = { ...course, featured: newFeatured }
    setCourses(updatedCourses)

    addCourseManagementUpdate({
      id: course.id,
      title: course.title,
      instructor: course.instructor,
      status: course.status,
      updateTimestamp: new Date().toISOString()
    })
  }

  const changePage = (direction) => {
    const totalPages = Math.ceil(filteredCourses.length / itemsPerPage)
    if (direction === 'prev' && currentPage > 1) {
      setCurrentPage(currentPage - 1)
    } else if (direction === 'next' && currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const paginatedCourses = filteredCourses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage)
  const pageInfo = totalPages > 0 ? `Page ${currentPage} of ${totalPages}` : "No items to display"

  if (isLoading) {
    return (
      <div className={`admin-page-content ${darkTheme ? 'admin-dark-theme' : ''}`}>
        <h1>Course Management</h1>
        <p>Loading courses...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`admin-page-content ${darkTheme ? 'admin-dark-theme' : ''}`}>
        <h1>Course Management</h1>
        <p>Error: {error}</p>
      </div>
    )
  }

  return (
    <div className={`admin-page-content ${darkTheme ? 'admin-dark-theme' : ''}`}>
      <h1>Course Management</h1>

      <div className="admin-filters-section">
        <div className="admin-search-box">
          <input
            type="text"
            id="course-search"
            placeholder="Search courses..."
            onInput={handleSearch}
            className={darkTheme ? 'admin-input-dark' : ''}
          />
        </div>
        <div className="admin-filter-controls">
          <select
            id="status-filter"
            value={statusFilter}
            onChange={handleFilterChange}
            className={darkTheme ? 'admin-select-dark' : ''}
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Pending Approval">Pending Approval</option>
          </select>
        </div>
      </div>

      <div className="admin-courses-grid">
        {paginatedCourses.map((course) => (
          <div className="admin-course-card" key={course.id}>
            <div className="admin-course-header">
              <h3>
                <img src={`/img/${course.status.toLowerCase().includes('pending') ? 'pending approval' : course.status.toLowerCase().replace(/\s+/g, '-')}.png`} alt={course.status} className="admin-status-icon" style={{width: '16px', height: '16px', marginRight: '8px', verticalAlign: 'middle'}} />
                {course.title}
              </h3>
              <div className="admin-course-meta">
                <span className="admin-instructor">{course.instructor}</span>
              </div>
            </div>
            <div className="admin-course-stats">
              <div className="admin-stat">
                <span className="admin-stat-label">Avg. Rating</span>
                <span className="admin-stat-value">{course.rating ? "⭐ " + course.rating : "-"}</span>
              </div>
              <div className="admin-stat">
                <span className="admin-stat-label">Completion Rate</span>
                <span className="admin-stat-value">{course.completion ? course.completion + "%" : "-"}</span>
              </div>
              <div className="admin-stat">
                <span className="admin-stat-label">Revenue</span>
                <span className="admin-stat-value">{course.revenue ? "$" + course.revenue.toLocaleString() : "-"}</span>
              </div>
            </div>
            <div className="admin-course-actions">
              <span className="admin-enrollments">{course.enrollments.toLocaleString()} Enrollments</span>
              <div className="admin-course-controls">
                <label className="admin-toggle-switch">
                  <input id={`featured-toggle-${course.id}`} className="admin-toggle-checkbox" type="checkbox" checked={course.featured && course.status === "published"} disabled={course.status !== "published"} onChange={() => handleToggleFeatured(course.id)} />
                  <span className="admin-toggle-slider"></span>
                  <span className="admin-toggle-label">Featured</span>
                </label>
                <button className="admin-btn-small" onClick={() => navigate(`/admin/course-detail/${course.id}`)}>View</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-pagination" id="courses-pagination">
        <button className="admin-pagination-btn" disabled={currentPage === 1} onClick={() => changePage('prev')}>Previous</button>
        <span className="admin-pagination-info">{pageInfo}</span>
        <button className="admin-pagination-btn" disabled={currentPage === totalPages || totalPages === 0} onClick={() => changePage('next')}>Next</button>
      </div>
    </div>
  )
}
