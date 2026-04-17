import React, { useState, useEffect, useRef } from "react";
import Navbar from "../components/Navbar";

const API = "http://localhost:5000/api";

function PostMap({ areaName, coordinates }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!coordinates?.lat || !coordinates?.lng) return;

    import("leaflet").then((leaflet) => {
      const L = leaflet.default;

      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (!mapInstanceRef.current && mapRef.current) {
        const map = L.map(mapRef.current, {
          center: [coordinates.lat, coordinates.lng],
          zoom: 14,
          zoomControl: false,
          dragging: false,
          scrollWheelZoom: false,
          doubleClickZoom: false,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap",
          maxZoom: 19,
        }).addTo(map);

        L.marker([coordinates.lat, coordinates.lng])
          .addTo(map)
          .bindPopup(`<b>${areaName}</b>`)
          .openPopup();

        mapInstanceRef.current = map;
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [coordinates, areaName]);

  if (!coordinates?.lat) return null;

  return <div ref={mapRef} className="post-map" />;
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function Feed() {
  const userRaw = localStorage.getItem("hyperlocal_user");
  const user = userRaw ? JSON.parse(userRaw) : null;

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch(`${API}/posts`, {
          headers: { "x-user-id": user._id },
        });
        const data = await res.json();
        if (data.success) {
          setPosts(data.posts);
        } else {
          setError(data.message || "Failed to fetch posts.");
        }
      } catch (err) {
        setError("Cannot connect to server.");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [user._id]);

  const getInitials = (name) =>
    name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <>
      <Navbar currentPage="feed" />
      <div className="feed-page">
        <div className="feed-header">
          <div>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.7rem",
                color: "var(--accent2)",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                display: "block",
                marginBottom: "0.25rem",
              }}
            >
              📡 Community Feed
            </span>
            <h1 style={{ fontSize: "1.6rem" }}>Local Issues</h1>
          </div>
          <div
            style={{
              background: "var(--surface2)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "0.5rem 1rem",
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
              color: "var(--text2)",
            }}
          >
            {posts.length} post{posts.length !== 1 ? "s" : ""}
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "3rem",
              gap: "0.75rem",
              alignItems: "center",
              color: "var(--text3)",
              fontFamily: "var(--font-mono)",
              fontSize: "0.8rem",
            }}
          >
            <span className="spinner" style={{ borderTopColor: "var(--accent)" }} />
            Loading community posts...
          </div>
        ) : posts.length === 0 ? (
          <div className="empty-feed">
            <div className="icon">🗺️</div>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.85rem",
                color: "var(--text3)",
              }}
            >
              No community posts yet.
              <br />
              Be the first to report an issue!
            </p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post._id} className="post-card">
              {/* Post Meta */}
              <div className="post-meta">
                <div className="post-avatar">{getInitials(post.userName)}</div>
                <div>
                  <div className="post-author">{post.userName}</div>
                  <div className="post-time">{timeAgo(post.createdAt)}</div>
                </div>
                <div className="post-area-tag">
                  📍 {post.areaName}
                </div>
              </div>

              {/* Problem */}
              <div className="post-section">
                <div className="tag-problem">Problem</div>
                <p className="post-problem">{post.problem}</p>
              </div>

              <hr className="divider" style={{ margin: "0.75rem 0" }} />

              {/* Solution */}
              <div className="post-section">
                <div className="tag-solution">Solution</div>
                <p className="post-solution">{post.solution}</p>
              </div>

              {/* Map */}
              {post.areaCoordinates?.lat && (
                <PostMap
                  areaName={post.areaName}
                  coordinates={post.areaCoordinates}
                />
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
}