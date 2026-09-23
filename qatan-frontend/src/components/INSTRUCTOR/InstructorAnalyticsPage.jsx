import React, { useState, useContext, useEffect } from 'react';
import { InstructorContext } from './Instructor';
import axios from 'axios';

const AnalyticsPage = () => {
  const { darkMode, courses, loading } = useContext(InstructorContext);
  const [analytics, setAnalytics] = useState(null);
  const [dateRange, setDateRange] = useState('last30days');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:5000/api/analytics", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          setAnalytics(response.data.analytics);
        } else {
          console.error("Failed to fetch analytics:", response.data.message);
          setAnalytics(null);
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
        setAnalytics(null);
      }
    };

    if (!loading && courses.length > 0) {
      fetchAnalytics();
    }
  }, [courses, loading]);

  if (loading) {
    return <div style={{ padding: '20px', minHeight: '100vh', color: darkMode ? '#f8f7f7' : '#333' }}>Loading Analytics...</div>;
  }

  // Compute analytics values if API returns wrong or missing data
  const totalEnrollments = analytics?.totalEnrollments ?? courses.reduce((sum, c) => sum + (c.enrollments || 0), 0);
  const averageRating = analytics?.averageRating ?? (courses.reduce((sum, c) => sum + (c.rating || 0), 0) / courses.length || 0).toFixed(1);
  const totalRevenue = analytics?.totalRevenue ?? courses.reduce((sum, c) => sum + ((c.price || 0) * (c.enrollments || 0)), 0);
  const activeCoursesCount = analytics?.activeCoursesCount ?? courses.length;
  const completionRates = analytics?.completionRates ?? courses.map(c => ({ title: c.title, completion: c.completion || 0 }));
  const monthlyRevenue = analytics?.monthlyRevenue ?? [];

  if (!courses || courses.length === 0) {
    return <div style={{ padding: '20px', minHeight: '100vh', color: darkMode ? '#f8f7f7' : '#333' }}>
      <h2>Analytics Dashboard</h2>
      <p>No courses available. Please ensure you have courses and are logged in as an instructor.</p>
    </div>;
  }

  const maxEnrollments = Math.ceil(Math.max(...courses.map(c => c.enrollments?.length || 0)) / 50) * 50;
  const tickInterval = 150;
  const numTicks = maxEnrollments / tickInterval + 1;
  const chartCourses = [...courses].sort((a, b) => (b.enrollments?.length || 0) - (a.enrollments?.length || 0)).slice(0, 5);

  return (
    <div style={{ backgroundColor: darkMode ? 'rgb(22, 21, 21)' : 'rgb(250, 247, 247)', minHeight: '100vh', padding: '20px', color: darkMode ? '#f8f7f7' : '#333' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '16px' }}>Analytics Dashboard</h1>
      <p style={{ color: darkMode ? '#665c5c' : '#666', marginBottom: '20px' }}>Overview of course performance and student engagement metrics.</p>

      {/* Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        {[ 
          { title: 'Total Enrollments', value: totalEnrollments.toLocaleString() },
          { title: 'Average Rating', value: `⭐️ ${averageRating}` },
          { title: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}` },
          { title: 'Active Courses', value: activeCoursesCount }
        ].map((metric, i) => (
          <div key={i} style={{ backgroundColor: darkMode ? 'rgb(22, 21, 21)' : 'white', padding: '20px', borderRadius: darkMode ? '0' : '8px', boxShadow: darkMode ? 'none' : '0 2px 4px rgba(0,0,0,0.1)', border: darkMode ? '1px solid #4b5563' : '1px solid #e5e7eb', textAlign: 'center' }}>
            <h3 style={{ fontSize: '0.875rem', color: darkMode ? '#d1d5db' : '#6b7280', marginBottom: '8px', fontWeight: '500' }}>{metric.title}</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: darkMode ? '#f9fafb' : '#111827', margin: 0 }}>{metric.value}</p>
          </div>
        ))}
      </div>

      {/* Course Completion Rates */}
      <div style={{ marginBottom: '20px', backgroundColor: darkMode ? 'rgb(22, 21, 21)' : 'white', padding: '20px', borderRadius: darkMode ? '0' : '8px', border: darkMode ? '1px solid #4b5563' : '1px solid #e5e7eb', boxShadow: darkMode ? 'none' : '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '16px' }}>Course Completion Rates</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          {completionRates.slice(0, 6).map((course, index) => (
            <div key={index} style={{ textAlign: 'center', padding: '15px', backgroundColor: darkMode ? '#374151' : '#f9fafb', borderRadius: '6px' }}>
              <h4 style={{ fontSize: '0.875rem', color: darkMode ? '#d1d5db' : '#6b7280', marginBottom: '5px' }}>{course.title.split(' ')[0]}</h4>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '5px' }}>
                <div style={{ width: '100px', height: '10px', backgroundColor: darkMode ? '#4b5563' : '#e5e7eb', borderRadius: '5px', overflow: 'hidden', marginRight: '10px' }}>
                  <div style={{ width: `${course.completion}%`, height: '100%', backgroundColor: darkMode ? '#10b981' : '#059669', borderRadius: '5px' }}></div>
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: 'bold', color: darkMode ? '#f9fafb' : '#111827' }}>{course.completion}%</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: darkMode ? '#9ca3af' : '#6b7280', margin: 0 }}>Completed</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Courses Table */}
      <div style={{ marginBottom: '20px', backgroundColor: darkMode ? 'rgb(22, 21, 21)' : 'white', padding: '20px', borderRadius: darkMode ? '0' : '8px', border: darkMode ? '1px solid #4b5563' : '1px solid #e5e7eb', boxShadow: darkMode ? 'none' : '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '16px' }}>Recent Courses Performance</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ minWidth: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: darkMode ? '#4b5563' : '#f3f4f6' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: darkMode ? '#d1d5db' : '#6b7280' }}>Course Title</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: darkMode ? '#d1d5db' : '#6b7280' }}>Enrollments</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: darkMode ? '#d1d5db' : '#6b7280' }}>Rating</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: darkMode ? '#d1d5db' : '#6b7280' }}>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {courses.slice(0, 5).map((course) => (
                <tr key={course.id} style={{ borderBottom: '1px solid ' + (darkMode ? '#4b5563' : '#e5e7eb') }}>
                  <td style={{ padding: '12px', fontSize: '0.875rem', color: darkMode ? '#f9fafb' : '#111827' }}>{course.title}</td>
                  <td style={{ padding: '12px', fontSize: '0.875rem', color: darkMode ? '#d1d5db' : '#6b7280' }}>{(course.enrollments?.length || 0).toLocaleString()}</td>
                  <td style={{ padding: '12px', fontSize: '0.875rem', color: darkMode ? '#d1d5db' : '#6b7280' }}>⭐️ {course.rating || 4.5}</td>
                  <td style={{ padding: '12px', fontSize: '0.875rem', color: darkMode ? '#d1d5db' : '#6b7280' }}>${((course.price || 0) * (course.enrollments?.length || 0)).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default AnalyticsPage;
