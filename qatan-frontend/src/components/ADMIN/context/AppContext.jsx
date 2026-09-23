import React, { createContext, useContext, useState, useEffect } from 'react';
import { students } from '../../../data/student.js';
import { instructors } from '../../../data/instructors.js';
import { courses } from '../../../data/course.js';
import { approvals } from '../../../data/approvals.js';

const API_BASE_URL = 'http://localhost:5000/api';

const AppContext = createContext();

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [appState, setAppState] = useState({
    users: [],
    courses: [],
    enrollments: [],
    progress: [],
    approvals: {
      pendingCourses: [],
      rejectedCourses: [],
      pendingOther: [],
      rejectedOther: []
    },
    metrics: { totalUsers: 0, totalCourses: 0, pendingApprovals: 0 }
  });

  const [courseManagementUpdates, setCourseManagementUpdates] = useState([]);
  const [darkTheme, setDarkTheme] = useState(false);

  const toggleTheme = () => {
    setDarkTheme(!darkTheme);
    document.documentElement.classList.toggle('dark');
  };

  const updateUsers = (users) => {
    setAppState(prev => ({ ...prev, users }));
  };

  const updateCourses = (courses) => {
    setAppState(prev => ({ ...prev, courses }));
  };

  const updateApprovals = (approvals) => {
    setAppState(prev => ({ ...prev, approvals }));
  };

  const updateMetrics = (metrics) => {
    setAppState(prev => ({ ...prev, metrics }));
  };

  const addCourseManagementUpdate = (update) => {
    setCourseManagementUpdates(prev => {
      const newUpdates = [update, ...prev].sort((a, b) => new Date(b.updateTimestamp) - new Date(a.updateTimestamp)).slice(0, 10);
      return newUpdates;
    });
  };

  const fetchPendingCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/courses/admin/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAppState(prev => ({
          ...prev,
          courses: data.courses
        }));
      }
    } catch (error) {
      console.error('Error fetching pending courses:', error);
    }
  };

  const fetchInstructorApplications = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/instructor-applications/pending`);
      if (response.ok) {
        const data = await response.json();
        const formattedApplications = data.applications.map(app => ({
          id: app.id,
          item: `Instructor Application: ${app.name}`,
          submittedBy: app.email,
          date: new Date(app.appliedAt).toISOString().split('T')[0]
        }));

        setAppState(prev => ({
          ...prev,
          approvals: {
            ...prev.approvals,
            pendingOther: formattedApplications
          },
          metrics: {
            ...prev.metrics,
            pendingApprovals: prev.approvals.pendingCourses.length + formattedApplications.length
          }
        }));
      }
    } catch (error) {
      console.error('Error fetching instructor applications:', error);
    }
  };

  const approveInstructorApplication = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/instructor-applications/${id}/approve`, {
        method: 'POST'
      });
      if (response.ok) {
        await fetchInstructorApplications(); // Refresh the list
        return true;
      }
    } catch (error) {
      console.error('Error approving instructor application:', error);
    }
    return false;
  };

  const rejectInstructorApplication = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/instructor-applications/${id}/reject`, {
        method: 'POST'
      });
      if (response.ok) {
        await fetchInstructorApplications(); // Refresh the list
        return true;
      }
    } catch (error) {
      console.error('Error rejecting instructor application:', error);
    }
    return false;
  };

  const fetchUsers = async (role = '', status = '') => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (role && role !== 'All Roles') params.append('role', role.toLowerCase());
      if (status && status !== 'All Statuses') params.append('status', status.toLowerCase());
      const url = `${API_BASE_URL}/users${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAppState(prev => ({ ...prev, users: data.users }));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchCourses = async (status = '') => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (status && status !== 'All Statuses') {
        if (status === 'Active') {
          params.append('status', 'published');
        } else if (status === 'Pending Approval') {
          params.append('status', 'pending_approval');
        } else {
          params.append('status', status.toLowerCase());
        }
      }
      const url = `${API_BASE_URL}/courses${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        // Transform course data to match frontend expectations
        const transformedCourses = data.courses.map(course => ({
          id: course.id,
          title: course.title,
          instructor: course.instructor.name,
          status: course.status === 'published' ? 'Active' : course.status === 'pending_approval' ? 'Pending for Approval' : course.status,
          enrollments: course._count?.enrollments || 0,
          rating: null, // Not in current schema
          completion: null, // Not in current schema
          revenue: course.price ? course.price * (course._count?.enrollments || 0) : null,
          createdDate: course.createdAt.toString().split('T')[0],
          featured: false, // Not in current schema
          modules: course.modules || []
        }));
        setAppState(prev => ({ ...prev, courses: transformedCourses }));
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchEnrollments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/enrollments/admin/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAppState(prev => ({ ...prev, enrollments: data.enrollments }));
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    }
  };

  const fetchProgress = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/progress/admin/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAppState(prev => ({ ...prev, progress: data.progress }));
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const fetchMetrics = async () => {
    try {
      const token = localStorage.getItem('token');
      const [usersMetricsRes, coursesMetricsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/users/metrics`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/users/courses/metrics`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (usersMetricsRes.ok) {
        const usersData = await usersMetricsRes.json();
        if (coursesMetricsRes.ok) {
          const coursesData = await coursesMetricsRes.json();
      setAppState(prev => ({
        ...prev,
        metrics: {
          totalUsers: usersData.metrics.totalUsers,
          activeCourses: coursesData.metrics.activeCourses,
          completedCourses: coursesData.metrics.completedCourses,
          systemUptime: "99.9%",
          pendingApprovals: coursesData.metrics.pendingApprovals
        }
      }));
        }
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  };

  useEffect(() => {
    // Load initial data from API
    fetchUsers();
    fetchCourses();
    fetchEnrollments();
    fetchProgress();
    fetchMetrics();

    // Fetch instructor applications on component mount
    fetchInstructorApplications();
  }, []);

  return (
    <AppContext.Provider value={{
      appState,
      updateUsers,
      updateCourses,
      updateApprovals,
      updateMetrics,
      addCourseManagementUpdate,
      courseManagementUpdates,
      darkTheme,
      toggleTheme,
      fetchPendingCourses,
      fetchInstructorApplications,
      approveInstructorApplication,
      rejectInstructorApplication,
      fetchUsers,
      fetchCourses,
      fetchEnrollments
    }}>
      {children}
    </AppContext.Provider>
  );
};
