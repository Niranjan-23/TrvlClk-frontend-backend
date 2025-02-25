import React, { useState, useEffect } from "react";
import "./Profile.css";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";

const Profile = ({ user, onUserUpdate, onEditClick }) => {
  const [localUser, setLocalUser] = useState(user);

  useEffect(() => {
    setLocalUser(user);
  }, [user]);

  const fetchCurrentUser = async () => {
    if (!user || !user._id) return;
    try {
      const response = await fetch(`http://localhost:5000/api/user/${user._id}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      const data = await response.json();
      setLocalUser(data.user);
      localStorage.setItem('loggedInUser', JSON.stringify(data.user));
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  useEffect(() => {
    const handleUserUpdate = () => {
      fetchCurrentUser();
    };
    window.addEventListener('userUpdated', handleUserUpdate);
    return () => window.removeEventListener('userUpdated', handleUserUpdate);
  }, [user]);

  const handleDeletePost = async (indexToDelete) => {
    if (localUser && localUser._id) {
      const updatedPosts = localUser.posts.filter((_, index) => index !== indexToDelete);
      try {
        const response = await fetch(`http://localhost:5000/api/user/${localUser._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            posts: updatedPosts,
            name: localUser.name,
            bio: localUser.bio,
            profileImage: localUser.profileImage,
          }),
        });
        const data = await response.json();
        if (response.ok) {
          setLocalUser(data.user);
          localStorage.setItem("loggedInUser", JSON.stringify(data.user));
          if (onUserUpdate) onUserUpdate(data.user);
        } else {
          console.error("Error deleting post", data.error);
        }
      } catch (error) {
        console.error("Error deleting post", error);
      }
    }
  };

  if (!localUser)
    return <div className="profile-container">No user data available.</div>;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-image-wrapper">
          <img src={localUser.profileImage} alt="Profile" className="profile-image" />
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
              <strong>{localUser.followers.length}</strong> Followers
            </div>
            <div>
              <strong>{localUser.following.length}</strong> Following
            </div>
          </div>
          <button onClick={onEditClick} className="edit-profile-button">
            Edit Profile
          </button>
        </div>
      </div>
      <div className="post-grid">
        {localUser.posts.map((post, index) => (
          <div className="post-item" key={index} style={{ position: "relative" }}>
            <img src={post} alt={`Post ${index + 1}`} className="post-image" />
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
    </div>
  );
};

export default Profile;