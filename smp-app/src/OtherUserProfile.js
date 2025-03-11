import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import API_BASE_URL from "./config";
import "./Profile.css";

const OtherUserProfile = ({ user: propUser, loggedInUser, onUserUpdate }) => {
  const { userId } = useParams();
  const [localUser, setLocalUser] = useState(propUser || {});
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);

  const followersRef = useRef(null);
  const followingRef = useRef(null);

  // Fetch user data from backend if not provided via props
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/user/${userId}`);
        if (response.ok) {
          const data = await response.json();
          console.log("Fetched user data:", data.user);
          console.log("Follow requests:", data.user.followRequests);
          setLocalUser(data.user);
        } else {
          console.error("Failed to fetch user:", response.status);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!propUser && userId) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [userId, propUser]);

  // Fetch user's posts from backend
  useEffect(() => {
    const fetchUserPosts = async () => {
      if (!localUser._id) return;
      try {
        const response = await fetch(`${API_BASE_URL}/api/posts/user/${localUser._id}`);
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
  }, [localUser]);

  // Safely determine following status
  const isFollowing = localUser.followers?.some(
    (f) => f?._id?.toString() === loggedInUser?._id?.toString()
  );

  // Safely determine if a follow request is pending
  const isRequested = localUser.followRequests?.some(
    (req) => {
      const match = req?._id?.toString() === loggedInUser?._id?.toString();
      console.log(`Checking request: req._id=${req?._id}, loggedInUser._id=${loggedInUser?._id}, match=${match}`);
      return match;
    }
  );
  console.log("isRequested:", isRequested);

  // Dynamically add/remove "overflow" class for modal content
  useEffect(() => {
    if (showFollowersModal && followersRef.current) {
      const content = followersRef.current;
      if (content.scrollHeight > content.clientHeight) {
        content.classList.add("overflow");
      } else {
        content.classList.remove("overflow");
      }
    }
    if (showFollowingModal && followingRef.current) {
      const content = followingRef.current;
      if (content.scrollHeight > content.clientHeight) {
        content.classList.add("overflow");
      } else {
        content.classList.remove("overflow");
      }
    }
  }, [showFollowersModal, showFollowingModal, localUser]);

  // Follow request handler
  const handleFollowRequest = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/${localUser._id}/followRequest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterId: loggedInUser._id }),
      });
      const data = await response.json();
      if (response.ok) {
        alert("Follow request sent!");
        // Fetch updated user data to ensure followRequests is current
        const updatedResponse = await fetch(`${API_BASE_URL}/api/user/${localUser._id}`);
        if (updatedResponse.ok) {
          const updatedData = await updatedResponse.json();
          console.log("Updated user data after follow request:", updatedData.user);
          setLocalUser(updatedData.user);
        }
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      console.error("Error sending follow request:", error);
    }
  };

  // Unfollow handler
  const handleFollowUnfollow = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/${localUser._id}/unfollow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followerId: loggedInUser._id }),
      });
      const data = await response.json();
      if (response.ok) {
        alert("Unfollowed successfully!");
        setLocalUser(data.user);
        if (onUserUpdate) onUserUpdate();
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      console.error("Error following/unfollowing user:", error);
    }
  };

  if (loading) return <div>Loading user...</div>;
  if (!localUser || !localUser._id) return <div>No user data available</div>;

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
              <strong>{userPosts.length}</strong> Posts
            </div>
            <div onClick={() => setShowFollowersModal(true)} style={{ cursor: "pointer" }}>
              <strong>{localUser.followers?.length || 0}</strong> Followers
            </div>
            <div onClick={() => setShowFollowingModal(true)} style={{ cursor: "pointer" }}>
              <strong>{localUser.following?.length || 0}</strong> Following
            </div>
          </div>
          <div style={{ marginTop: '15px' }}>
            {isFollowing ? (
              <Button
                onClick={handleFollowUnfollow}
                size="small"
                variant="contained"
                color="secondary"
              >
                Unfollow
              </Button>
            ) : isRequested ? (
              <Button
                disabled
                size="small"
                variant="contained"
                color="primary"
              >
                Requested
              </Button>
            ) : (
              <Button
                onClick={handleFollowRequest}
                size="small"
                variant="contained"
                color="primary"
                startIcon={<PersonAddAlt1Icon />}
              >
                Follow
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Render user's posts */}
      <div className="post-grid">
        {userPosts.map((post) => (
          <div className="post-item" key={post._id}>
            <img src={post.imageUrl} alt="Post" className="post-image" />
          </div>
        ))}
      </div>
      
      {/* Followers Modal */}
      {showFollowersModal && (
        <div className="modal-overlay" onClick={() => setShowFollowersModal(false)}>
          <div className="list-container" onClick={(e) => e.stopPropagation()}>
            <div className="list-header">
              <h2>Followers</h2>
              <IconButton onClick={() => setShowFollowersModal(false)}>
                <CloseIcon />
              </IconButton>
            </div>
            <div className="list-content" ref={followersRef}>
              {localUser.followers && localUser.followers.length > 0 ? (
                localUser.followers.map((follower) => (
                  <div key={follower._id} className="list-item">
                    <img src={follower.profileImage} alt={follower.username} />
                    <span>{follower.username}</span>
                  </div>
                ))
              ) : (
                <p>No followers</p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Following Modal */}
      {showFollowingModal && (
        <div className="modal-overlay" onClick={() => setShowFollowingModal(false)}>
          <div className="list-container" onClick={(e) => e.stopPropagation()}>
            <div className="list-header">
              <h2>Following</h2>
              <IconButton onClick={() => setShowFollowingModal(false)}>
                <CloseIcon />
              </IconButton>
            </div>
            <div className="list-content" ref={followingRef}>
              {localUser.following && localUser.following.length > 0 ? (
                localUser.following.map((followed) => (
                  <div key={followed._id} className="list-item">
                    <img src={followed.profileImage} alt={followed.username} />
                    <span>{followed.username}</span>
                  </div>
                ))
              ) : (
                <p>No following</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OtherUserProfile;