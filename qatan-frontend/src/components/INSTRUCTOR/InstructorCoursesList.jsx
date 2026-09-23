import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { InstructorContext } from './Instructor';

const InstructorCoursesList = () => {
  const { darkMode, courses, editCourse, deleteCourse } = useContext(InstructorContext);
  const navigate = useNavigate();



  const displayCourses = courses.length > 0 ? courses : [];

  if (displayCourses.length === 0) {
    return (
      <div style={{ padding: '20px', backgroundColor: darkMode ? 'rgb(22, 21, 21)' : 'rgb(250, 247, 247)', color: darkMode ? '#f8f7f7' : '#333', border: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: darkMode ? '#f8f7f7' : '#333' }}>My Courses</h1>
          <button
            onClick={() => navigate('create')}
            style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
          >
            New Course
          </button>
        </div>
        <p style={{ marginBottom: '24px', color: darkMode ? '#665c5c' : '#666' }}>Manage your courses, view analytics, and create new ones.</p>
        <div style={{ textAlign: 'center', padding: '40px', color: darkMode ? '#9ca3af' : '#666' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>No courses yet</h3>
          <p style={{ marginBottom: '24px' }}>Create your first course to get started!</p>
          <button
            onClick={() => navigate('create')}
            style={{ padding: '12px 24px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
          >
            Create Your First Course
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', backgroundColor: darkMode ? 'rgb(22, 21, 21)' : 'rgb(250, 247, 247)', color: darkMode ? '#f8f7f7' : '#333', border: 'none' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: darkMode ? '#f8f7f7' : '#333' }}>My Courses</h1>
        <button
          onClick={() => navigate('create')}
          style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
        >
          New Course
        </button>
      </div>
      <p style={{ marginBottom: '24px', color: darkMode ? '#665c5c' : '#666' }}>Manage your courses, view analytics, and create new ones.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        {displayCourses.map((course, index) => (
          <div key={index} style={{
            backgroundColor: darkMode ? 'rgb(22, 21, 21)' : 'white',
            padding: '24px',
            borderRadius: darkMode ? '0' : '8px',
            boxShadow: darkMode ? 'none' : '0 2px 4px rgba(0,0,0,0.1)',
            border: darkMode ? '1px solid #4b5563' : '1px solid #ddd',
            transition: 'transform 0.3s, box-shadow 0.3s'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '8px', color: darkMode ? '#d6c3c3' : '#333' }}>{course.title}</h3>
            <p style={{ fontSize: '1rem', color: darkMode ? '#e4dada' : '#666', marginBottom: '16px', fontWeight: '300' }}>{course.description}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ color: darkMode ? '#e6a133' : '#f59e0b', fontWeight: 'bold', fontSize: '0.875rem' }}>⭐ {course.rating || '4.5'}</span>
              <span style={{
                fontSize: '0.875rem',
                fontWeight: 'bold',
                padding: '4px 12px',
                borderRadius: '9999px',
                backgroundColor: darkMode ? '#177d4a' : '#10b981',
                color: darkMode ? '#f4efef' : 'white'
              }}>
                {course.status || 'Published'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: darkMode ? '#f4efef' : '#9ca3af' }}>
              <span>{course.students || '0'} students</span>
              <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={() => { editCourse(course); navigate('create'); }} style={{ color: darkMode ? '#0f75eb' : '#3b82f6', textDecoration: 'none', border: 'none', background: 'none', cursor: 'pointer' }}>Edit</button>
        <button onClick={() => deleteCourse(course.id)} style={{ color: darkMode ? '#ef4444' : '#ef4444', textDecoration: 'none', border: 'none', background: 'none', cursor: 'pointer' }}>Delete</button>
      </div>
    </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InstructorCoursesList;
