import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import CourseCard from "./MainCourseCard";
import CourseSkeleton from "../common/CourseSkeleton";
import "./MainIndex.css";

export default function Courses() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [allCourses, setAllCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [price, setPrice] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("popular");
  const [showFilters, setShowFilters] = useState(false);

  // Fetch courses from backend
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/courses");
        if (response.data.success) {
          setAllCourses(response.data.courses || []);
        }
      } catch (error) {
        console.error("Failed to fetch courses:", error);
        setAllCourses([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const categories = useMemo(() => [
    "All",
    "Design",
    "Development",
    "Marketing",
    "Business",
    ...Array.from(
      new Set(
        allCourses
          .map((c) => c.category)
          .filter(
            (cat) =>
              cat &&
              ![
                "Design",
                "Development",
                "Marketing",
                "Business",
              ].includes(cat)
          )
      )
    ),
  ], [allCourses]);

  // Sync category from searchParams
  useEffect(() => {
    const cat = searchParams.get("category") || "All";
    if (categories.includes(cat)) {
      setCategory(cat);
    } else {
      setCategory("All");
    }
  }, [searchParams, categories]);

  // Combined search, category, price filtering & sorting
  const filteredCourses = useMemo(() => {
    let result = [...allCourses];

    // Category filter
    if (category !== "All") {
      result = result.filter((c) => c.category === category);
    }

    // Price filter
    if (price === "Free") {
      result = result.filter((c) => !c.price || parseFloat(c.price) === 0);
    } else if (price === "Paid") {
      result = result.filter((c) => parseFloat(c.price) > 0);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.title?.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.instructor?.name?.toLowerCase().includes(q) ||
          c.category?.toLowerCase().includes(q)
      );
    }

    // Sorting
    if (sortBy === "price-low") {
      result.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
    } else if (sortBy === "price-high") {
      result.sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0));
    } else if (sortBy === "newest") {
      result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else {
      // Default: popular / enrollment count
      result.sort((a, b) => (b.enrollmentCount || 0) - (a.enrollmentCount || 0));
    }

    return result;
  }, [allCourses, category, price, searchQuery, sortBy]);

  const handleCategorySelect = (selectedCat) => {
    setCategory(selectedCat);
    if (selectedCat === "All") {
      navigate("/courses", { replace: true });
    } else {
      navigate(`/courses?category=${encodeURIComponent(selectedCat)}`, { replace: true });
    }
    setShowFilters(false);
  };

  const resetAllFilters = () => {
    setCategory("All");
    setPrice("All");
    setSearchQuery("");
    setSortBy("popular");
    navigate("/courses", { replace: true });
  };

  const hasActiveFilters = category !== "All" || price !== "All" || searchQuery.trim() !== "";

  return (
    <div className="Main-courses-layout">
      {/* 1. Sidebar Filters */}
      <aside className={`Main-filters-aside ${showFilters ? "Main-open" : ""}`}>
        <div className="Main-filters-sidebar">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h4 className="Main-filters-title" style={{ margin: 0 }}>Filters</h4>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                style={{ background: "none", border: "none", color: "#1c6048", fontSize: "0.75rem", cursor: "pointer", fontWeight: 600, padding: 0 }}
              >
                Reset
              </button>
            )}
          </div>

          <p className="Main-filter-label">Category</p>
          <ul className="Main-filter-list">
            {categories.map((cat) => (
              <li key={cat}>
                <button
                  type="button"
                  onClick={() => handleCategorySelect(cat)}
                  className={`Main-filter-btn ${
                    category === cat
                      ? "Main-filter-btn-active"
                      : "Main-filter-btn-inactive"
                  }`}
                >
                  {cat}
                </button>
              </li>
            ))}
          </ul>

          <p className="Main-filter-label Main-mt-6">Price</p>
          <ul className="Main-filter-list">
            {["All", "Free", "Paid"].map((p) => (
              <li key={p}>
                <button
                  type="button"
                  onClick={() => {
                    setPrice(p);
                    setShowFilters(false);
                  }}
                  className={`Main-filter-btn ${
                    price === p
                      ? "Main-filter-btn-active"
                      : "Main-filter-btn-inactive"
                  }`}
                >
                  {p}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* 2. Main Courses Section */}
      <section className="Main-courses-section">
        <div className="Main-courses-header">
          <h2 className="Main-courses-title">Courses</h2>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="Main-filters-toggle"
            aria-label="Toggle filters"
          >
            ☰ Filters
          </button>
        </div>

        {/* Search & Sort Controls */}
        <div className="Main-courses-controls">
          <div className="Main-search-box">
            <svg
              className="search-icon"
              width="16"
              height="16"
              style={{
                position: "absolute",
                left: "0.875rem",
                top: "50%",
                transform: "translateY(-50%)",
                width: "16px",
                height: "16px",
                minWidth: "16px",
                minHeight: "16px",
                maxWidth: "16px",
                maxHeight: "16px",
                color: "#9ca3af",
                pointerEvents: "none",
              }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search courses, instructors, topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="Main-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="Main-search-clear"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.8125rem", color: "#6b7280", whiteSpace: "nowrap" }}>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="Main-sort-dropdown"
            >
              <option value="popular">Most Popular</option>
              <option value="newest">Newest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Active Filters Pill Bar */}
        {hasActiveFilters && (
          <div className="Main-active-filter-bar">
            <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>Active:</span>
            {category !== "All" && (
              <span className="Main-active-pill">
                Category: {category}
                <button type="button" onClick={() => handleCategorySelect("All")}>✕</button>
              </span>
            )}
            {price !== "All" && (
              <span className="Main-active-pill">
                Price: {price}
                <button type="button" onClick={() => setPrice("All")}>✕</button>
              </span>
            )}
            {searchQuery.trim() && (
              <span className="Main-active-pill">
                "{searchQuery}"
                <button type="button" onClick={() => setSearchQuery("")}>✕</button>
              </span>
            )}
            <button
              type="button"
              onClick={resetAllFilters}
              className="Main-clear-filters-btn"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Courses Count */}
        <div style={{ marginBottom: "1rem", fontSize: "0.875rem", color: "#6b7280" }}>
          Showing <strong>{filteredCourses.length}</strong> {filteredCourses.length === 1 ? "course" : "courses"}
        </div>

        {/* Grid of Courses */}
        <div className="Main-courses-grid">
          {loading ? (
            <CourseSkeleton count={6} />
          ) : filteredCourses.length > 0 ? (
            filteredCourses.map((c) => (
              <div
                key={c.id}
                className="Main-cursor-pointer"
                onClick={() => navigate(`${c.id}`)}
              >
                <CourseCard course={c} />
              </div>
            ))
          ) : (
            <div className="Main-no-courses" style={{ gridColumn: "1 / -1", padding: "3rem", textAlign: "center" }}>
              <p style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.5rem" }}>
                No courses found
              </p>
              <p style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "1rem" }}>
                Try adjusting your search query, category, or price filters.
              </p>
              <button
                type="button"
                onClick={resetAllFilters}
                style={{
                  padding: "0.5rem 1.25rem",
                  backgroundColor: "#1c6048",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                }}
              >
                Reset all filters
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
