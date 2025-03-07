import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Nav from './Nav';
import Post from './Post';
import LoginPage from './LoginPage';
import './App.css';
import AddPost from './AddPost';
import Search from './Search';
import Notification from './Notification';
import SignUp from './SignUp';
import Profile from './Profile';
import EditProfileComponent from './EditProfileComponent';
import Button from '@mui/material/Button';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { Avatar } from '@mui/material';
import API_BASE_URL from './config';

// Helper functions to retrieve data from localStorage
const getLoggedInUserFromLocalStorage = () => {
  const user = localStorage.getItem('loggedInUser');
  if (!user || user === "undefined") return null;
  try {
    return JSON.parse(user);
  } catch (error) {
    console.error("Error parsing loggedInUser from localStorage:", error);
    return null;
  }
};

const getTokenFromLocalStorage = () => localStorage.getItem('token') || null;

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(!!getTokenFromLocalStorage());
  const [loggedInUser, setLoggedInUser] = useState(getLoggedInUserFromLocalStorage());
  const [isDarkMode, setIsDarkMode] = useState(true); // Dark theme default
  const [showEdit, setShowEdit] = useState(false); // Control EditProfileComponent visibility

  const handleLogin = (token, user) => {
    setLoggedInUser(user);
    setIsLoggedIn(true);
    localStorage.setItem('token', token);
    localStorage.setItem('loggedInUser', JSON.stringify(user));
  };

  const handleSignUp = (token, user) => {
    setLoggedInUser(user);
    setIsLoggedIn(true);
    localStorage.setItem('token', token);
    localStorage.setItem('loggedInUser', JSON.stringify(user));
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('token');
    localStorage.removeItem('loggedInUser');
  };

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const handleEditClick = () => setShowEdit(true);
  const handleCloseEdit = () => setShowEdit(false);

  const handleSaveProfile = (updatedUser) => {
    setLoggedInUser(updatedUser);
    localStorage.setItem("loggedInUser", JSON.stringify(updatedUser));
    setShowEdit(false); // Close modal after save
  };

  // Home component: Fetch timeline posts (from followed users)
  const Home = () => {
    const [timelinePosts, setTimelinePosts] = useState([]);

    useEffect(() => {
      const fetchTimeline = async () => {
        try {
          const url = `http://${API_BASE_URL}/timeline?userId=${loggedInUser._id}`;
          console.log('Fetching timeline from:', url);
          const response = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${getTokenFromLocalStorage()}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            console.log('Timeline posts:', data.posts);
            setTimelinePosts(data.posts || []);
          } else {
            console.error('Failed to fetch timeline posts:', response.status);
          }
        } catch (error) {
          console.error('Error fetching timeline posts:', error);
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
            <Post 
              key={index} 
              post={post} 
              loggedInUser={loggedInUser} 
            />
          ))
        ) : (
          <p>No posts to display</p>
        )}
      </div>
    );
  };

  // NewPost component: Adding a new post will refresh timeline without changing loggedInUser
  const NewPost = () => (
    <div className="posts-container">
      <AddPost 
        user={loggedInUser}
        onPostAdded={() => {
          // Optionally, trigger a timeline refresh here
          console.log('New post added, refresh timeline if needed.');
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

  const ProfileComp = () => (
    <div className="posts-container">
      <Profile 
        user={loggedInUser}
        onUserUpdate={updatedUser => {
          setLoggedInUser(updatedUser);
          localStorage.setItem('loggedInUser', JSON.stringify(updatedUser));
        }}
        onEditClick={handleEditClick}
      />
    </div>
  );

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
        <div className={isDarkMode ? 'app-container dark' : 'app-container light'}>
          <Nav />
          <div className="main-content">
            <div className="toolbar">
              <Button onClick={toggleTheme} variant="outlined" color="inherit">
                {isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
              </Button>
              <Button onClick={handleLogout} variant="outlined" color="inherit">
                <Avatar
                  alt={loggedInUser?.username || 'User'}
                  src={loggedInUser?.profileImage || '/default-avatar.png'}
                  className="avatar"
                />
                Logout
              </Button>
            </div>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/Notification" element={<Noti />} />
              <Route path="/Add-post" element={<NewPost />} />
              <Route path="/Search" element={<SearchProfile />} />
              <Route path="/ProfileSetting" element={<ProfileComp />} />
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
