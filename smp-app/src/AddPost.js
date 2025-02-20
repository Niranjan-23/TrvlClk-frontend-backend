import React, { useState } from "react";
import { styled } from "@mui/material/styles";
import Button from "@mui/material/Button";
import BackupTwoToneIcon from "@mui/icons-material/BackupTwoTone";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import "./AddPost.css";

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

export default function AddPost({ user, onPostAdded = () => {} }) {
  const [previewUrl, setPreviewUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  // Prompt for an image URL
  const handleUploadClick = () => {
    const url = prompt("Enter Image URL:");
    if (url && url.trim() !== "") {
      setPreviewUrl(url);
      setImageUrl(url);
    }
  };

  const handlePost = async () => {
    console.log("handlePost triggered", { imageUrl, user });
  
    // Validate imageUrl and user ID
    if (!imageUrl?.trim() || !user?._id) {
      console.error("Image URL is empty or user ID is missing");
      return;
    }
  
    try {
      const response = await fetch(
        `http://localhost:5000/api/user/${user._id}/posts`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: imageUrl.trim() }), // Ensure imageUrl is sent
        }
      );
  
      // Handle response
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error adding post:", errorData.error || "Unknown error");
        return;
      }
  
      const data = await response.json();
      console.log("Post added successfully:", data.user);
  
      // Pass the updated user back to the parent
      onPostAdded(data.user);
  
      // Reset states after posting
      setPreviewUrl("");
      setImageUrl("");
    } catch (error) {
      console.error("Error adding post:", error);
    }
  };

  return (
    <div className="add-container">
      {previewUrl ? (
        <>
          <img src={previewUrl} alt="Selected" />
          <div className="post-button">
            <div>
              <Button
                type="button"
                size="medium"
                variant="contained"
                startIcon={<FileUploadOutlinedIcon />}
                onClick={handleUploadClick}
              >
                Upload
              </Button>
            </div>
            <div>
              <Button
                type="button"
                size="medium"
                variant="contained"
                startIcon={<BackupTwoToneIcon />}
                onClick={handlePost}
              >
                Post
              </Button>
            </div>
          </div>
        </>
      ) : (
        <>
          <h3>No Image Uploaded</h3>
          <Button
            type="button"
            size="small"
            variant="contained"
            startIcon={<FileUploadOutlinedIcon />}
            onClick={handleUploadClick}
          >
            Upload
          </Button>
        </>
      )}
    </div>
  );
}
