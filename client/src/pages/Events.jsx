import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Navbar from "../components/Navbar";

const CATEGORIES = [
  "All",
  "Movie",
  "Concert",
  "Sports",
  "Theatre",
  "Workshop",
  "Conference",
];

function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLanguage, setSelectedLanguage] = useState("All");
  const [minRating, setMinRating] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents();
  }, [selectedCategory, selectedLanguage, minRating, maxPrice, sortBy, currentPage]);

  const fetchEvents = async (searchOverride = null) => {
    setLoading(true);
    setError("");

    try {
      const activeSearch = searchOverride !== null ? searchOverride : search;
      const params = {
        page: currentPage,
        limit: 6,
        sortBy,
      };

      if (activeSearch.trim()) params.search = activeSearch.trim();
      if (selectedCategory !== "All") params.category = selectedCategory;
      if (selectedLanguage !== "All") params.language = selectedLanguage;
      if (minRating) params.minRating = minRating;
      if (maxPrice) params.maxPrice = maxPrice;

      const res = await API.get("/events", { params });
      if (res.data?.success) {
        setEvents(res.data.events || []);
        setTotalPages(res.data.totalPages || 1);
        setTotalEvents(res.data.totalEvents || 0);
      }
    } catch (err) {
      setError("Failed to load events. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchEvents();
  };

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearch("");
    setSelectedCategory("All");
    setSelectedLanguage("All");
    setMinRating("");
    setMaxPrice("");
    setSortBy("date_desc");
    setCurrentPage(1);
    fetchEvents("");
  };

  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <div
        className="py-5 text-center text-white position-relative"
        style={{
          background: "linear-gradient(180deg, #181a20 0%, #0f1015 100%)",
          borderBottom: "1px solid #2a2d39",
        }}
      >
        <div className="container py-4">
          <span className="badge bg-danger px-3 py-2 rounded-pill mb-3 text-uppercase fw-bold letter-spacing">
            ⚡ Live Entertainment & Seat Booking
          </span>
          <h1 className="display-4 fw-bold mb-3">
            Discover & Book Unforgettable Experiences
          </h1>
          <p className="lead text-secondary mx-auto mb-4" style={{ maxWidth: "700px" }}>
            Real-time seat selection, instant temporary locking, and seamless booking for
            movies, live concerts, sports finals, and workshops.
          </p>

          {/* Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="d-flex mx-auto shadow-lg"
            style={{ maxWidth: "620px" }}
          >
            <input
              type="text"
              className="form-control form-control-lg bg-dark text-white border-secondary rounded-start-pill ps-4"
              placeholder="Search by title, artist, genre, or language..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              type="submit"
              className="btn btn-danger btn-lg px-4 rounded-end-pill fw-semibold"
            >
              <i className="bi bi-search me-1"></i> Search
            </button>
          </form>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container py-5">
        {/* Category Pills Filter */}
        <div className="d-flex flex-wrap gap-2 justify-content-center mb-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`btn btn-sm rounded-pill px-3 py-2 fw-semibold ${
                selectedCategory === cat
                  ? "btn-danger shadow"
                  : "btn-outline-secondary text-light"
              }`}
              onClick={() => handleCategoryChange(cat)}
            >
              {cat === "All" && "🌐 "}
              {cat === "Movie" && "🎬 "}
              {cat === "Concert" && "🎸 "}
              {cat === "Sports" && "⚽ "}
              {cat === "Theatre" && "🎭 "}
              {cat === "Workshop" && "💻 "}
              {cat === "Conference" && "🎤 "}
              {cat}
            </button>
          ))}
        </div>

        {/* Filter & Sorting Controls Toolbar */}
        <div
          className="card border-0 p-3 mb-5 shadow-sm"
          style={{ background: "#1a1c24", borderRadius: "14px" }}
        >
          <div className="row g-3 align-items-center">
            {/* Language */}
            <div className="col-6 col-md-3">
              <label className="text-secondary small fw-semibold mb-1">Language</label>
              <select
                className="form-select form-select-sm bg-dark text-white border-secondary"
                value={selectedLanguage}
                onChange={(e) => {
                  setSelectedLanguage(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="All">All Languages</option>
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Spanish">Spanish</option>
              </select>
            </div>

            {/* Min Rating */}
            <div className="col-6 col-md-2">
              <label className="text-secondary small fw-semibold mb-1">Min Rating</label>
              <select
                className="form-select form-select-sm bg-dark text-white border-secondary"
                value={minRating}
                onChange={(e) => {
                  setMinRating(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">Any Rating</option>
                <option value="4.5">★ 4.5 & up</option>
                <option value="4.0">★ 4.0 & up</option>
                <option value="3.5">★ 3.5 & up</option>
              </select>
            </div>

            {/* Max Price */}
            <div className="col-6 col-md-2">
              <label className="text-secondary small fw-semibold mb-1">Max Price</label>
              <select
                className="form-select form-select-sm bg-dark text-white border-secondary"
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">Any Price</option>
                <option value="200">Under ₹200</option>
                <option value="300">Under ₹300</option>
                <option value="500">Under ₹500</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className="col-6 col-md-3">
              <label className="text-secondary small fw-semibold mb-1">Sort By</label>
              <select
                className="form-select form-select-sm bg-dark text-white border-secondary"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="date_desc">Newest Releases</option>
                <option value="rating_desc">Highest Rated</option>
                <option value="price_asc">Price: Low → High</option>
                <option value="price_desc">Price: High → Low</option>
                <option value="date_asc">Oldest Releases</option>
              </select>
            </div>

            {/* Reset */}
            <div className="col-12 col-md-2 d-flex align-items-end">
              <button
                className="btn btn-sm btn-outline-warning w-100 py-1"
                onClick={resetFilters}
              >
                <i className="bi bi-arrow-counterclockwise me-1"></i> Reset
              </button>
            </div>
          </div>
        </div>

        {/* Results Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="fw-bold text-white mb-0">
            {selectedCategory === "All" ? "Featured Events" : `${selectedCategory} Events`}
            <span className="badge bg-secondary ms-2 fs-6">{totalEvents} Available</span>
          </h4>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-danger" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-secondary mt-2">Loading events...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="alert alert-danger" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && events.length === 0 && (
          <div
            className="text-center py-5 rounded"
            style={{ background: "#1a1c24", border: "1px dashed #3a3e4e" }}
          >
            <span className="fs-1">🔍</span>
            <h4 className="text-white mt-3">No Events Found</h4>
            <p className="text-secondary mb-4">
              Try adjusting your search criteria or resetting filters.
            </p>
            <button className="btn btn-danger rounded-pill px-4" onClick={resetFilters}>
              Clear All Filters
            </button>
          </div>
        )}

        {/* Events Grid */}
        {!loading && !error && events.length > 0 && (
          <div className="row g-4 mb-5">
            {events.map((evt) => (
              <div key={evt._id} className="col-md-6 col-lg-4">
                <div className="card event-card h-100 shadow">
                  <div className="position-relative overflow-hidden">
                    <img
                      src={evt.poster}
                      alt={evt.title}
                      className="event-poster"
                      onError={(e) => {
                        e.target.src =
                          "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=60";
                      }}
                    />
                    <span className="position-absolute top-0 end-0 m-3 badge bg-dark bg-opacity-75 text-warning fw-bold p-2 rounded-pill shadow">
                      ★ {evt.rating?.toFixed(1) || "4.5"}
                    </span>
                    <span className="position-absolute top-0 start-0 m-3 badge badge-category">
                      {evt.category}
                    </span>
                  </div>

                  <div className="card-body d-flex flex-column p-4">
                    <h5 className="card-title fw-bold text-white mb-2 text-truncate">
                      {evt.title}
                    </h5>

                    <div className="d-flex align-items-center gap-3 text-secondary small mb-3">
                      <span>
                        <i className="bi bi-translate me-1 text-danger"></i>
                        {evt.language}
                      </span>
                      <span>
                        <i className="bi bi-clock me-1 text-danger"></i>
                        {evt.duration} mins
                      </span>
                    </div>

                    <p
                      className="card-text text-secondary small flex-grow-1"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {evt.description}
                    </p>

                    <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top border-secondary border-opacity-25">
                      <div>
                        <span className="text-secondary small d-block">Starting from</span>
                        <span className="fs-5 fw-bold text-white">
                          ₹{evt.basePrice || 150}
                        </span>
                      </div>

                      <button
                        className="btn btn-danger rounded-pill px-4 fw-semibold"
                        onClick={() => navigate(`/events/${evt._id}`)}
                      >
                        Book Seats <i className="bi bi-arrow-right ms-1"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Controls (Requirement 10) */}
        {!loading && totalPages > 1 && (
          <nav aria-label="Event pagination" className="d-flex justify-content-center">
            <ul className="pagination pagination-dark">
              <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                <button
                  className="page-link bg-dark text-white border-secondary"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  &laquo; Previous
                </button>
              </li>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                <li
                  key={num}
                  className={`page-item ${currentPage === num ? "active" : ""}`}
                >
                  <button
                    className={`page-link border-secondary ${
                      currentPage === num
                        ? "bg-danger text-white border-danger"
                        : "bg-dark text-white"
                    }`}
                    onClick={() => setCurrentPage(num)}
                  >
                    {num}
                  </button>
                </li>
              ))}

              <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                <button
                  className="page-link bg-dark text-white border-secondary"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next &raquo;
                </button>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </>
  );
}

export default Events;
