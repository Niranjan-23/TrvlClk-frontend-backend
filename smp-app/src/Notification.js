import React, { useState, useEffect } from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import './Notification.css';

export default function Notification() {
  const currentUser = JSON.parse(localStorage.getItem('loggedInUser') || 'null');
  const [followRequests, setFollowRequests] = useState([]);

  const fetchFollowRequests = async () => {
    if (!currentUser || !currentUser._id) return;
    try {
      const response = await fetch(`http://localhost:5000/api/user/${currentUser._id}/followRequests`);
      if (!response.ok) {
        throw new Error('Failed to fetch follow requests');
      }
      const data = await response.json();
      setFollowRequests(data.followRequests || []);
    } catch (error) {
      console.error('Error fetching follow requests:', error);
      setFollowRequests([]);
    }
  };

  // Fetch current user data to sync followers
  const fetchCurrentUser = async () => {
    if (!currentUser || !currentUser._id) return;
    try {
      const response = await fetch(`http://localhost:5000/api/user/${currentUser._id}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      const data = await response.json();
      localStorage.setItem('loggedInUser', JSON.stringify(data.user));
      window.dispatchEvent(new Event('userUpdated'));
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  useEffect(() => {
    fetchFollowRequests();
  }, [currentUser]);

  const handleAccept = async (requesterId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/user/${currentUser._id}/followRequest/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterId: requesterId.toString() }),
      });
      const data = await response.json();
      if (response.ok) {
        alert("Accepted! Please click 'Follow Back' to complete the mutual follow.");
        localStorage.setItem('loggedInUser', JSON.stringify(data.user)); // Update followers
        window.dispatchEvent(new Event('userUpdated'));
        fetchFollowRequests();
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      console.error("Error accepting follow request:", error);
    }
  };

  const handleReject = async (requesterId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/user/${currentUser._id}/followRequest/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterId: requesterId.toString() }),
      });
      const data = await response.json();
      if (response.ok) {
        alert("Request rejected.");
        fetchFollowRequests();
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      console.error("Error rejecting follow request:", error);
    }
  };

  const handleFollowBack = async (requesterId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/user/${currentUser._id}/followBack`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterId: requesterId.toString() }),
      });
      const data = await response.json();
      if (response.ok) {
        alert("Followed back successfully!");
        localStorage.setItem('loggedInUser', JSON.stringify(data.user)); // Update following
        fetchCurrentUser(); // Fetch latest data to sync followers too
        fetchFollowRequests();
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      console.error("Error following back:", error);
    }
  };

  if (!currentUser) {
    return <div>Please log in to see notifications.</div>;
  }

  return (
    <div className="notification-container">
      <h2>Incoming Follower Requests</h2>
      {followRequests.length === 0 ? (
        <p>No new follower requests</p>
      ) : (
        followRequests.map((request) => (
          <div key={request._id} className="notification-item">
            <Avatar alt={request.name} src={request.profileImage} className="avatar" />
            <div className="notification-details">
              <div className="notification-text">
                <span>{request.name}</span> <span className="username">(@{request.username})</span>
              </div>
              <div className="notification-actions">
                <Button onClick={() => handleAccept(request._id)} variant="contained" color="primary">
                  Accept
                </Button>
                <Button onClick={() => handleReject(request._id)} variant="outlined" color="secondary">
                  Reject
                </Button>
                <Button onClick={() => handleFollowBack(request._id)} variant="contained" color="success">
                  Follow Back
                </Button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}