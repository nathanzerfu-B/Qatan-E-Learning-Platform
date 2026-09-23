import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAppContext } from './context/AppContext'
import ThemedText from './ThemedText'

export default function AdminReports() {
  const { darkTheme } = useAppContext()
  const [studentReport, setStudentReport] = useState({
    studentId: '',
    course: 'All Courses',
  })

  const [enrollmentReport, setEnrollmentReport] = useState({
    courseId: '',
    status: 'All',
  })

  const [paymentReport, setPaymentReport] = useState({
    student: '',
  })

  const [showPreview, setShowPreview] = useState(false)
  const [previewType, setPreviewType] = useState('')
  const [availableCourses, setAvailableCourses] = useState(['All Courses'])
  const [popupMessage, setPopupMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const [detailedData, setDetailedData] = useState([])

  // Fetch courses for a specific student
  const fetchStudentCourses = async (studentId) => {
    if (!studentId.trim()) {
      setAvailableCourses(['All Courses'])
      return
    }

    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await axios.get('http://localhost:5000/api/reports/performance', {
        headers: { Authorization: `Bearer ${token}` },
        params: { studentId }
      })

      if (response.data.success && response.data.data.length > 0) {
        const courses = ['All Courses', ...new Set(response.data.data.map(item => item.courseTitle))]
        setAvailableCourses(courses)
      } else {
        setAvailableCourses(['All Courses'])
      }
    } catch (error) {
      console.error('Error fetching student courses:', error)
      setAvailableCourses(['All Courses'])
    }
  }

  // Update courses when student name changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchStudentCourses(studentReport.studentId)
    }, 500) // Debounce for 500ms

    return () => clearTimeout(timeoutId)
  }, [studentReport.studentId])

  const handleView = async (type) => {
    setLoading(true)
    setPopupMessage('')

    const token = localStorage.getItem('token')
    if (!token) {
      setPopupMessage('Authentication required. Please log in.')
      setLoading(false)
      return
    }

    try {
      let response
      if (type === 'Student Performance') {
        response = await axios.get('http://localhost:5000/api/reports/performance', {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            studentId: studentReport.studentId || undefined,
            courseId: studentReport.course === 'All Courses' ? undefined : studentReport.course
          }
        })
      } else if (type === 'Enrollment') {
        response = await axios.get('http://localhost:5000/api/reports/enrollment', {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            courseId: enrollmentReport.courseId || undefined,
            status: enrollmentReport.status === 'All' ? undefined : enrollmentReport.status
          }
        })
      } else if (type === 'Payment & Financial') {
        response = await axios.get('http://localhost:5000/api/reports/payment', {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            studentId: paymentReport.student || undefined,
            courseId: paymentReport.course || undefined
          }
        })
      }

      if (response.data.success) {
        setDetailedData(response.data.data)
        setPreviewType(type)
        setShowPreview(true)
      } else {
        setPopupMessage('Failed to fetch report data.')
        setTimeout(() => setPopupMessage(''), 3000)
      }
    } catch (error) {
      console.error('Error fetching report:', error)
      setPopupMessage('Error fetching report data. Please try again.')
      setTimeout(() => setPopupMessage(''), 3000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="admin-page-content">
        <ThemedText as="h1" variant="heading">Reports</ThemedText>
        {popupMessage && (
          <div className="admin-popup-message" style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '10px', marginBottom: '10px', borderRadius: '4px' }}>
            {popupMessage}
          </div>
        )}

        <div className="admin-report-section">
          <ThemedText as="h3" variant="heading">Student Performance Reports</ThemedText>
          <ThemedText as="p" variant="muted" style={{ marginTop: '8px' }}>View student grades, analytics, and completion rates. Available for Instructors & Admins.</ThemedText>
          <div className="admin-report-form">
            <div className="admin-form-row">
              <div className="admin-form-group">
                <ThemedText as="label" variant="muted">Student Name/ID</ThemedText>
                <input 
                  type="text" 
                  placeholder="Enter name or ID" 
                  className="admin-form-input"
                  value={studentReport.studentId}
                  onChange={(e) => setStudentReport(prev => ({ ...prev, studentId: e.target.value }))}
                />
              </div>
              <div className="admin-form-group">
                <ThemedText as="label" variant="muted">Course</ThemedText>
                <select 
                  className="admin-form-select"
                  value={studentReport.course}
                  onChange={(e) => setStudentReport(prev => ({ ...prev, course: e.target.value }))}
                >
                  {availableCourses.map(course => <option key={course} value={course}>{course}</option>)}
                </select>
              </div>
              <button className="admin-btn admin-btn-secondary" onClick={() => handleView('Student Performance')}>View</button>
            </div>
          </div>
        </div>

        <div className="admin-report-section">
          <ThemedText as="h3" variant="heading">Enrollment Reports</ThemedText>
          <ThemedText as="p" variant="muted" style={{ marginTop: '8px' }}>Track course enrollments, dates, and status. Available for Admins.</ThemedText>
          <div className="admin-report-form">
            <div className="admin-form-row">
              <div className="admin-form-group">
                <ThemedText as="label" variant="muted">Course Title/ID</ThemedText>
                <input 
                  type="text" 
                  placeholder="Enter title or ID" 
                  className="admin-form-input"
                  value={enrollmentReport.courseId}
                  onChange={(e) => setEnrollmentReport(prev => ({ ...prev, courseId: e.target.value }))}
                />
              </div>
              <div className="admin-form-group">
                <ThemedText as="label" variant="muted">Status</ThemedText>
                <select 
                  className="admin-form-select"
                  value={enrollmentReport.status}
                  onChange={(e) => setEnrollmentReport(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option>All</option>
                  <option>In Progress</option>
                  <option>Completed</option>
                </select>
              </div>
              <button className="admin-btn admin-btn-secondary" onClick={() => handleView('Enrollment')} disabled={loading}>View</button>
            </div>
          </div>
        </div>

        <div className="admin-report-section">
          <ThemedText as="h3" variant="heading">Payment & Financial Reports</ThemedText>
          <ThemedText as="p" variant="muted" style={{ marginTop: '8px' }}>Monitor student payments, amounts, status, and dates. Available for Admins & Finance.</ThemedText>
          <div className="admin-report-form">
            <div className="admin-form-row">
              <div className="admin-form-group">
                <ThemedText as="label" variant="muted">Student</ThemedText>
                <input
                  type="text"
                  placeholder="Enter name or ID"
                  className="admin-form-input"
                  value={paymentReport.student}
                  onChange={(e) => setPaymentReport(prev => ({ ...prev, student: e.target.value }))}
                />
              </div>
              <div className="admin-form-group">
                <ThemedText as="label" variant="muted">Course</ThemedText>
                <input
                  type="text"
                  placeholder="Enter course title or ID"
                  className="admin-form-input"
                  value={paymentReport.course || ''}
                  onChange={(e) => setPaymentReport(prev => ({ ...prev, course: e.target.value }))}
                />
              </div>
              <div className="admin-form-group">
                <ThemedText as="label" variant="muted">Payment Status</ThemedText>
                <select
                  className="admin-form-select"
                  value="Paid"
                  disabled
                >
                  <option>Paid</option>
                </select>
              </div>
              <button className="admin-btn admin-btn-secondary" onClick={() => handleView('Payment & Financial')}>View</button>
            </div>
          </div>
        </div>
      </div>
      {showPreview && (
        <div className="admin-modal-overlay" onClick={() => setShowPreview(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="admin-modal-content" onClick={(e) => e.stopPropagation()} style={{ background: darkTheme ? '#1f2937' : 'white', color: darkTheme ? '#f9fafb' : '#111827', padding: '20px', borderRadius: '8px', maxWidth: '80%', maxHeight: '80%', overflow: 'auto' }}>
            <h2>{previewType} Report Preview</h2>
      {previewType === 'Student Performance' && (
        detailedData.length > 0 ? (
          (() => {
            // Group data by student
            const groupedByStudent = detailedData.reduce((acc, item) => {
              const key = `${item.studentName}-${item.studentEmail}`;
              if (!acc[key]) {
                acc[key] = {
                  studentName: item.studentName,
                  studentEmail: item.studentEmail,
                  courses: []
                };
              }
              acc[key].courses.push({
                courseTitle: item.courseTitle,
                progress: item.progress,
                status: item.status,
                courseDetails: item.courseDetails
              });
              return acc;
            }, {});

            return Object.values(groupedByStudent).map((student, studentIdx) => (
              <div key={studentIdx} style={{ marginBottom: '40px' }}>
                <div style={{ background: darkTheme ? '#374151' : '#f3f4f6', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                  <h3 style={{ margin: '0 0 10px 0', color: darkTheme ? '#f9fafb' : '#111827' }}>
                    {student.studentName}
                  </h3>
                  <p style={{ margin: '0', color: darkTheme ? '#d1d5db' : '#6b7280' }}>
                    <strong>Email:</strong> {student.studentEmail}
                  </p>
                </div>

                {student.courses.map((course, courseIdx) => (
                  <div key={courseIdx} style={{ marginBottom: '30px', border: `2px solid ${darkTheme ? '#4b5563' : '#e5e7eb'}`, borderRadius: '8px', padding: '15px' }}>
                    <div style={{ background: darkTheme ? '#1f2937' : '#f9fafb', padding: '10px', borderRadius: '6px', marginBottom: '15px' }}>
                      <h4 style={{ margin: '0 0 8px 0', color: darkTheme ? '#f9fafb' : '#111827' }}>
                        {course.courseTitle}
                      </h4>
                      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                        <p style={{ margin: '0', color: darkTheme ? '#d1d5db' : '#6b7280' }}>
                          <strong>Progress:</strong> {course.progress}%
                        </p>
                        <p style={{ margin: '0', color: darkTheme ? '#d1d5db' : '#6b7280' }}>
                          <strong>Status:</strong> {course.status}
                        </p>
                      </div>
                    </div>

                    {course.courseDetails && course.courseDetails.length > 0 ? (
                      <div>
                        <h5 style={{ color: darkTheme ? '#f9fafb' : '#111827', marginBottom: '15px' }}>Course Modules</h5>
                        {course.courseDetails.map((module, moduleIdx) => (
                          <div key={moduleIdx} style={{ marginBottom: '25px', border: `1px solid ${darkTheme ? '#4b5563' : '#e5e7eb'}`, borderRadius: '8px', padding: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                              <h6 style={{ margin: '0', color: darkTheme ? '#f9fafb' : '#111827' }}>
                                {module.moduleTitle}
                              </h6>
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                background: module.moduleProgress >= 80 ? '#10b981' : module.moduleProgress >= 60 ? '#f59e0b' : '#ef4444',
                                color: 'white',
                                fontSize: '12px'
                              }}>
                                {module.moduleProgress}% Complete
                              </span>
                            </div>

                            {module.lessons && module.lessons.length > 0 && (
                              <div style={{ marginBottom: '15px' }}>
                                <h6 style={{ margin: '0 0 10px 0', color: darkTheme ? '#d1d5db' : '#6b7280' }}>Lessons</h6>
                                <div style={{ display: 'grid', gap: '8px' }}>
                                  {module.lessons.map((lesson, lessonIdx) => (
                                    <div key={lessonIdx} style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      padding: '8px 12px',
                                      background: darkTheme ? '#1f2937' : '#f9fafb',
                                      borderRadius: '4px',
                                      border: `1px solid ${darkTheme ? '#374151' : '#e5e7eb'}`
                                    }}>
                                      <div>
                                        <span style={{ fontWeight: '500', color: darkTheme ? '#f9fafb' : '#111827' }}>
                                          {lesson.lessonTitle}
                                        </span>
                                        <span style={{
                                          marginLeft: '10px',
                                          padding: '2px 6px',
                                          borderRadius: '3px',
                                          fontSize: '11px',
                                          background: lesson.lessonType === 'video' ? '#3b82f6' : lesson.lessonType === 'text' ? '#10b981' : '#f59e0b',
                                          color: 'white'
                                        }}>
                                          {lesson.lessonType}
                                        </span>
                                      </div>
                                      <span style={{
                                        padding: '2px 6px',
                                        borderRadius: '3px',
                                        fontSize: '11px',
                                        background: lesson.progress >= 80 ? '#10b981' : lesson.progress >= 60 ? '#f59e0b' : '#ef4444',
                                        color: 'white'
                                      }}>
                                        {lesson.progress}% Complete
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {module.quizzes && module.quizzes.length > 0 && (
                              <div>
                                <h6 style={{ margin: '0 0 10px 0', color: darkTheme ? '#d1d5db' : '#6b7280' }}>Quizzes</h6>
                                <div style={{ display: 'grid', gap: '8px' }}>
                                  {module.quizzes.map((quiz, quizIdx) => (
                                    <div key={quizIdx} style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      padding: '8px 12px',
                                      background: darkTheme ? '#1f2937' : '#f9fafb',
                                      borderRadius: '4px',
                                      border: `1px solid ${darkTheme ? '#374151' : '#e5e7eb'}`
                                    }}>
                                      <span style={{ fontWeight: '500', color: darkTheme ? '#f9fafb' : '#111827' }}>
                                        {quiz.quizTitle}
                                      </span>
                                      <span style={{ color: darkTheme ? '#d1d5db' : '#6b7280', fontSize: '12px' }}>
                                        {quiz.questionsCount} questions • Max Score: {quiz.maxScore}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: darkTheme ? '#d1d5db' : '#6b7280' }}>No course details available.</p>
                    )}
                  </div>
                ))}
              </div>
            ));
          })()
        ) : (
          <p>No matching data found for the selected criteria.</p>
        )
      )}
      {previewType === 'Enrollment' && (
        detailedData.length > 0 ? (
          detailedData.map((course, idx) => (
            <div key={idx} style={{ marginBottom: '30px' }}>
              <div style={{ display: 'flex', gap: '40px', marginBottom: '20px' }}>
                <div style={{ flex: 1 }}>
                  <h3>Course Info</h3>
                  <p><strong>Title:</strong> {course.title}</p>
                  <p><strong>Instructor:</strong> {course.instructor}</p>
                  <p><strong>Status:</strong> {course.status}</p>
                  <p><strong>Created Date:</strong> {course.createdDate || 'N/A'}</p>
                </div>
                <div style={{ flex: 1 }}>
                  <h3>Stats & Metrics</h3>
                  <p><strong>Enrollments:</strong> {course.enrollments}</p>
                  <p><strong>Rating:</strong> {course.rating}</p>
                  <p><strong>Completion Rate:</strong> {course.completion}%</p>
                  <p><strong>Revenue:</strong> ${course.revenue}</p>
                </div>
              </div>
              <h4>Enrolled Students</h4>
              {course.enrolledStudents && course.enrolledStudents.length > 0 ? (
                <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ border: '1px solid #ddd', padding: '8px' }}>Student Name</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px' }}>Enrollment Date</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px' }}>Progress</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {course.enrolledStudents.map((student, i) => (
                      <tr key={i}>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{student.name}</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{student.enrollmentDate}</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{student.progress}</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{student.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No enrolled students found.</p>
              )}
            </div>
          ))
        ) : (
          <p>No matching data found for the selected criteria.</p>
        )
      )}
      {previewType === 'Payment & Financial' && (
        detailedData.length > 0 ? (
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Student Name</th>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Student Email</th>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Course Title</th>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Amount</th>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Status</th>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Date</th>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Payment Ref</th>
              </tr>
            </thead>
            <tbody>
              {detailedData.map((item, i) => (
                <tr key={i}>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.studentName}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.studentEmail}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.courseTitle}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>${item.amount}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.status}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.date}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.paymentRef}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No matching data found for the selected criteria.</p>
        )
      )}
            <button className="admin-btn admin-btn-primary" onClick={() => setShowPreview(false)} style={{ marginTop: '20px' }}>Close</button>
          </div>
        </div>
      )}
    </>
  )
}
