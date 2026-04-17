import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon paths broken by webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function MapPicker({ onLocationSelect }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [selectedArea, setSelectedArea] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mapInstanceRef.current || !mapRef.current) return;

    // Initialize map centered on Jaipur
    const map = L.map(mapRef.current, {
      center: [26.9124, 75.7873],
      zoom: 12,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    map.on("click", async (e) => {
      const { lat, lng } = e.latlng;
      setLoading(true);

      // Remove existing marker
      if (markerRef.current) {
        markerRef.current.remove();
      }

      // Add new marker
      markerRef.current = L.marker([lat, lng]).addTo(map);

      // Reverse geocode using Nominatim (free, no API key)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
        );
        const data = await res.json();

        const areaName =
          data.address?.suburb ||
          data.address?.neighbourhood ||
          data.address?.village ||
          data.address?.town ||
          data.address?.city ||
          data.address?.county ||
          data.display_name?.split(",")[0] ||
          `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

        const fullArea = `${areaName}${data.address?.city ? ", " + data.address.city : ""}`;

        setSelectedArea(fullArea);
        onLocationSelect({ areaName: fullArea, lat, lng });

        markerRef.current.bindPopup(`<b>${fullArea}</b>`).openPopup();
      } catch (err) {
        const fallback = `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
        setSelectedArea(fallback);
        onLocationSelect({ areaName: fallback, lat, lng });
      } finally {
        setLoading(false);
      }
    });

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div
        ref={mapRef}
        className="map-container"
        style={{ cursor: "crosshair" }}
      />
      {loading && (
        <div className="area-selected">
          <span className="spinner" style={{ width: 12, height: 12 }} />
          Fetching area name...
        </div>
      )}
      {selectedArea && !loading && (
        <div className="area-selected">
          📍 {selectedArea}
        </div>
      )}
      {!selectedArea && !loading && (
        <p style={{ fontSize: "0.75rem", color: "var(--text3)", marginTop: "0.5rem", fontFamily: "var(--font-mono)" }}>
          Click anywhere on the map to select the problem area
        </p>
      )}
    </div>
  );
}