import React, { useState, useEffect } from "react";
import EditProfileComponent from "./EditProfileComponent";
import "./Profile.css";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";

const Profile = ({ user }) => {
  // Local state for the current user’s data.
  const [localUser, setLocalUser] = useState(user);
  const [showEdit, setShowEdit] = useState(false);

  // Update localUser when user prop changes.
  useEffect(() => {
    setLocalUser(user);
  }, [user]);

  // Listen for the custom "postAdded" event to update the profile instantly.
  useEffect(() => {
    const updateUserFromStorage = () => {
      const storedUser = localStorage.getItem("loggedInUser");
      if (storedUser && storedUser !== "undefined") {
        setLocalUser(JSON.parse(storedUser));
      }
    };

    window.addEventListener("postAdded", updateUserFromStorage);
    return () => window.removeEventListener("postAdded", updateUserFromStorage);
  }, []);

  const handleEditClick = () => {
    setShowEdit(true);
  };

  const handleCloseEdit = () => {
    setShowEdit(false);
  };

  // Update local state and localStorage with the updated user.
  const handleSaveProfile = (updatedUser) => {
    setLocalUser(updatedUser);
    localStorage.setItem("loggedInUser", JSON.stringify(updatedUser));
  };

  // Delete a post from the user's posts array.
  const handleDeletePost = (indexToDelete) => {
    const updatedPosts = localUser.posts.filter((_, index) => index !== indexToDelete);
    const updatedUser = { ...localUser, posts: updatedPosts };
    setLocalUser(updatedUser);
    localStorage.setItem("loggedInUser", JSON.stringify(updatedUser));
  };

  if (!localUser) {
    return <div className="profile-container">No user data available.</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-image-wrapper">
          <img
            src={localUser.profileImage}
            alt="Profile"
            className="profile-image"
          />
        </div>
        <div className="profile-details">
          <h2 className="profile-name">{localUser.name}</h2>
          <p className="profile-username">@{localUser.username}</p>
          <p className="profile-bio">{localUser.bio}</p>
          <div className="profile-stats">
            <div>
              <strong>{localUser.posts.length}</strong> Posts
            </div>
            <div>
              <strong>1.5k</strong> Followers
            </div>
            <div>
              <strong>350</strong> Following
            </div>
          </div>
          <button onClick={handleEditClick} className="edit-profile-button">
            Edit Profile
          </button>
        </div>
      </div>

      <div className="post-grid">
        {localUser.posts.map((post, index) => (
          <div className="post-item" key={index} style={{ position: "relative" }}>
            <img
              src={post}
              alt={`Post ${index + 1}`}
              className="post-image"
            />
            <IconButton
              onClick={() => handleDeletePost(index)}
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                background: "none",
                color: "white",
              }}
              size="small"
            >
              <DeleteIcon />
            </IconButton>
          </div>
        ))}
      </div>

      {showEdit && (
        <EditProfileComponent
          user={localUser}
          onClose={handleCloseEdit}
          onSave={handleSaveProfile}
        />
      )}
    </div>
  );
};

export default Profile;
