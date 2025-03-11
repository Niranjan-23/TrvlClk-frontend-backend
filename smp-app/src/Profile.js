// Profile.jsx
import React, { useState, useEffect, useRef } from "react";
import "./Profile.css";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import API_BASE_URL from './config';

const Profile = ({ user, onUserUpdate, onEditClick }) => {
  // Initialize with an empty object if user is undefined
  const [localUser, setLocalUser] = useState(user || {});
  const [userPosts, setUserPosts] = useState([]);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const followersRef = useRef(null);
  const followingRef = useRef(null);

  // Update localUser when the user prop changes and fetch posts
  useEffect(() => {
    setLocalUser(user || {});
    const fetchUserPosts = async () => {
      if (!user || !user._id) return;
      try {
        const response = await fetch(`${API_BASE_URL}/api/posts/user/${user._id}`);
        if (response.ok) {
          const data = await response.json();
          setUserPosts(data.posts || []);
        } else {
          console.error("Failed to fetch user posts");
        }
      } catch (error) {
        console.error("Error fetching user posts:", error);
      }
    };
    fetchUserPosts();
  }, [user]);

  // Fetch the latest user data from the backend
  const fetchCurrentUser = async () => {
    if (!user || !user._id) return;
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/user/${user._id}`);
      if (!response.ok) throw new Error("Failed to fetch user");
      const data = await response.json();
      // Ensure followers and following are arrays
      setLocalUser({
        ...data.user,
        followers: data.user.followers || [],
        following: data.user.following || [],
      });
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

  // Delete post using new posts endpoint
  const handleDeletePost = async (postId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/posts/${postId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: localUser._id }),
      });
      if (!response.ok) {
        console.error("Failed to delete post:", response.statusText);
        return;
      }
      await response.json();
      // Remove the deleted post from local state
      setUserPosts(userPosts.filter(post => post._id !== postId));
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  // Create a safe user object ensuring followers and following are arrays
  const safeUser = {
    ...localUser,
    followers: localUser.followers || [],
    following: localUser.following || [],
  };

  // If no user data is available, render a fallback
  if (!localUser || !localUser._id)
    return <div className="profile-container">No user data available.</div>;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-image-wrapper">
          <img src={safeUser.profileImage} alt="Profile" className="profile-image" />
        </div>
        <div className="profile-details">
          <h2 className="profile-name">{safeUser.name}</h2>
          <p className="profile-username">@{safeUser.username}</p>
          <p className="profile-bio">{safeUser.bio}</p>
          <div className="profile-stats">
            <div>
              <strong>{userPosts.length}</strong> Posts
            </div>
            <div onClick={handleShowFollowers} style={{ cursor: "pointer" }}>
              <strong>{safeUser.followers.length}</strong> Followers
            </div>
            <div onClick={handleShowFollowing} style={{ cursor: "pointer" }}>
              <strong>{safeUser.following.length}</strong> Following
            </div>
          </div>
          <button onClick={onEditClick} className="edit-profile-button">
            Edit Profile
          </button>
        </div>
      </div>
      <div className="post-grid">
        {userPosts.map((post) => (
          <div className="post-item" key={post._id} style={{ position: "relative" }}>
            <img src={post.imageUrl} alt="Post" className="post-image" />
            <IconButton
              onClick={() => handleDeletePost(post._id)}
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
              ) : safeUser.followers.length > 0 ? (
                safeUser.followers.map((follower) => (
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
              ) : safeUser.following.length > 0 ? (
                safeUser.following.map((followed) => (
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