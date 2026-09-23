import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./MainNavbar";
import Home from "./MainHome";
import Courses from "./MainCourses";
import CourseDetail from "./MainCourseDetail";
import About from "./MainAbout";
import Login from "./Login";
import SignUp from "./SignUp";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";
import Footer from "./MainFooter";
import "./MainIndex.css";
import PaymentSuccess from "./PaymentSuccess";

export default function App() {
  return (
    <div className="Main-app">
      <Navbar />
      <main className="Main-flex-1 Main-container Main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="courses" element={<Courses />} />
          <Route path="courses/:id" element={<CourseDetail />} />
          <Route path="about" element={<About />} />
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<SignUp />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />
          <Route path="payment-success" element={<PaymentSuccess />} />

        </Routes>
      </main>
      <Footer />
    </div>
  );
}
