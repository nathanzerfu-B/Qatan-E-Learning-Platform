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
    <div className="w-full">
      {/* 1. Full-Width Catalog Hero & Search Bar */}
      <section className="bg-gradient-to-b from-blue-50/50 via-white to-white dark:from-[#0d131f] dark:via-[#090d14] dark:to-[#090d14] border-b border-border/80 pb-10 pt-4 -mt-4 px-4 sm:px-6 rounded-3xl mb-8 shadow-sm">
        <div className="max-w-7xl mx-auto">
          {/* Header Title */}
          <div className="max-w-2xl mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3 border border-primary/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Explore Top-Rated Curriculums</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              Expand Your Skills with Qatan
            </h1>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed">
              Explore interactive courses led by verified instructors, hands-on module assignments, and industry-recognized certifications.
            </p>
          </div>

          {/* Search & Sort Action Bar */}
          <div className="bg-card/90 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-border shadow-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <svg
                className="search-icon absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                width="16"
                height="16"
                style={{
                  width: "16px",
                  height: "16px",
                  minWidth: "16px",
                  minHeight: "16px",
                  maxWidth: "16px",
                  maxHeight: "16px",
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
                className="w-full pl-10 pr-9 py-2 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground font-bold p-1"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sort Selector & Mobile Filter Button */}
            <div className="flex items-center justify-between md:justify-end gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-background border border-border text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer shadow-sm"
                >
                  <option value="popular">Most Popular</option>
                  <option value="newest">Newest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="md:hidden px-3.5 py-2 rounded-xl bg-muted text-foreground text-xs font-semibold border border-border flex items-center gap-1.5"
              >
                <span>☰</span>
                <span>Filters</span>
                {hasActiveFilters && (
                  <span className="w-2 h-2 rounded-full bg-primary" />
                )}
              </button>
            </div>
          </div>

          {/* Quick Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 mt-4 scrollbar-none">
            <span className="text-xs font-semibold text-muted-foreground shrink-0 mr-1">Categories:</span>
            {categories.slice(0, 8).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategorySelect(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                  category === cat
                    ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                    : "bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Active Filter Chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-border/50">
              <span className="text-xs font-semibold text-muted-foreground">Active:</span>
              {category !== "All" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                  Category: {category}
                  <button
                    type="button"
                    onClick={() => handleCategorySelect("All")}
                    className="hover:opacity-70 font-bold ml-1"
                  >
                    ✕
                  </button>
                </span>
              )}
              {price !== "All" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                  Price: {price}
                  <button
                    type="button"
                    onClick={() => setPrice("All")}
                    className="hover:opacity-70 font-bold ml-1"
                  >
                    ✕
                  </button>
                </span>
              )}
              {searchQuery.trim() && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                  Search: "{searchQuery}"
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="hover:opacity-70 font-bold ml-1"
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
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 2. Main Content Layout: Sticky Sidebar + Course Grid */}
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Sidebar Filters */}
        <aside
          className={`w-full md:w-64 shrink-0 transition-all duration-300 ${
            showFilters ? "block" : "hidden md:block"
          }`}
        >
          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm sticky top-24 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-border/70">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <span>⚡</span>
                <span>Filters</span>
              </h3>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="text-[11px] font-semibold text-primary hover:underline"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Category Filter List */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                Categories
              </p>
              <ul className="space-y-1">
                {categories.map((cat) => {
                  const count =
                    cat === "All"
                      ? allCourses.length
                      : allCourses.filter((c) => c.category === cat).length;
                  return (
                    <li key={cat}>
                      <button
                        type="button"
                        onClick={() => handleCategorySelect(cat)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between ${
                          category === cat
                            ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <span>{cat}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                            category === cat
                              ? "bg-primary-foreground/20 text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Pricing Filter */}
            <div className="pt-4 border-t border-border/70">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                Pricing
              </p>
              <div className="space-y-1.5">
                {[
                  { id: "All", label: "All Prices" },
                  { id: "Free", label: "Free Courses" },
                  { id: "Paid", label: "Paid Only" },
                ].map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer text-xs font-medium transition-colors ${
                      price === item.id
                        ? "bg-primary/10 text-primary font-semibold border border-primary/20"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
                    }`}
                  >
                    <span>{item.label}</span>
                    <input
                      type="radio"
                      name="course-price"
                      value={item.id}
                      checked={price === item.id}
                      onChange={() => setPrice(item.id)}
                      className="accent-primary w-3.5 h-3.5 cursor-pointer"
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* 3. Main Course Grid (Takes remaining full width smoothly) */}
        <section className="flex-1 w-full min-w-0">
          {/* Header Count */}
          <div className="flex items-center justify-between mb-5 px-1">
            <span className="text-xs font-medium text-muted-foreground">
              Showing <strong className="text-foreground font-bold">{filteredCourses.length}</strong> {filteredCourses.length === 1 ? "course" : "courses"}
            </span>
          </div>

          {/* Grid Container */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
            {loading ? (
              <CourseSkeleton count={6} />
            ) : filteredCourses.length > 0 ? (
              filteredCourses.map((c) => (
                <div
                  key={c.id}
                  className="h-full"
                  onClick={() => navigate(`${c.id}`)}
                >
                  <CourseCard course={c} />
                </div>
              ))
            ) : (
              <div className="col-span-full py-16 px-6 text-center bg-card rounded-3xl border border-dashed border-border shadow-sm">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-muted/80 flex items-center justify-center text-2xl">
                  🔍
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1">
                  No courses found
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-6">
                  We couldn't find any courses matching your current filters or search query.
                </p>
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity shadow-sm"
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
