import React, { useState, useContext, useEffect } from 'react';
import { InstructorContext } from './Instructor';
import axios from 'axios';

const StudentsPage = () => {
  const { darkMode } = useContext(InstructorContext);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [studentDetailsLoading, setStudentDetailsLoading] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:5000/api/students", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          setStudents(response.data.students);
        }
      } catch (error) {
        console.error("Failed to fetch students:", error);
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const openModal = async (student) => {
    setStudentDetailsLoading(true);
    setIsModalOpen(true);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`http://localhost:5000/api/students/${student.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSelectedStudent(response.data.student);
      } else {
        console.error("Failed to fetch student details:", response.data.message);
        setSelectedStudent(null);
      }
    } catch (error) {
      console.error("Error fetching student details:", error);
      setSelectedStudent(null);
    } finally {
      setStudentDetailsLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedStudent(null);
  };



  if (loading) {
    return <div style={{ padding: '20px', backgroundColor: darkMode ? 'rgb(22, 21, 21)' : 'rgb(250, 247, 247)', minHeight: '100vh', color: darkMode ? '#f8f7f7' : '#333' }}>Loading students...</div>;
  }

  return (
    <div style={{backgroundColor: darkMode ? 'rgb(22, 21, 21)' : 'rgb(250, 247, 247)', minHeight: '100vh', padding: '20px', color: darkMode ? '#f8f7f7' : '#333'}}>
      <h1 style={{fontSize: '2rem', fontWeight: 'bold', marginBottom: '16px', color: darkMode ? '#f8f7f7' : '#333'}}>Enrolled Students</h1>
      <p style={{color: darkMode ? '#665c5c' : '#666', marginBottom: '20px'}}>View the list of students enrolled in your courses.</p>

      <div style={{overflowX: 'auto', backgroundColor: darkMode ? 'rgb(22, 21, 21)' : 'white', borderRadius: darkMode ? '0' : '8px', boxShadow: darkMode ? 'none' : '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px', border: darkMode ? '1px solid #4b5563' : '1px solid #e5e7eb'}}>
        <table style={{minWidth: '100%', borderCollapse: 'collapse'}}>
          <thead>
            <tr style={{backgroundColor: darkMode ? '#4b5563' : '#f3f4f6'}}>
              <th style={{padding: '12px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: darkMode ? '#d1d5db' : '#6b7280', letterSpacing: '0.05em'}}>Name</th>
              <th style={{padding: '12px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: darkMode ? '#d1d5db' : '#6b7280', letterSpacing: '0.05em'}}>Enrollments</th>
              <th style={{padding: '12px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: darkMode ? '#d1d5db' : '#6b7280', letterSpacing: '0.05em'}}>Status</th>
              <th style={{padding: '12px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: darkMode ? '#d1d5db' : '#6b7280', letterSpacing: '0.05em'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id} style={{borderBottom: '1px solid ' + (darkMode ? '#4b5563' : '#e5e7eb')}}>
                <td style={{padding: '12px', fontSize: '0.875rem', fontWeight: '500', color: darkMode ? '#f9fafb' : '#111827'}}>{student.name}</td>
                <td style={{padding: '12px', fontSize: '0.875rem', color: darkMode ? '#d1d5db' : '#6b7280'}}>{student.enrollments}</td>
                <td style={{padding: '12px'}}>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 8px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    borderRadius: '9999px',
                    backgroundColor: student.status === 'Active' ? (darkMode ? '#059669' : '#10b981') : student.status === 'Suspended' ? (darkMode ? '#dc2626' : '#ef4444') : (darkMode ? '#d97706' : '#f59e0b'),
                    color: 'white'
                  }}>
                    {student.status}
                  </span>
                </td>
                <td style={{padding: '12px', fontSize: '0.875rem', fontWeight: '500'}}>
                  <button
                    onClick={() => openModal(student)}
                    style={{
                      color: darkMode ? '#60a5fa' : '#2563eb',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      hover: { color: darkMode ? '#3b82f6' : '#1d4ed8' }
                    }}
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && selectedStudent && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, overflowY: 'auto'}}>
          <div style={{
            padding: '24px',
            borderRadius: darkMode ? '0' : '8px',
            boxShadow: darkMode ? 'none' : '0 10px 15px -3px rgba(0,0,0,0.1)',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
            backgroundColor: darkMode ? 'rgb(22, 21, 21)' : 'white',
            color: darkMode ? '#f8f7f7' : '#333',
            border: darkMode ? '1px solid #4b5563' : '1px solid #e5e7eb'
          }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
              <h2 style={{fontSize: '1.25rem', fontWeight: 'bold', color: darkMode ? '#f8f7f7' : '#333'}}>Student Details</h2>
              <button onClick={closeModal} style={{color: darkMode ? '#9ca3af' : '#6b7280', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer'}}>
                &times;
              </button>
            </div>
            {studentDetailsLoading ? (
              <div style={{textAlign: 'center', padding: '20px'}}>Loading student details...</div>
            ) : selectedStudent ? (
              <div style={{marginBottom: '16px'}}>
                <p style={{marginBottom: '8px'}}><strong style={{color: darkMode ? '#f8f7f7' : '#333'}}>Username:</strong> {selectedStudent.name}</p>
                <p style={{marginBottom: '8px'}}><strong style={{color: darkMode ? '#f8f7f7' : '#333'}}>Email:</strong> {selectedStudent.email}</p>
                <p style={{marginBottom: '8px'}}><strong style={{color: darkMode ? '#f8f7f7' : '#333'}}>Enrollments:</strong> {selectedStudent.enrolledCourses?.length || 0}</p>
                <p style={{marginBottom: '16px'}}><strong style={{color: darkMode ? '#f8f7f7' : '#333'}}>Status:</strong> {selectedStudent.status}</p>
                <div>
                  <strong style={{color: darkMode ? '#f8f7f7' : '#333', marginBottom: '8px', display: 'block'}}>Enrolled Courses:</strong>
                  <ul style={{margin: 0, paddingLeft: '20px'}}>
                    {selectedStudent.enrolledCourses?.map((course, index) => (
                      <li key={index} style={{fontSize: '0.875rem', color: darkMode ? '#d1d5db' : '#6b7280', marginBottom: '4px'}}>
                        {course.courseTitle} - Progress: {course.progress}%, Status: {course.status}, Enrolled: {new Date(course.enrolledAt).toLocaleDateString()}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div style={{textAlign: 'center', padding: '20px'}}>Failed to load student details.</div>
            )}
            <div style={{textAlign: 'right'}}>
              <button
                onClick={closeModal}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  hover: { backgroundColor: '#1d4ed8' }
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsPage;
