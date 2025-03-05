import React, { useState, useEffect, useRef } from "react";
import "./Profile.css";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";

const Profile = ({ user, onUserUpdate, onEditClick }) => {
  const [localUser, setLocalUser] = useState(user);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const followersRef = useRef(null);
  const followingRef = useRef(null);

  useEffect(() => {
    setLocalUser(user);
  }, [user]);

  const fetchCurrentUser = async () => {
    if (!user || !user._id) return;
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/user/${user._id}`);
      if (!response.ok) throw new Error("Failed to fetch user");
      const data = await response.json();
      setLocalUser(data.user);
      localStorage.setItem("loggedInUser", JSON.stringify(data.user));
    } catch (error) {
      console.error("Error fetching current user:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleUserUpdate = () => {
      fetchCurrentUser();
    };
    window.addEventListener("userUpdated", handleUserUpdate);
    return () => window.removeEventListener("userUpdated", handleUserUpdate);
  }, [user]);

  const handleShowFollowers = async () => {
    await fetchCurrentUser();
    setShowFollowers(true);
  };

  const handleShowFollowing = async () => {
    await fetchCurrentUser();
    setShowFollowing(true);
  };

  useEffect(() => {
    if (showFollowers && followersRef.current) {
      const content = followersRef.current;
      if (content.scrollHeight > content.clientHeight) {
        content.classList.add("overflow");
      } else {
        content.classList.remove("overflow");
      }
    }
    if (showFollowing && followingRef.current) {
      const content = followingRef.current;
      if (content.scrollHeight > content.clientHeight) {
        content.classList.add("overflow");
      } else {
        content.classList.remove("overflow");
      }
    }
  }, [showFollowers, showFollowing, localUser]);

  // Updated delete function to call the backend DELETE endpoint
  const handleDeletePost = async (index) => {
    const imageUrl = localUser.posts[index];
    try {
      const response = await fetch(
        `http://localhost:5000/api/user/${localUser._id}/posts`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ imageUrl: imageUrl.trim() }),
        }
      );
      if (!response.ok) {
        console.error("Failed to delete post:", response.statusText);
        return;
      }
      const data = await response.json();
      // Update the state and localStorage with the updated user
      setLocalUser(data.user);
      localStorage.setItem("loggedInUser", JSON.stringify(data.user));
      // Optionally trigger a parent update if needed
      if (onUserUpdate) onUserUpdate(data.user);
    } catch (error) {
      console.error("Error deleting post:", error);
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
            <div onClick={handleShowFollowers} style={{ cursor: "pointer" }}>
              <strong>{localUser.followers.length}</strong> Followers
            </div>
            <div onClick={handleShowFollowing} style={{ cursor: "pointer" }}>
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
              style={{ position: "absolute", top: 0, right: 0, background: "none", color: "white" }}
              size="small"
            >
              <DeleteIcon />
            </IconButton>
          </div>
        ))}
      </div>

      {/* Followers Modal */}
      {showFollowers && (
        <div className="modal-overlay" onClick={() => setShowFollowers(false)}>
          <div className="list-container" onClick={(e) => e.stopPropagation()}>
            <div className="list-header">
              <h2>Followers</h2>
              <IconButton onClick={() => setShowFollowers(false)}>
                <CloseIcon />
              </IconButton>
            </div>
            <div className="list-content" ref={followersRef}>
              {loading ? (
                <p>Loading...</p>
              ) : localUser.followers.length > 0 ? (
                localUser.followers.map((follower) => (
                  <div key={follower._id} className="list-item">
                    <img src={follower.profileImage} alt={follower.username} />
                    <span>{follower.username}</span>
                  </div>
                ))
              ) : (
                <p>No followers yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Following Modal */}
      {showFollowing && (
        <div className="modal-overlay" onClick={() => setShowFollowing(false)}>
          <div className="list-container" onClick={(e) => e.stopPropagation()}>
            <div className="list-header">
              <h2>Following</h2>
              <IconButton onClick={() => setShowFollowing(false)}>
                <CloseIcon />
              </IconButton>
            </div>
            <div className="list-content" ref={followingRef}>
              {loading ? (
                <p>Loading...</p>
              ) : localUser.following.length > 0 ? (
                localUser.following.map((followed) => (
                  <div key={followed._id} className="list-item">
                    <img src={followed.profileImage} alt={followed.username} />
                    <span>{followed.username}</span>
                  </div>
                ))
              ) : (
                <p>Not following anyone yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
