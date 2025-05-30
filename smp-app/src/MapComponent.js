import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const MapComponent = () => {
  const position = [11.0056, 76.9661]; // Default coordinates

  return (
    <div style={{ width: "100vw", height: "100vh" }}> {/* Ensures fullscreen */}
      <MapContainer center={position} zoom={13} style={{ width: "80%", height: "80%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position}>
          <Popup>Location is here!</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default MapComponent;