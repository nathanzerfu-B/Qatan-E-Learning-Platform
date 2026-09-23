// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('student-dark', darkMode);
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  // ✅ Register
const register = async (formData) => {
  try {
    const res = await axios.post('http://localhost:5000/api/auth/register', formData);

    if (res.data.success) {
      if (res.data.redirect) {
        // Instructor: wait for backend insert, then redirect to Discord
        window.location.href = res.data.redirect;
      } else {
        // Student or Admin: normal flow
        alert('Registration successful! Please log in.');
        navigate('/login');
      }
    }
  } catch (err) {
    console.error('Register Error:', err.response?.data || err.message);
    alert(err.response?.data?.message || 'Registration failed.');
  }
};



  // ✅ Login
  const login = async (email, password) => {
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      const { user, token } = res.data;
      if (!user || !token) throw new Error('Invalid response from server.');

      // Set user state first
      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);

      // Small delay to ensure state update
      setTimeout(() => {
        // Redirect to main homepage after login for all roles
        navigate('/');
      }, 100);
    } catch (err) {
      console.error('Login Error:', err.response?.data || err.message);
      alert(err.response?.data?.message || 'Invalid email or password.');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/');
  };

  const updateUser = (updatedUserData) => {
    const updatedUser = { ...user, ...updatedUserData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const isAuthenticated = () => !!user;
  const isAdmin = () => user?.role?.toLowerCase() === 'admin';
  const isStudent = () => user?.role?.toLowerCase() === 'student';
  const isInstructor = () => user?.role?.toLowerCase() === 'instructor';

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        register,
        updateUser,
        isAuthenticated,
        isAdmin,
        isStudent,
        isInstructor,
        loading,
        darkMode,
        setDarkMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
