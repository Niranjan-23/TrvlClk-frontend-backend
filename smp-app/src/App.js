import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate, useParams } from "react-router-dom";
import Nav from "./Nav";
import Post from "./Post";
import LoginPage from "./LoginPage";
import "./App.css";
import AddPost from "./AddPost";
import Search from "./Search";
import Notification from "./Notification";
import SignUp from "./SignUp";
import Profile from "./Profile";
import OtherUserProfile from "./OtherUserProfile"; // Import the other user's profile component
import EditProfileComponent from "./EditProfileComponent";
import Button from "@mui/material/Button";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import { Avatar } from "@mui/material";
import API_BASE_URL from "./config";
import MessageComponent from "./ChatInterface";

// Helper functions to retrieve data from localStorage
const getLoggedInUserFromLocalStorage = () => {
  const user = localStorage.getItem("loggedInUser");
  if (!user || user === "undefined") return null;
  try {
    return JSON.parse(user);
  } catch (error) {
    console.error("Error parsing loggedInUser from localStorage:", error);
    return null;
  }
};

const getTokenFromLocalStorage = () => localStorage.getItem("token") || null;

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(!!getTokenFromLocalStorage());
  const [loggedInUser, setLoggedInUser] = useState(getLoggedInUserFromLocalStorage());
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  // Flag to ensure we fetch the full user data only once.
  const [fullUserFetched, setFullUserFetched] = useState(false);

  const handleLogin = (token, user) => {
    setLoggedInUser(user);
    setIsLoggedIn(true);
    localStorage.setItem("token", token);
    localStorage.setItem("loggedInUser", JSON.stringify(user));
    // Reset the flag so full data will be fetched after login.
    setFullUserFetched(false);
  };

  const handleSignUp = (token, user) => {
    setLoggedInUser(user);
    setIsLoggedIn(true);
    localStorage.setItem("token", token);
    localStorage.setItem("loggedInUser", JSON.stringify(user));
    setFullUserFetched(false);
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem("token");
    localStorage.removeItem("loggedInUser");
    setFullUserFetched(false);
  };

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const handleEditClick = () => setShowEdit(true);
  const handleCloseEdit = () => setShowEdit(false);

  const handleSaveProfile = (updatedUser) => {
    setLoggedInUser(updatedUser);
    localStorage.setItem("loggedInUser", JSON.stringify(updatedUser));
    setShowEdit(false);
  };

  // Fetch the full user data (populated followers/following) if not yet fetched.
  useEffect(() => {
    const fetchFullUserData = async () => {
      if (loggedInUser && loggedInUser._id && !fullUserFetched) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/user/${loggedInUser._id}`, {
            headers: {
              Authorization: `Bearer ${getTokenFromLocalStorage()}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            console.log("Fetched full user data:", data.user);
            setLoggedInUser(data.user);
            localStorage.setItem("loggedInUser", JSON.stringify(data.user));
            setFullUserFetched(true);
          } else {
            console.error("Failed to fetch full user data:", response.status);
          }
        } catch (error) {
          console.error("Error fetching full user data:", error);
        }
      }
    };
    fetchFullUserData();
  }, [loggedInUser, fullUserFetched]);

  const Home = () => {
    const [timelinePosts, setTimelinePosts] = useState([]);

    useEffect(() => {
      const fetchTimeline = async () => {
        try {
          const url = `${API_BASE_URL}/api/timeline?userId=${loggedInUser._id}`;
          const response = await fetch(url, {
            headers: {
              Authorization: `Bearer ${getTokenFromLocalStorage()}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            setTimelinePosts(data.posts || []);
          } else {
            console.error("Failed to fetch timeline posts:", response.status);
          }
        } catch (error) {
          console.error("Error fetching timeline posts:", error);
        }
      };
      if (loggedInUser && loggedInUser._id) {
        fetchTimeline();
      }
    }, [loggedInUser]);

    return (
      <div className="posts-container">
        {timelinePosts.length > 0 ? (
          timelinePosts.map((post, index) => (
            <Post key={index} post={post} loggedInUser={loggedInUser} />
          ))
        ) : (
          <p>No posts to display</p>
        )}
      </div>
    );
  };

  const NewPost = () => (
    <div className="posts-container">
      <AddPost
        user={loggedInUser}
        onPostAdded={() => {
          console.log("New post added, refresh timeline if needed.");
        }}
      />
    </div>
  );

  const SearchProfile = () => (
    <div className="posts-container">
      <Search />
    </div>
  );

  const Noti = () => (
    <div className="posts-container">
      <Notification />
    </div>
  );

  // Profile component wrapper for logged-in user's own profile.
  const ProfileComp = ({ userId: propUserId }) => {
    const { userId: paramUserId } = useParams(); // Get userId from URL params.
    const userId = propUserId || paramUserId; // Use prop if provided, otherwise URL param.
    const [profileUser, setProfileUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
      const fetchUser = async () => {
        if (!userId) {
          setError("No user ID provided");
          setLoading(false);
          return;
        }

        try {
          setLoading(true);
          const response = await fetch(`${API_BASE_URL}/api/user/${userId}`, {
            headers: {
              Authorization: `Bearer ${getTokenFromLocalStorage()}`,
            },
          });
          if (!response.ok) {
            throw new Error(`Failed to fetch user: ${response.status}`);
          }
          const data = await response.json();
          setProfileUser(data.user);
          setError(null);
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setError(error.message);
        } finally {
          setLoading(false);
        }
      };

      fetchUser();
    }, [userId]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!profileUser) return <div>No user data available</div>;

    return (
      <div className="posts-container">
        <Profile
          key={profileUser._id}
          user={profileUser}
          onUserUpdate={(updatedUser) => {
            setLoggedInUser(updatedUser);
            setProfileUser(updatedUser);
            localStorage.setItem("loggedInUser", JSON.stringify(updatedUser));
          }}
          onEditClick={handleEditClick}
          loggedInUser={loggedInUser}
        />
      </div>
    );
  };

  return (
    <Router>
      {!isLoggedIn ? (
        <div className="fullscreen-login">
          <Routes>
            <Route path="/" element={<LoginPage onLogin={handleLogin} />} />
            <Route path="/SignUp" element={<SignUp onSignUp={handleSignUp} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      ) : (
        <div className={isDarkMode ? "app-container dark" : "app-container light"}>
          <Nav />
          <div className="main-content">
            <div className="toolbar">
              <Button onClick={toggleTheme} variant="outlined" color="inherit">
                {isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
              </Button>
              <Button onClick={handleLogout} variant="outlined" color="inherit">
                <Avatar
                  alt={loggedInUser?.username || "User"}
                  src={loggedInUser?.profileImage || "/default-avatar.png"}
                  className="avatar"
                />
                Logout
              </Button>
            </div>
            <Routes>
              <Route path="/messages/:recipientId?" element={<MessageComponent loggedInUser={loggedInUser} />} />
              <Route path="/" element={<Home />} />
              <Route path="/Notification" element={<Noti />} />
              <Route path="/Add-post" element={<NewPost />} />
              <Route path="/Search" element={<SearchProfile />} />
              <Route path="/ProfileSetting" element={<ProfileComp userId={loggedInUser._id} />} />
              {/* Updated route for viewing other users' profiles */}
              <Route path="/user/:userId" element={<OtherUserProfile loggedInUser={loggedInUser} />} />
              <Route path="*" element={<div>404 - Page Not Found</div>} />
            </Routes>
            {showEdit && (
              <EditProfileComponent
                user={loggedInUser}
                onClose={handleCloseEdit}
                onSave={handleSaveProfile}
              />
            )}
          </div>
        </div>
      )}
    </Router>
  );
};

export default App;
