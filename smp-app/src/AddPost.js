// AddPost.js
import React, { useState } from "react";
import Button from "@mui/material/Button";
import BackupTwoToneIcon from "@mui/icons-material/BackupTwoTone";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import TextField from '@mui/material/TextField';
import "./AddPost.css";
import API_BASE_URL from "./config";

export default function AddPost({ user, onPostAdded = () => {} }) {
  const [previewUrl, setPreviewUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  // Prompt for an image URL
  const handleUploadClick = () => {
    const url = prompt("Enter Image URL:");
    if (url && url.trim() !== "") {
      setPreviewUrl(url);
      setImageUrl(url);
    }
  };

  const handlePost = async () => {
    if (!imageUrl?.trim() || !user?._id) {
      console.error("Image URL is empty or user ID is missing");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user._id,
          imageUrl: imageUrl.trim(),
          location: location.trim(),
          description: description.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error adding post:", errorData.error || "Unknown error");
        return;
      }

      const data = await response.json();
      console.log("Post added successfully:", data.post);

      // Trigger callback to refresh timeline
      onPostAdded();

      // Clear fields
      setPreviewUrl("");
      setImageUrl("");
      setLocation("");
      setDescription("");
    } catch (error) {
      console.error("Error adding post:", error);
    }
  };

  return (
    <div className="add-container">
      {previewUrl ? (
        <>
          <img src={previewUrl} alt="Selected Preview" />
          <div className="input-fields">
            <TextField
              label="Description"
              variant="outlined"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Location"
              variant="outlined"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              fullWidth
              margin="normal"
            />
          </div>
          <div className="post-button">
            <Button
              type="button"
              size="medium"
              variant="contained"
              startIcon={<FileUploadOutlinedIcon />}
              onClick={handleUploadClick}
              sx={{
                background: "linear-gradient(45deg, #4CAF50, #81C784)",
                color: "#fff",
                padding: "10px 20px",
                borderRadius: "8px",
                boxShadow: "0 3px 6px rgba(0,0,0,0.2)",
                "&:hover": {
                  background: "linear-gradient(45deg, #388E3C, #66BB6A)",
                  boxShadow: "0 5px 10px rgba(0,0,0,0.3)",
                },
              }}
            >
              Change Image
            </Button>
            <Button
              type="button"
              size="medium"
              variant="contained"
              startIcon={<BackupTwoToneIcon />}
              onClick={handlePost}
              sx={{
                background: "linear-gradient(45deg, #1976D2, #42A5F5)",
                color: "#fff",
                padding: "10px 20px",
                borderRadius: "8px",
                boxShadow: "0 3px 6px rgba(0,0,0,0.2)",
                "&:hover": {
                  background: "linear-gradient(45deg, #1565C0, #1E88E5)",
                  boxShadow: "0 5px 10px rgba(0,0,0,0.3)",
                },
              }}
            >
              Post
            </Button>
          </div>
        </>
      ) : (
        <div style={{ gap:"30px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%" }}>
          <h3>No Image Uploaded</h3>
          <Button
            type="button"
            size="medium"
            variant="contained"
            startIcon={<FileUploadOutlinedIcon />}
            onClick={handleUploadClick}
            sx={{
              background: "linear-gradient(45deg, #FF5722, #FF8A65)",
              color: "#fff",
              padding: "12px 24px",
              borderRadius: "10px",
              boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
              "&:hover": {
                background: "linear-gradient(45deg, #E64A19, #F4511E)",
                boxShadow: "0 6px 12px rgba(0,0,0,0.3)",
              },
            }}
          >
            Upload Image
          </Button>
        </div>
      )}
    </div>
  );
}
