import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';

// --- Advanced Styles and Theme ---
const sleekTheme = {
  backgroundColor: "#0F0F1A", // Dark background
  accentColor: "#f59e0b", // Yellow-600 for consistency with details page
  highlightColor: "#fcd34d", // Yellow-400
  textColor: "#E5E7EB",
  cardBackground: "rgba(30, 30, 45, 0.7)",
  errorColor: "#F87171",
};

const styles = {
  container: {
    padding: "0 0 40px 0",
    minHeight: "100vh",
    backgroundColor: sleekTheme.backgroundColor,
    color: sleekTheme.textColor,
  },
  contentWrapper: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '60px 20px 0 20px', // Adjusted padding for better center alignment
  },
  title: {
    // Adjusted padding and margin for better center alignment below the wrapper
    padding: "0 0 20px 0",
    marginLeft: "20px",
    fontSize: "2.5rem",
    fontWeight: 700,
    letterSpacing: "0.05em",
    borderLeft: `6px solid ${sleekTheme.highlightColor}`,
  },
  grid: {
    padding: "0 20px", // Match contentWrapper padding
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "40px 30px",
  },
  infoText: {
    padding: "50px",
    textAlign: "center",
    fontSize: "1.2rem",
    color: sleekTheme.textColor,
  },
  paginationContainer: {
    marginTop: "60px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "20px",
  },
  button: {
    padding: "12px 25px",
    border: "2px solid",
    borderColor: sleekTheme.accentColor,
    borderRadius: "50px",
    backgroundColor: "transparent",
    color: sleekTheme.highlightColor,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "1rem",
    transition: "all 0.3s ease",
  },
  buttonActive: {
    backgroundColor: sleekTheme.accentColor,
    color: "#fff",
    boxShadow: `0 4px 15px ${sleekTheme.accentColor}80`,
  },
  pageIndicator: {
    fontSize: "1.3rem",
    fontWeight: 700,
    color: sleekTheme.highlightColor,
  },
};


const MovieCard = ({ movie, onHover, isHovered, onCardClick }) => {
  const getPosterUrl = (path) =>
    path ? `https://image.tmdb.org/t/p/w500${path}` : "/placeholder-image.png";

  const cardStyle = {
    position: "relative",
    borderRadius: "10px",
    overflow: "hidden",
    backgroundColor: sleekTheme.cardBackground,
    transform: isHovered ? "scale(1.05)" : "scale(1)",
    boxShadow: isHovered
      ? `0 15px 30px rgba(0, 0, 0, 0.8)`
      : `0 5px 15px rgba(0, 0, 0, 0.5)`,
    transition: "transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    cursor: "pointer",
    zIndex: isHovered ? 10 : 1,
  };

  const imageStyle = {
    width: "100%",
    height: "330px",
    objectFit: "cover",
  };

  const contentStyle = {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: "15px",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    opacity: isHovered ? 1 : 0,
    transform: isHovered ? "translateY(0)" : "translateY(100%)",
    transition: "transform 0.4s ease, opacity 0.3s ease 0.1s",
  };

  const initialContentStyle = {
    padding: "15px 15px 0 15px",
    position: "absolute",
    top: '60%',
    left: 0,
    right: 0,
    zIndex: 2,
    transition: "opacity 0.2s ease",
    opacity: isHovered ? 0 : 1,
    textShadow: '0 1px 4px rgba(0,0,0,0.8)'
  }

  const voteAverage = movie.vote_average ? movie.vote_average.toFixed(1) : "N/A";

  return (
    <div
      style={cardStyle}
      onMouseEnter={() => onHover(movie.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onCardClick(movie.id)}
    >
      {/* Poster Image */}
      <img
        src={getPosterUrl(movie.poster_path)}
        alt={movie.title}
        style={imageStyle}
      />

      {/* Initial Title/Info Overlay */}
      <div style={initialContentStyle}>
        <h3 style={{ fontSize: "1.2rem", margin: "0", color: "#fff" }}>
          {movie.title}
        </h3>
      </div>

      {/* Detailed Info (Slides Up on Hover) */}
      <div style={contentStyle}>
        <h4 style={{ fontSize: "1.1rem", margin: "0 0 5px 0", color: sleekTheme.highlightColor }}>
          {movie.title}
        </h4>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
          <p style={{ margin: "0", opacity: 0.8 }}>
            Release: {movie.release_date || "TBD"}
          </p>
          <p style={{ margin: "0", fontWeight: 700, color: '#FFD700' }}>
            Rating: {voteAverage}
          </p>
        </div>
        <p style={{ fontSize: '0.85rem', marginTop: '10px', maxHeight: '50px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {movie.overview || 'No synopsis available.'}
        </p>
      </div>
    </div>
  );
};

// --- Main Component ---
const UpcomingReleases = () => {
  const navigate = useNavigate();

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [heroMovie, setHeroMovie] = useState(null);

  const getBackdropUrl = (path) =>
    path ? `https://image.tmdb.org/t/p/original${path}` : null;

  const fetchUpcoming = async (pageNumber = 1) => {
    try {
      setLoading(true);
      window.scrollTo(0, 0);

      const { data } = await axios.get(
      `/api/movies/upcoming?page=${pageNumber}`
    );

      const filteredMovies = (data.movies || []).filter(m => m.poster_path);

      setMovies(filteredMovies);
      if (pageNumber === 1 && filteredMovies.length > 0) {
        setHeroMovie(filteredMovies.find(m => m.backdrop_path) || filteredMovies[0]);
      }
      setPage(data.page);
      setTotalPages(data.total_pages || 1);
      setError("");
    } catch (err) {
      console.error("Error fetching upcoming movies:", err);
      setError("Failed to load movies. Please check the API source.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpcoming(page);
  }, [page]);

  const handlePrev = () => page > 1 && setPage(page - 1);
  const handleNext = () => page < totalPages && setPage(page + 1);
  const handleHover = (id) => setHoveredCard(id);

  const handleCardClick = (movieId) => {
    navigate(`/upcoming/${movieId}`);
  };

  if (loading)
    return (
      <div style={styles.infoText}>Loading the next big blockbusters...</div>
    );
  if (error)
    return (
      <div style={{...styles.infoText, color: sleekTheme.errorColor}}>{error}</div>
    );

  return (
    <div style={styles.container}>
      <div style={styles.contentWrapper}>

        {/* 1. Parallax Hero Banner */}
        {heroMovie && (
          <div
            style={{
              height: "450px",
              background: `url(${getBackdropUrl(heroMovie.backdrop_path)}) center center / cover no-repeat`,
              position: "relative",
              marginBottom: "40px",
              backgroundAttachment: "fixed",
              boxShadow: `inset 0 -100px 50px -20px ${sleekTheme.backgroundColor}`,
              display: 'flex', // Use flexbox for centering
              alignItems: 'center', // Center vertically
              justifyContent: 'center', // Center horizontally
            }}
          >
            <div style={{
              position: 'absolute', // Keep absolute for gradient overlay
              bottom: 0,
              left: 0,
              right: 0,
              padding: '40px',
              background: 'linear-gradient(to top, #0F0F1A 20%, transparent)', // Adjusted gradient for better text visibility
              color: '#fff',
              textAlign: 'center', // Center text content
              display: 'flex', // Use flex for internal elements too
              flexDirection: 'column', // Stack them vertically
              alignItems: 'center', // Center items horizontally
              justifyContent: 'center', // Center items vertically within this overlay
              height: '100%', // Take full height to center content
            }}>
              <p style={{
                color: sleekTheme.highlightColor,
                fontSize: '1.5rem', // Bigger font size
                marginBottom: '10px', // Adjusted margin
                fontWeight: 700, // Make it bold
                letterSpacing: '0.1em', // More prominent
                textTransform: 'uppercase', // All caps
              }}>
                FEATURED UPCOMING RELEASE
              </p>
              <h1 style={{
                fontSize: '2.8rem', // Smaller movie title font size
                margin: '0 0 20px 0', // Adjusted margin
                textShadow: '0 2px 5px rgba(0,0,0,0.8)',
                maxWidth: '80%', // Limit width for better readability on one line
              }}>
                {heroMovie.title}
              </h1>
              <p style={{
                maxWidth: '60%',
                fontSize: '1.1rem',
                opacity: 0.9,
                marginBottom: '20px', // Add margin below overview
                // Remove the substring to show full available overview (or limit with CSS)
                // If you *still* want a character limit, use this:
                // {heroMovie.overview?.length > 200 ? heroMovie.overview.substring(0, 200) + '...' : heroMovie.overview}
                // For simplicity as requested, let's just show the full overview
                textAlign: 'center', // Ensure overview text is centered
              }}>
                {heroMovie.overview || 'No synopsis available for this featured release.'}
              </p>
              <button
                onClick={() => handleCardClick(heroMovie.id)}
                style={{ ...styles.button, ...styles.buttonActive, marginTop: '15px', padding: '12px 35px' }}> {/* Slightly larger button padding */}
                View Details
              </button>
            </div>
          </div>
        )}

        <h2 style={{ ...styles.title, marginTop: heroMovie ? 0 : '0' }}>
          New & Future Releases
        </h2>

        {/* 2. Elevated Grid */}
        <div style={styles.grid}>
          {movies.map((m) => (
            <MovieCard
              key={m.id}
              movie={m}
              onHover={handleHover}
              isHovered={hoveredCard === m.id}
              onCardClick={handleCardClick}
            />
          ))}
        </div>

        {/* 3. Sleek Pagination */}
        {totalPages > 1 && (
          <div style={styles.paginationContainer}>
            <button
              onClick={handlePrev}
              disabled={page === 1}
              style={{
                ...styles.button,
                ...(page === 1 ? {} : styles.buttonActive),
                opacity: page === 1 ? 0.5 : 1,
              }}
            >
              &lt; Previous Page
            </button>
            <span style={styles.pageIndicator}>
              {page} / {totalPages}
            </span>
            <button
              onClick={handleNext}
              disabled={page === totalPages}
              style={{
                ...styles.button,
                ...(page === totalPages ? {} : styles.buttonActive),
                opacity: page === totalPages ? 0.5 : 1,
              }}
            >
              Next Page &gt;
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpcomingReleases;