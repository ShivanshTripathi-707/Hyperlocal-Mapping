import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import MapPicker from "../components/MapPicker";

const API = "http://localhost:5000/api";

export default function Doc() {
  const navigate = useNavigate();
  const userRaw = localStorage.getItem("hyperlocal_user");
  const user = userRaw ? JSON.parse(userRaw) : null;

  const [form, setForm] = useState({
    problem: "",
    solution: "",
    areaName: "",
  });
  const [areaCoordinates, setAreaCoordinates] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleLocationSelect = useCallback(({ areaName, lat, lng }) => {
    setForm((prev) => ({ ...prev, areaName }));
    setAreaCoordinates({ lat, lng });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const { problem, solution, areaName } = form;

    if (!problem.trim()) {
      setError("Please describe the problem.");
      return;
    }
    if (!solution.trim()) {
      setError("Please provide a solution.");
      return;
    }
    if (!areaName.trim()) {
      setError("Please select an area on the map.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user._id,
        },
        body: JSON.stringify({
          problem,
          solution,
          areaName,
          areaCoordinates,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess("✅ Issue posted to community!");
        setForm({ problem: "", solution: "", areaName: "" });
        setAreaCoordinates(null);
        setShowMap(false);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Failed to post. Try again.");
      }
    } catch (err) {
      setError("Cannot connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar currentPage="doc" />
      <div className="doc-page">
        <div className="doc-header">
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.7rem",
              color: "var(--accent2)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            📍 Report a Local Issue
          </span>
          <h1>
            Hello, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p>Share a problem you've noticed in your community with a solution.</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-card">
            <h2>📝 Issue Details</h2>

            <div className="form-group">
              <label className="form-label">Problem Description</label>
              <textarea
                className="form-input"
                name="problem"
                value={form.problem}
                onChange={handleChange}
                placeholder="Describe the community problem you've encountered... (e.g., broken streetlight on main road, garbage not picked up for 3 days)"
                rows={4}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Proposed Solution</label>
              <textarea
                className="form-input"
                name="solution"
                value={form.solution}
                onChange={handleChange}
                placeholder="What do you think the solution is? Who should take action? (e.g., Contact municipal corporation, organize community clean-up)"
                rows={3}
              />
            </div>
          </div>

          <div className="form-card">
            <h2>🗺️ Problem Location</h2>

            <div className="form-group">
              <label className="form-label">Area Name</label>
              <input
                className="form-input"
                type="text"
                name="areaName"
                value={form.areaName}
                onChange={handleChange}
                placeholder="Type area name or use the map below"
              />
            </div>

            <button
              type="button"
              className="btn btn-outline"
              style={{ marginBottom: "0.75rem", width: "100%" }}
              onClick={() => setShowMap((v) => !v)}
            >
              {showMap ? "🗺️ Hide Map" : "🗺️ Pin Location on Map"}
            </button>

            {showMap && (
              <MapPicker onLocationSelect={handleLocationSelect} />
            )}
          </div>

          <button
            className="btn btn-primary"
            type="submit"
            disabled={loading}
            style={{ marginTop: "0.5rem" }}
          >
            {loading ? (
              <>
                <span className="spinner" /> Posting...
              </>
            ) : (
              "🚀 Post to Community"
            )}
          </button>
        </form>

        <div
          style={{
            marginTop: "2rem",
            padding: "1.25rem",
            background: "var(--surface2)",
            borderRadius: "var(--radius)",
            border: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                color: "var(--text2)",
              }}
            >
              See what others in your community are reporting
            </p>
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => navigate("/feed")}
          >
            📡 View Feed →
          </button>
        </div>
      </div>
    </>
  );
}