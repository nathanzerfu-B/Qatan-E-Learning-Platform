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

  const resetAllFilters = () => {
    setCategory("All");
    setPrice("All");
    setSearchQuery("");
    setSortBy("popular");
    navigate("?", { replace: true });
  };

  const hasActiveFilters = category !== "All" || price !== "All" || searchQuery.trim() !== "";

  return (
    <div className="Main-courses-layout max-w-7xl mx-auto px-4 py-8">
      {/* Top Search & Filter Bar */}
      <div className="w-full mb-8">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-card p-4 rounded-2xl border border-border/70 shadow-sm">
          {/* Search Box */}
          <div className="relative flex-1">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
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
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort By Dropdown & Mobile Toggle */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 rounded-xl bg-background border border-border text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
              >
                <option value="popular">Most Popular</option>
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden px-4 py-2 rounded-xl bg-muted text-xs font-semibold text-foreground border border-border"
            >
              ☰ Filters
            </button>
          </div>
        </div>

        {/* Active Filters Pill Bar */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mt-3 px-1">
            <span className="text-xs text-muted-foreground">Active filters:</span>
            {category !== "All" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                {category}
                <button
                  type="button"
                  onClick={() => {
                    setCategory("All");
                    navigate("?", { replace: true });
                  }}
                  className="hover:opacity-75 font-bold"
                >
                  ✕
                </button>
              </span>
            )}
            {price !== "All" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                Price: {price}
                <button
                  type="button"
                  onClick={() => setPrice("All")}
                  className="hover:opacity-75 font-bold"
                >
                  ✕
                </button>
              </span>
            )}
            {searchQuery.trim() && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                "{searchQuery}"
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="hover:opacity-75 font-bold"
                >
                  ✕
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={resetAllFilters}
              className="text-xs font-semibold text-red-500 hover:underline ml-2"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Filters Sidebar */}
        <aside
          className={`Main-filters-aside md:w-64 shrink-0 ${
            showFilters ? "Main-open" : "hidden md:block"
          }`}
        >
          <div className="bg-card p-5 rounded-2xl border border-border/70 sticky top-24 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-border/50">
              <h3 className="font-bold text-sm text-foreground">Categories</h3>
              {category !== "All" && (
                <button
                  type="button"
                  onClick={() => {
                    setCategory("All");
                    navigate("?", { replace: true });
                  }}
                  className="text-[11px] text-primary hover:underline"
                >
                  Reset
                </button>
              )}
            </div>

            <ul className="space-y-1">
              {categories.map((cat) => (
                <li key={cat}>
                  <button
                    onClick={() => {
                      setCategory(cat);
                      navigate(`?category=${encodeURIComponent(cat)}`, { replace: true });
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      category === cat
                        ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {cat}
                  </button>
                </li>
              ))}
            </ul>

            <div className="pt-4 border-t border-border/50">
              <div className="flex items-center justify-between pb-3 border-b border-border/50 mb-2">
                <h3 className="font-bold text-sm text-foreground">Pricing</h3>
                {price !== "All" && (
                  <button
                    type="button"
                    onClick={() => setPrice("All")}
                    className="text-[11px] text-primary hover:underline"
                  >
                    Reset
                  </button>
                )}
              </div>
              <ul className="space-y-1">
                {["All", "Free", "Paid"].map((p) => (
                  <li key={p}>
                    <button
                      onClick={() => setPrice(p)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        price === p
                          ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {p === "All" ? "All Prices" : p}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>

        {/* Main Courses Grid */}
        <section className="flex-1">
          <div className="flex items-center justify-between mb-4 px-1">
            <span className="text-xs font-medium text-muted-foreground">
              Showing <strong className="text-foreground">{filteredCourses.length}</strong> courses
            </span>
          </div>

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
              <div className="col-span-full py-16 text-center bg-card rounded-2xl border border-dashed border-border p-8">
                <p className="text-base font-semibold text-foreground mb-2">
                  No courses found matching your criteria
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  Try adjusting your search query, category, or price filters.
                </p>
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
                >
                  Reset all filters
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
