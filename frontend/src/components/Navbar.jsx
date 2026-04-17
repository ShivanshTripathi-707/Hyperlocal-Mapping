import React from "react";
import { useNavigate } from "react-router-dom";

export default function Navbar({ currentPage }) {
  const navigate = useNavigate();
  const userRaw = localStorage.getItem("hyperlocal_user");
  const user = userRaw ? JSON.parse(userRaw) : null;

  const handleLogout = () => {
    localStorage.removeItem("hyperlocal_user");
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        🗺️ Hyperlocal
        <span>Community Mapping</span>
      </div>

      <div className="navbar-actions">
        {currentPage === "doc" && (
          <button
            className="btn btn-secondary"
            style={{ padding: "0.5rem 1rem", fontSize: "0.82rem" }}
            onClick={() => navigate("/feed")}
          >
            📡 Community Feed
          </button>
        )}
        {currentPage === "feed" && (
          <button
            className="btn btn-secondary"
            style={{ padding: "0.5rem 1rem", fontSize: "0.82rem" }}
            onClick={() => navigate("/doc")}
          >
            ✍️ Post Issue
          </button>
        )}

        {user && (
          <span className="navbar-user">
            👤 {user.name.split(" ")[0]}
          </span>
        )}

        <button
          className="btn btn-danger"
          style={{ padding: "0.5rem 1rem", fontSize: "0.82rem" }}
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}