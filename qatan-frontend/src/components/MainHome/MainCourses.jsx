import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import CourseCard from "./MainCourseCard";
import "./MainIndex.css";

export default function Courses() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [allCourses, setAllCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");

  const [price, setPrice] = useState("All");
  const [showFilters, setShowFilters] = useState(false);

  // Fetch courses from backend
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/courses");
        if (response.data.success) {
          setAllCourses(response.data.courses);
          setFilteredCourses(response.data.courses);
        }
      } catch (error) {
        console.error("Failed to fetch courses:", error);
        setAllCourses([]);
        setFilteredCourses([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const categories = [
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
  ];

  // Combined effect to update category from searchParams reliably
  useEffect(() => {
    const cat = searchParams.get("category") || "All";
    if (categories.includes(cat)) {
      setCategory(cat);
    } else {
      setCategory("All");
    }
  }, [searchParams, categories, allCourses]);

  useEffect(() => {
    let filtered = allCourses;
    if (category !== "All") {
      filtered = filtered.filter((c) => c.category === category);
    }
    if (price !== "All") {
      if (price === "Free") {
        filtered = filtered.filter((c) => c.price === 0 || c.price === null);
      } else if (price === "Paid") {
        filtered = filtered.filter((c) => c.price > 0);
      }
    }
    setFilteredCourses(filtered);
  }, [category, price, allCourses]);

  useEffect(() => {
    setShowFilters(false);
  }, [category, price]);

  return (
    <div className="Main-courses-layout">
      <aside className={`Main-filters-aside ${showFilters ? "Main-open" : ""}`}>
        <div className="Main-filters-sidebar">
          <h4 className="Main-filters-title">Filters</h4>
          <p className="Main-filter-label">Category</p>
          <ul className="Main-filter-list">
            {categories.map((cat) => (
              <li key={cat}>
                <button
                  onClick={() => {
                    setCategory(cat);
                    navigate(`?category=${encodeURIComponent(cat)}`, { replace: true });
                  }}
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
                  onClick={() => setPrice(p)}
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

      <section className="Main-courses-section">
        <div className="Main-courses-header">
          <h2 className="Main-courses-title">Courses</h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="Main-filters-toggle"
            aria-label="Toggle filters"
          >
            ☰ Filters
          </button>
        </div>
        <div className="Main-courses-grid">
          {loading ? (
            <div className="Main-loading">Loading courses...</div>
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
            <div className="Main-no-courses">No courses found</div>
          )}
        </div>
      </section>
    </div>
  );
}
