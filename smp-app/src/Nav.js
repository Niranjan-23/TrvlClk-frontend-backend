import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Button from "@mui/material/Button";
import Badge from "@mui/material/Badge";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import AddBoxOutlinedIcon from "@mui/icons-material/AddBoxOutlined";
import PersonSearchTwoToneIcon from "@mui/icons-material/PersonSearchTwoTone";
import NotificationsActiveTwoToneIcon from "@mui/icons-material/NotificationsActiveTwoTone";
import AccountCircleTwoToneIcon from "@mui/icons-material/AccountCircleTwoTone";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import API_BASE_URL from "./config"; // Ensure this points to your API base URL
import "./Nav.css"; // Ensure this CSS file exists for styling
import logo from "./assets/logo.png"; // Ensure this image exists in your assets folder

const Nav = () => {
  // Retrieve the current user from local storage
  const currentUser = JSON.parse(localStorage.getItem("loggedInUser") || "null");
  
  // State to store the notification count
  const [notificationCount, setNotificationCount] = useState(0);

  // Function to fetch the notification count from the API
  const fetchNotificationCount = async () => {
    if (!currentUser || !currentUser._id) {
      setNotificationCount(0);
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/${currentUser._id}/followRequests`);
      if (!response.ok) {
        throw new Error("Failed to fetch follow requests");
      }
      const data = await response.json();
      const pendingCount = data.pendingFollowRequests?.length || 0;
      setNotificationCount(pendingCount);
    } catch (error) {
      console.error("Error fetching notification count:", error);
      setNotificationCount(0);
    }
  };

  // Effect to fetch notification count on mount and when user changes
  useEffect(() => {
    fetchNotificationCount();
    const handleUserUpdated = () => fetchNotificationCount();
    window.addEventListener("userUpdated", handleUserUpdated);
    return () => window.removeEventListener("userUpdated", handleUserUpdated);
  }, [currentUser?._id]);

  // Render the navigation bar
  return (
    <div className="nav-container">
      <Link to="/">
        <img src={logo} alt="TrvlClk Logo" className="logo-image" />
      </Link>
      <div className="nav-links">
        <Link to="/" className="nav-link">
          <Button className="nav-button" color="success" variant="text">
            <HomeRoundedIcon fontSize="large" />
            Home
          </Button>
        </Link>
        <Link to="/Notification" className="nav-link">
          <Button color="success" className="nav-button" variant="text">
            <Badge badgeContent={notificationCount} color="error">
              <NotificationsActiveTwoToneIcon fontSize="large" />
            </Badge>
            Notification
          </Button>
        </Link>
        <Link to="/messages" className="nav-link">
          <Button color="success" className="nav-button" variant="text">
            <ChatBubbleOutlineIcon fontSize="large" />
            Messages
          </Button>
        </Link>
        <Link to="/Add-post" className="nav-link">
          <Button color="success" className="nav-button" variant="text">
            <AddBoxOutlinedIcon fontSize="large" />
            Add Post
          </Button>
        </Link>
        <Link to="/Search" className="nav-link">
          <Button color="success" className="nav-button" variant="text">
            <PersonSearchTwoToneIcon fontSize="large" />
            Search
          </Button>
        </Link>
        <Link to="/ProfileSetting" className="nav-link">
          <Button color="success" className="nav-button" variant="text">
            <AccountCircleTwoToneIcon fontSize="large" />
            Profile
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Nav;