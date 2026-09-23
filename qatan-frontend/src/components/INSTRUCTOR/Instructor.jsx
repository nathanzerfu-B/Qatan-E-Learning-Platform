// src/components/INSTRUCTOR/Instructor.jsx
import React, { createContext, useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import "./Instructor.css";
import axios from "axios";

import { useAuth } from "../../context/AuthContext";

export const InstructorContext = createContext();

const Instructor = () => {
  const { logout, user } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [courses, setCourses] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  const toggleDarkMode = () => setDarkMode(!darkMode);
  const handleLogout = () => logout();

  // Fetch courses from API
  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/api/courses", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setCourses(response.data.courses);
      }
    } catch (error) {
      console.error("Failed to fetch courses:", error);
    }
  };

  // Fetch quizzes from API
  const fetchQuizzes = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/api/quizzes", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setQuizzes(response.data.quizzes);
      }
    } catch (error) {
      console.error("Failed to fetch quizzes:", error);
    }
  };

  const addCourse = async (courseData) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post("http://localhost:5000/api/courses", courseData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setCourses(prev => [...prev, response.data.course]);
        setIsCreatingCourse(false);
      }
    } catch (error) {
      console.error("Failed to create course:", error);
    }
  };

  const editCourse = (courseToEdit) => {
    setIsCreatingCourse(true);
    setEditingCourse(courseToEdit);
    // Navigate to the course creation page for editing
    // Assuming the navigation is handled by the router, but since we're using context, we need to ensure the route changes
    // The route is '/instructor/dashboard/courses/create' for both create and edit
  };

  const updateCourse = async (courseId, courseData) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(`http://localhost:5000/api/courses/${courseId}`, courseData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setCourses(prev => prev.map(course =>
          course.id === courseId ? response.data.course : course
        ));
        setIsCreatingCourse(false);
        setEditingCourse(null);
      }
    } catch (error) {
      console.error("Failed to update course:", error);
    }
  };

  const deleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) {
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const response = await axios.delete(`http://localhost:5000/api/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setCourses(prev => prev.filter(course => course.id !== courseId));
      }
    } catch (error) {
      console.error("Failed to delete course:", error);
    }
  };

  // Add quiz functions
  const addQuiz = async (quizData) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post("http://localhost:5000/api/quizzes", quizData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setQuizzes(prev => [...prev, response.data.quiz]);
      }
    } catch (error) {
      console.error("Failed to create quiz:", error);
    }
  };

  const updateQuiz = async (quizId, quizData) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(`http://localhost:5000/api/quizzes/${quizId}`, quizData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setQuizzes(prev => prev.map(quiz =>
          quiz.id === quizId ? response.data.quiz : quiz
        ));
      }
    } catch (error) {
      console.error("Failed to update quiz:", error);
    }
  };

  const deleteQuiz = async (quizId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.delete(`http://localhost:5000/api/quizzes/${quizId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setQuizzes(prev => prev.filter(quiz => quiz.id !== quizId));
      }
    } catch (error) {
      console.error("Failed to delete quiz:", error);
    }
  };

  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode") === "true";
    if (savedDarkMode !== darkMode) {
      setDarkMode(savedDarkMode);
    }

    // Fetch data from API instead of localStorage
    const loadData = async () => {
      await Promise.all([fetchCourses(), fetchQuizzes()]);
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);

    if (darkMode) {
      document.documentElement.classList.add("dark");
      document.body.classList.add("instructor-dark-theme");
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("instructor-dark-theme");
    }
  }, [darkMode]);

  const contextValue = {
    darkMode,
    toggleDarkMode,
    courses,
    setCourses,
    quizzes,
    setQuizzes,
    isCreatingCourse,
    setIsCreatingCourse,
    activeQuiz,
    setActiveQuiz,
    editingCourse,
    setEditingCourse,
    addCourse,
    editCourse,
    updateCourse,
    deleteCourse,
    addQuiz,
    updateQuiz,
    deleteQuiz,
    handleLogout,
    loading,
  };

  return (
    <InstructorContext.Provider value={contextValue}>
      <Outlet />
    </InstructorContext.Provider>
  );
};

export default Instructor;
