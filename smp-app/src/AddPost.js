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

export default function AddPost() {
  const [files, setFiles] = useState("");

  // Handle file selection.
  const newPost = (event) => {
    const image = event.target.files[0];
    // Create a temporary URL for previewing the image.
    setFiles(URL.createObjectURL(image));
  };

  // When "Post" is clicked, update loggedInUser's posts in localStorage.
  const handlePost = () => {
    if (files) {
      const storedUser = localStorage.getItem("loggedInUser");
      const userObj =
        storedUser && storedUser !== "undefined"
          ? JSON.parse(storedUser)
          : null;
      if (userObj) {
        userObj.posts = userObj.posts ? userObj.posts : [];
        // Append the new post (image URL string).
        userObj.posts.push(files);
        localStorage.setItem("loggedInUser", JSON.stringify(userObj));
        // Dispatch a custom event to notify other components.
        window.dispatchEvent(new Event("postAdded"));
      }
      setFiles("");
    }
  };

  return (
    <div className="add-container">
      {files ? (
        <>
          <img src={files} alt="Selected" />
          <div className="post-button">
            <div>
              <Button
                size="medium"
                component="label"
                variant="contained"
                tabIndex={-1}
                startIcon={<FileUploadOutlinedIcon />}
              >
                Upload
                <VisuallyHiddenInput
                  type="file"
                  onChange={newPost}
                  multiple
                  accept="image/*"
                />
              </Button>
            </div>
            <div>
              <Button
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
          <h3>No Image is uploaded</h3>
          <Button
            size="small"
            component="label"
            variant="contained"
            tabIndex={-1}
            startIcon={<FileUploadOutlinedIcon />}
          >
            Upload
            <VisuallyHiddenInput
              type="file"
              onChange={newPost}
              multiple
              accept="image/*"
            />
          </Button>
        </>
      )}
    </div>
  );
}
