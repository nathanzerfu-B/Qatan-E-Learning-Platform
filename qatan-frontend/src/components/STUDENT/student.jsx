import React, { useState, useEffect } from "react";
import { Routes, Route, Link, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import LessonViewer from "./LessonViewer";
import CertificateModal from "./CertificateModal";
import CourseSkeleton from "../common/CourseSkeleton";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Progress } from "../ui/Progress";
import PasswordStrengthMeter from "../ui/PasswordStrengthMeter";
import "./student.css";

const Student = () => {
  const navigate = useNavigate();
  const { logout, darkMode, setDarkMode, user, updateUser } = useAuth();
  const [activeLink, setActiveLink] = useState("home");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [selectedCertificate, setSelectedCertificate] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = () => {
    if (isMobile) setIsMobileMenuOpen(false);
    logout();
    navigate("/");
  };

  const handleProfile = () => {
    setActiveLink("profile");
    if (isMobile) setIsMobileMenuOpen(false);
    // For now, redirect to home
    navigate("/student/home");
  };

  const setActiveAndClose = (link) => {
    setActiveLink(link);
    if (isMobile) setIsMobileMenuOpen(false);
  };

  const navLeft = isMobile ? (isMobileMenuOpen ? "0" : "-250px") : "0";

  // Component: StudentHome
  const StudentHome = () => {
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const fetchEnrollments = async () => {
        try {
          const token = localStorage.getItem("token");
          const response = await axios.get(
            "http://localhost:5000/api/enrollments",
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (response.data.success) {
            setEnrollments(response.data.enrollments);
          }
        } catch (error) {
          console.error("Failed to fetch enrollments:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchEnrollments();
    }, []);

    const enrolledCount = enrollments.length;
    const completedCount = enrollments.filter(
      (e) => e.progress === 100 || e.status === "completed"
    ).length;
    const inProgressCount = enrollments.filter(
      (e) => (e.progress || 0) > 0 && e.progress < 100
    ).length;
    const avgProgress =
      enrolledCount > 0
        ? Math.round(
            enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) /
              enrolledCount
          )
        : 0;

    const currentActive =
      enrollments.find((e) => (e.progress || 0) > 0 && e.progress < 100) ||
      enrollments[0];

    const weekDays = [
      { day: "M", label: "Mon", active: true },
      { day: "T", label: "Tue", active: true },
      { day: "W", label: "Wed", active: true },
      { day: "T", label: "Thu", active: true },
      { day: "F", label: "Fri", active: false },
      { day: "S", label: "Sat", active: false },
      { day: "S", label: "Sun", active: false },
    ];

    return (
      <div className="min-h-screen bg-background text-foreground p-6 sm:p-8 space-y-8 text-left">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/")}
              className="mb-3 gap-2 text-muted-foreground hover:text-foreground"
            >
              ← Back to Main
            </Button>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Welcome back, {user?.name || "Student"}! 👋
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track your learning momentum, course milestones, and certificates.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="default"
              onClick={() => navigate("/courses")}
              className="shadow-sm font-medium"
            >
              Browse Catalog
            </Button>
            <Button
              variant="default"
              size="default"
              onClick={() => setActiveAndClose("courses")}
              className="shadow-sm font-semibold"
            >
              My Courses
            </Button>
          </div>
        </div>

        {/* 4 Responsive KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Metric 1: Enrolled */}
          <Card className="hover:border-primary/50 transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Enrolled Courses
              </CardTitle>
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight text-foreground">
                {loading ? "..." : enrolledCount}
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                <Badge variant="primary" className="text-[11px]">Active</Badge>
                <span className="text-xs text-muted-foreground">Total registered</span>
              </div>
            </CardContent>
          </Card>

          {/* Metric 2: In Progress */}
          <Card className="hover:border-blue-500/50 transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                In Progress
              </CardTitle>
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight text-foreground">
                {loading ? "..." : inProgressCount}
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                <Badge variant="secondary" className="text-[11px]">Learning</Badge>
                <span className="text-xs text-muted-foreground">Currently studying</span>
              </div>
            </CardContent>
          </Card>

          {/* Metric 3: Completed */}
          <Card className="hover:border-emerald-500/50 transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Completed
              </CardTitle>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight text-foreground">
                {loading ? "..." : completedCount}
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                <Badge variant="success" className="text-[11px]">Certificates</Badge>
                <span className="text-xs text-muted-foreground">Verified finishes</span>
              </div>
            </CardContent>
          </Card>

          {/* Metric 4: Avg Progress */}
          <Card className="hover:border-amber-500/50 transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Avg. Completion
              </CardTitle>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight text-foreground">
                {loading ? "..." : `${avgProgress}%`}
              </div>
              <div className="mt-2 space-y-1">
                <Progress value={avgProgress} className="h-1.5" />
                <span className="text-[11px] text-muted-foreground">Overall completion index</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Hero "Jump Back In" Card & Learning Streak Widget */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Jump Back In Card (2 Columns) */}
          <div className="lg:col-span-2">
            {currentActive ? (
              <Card className="overflow-hidden border-primary/20 shadow-md">
                <div className="p-6 sm:p-7 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                  <div className="relative w-full sm:w-48 aspect-video rounded-xl overflow-hidden bg-muted shrink-0 shadow-inner">
                    <img
                      src={currentActive.course.thumbnailUrl || "/img/student/python.png"}
                      alt={currentActive.course.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2">
                      <Badge variant="secondary" className="backdrop-blur bg-background/80 text-[10px]">
                        {currentActive.course.category || "Course"}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex-1 space-y-3 w-full">
                    <div>
                      <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                        Resume Where You Left Off
                      </span>
                      <h2 className="text-xl font-bold text-foreground mt-0.5 leading-snug">
                        {currentActive.course.title}
                      </h2>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        Instructor: {currentActive.course.instructor?.name || "Lead Instructor"}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-muted-foreground">Course Progress</span>
                        <span className="text-foreground font-semibold">{currentActive.progress || 0}%</span>
                      </div>
                      <Progress value={currentActive.progress || 0} />
                    </div>

                    <div className="pt-2 flex items-center gap-3">
                      <Button
                        size="sm"
                        onClick={() =>
                          navigate("/student/lesson", {
                            state: { courseId: currentActive.course.id },
                          })
                        }
                        className="font-semibold shadow-sm"
                      >
                        ▶ Resume Lesson
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveAndClose("courses")}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        All My Courses →
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-8 text-center flex flex-col items-center justify-center h-full">
                <div className="p-4 rounded-full bg-primary/10 text-primary mb-3">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-foreground">Start Learning Today</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-md">
                  You haven't enrolled in any courses yet. Choose from dozens of top-rated courses and earn certificates.
                </p>
                <Button className="mt-4" onClick={() => navigate("/courses")}>
                  Explore Course Catalog
                </Button>
              </Card>
            )}
          </div>

          {/* Learning Streak & Weekly Goal (1 Column) */}
          <Card className="flex flex-col justify-between">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-foreground flex items-center gap-1.5">
                  <span>🔥</span> Weekly Streak
                </CardTitle>
                <Badge variant="warning" className="text-[11px]">4 Days Active</Badge>
              </div>
              <CardDescription>
                Keep your momentum alive with daily practice.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center gap-1">
                {weekDays.map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground font-medium">{item.label}</span>
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        item.active
                          ? "bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/20"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {item.active ? "✓" : item.day}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 rounded-lg bg-muted/60 border border-border/50 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Tip: </span>
                Completing 1 lesson per day increases your completion probability by 74%!
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Card */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your latest interactions, completed modules, and quiz checkpoints.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
              <div className="relative flex items-start gap-4">
                <div className="absolute -left-[27px] mt-1 h-3.5 w-3.5 rounded-full border-2 border-background bg-primary ring-2 ring-primary/20" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Completed lesson: Introduction to React</p>
                  <p className="text-xs text-muted-foreground mt-0.5">2 hours ago</p>
                </div>
              </div>
              <div className="relative flex items-start gap-4">
                <div className="absolute -left-[27px] mt-1 h-3.5 w-3.5 rounded-full border-2 border-background bg-emerald-500 ring-2 ring-emerald-500/20" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Enrolled in: Advanced JavaScript</p>
                  <p className="text-xs text-muted-foreground mt-0.5">1 day ago</p>
                </div>
              </div>
              <div className="relative flex items-start gap-4">
                <div className="absolute -left-[27px] mt-1 h-3.5 w-3.5 rounded-full border-2 border-background bg-amber-500 ring-2 ring-amber-500/20" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Started quiz: CSS Fundamentals</p>
                  <p className="text-xs text-muted-foreground mt-0.5">3 days ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Component: StudentCourses
  const StudentCourses = () => {
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
      const fetchEnrollments = async () => {
        try {
          const token = localStorage.getItem("token");
          const response = await axios.get(
            "http://localhost:5000/api/enrollments",
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (response.data.success) {
            setEnrollments(response.data.enrollments);
          }
        } catch (error) {
          console.error("Failed to fetch enrollments:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchEnrollments();
    }, []);

    const inProgressCount = enrollments.filter(
      (e) => (e.progress || 0) > 0 && e.progress < 100
    ).length;
    const completedCount = enrollments.filter(
      (e) => e.progress === 100 || e.status === "completed"
    ).length;

    const filtered = enrollments.filter((e) => {
      const isCompleted = e.progress === 100 || e.status === "completed";
      const matchesStatus =
        filterStatus === "all"
          ? true
          : filterStatus === "completed"
          ? isCompleted
          : !isCompleted;
      const matchesSearch = e.course.title
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase().trim());
      return matchesStatus && matchesSearch;
    });

    return (
      <div className="min-h-screen bg-background text-foreground p-6 sm:p-8 space-y-8 text-left">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/")}
              className="mb-3 gap-2 text-muted-foreground hover:text-foreground"
            >
              ← Back to Main
            </Button>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              My Courses
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Pick up where you left off or review completed courses and earned certificates.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate("/courses")}
            className="shadow-sm font-medium self-start sm:self-auto"
          >
            + Enroll in More Courses
          </Button>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilterStatus("all")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterStatus === "all"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary text-secondary-foreground hover:bg-accent"
              }`}
            >
              All ({enrollments.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus("in_progress")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterStatus === "in_progress"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary text-secondary-foreground hover:bg-accent"
              }`}
            >
              In Progress ({inProgressCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus("completed")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterStatus === "completed"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary text-secondary-foreground hover:bg-accent"
              }`}
            >
              Completed ({completedCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <input
              type="text"
              placeholder="Search your courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-card text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <svg
              className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Courses Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <CourseSkeleton count={6} />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="p-4 rounded-full bg-muted w-14 h-14 mx-auto flex items-center justify-center text-muted-foreground mb-3">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-foreground">No courses found</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              {searchQuery
                ? `No courses matching "${searchQuery}"`
                : "You don't have any courses in this category yet."}
            </p>
            {searchQuery ? (
              <Button size="sm" variant="outline" onClick={() => setSearchQuery("")}>
                Clear Search
              </Button>
            ) : (
              <Button size="sm" onClick={() => navigate("/courses")}>
                Browse Catalog
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((enrollment) => {
              const isCompleted =
                enrollment.progress === 100 || enrollment.status === "completed";
              return (
                <Card
                  key={enrollment.id}
                  className="overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300 hover:border-primary/50 group"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-muted">
                    <img
                      src={
                        enrollment.course.thumbnailUrl || "/img/student/python.png"
                      }
                      alt={enrollment.course.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge
                        variant="secondary"
                        className="backdrop-blur bg-background/85 text-[10px] shadow-sm font-medium"
                      >
                        {enrollment.course.category || "General"}
                      </Badge>
                    </div>
                    <div className="absolute top-3 right-3">
                      <Badge variant={isCompleted ? "success" : "default"}>
                        {isCompleted ? "Completed" : "In Progress"}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-base font-bold text-foreground line-clamp-1 mb-1 group-hover:text-primary transition-colors">
                      {enrollment.course.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-4 flex-1">
                      {enrollment.course.description}
                    </p>

                    <div className="mt-auto space-y-4 pt-3 border-t border-border">
                      <Progress
                        value={enrollment.progress || 0}
                        showLabel
                        indicatorClassName={
                          isCompleted ? "bg-emerald-500" : "bg-primary"
                        }
                      />

                      <div className="flex items-center justify-between gap-2 pt-1">
                        {isCompleted && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10 font-medium text-xs"
                            onClick={() =>
                              setSelectedCertificate({
                                courseTitle: enrollment.course.title,
                                instructorName:
                                  enrollment.course.instructor?.name ||
                                  "Lead Instructor",
                                studentName: user?.name,
                              })
                            }
                          >
                            🎓 Certificate
                          </Button>
                        )}
                        <Button
                          variant={isCompleted ? "secondary" : "default"}
                          size="sm"
                          className="ml-auto font-semibold"
                          onClick={() =>
                            navigate("/student/lesson", {
                              state: { courseId: enrollment.course.id },
                            })
                          }
                        >
                          {enrollment.progress > 0 ? "Continue" : "Start"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Component: StudentSettings
  const StudentSettings = () => {
    const [formData, setFormData] = useState({
      name: user?.name || "",
      password: "",
      confirmPassword: "",
      bio: user?.bio || "",
      profilePicture: null,
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });
    const [previewImage, setPreviewImage] = useState(
      user?.profilePicture || "/img/student/student photo.png"
    );

    useEffect(() => {
      // Update form data when user data changes
      setFormData((prev) => ({
        ...prev,
        name: user?.name || "",
        bio: user?.bio || "",
      }));
      setPreviewImage(user?.profilePicture || "/img/student/student photo.png");
    }, [user]);

    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    };

    const handleFileChange = (e) => {
      const file = e.target.files[0];
      if (file) {
        setFormData((prev) => ({
          ...prev,
          profilePicture: file,
        }));
        // Create preview URL
        const reader = new FileReader();
        reader.onload = (e) => setPreviewImage(e.target.result);
        reader.readAsDataURL(file);
      }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      setMessage({ type: "", text: "" });

      // Validation
      if (formData.password && formData.password !== formData.confirmPassword) {
        setMessage({ type: "error", text: "Passwords do not match" });
        setLoading(false);
        return;
      }

      if (formData.password) {
        if (formData.password.length < 8) {
          setMessage({ type: "error", text: "Password must be at least 8 characters long" });
          setLoading(false);
          return;
        }
        if (!/[a-zA-Z]/.test(formData.password) || !/[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password)) {
          setMessage({ type: "error", text: "Password must contain both letters and numbers/symbols" });
          setLoading(false);
          return;
        }
      }

      try {
        const formDataToSend = new FormData();
        formDataToSend.append("name", formData.name);
        if (formData.password) {
          formDataToSend.append("password", formData.password);
          formDataToSend.append("confirmPassword", formData.confirmPassword);
        }
        formDataToSend.append("bio", formData.bio);
        if (formData.profilePicture) {
          formDataToSend.append("profilePicture", formData.profilePicture);
        }

        const token = localStorage.getItem("token");
        const response = await axios.put(
          "http://localhost:5000/api/users/profile",
          formDataToSend,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        if (response.data.success) {
          setMessage({
            type: "success",
            text: "Profile updated successfully!",
          });
          // Update user context with new data
          updateUser(response.data.user);
        }
      } catch (error) {
        console.error("Profile update error:", error);
        setMessage({
          type: "error",
          text: "Failed to update profile. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };

    return (
      <div
        style={{
          backgroundColor: "var(--bg-color)",
          minHeight: "100vh",
          padding: "var(--padding)",
          fontFamily: "sans-serif",
          textAlign: "left",
        }}
      >
        <button
          style={{
            backgroundColor: "var(--button-bg)",
            color: "var(--button-color)",
            padding: "var(--button-padding)",
            borderRadius: "var(--border-radius-small)",
            border: "none",
            cursor: "pointer",
            marginBottom: "16px",
          }}
          onClick={() => navigate("/")}
        >
          ← Back to Main
        </button>
        <h1
          style={{
            fontSize: "var(--font-size-h1)",
            fontWeight: "bold",
            color: "var(--text-color)",
            marginBottom: "32px",
          }}
        >
          Settings
        </h1>
        <div
          style={{
            backgroundColor: "var(--card-bg)",
            backdropFilter: "blur(4px)",
            border: "1px solid var(--border-color)",
            borderRadius: "16px",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
            padding: "var(--card-padding)",
            maxWidth: "600px",
            margin: "0 auto",
          }}
        >
          <h2
            style={{
              fontSize: "var(--font-size-h2)",
              fontWeight: "bold",
              color: "var(--text-color)",
              marginBottom: "16px",
            }}
          >
            Profile Settings
          </h2>
          {message.text && (
            <div
              style={{
                padding: "var(--spacing-md)",
                borderRadius: "var(--border-radius-small)",
                marginBottom: "var(--spacing-md)",
                backgroundColor:
                  message.type === "success" ? "#d1fae5" : "#fee2e2",
                color: message.type === "success" ? "#065f46" : "#991b1b",
                border: `1px solid ${
                  message.type === "success" ? "#a7f3d0" : "#fecaca"
                }`,
              }}
            >
              {message.text}
            </div>
          )}
          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--spacing-md)",
            }}
          >
            <div>
              <label
                htmlFor="name"
                style={{
                  display: "block",
                  fontSize: "var(--font-size-small)",
                  fontWeight: "500",
                  color: "var(--text-color)",
                  marginBottom: "var(--spacing-xs)",
                }}
              >
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                style={{
                  width: "100%",
                  padding: "var(--input-padding)",
                  backgroundColor: "var(--card-bg)",
                  backdropFilter: "blur(4px)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--border-radius-small)",
                  outline: "none",
                  color: "var(--text-color)",
                  transition: "all 0.3s",
                  boxShadow: "inset 0 2px 4px 0 rgba(0,0,0,0.06)",
                }}
                onFocus={(e) => {
                  e.target.style.boxShadow = "0 0 0 2px var(--primary-focus)";
                  e.target.style.borderColor = "var(--primary-color)";
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow =
                    "inset 0 2px 4px 0 rgba(0,0,0,0.06)";
                  e.target.style.borderColor = "var(--border-color)";
                }}
              />
            </div>
            <div>
              <label
                htmlFor="bio"
                style={{
                  display: "block",
                  fontSize: "var(--font-size-small)",
                  fontWeight: "500",
                  color: "var(--text-color)",
                  marginBottom: "var(--spacing-xs)",
                }}
              >
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows="4"
                style={{
                  width: "100%",
                  padding: "var(--input-padding)",
                  backgroundColor: "var(--card-bg)",
                  backdropFilter: "blur(4px)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--border-radius-small)",
                  outline: "none",
                  color: "var(--text-color)",
                  resize: "vertical",
                  transition: "all 0.3s",
                  boxShadow: "inset 0 2px 4px 0 rgba(0,0,0,0.06)",
                }}
                onFocus={(e) => {
                  e.target.style.boxShadow = "0 0 0 2px var(--primary-focus)";
                  e.target.style.borderColor = "var(--primary-color)";
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow =
                    "inset 0 2px 4px 0 rgba(0,0,0,0.06)";
                  e.target.style.borderColor = "var(--border-color)";
                }}
              />
            </div>
            <div>
              <label
                htmlFor="profilePicture"
                style={{
                  display: "block",
                  fontSize: "var(--font-size-small)",
                  fontWeight: "500",
                  color: "var(--text-color)",
                  marginBottom: "var(--spacing-xs)",
                }}
              >
                Profile Picture
              </label>
              <input
                type="file"
                id="profilePicture"
                name="profilePicture"
                accept="image/*"
                onChange={handleFileChange}
                style={{
                  width: "100%",
                  padding: "var(--input-padding)",
                  backgroundColor: "var(--card-bg)",
                  backdropFilter: "blur(4px)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--border-radius-small)",
                  outline: "none",
                  color: "var(--text-color)",
                  transition: "all 0.3s",
                  boxShadow: "inset 0 2px 4px 0 rgba(0,0,0,0.06)",
                }}
              />
              {previewImage && (
                <img
                  src={previewImage}
                  alt="Preview"
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    marginTop: "var(--spacing-sm)",
                    objectFit: "cover",
                  }}
                />
              )}
            </div>
            <div>
              <label
                htmlFor="password"
                style={{
                  display: "block",
                  fontSize: "var(--font-size-small)",
                  fontWeight: "500",
                  color: "var(--text-color)",
                  marginBottom: "var(--spacing-xs)",
                }}
              >
                New Password (optional)
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                style={{
                  width: "100%",
                  padding: "var(--input-padding)",
                  backgroundColor: "var(--card-bg)",
                  backdropFilter: "blur(4px)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--border-radius-small)",
                  outline: "none",
                  color: "var(--text-color)",
                  transition: "all 0.3s",
                  boxShadow: "inset 0 2px 4px 0 rgba(0,0,0,0.06)",
                }}
                onFocus={(e) => {
                  e.target.style.boxShadow = "0 0 0 2px var(--primary-focus)";
                  e.target.style.borderColor = "var(--primary-color)";
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow =
                    "inset 0 2px 4px 0 rgba(0,0,0,0.06)";
                  e.target.style.borderColor = "var(--border-color)";
                }}
              />
              <PasswordStrengthMeter password={formData.password} />
            </div>
            <div>
              <label
                htmlFor="confirmPassword"
                style={{
                  display: "block",
                  fontSize: "var(--font-size-small)",
                  fontWeight: "500",
                  color: "var(--text-color)",
                  marginBottom: "var(--spacing-xs)",
                }}
              >
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                style={{
                  width: "100%",
                  padding: "var(--input-padding)",
                  backgroundColor: "var(--card-bg)",
                  backdropFilter: "blur(4px)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--border-radius-small)",
                  outline: "none",
                  color: "var(--text-color)",
                  transition: "all 0.3s",
                  boxShadow: "inset 0 2px 4px 0 rgba(0,0,0,0.06)",
                }}
                onFocus={(e) => {
                  e.target.style.boxShadow = "0 0 0 2px var(--primary-focus)";
                  e.target.style.borderColor = "var(--primary-color)";
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow =
                    "inset 0 2px 4px 0 rgba(0,0,0,0.06)";
                  e.target.style.borderColor = "var(--border-color)";
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: loading
                  ? "var(--muted-text)"
                  : "var(--button-bg)",
                color: "var(--button-color)",
                padding: "var(--button-padding)",
                borderRadius: "var(--border-radius-small)",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: "500",
                transition: "all 0.3s",
              }}
              onMouseEnter={(e) => {
                if (!loading)
                  e.target.style.backgroundColor = "var(--button-hover)";
              }}
              onMouseLeave={(e) => {
                if (!loading)
                  e.target.style.backgroundColor = "var(--button-bg)";
              }}
            >
              {loading ? "Updating..." : "Update Profile"}
            </button>
          </form>
        </div>
      </div>
    );
  };

  // Component: StudentHelp
  const StudentHelp = () => {
    return (
      <div
        style={{
          marginLeft: "0px",
          backgroundColor: "var(--bg-color)",
          minHeight: "100vh",
          padding: "var(--padding)",
          fontFamily: "sans-serif",
          textAlign: "left",
        }}
      >
        <button
          style={{
            backgroundColor: "var(--button-bg)",
            color: "var(--button-color)",
            padding: "var(--button-padding)",
            borderRadius: "var(--border-radius-small)",
            border: "none",
            cursor: "pointer",
            marginBottom: "16px",
          }}
          onClick={() => navigate("/")}
        >
          ← Back to Main
        </button>
        <h1
          style={{
            fontSize: "var(--font-size-h1)",
            fontWeight: "bold",
            color: "var(--text-color)",
            marginBottom: "32px",
          }}
        >
          Help & Support
        </h1>
        <div
          style={{
            backgroundColor: "var(--card-bg)",
            backdropFilter: "blur(4px)",
            border: "1px solid var(--border-color)",
            borderRadius: "16px",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
            padding: "var(--card-padding)",
            marginBottom: "var(--card-margin-bottom)",
          }}
        >
          <h2
            style={{
              fontSize: "var(--font-size-h2)",
              fontWeight: "bold",
              color: "var(--text-color)",
              marginBottom: "16px",
            }}
          >
            Frequently Asked Questions
          </h2>
          <div
            className="student-faq-item"
            style={{ marginBottom: "var(--spacing-md)" }}
          >
            <h3
              style={{
                fontSize: "var(--font-size-h3)",
                fontWeight: "600",
                color: "var(--text-color)",
                marginBottom: "var(--spacing-sm)",
              }}
            >
              How do I enroll in a course?
            </h3>
            <p style={{ color: "var(--secondary-text)" }}>
              Navigate to the Courses page and click on the "Enroll" button for
              the course you want to take.
            </p>
          </div>
          <div
            className="student-faq-item"
            style={{ marginBottom: "var(--spacing-md)" }}
          >
            <h3
              style={{
                fontSize: "var(--font-size-h3)",
                fontWeight: "600",
                color: "var(--text-color)",
                marginBottom: "var(--spacing-sm)",
              }}
            >
              How can I reset my password?
            </h3>
            <p style={{ color: "var(--secondary-text)" }}>
              Go to Settings and use the "Change Password" field to update your
              password.
            </p>
          </div>
          <div
            className="student-faq-item"
            style={{ marginBottom: "var(--spacing-md)" }}
          >
            <h3
              style={{
                fontSize: "var(--font-size-h3)",
                fontWeight: "600",
                color: "var(--text-color)",
                marginBottom: "var(--spacing-sm)",
              }}
            >
              How do I contact support?
            </h3>
            <p style={{ color: "var(--secondary-text)" }}>
              You can reach out to our support team at support@qatan.edu or use
              the contact form below.
            </p>
          </div>
        </div>
        <div
          style={{
            backgroundColor: "var(--card-bg)",
            backdropFilter: "blur(4px)",
            border: "1px solid var(--border-color)",
            borderRadius: "16px",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
            padding: "var(--card-padding)",
          }}
        >
          <h2
            style={{
              fontSize: "var(--font-size-h2)",
              fontWeight: "bold",
              color: "var(--text-color)",
              marginBottom: "16px",
            }}
          >
            Contact Support
          </h2>
          <form
            className="student-contact-form"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--spacing-md)",
            }}
          >
            <div>
              <label
                htmlFor="subject"
                style={{
                  display: "block",
                  fontSize: "var(--font-size-small)",
                  fontWeight: "500",
                  color: "var(--text-color)",
                  marginBottom: "var(--spacing-xs)",
                }}
              >
                Subject
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                style={{
                  width: "100%",
                  padding: "var(--input-padding)",
                  backgroundColor: "var(--card-bg)",
                  backdropFilter: "blur(4px)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--border-radius-small)",
                  outline: "none",
                  color: "var(--text-color)",
                  transition: "all 0.3s",
                  boxShadow: "inset 0 2px 4px 0 rgba(0,0,0,0.06)",
                }}
                onFocus={(e) => {
                  e.target.style.boxShadow = "0 0 0 2px var(--primary-focus)";
                  e.target.style.borderColor = "var(--primary-color)";
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow =
                    "inset 0 2px 4px 0 rgba(0,0,0,0.06)";
                  e.target.style.borderColor = "var(--border-color)";
                }}
              />
            </div>
            <div>
              <label
                htmlFor="message"
                style={{
                  display: "block",
                  fontSize: "var(--font-size-small)",
                  fontWeight: "500",
                  color: "var(--text-color)",
                  marginBottom: "var(--spacing-xs)",
                }}
              >
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows="6"
                style={{
                  width: "100%",
                  padding: "var(--input-padding)",
                  backgroundColor: "var(--card-bg)",
                  backdropFilter: "blur(4px)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--border-radius-small)",
                  outline: "none",
                  color: "var(--text-color)",
                  resize: "vertical",
                  transition: "all 0.3s",
                  boxShadow: "inset 0 2px 4px 0 rgba(0,0,0,0.06)",
                }}
                onFocus={(e) => {
                  e.target.style.boxShadow = "0 0 0 2px var(--primary-focus)";
                  e.target.style.borderColor = "var(--primary-color)";
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow =
                    "inset 0 2px 4px 0 rgba(0,0,0,0.06)";
                  e.target.style.borderColor = "var(--border-color)";
                }}
              ></textarea>
            </div>
            <button
              type="submit"
              style={{
                backgroundColor: "var(--button-bg)",
                color: "var(--button-color)",
                padding: "var(--button-padding)",
                borderRadius: "var(--border-radius-small)",
                border: "none",
                cursor: "pointer",
                fontWeight: "500",
                transition: "all 0.3s",
              }}
              onMouseEnter={(e) =>
                (e.target.style.backgroundColor = "var(--button-hover)")
              }
              onMouseLeave={(e) =>
                (e.target.style.backgroundColor = "var(--button-bg)")
              }
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`m-0 font-sans ${darkMode ? "student-dark" : ""}`}
      style={{ backgroundColor: "var(--bg-color)" }}
    >
      <button
        className="student-mobile-menu-button"
        onClick={toggleMobileMenu}
        style={{
          display: isMobile && !isMobileMenuOpen ? "block" : "none",
        }}
      >
        ☰
      </button>
      <nav
        className="student-sidebar fixed top-0 h-screen w-[250px] p-5 flex flex-col transition-all duration-300 ease-in-out z-50 bg-[var(--nav-bg)]"
        style={{ left: navLeft }}
      >
        <button
          className="student-close-btn absolute top-4 right-4 p-2 rounded-md text-gray-400 bg-white ring-1 ring-black ring-opacity-5 shadow-lg"
          onClick={toggleMobileMenu}
          style={{
            color: "var(--text-color)",
            display: isMobile ? "block" : "none",
          }}
        >
          ✕
        </button>
        <div
          className="flex items-center justify-between mb-5"
          style={{
            marginLeft: "var(--spacing-md)",
            marginTop: "var(--spacing-xl)",
            marginBottom: "var(--spacing-xl)",
          }}
        >
          <Link
            to="/student/home"
            className="flex items-center no-underline"
            style={{ color: "var(--text-color)" }}
            onClick={handleProfile}
          >
            <img
              src={user?.profilePicture || "/img/student/student photo.png"}
              alt="profile"
              style={{
                width: "80px",
                borderRadius: "10rem",
                marginRight: "var(--spacing-xxs)",
              }}
            />
            <div>
              <div>{user?.name || "Student"}</div>
              <div
                style={{ fontSize: "small", color: "var(--secondary-text)" }}
              >
                {user?.bio || ""}
              </div>
            </div>
          </Link>
          <label
            className="student-switch mt-5"
            style={{
              marginTop: "var(--spacing-xxl)",
              marginLeft: "var(--spacing-md)",
            }}
          >
            <input
              id="switch"
              type="checkbox"
              checked={darkMode}
              onChange={toggleDarkMode}
            />
            <span className="student-slider"></span>
            <span className="student-decoration"></span>
          </label>
        </div>
        <Link
          to="/student/home"
          onClick={() => setActiveAndClose("home")}
          className="flex items-center no-underline"
          style={{
            marginBottom: "var(--spacing-xl)",
            fontWeight: "bold",
            marginLeft: "var(--spacing-md)",
            color:
              activeLink === "home"
                ? "var(--active-link)"
                : "var(--link-color)",
          }}
        >
          <img
            src={
              activeLink === "home"
                ? "/img/dashboard-hover-blue.png"
                : "/img/dashboard-gray.png"
            }
            alt="Home"
            style={{
              width: "24px",
              height: "24px",
              marginRight: "5px",
              borderRadius: "50%",
            }}
          />
          Home
        </Link>
        <Link
          to="/student/courses"
          onClick={() => setActiveAndClose("courses")}
          className="flex items-center no-underline"
          style={{
            marginBottom: "var(--spacing-xl)",
            fontWeight: "bold",
            marginLeft: "var(--spacing-md)",
            color:
              activeLink === "courses"
                ? "var(--active-link)"
                : "var(--link-color)",
          }}
        >
          <img
            src={
              activeLink === "courses"
                ? "/img/courses-hover-blue.png"
                : "/img/courses-gray.png"
            }
            alt="Courses"
            style={{
              width: "24px",
              height: "24px",
              marginRight: "var(--spacing-xxs)",
              borderRadius: "50%",
            }}
          />
          My Courses
        </Link>
        <Link
          to="/student/settings"
          onClick={() => setActiveAndClose("settings")}
          className="flex items-center no-underline"
          style={{
            marginBottom: "var(--spacing-xl)",
            fontWeight: "bold",
            marginLeft: "var(--spacing-md)",
            color:
              activeLink === "settings"
                ? "var(--active-link)"
                : "var(--link-color)",
          }}
        >
          <img
            src={
              activeLink === "settings"
                ? "/img/settings-hover-blue.png"
                : "/img/settings-gray.png"
            }
            alt="Settings"
            style={{
              width: "24px",
              height: "24px",
              marginRight: "5px",
              borderRadius: "50%",
            }}
          />
          Settings
        </Link>
        <Link
          to="/student/help"
          onClick={() => setActiveAndClose("help")}
          className="flex items-center no-underline"
          style={{
            marginBottom: "var(--spacing-xl)",
            fontWeight: "bold",
            marginLeft: "var(--spacing-md)",
            color:
              activeLink === "help"
                ? "var(--active-link)"
                : "var(--link-color)",
          }}
        >
          <img
            src={
              activeLink === "help"
                ? "/img/reports-hover-blue.png"
                : "/img/reports-gray.png"
            }
            alt="Help"
            style={{
              width: "24px",
              height: "24px",
              marginRight: "var(--spacing-xxs)",
              borderRadius: "50%",
            }}
          />
          Help
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center no-underline"
          style={{
            marginBottom: "var(--spacing-xl)",
            fontWeight: "bold",
            marginLeft: "var(--spacing-md)",
            color:
              activeLink === "logout"
                ? "var(--active-link)"
                : "var(--link-color)",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          <img
            src={
              activeLink === "logout"
                ? "/img/logout-hover-blue.png"
                : "/img/logout-grey.png"
            }
            alt="Logout"
            style={{
              width: "24px",
              height: "24px",
              marginRight: "var(--spacing-xxs)",
              borderRadius: "50%",
            }}
          />
          Logout
        </button>
      </nav>
      {isMobile && isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleMobileMenu}
        />
      )}
      <div
        className="student-main-content min-h-screen p-5"
        style={{ marginLeft: "var(--main-margin-left)" }}
        onClick={isMobile && isMobileMenuOpen ? toggleMobileMenu : undefined}
      >
        <Routes>
          <Route index element={<StudentHome />} />
          <Route path="/" element={<StudentHome />} />
          <Route path="dashboard" element={<StudentHome />} />
          <Route path="home" element={<StudentHome />} />
          <Route path="courses" element={<StudentCourses />} />
          <Route path="lesson" element={<LessonViewer />} />
          <Route path="settings" element={<StudentSettings />} />
          <Route path="help" element={<StudentHelp />} />
        </Routes>
      </div>

      {selectedCertificate && (
        <CertificateModal
          studentName={selectedCertificate.studentName || user?.name || "Verified Student"}
          courseTitle={selectedCertificate.courseTitle}
          instructorName={selectedCertificate.instructorName}
          onClose={() => setSelectedCertificate(null)}
        />
      )}
    </div>
  );
};

export default Student;
