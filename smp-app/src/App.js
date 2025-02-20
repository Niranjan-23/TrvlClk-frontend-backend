import React, { useState } from 'react';
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
import Button from '@mui/material/Button';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { Avatar } from '@mui/material';

// Helper functions to retrieve data from localStorage
const getLoggedInUserFromLocalStorage = () => {
  const user = localStorage.getItem('loggedInUser');
  if (!user || user === "undefined") {
    return null;
  }
  try {
    return JSON.parse(user);
  } catch (error) {
    console.error("Error parsing loggedInUser from localStorage:", error);
    return null;
  }
};

const getTokenFromLocalStorage = () => {
  return localStorage.getItem('token') || null;
};

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(!!getTokenFromLocalStorage());
  const [loggedInUser, setLoggedInUser] = useState(getLoggedInUserFromLocalStorage());
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Handle login by storing token and user data in localStorage
  const handleLogin = (token, user) => {
    setLoggedInUser(user);
    setIsLoggedIn(true);
    localStorage.setItem('token', token);
    localStorage.setItem('loggedInUser', JSON.stringify(user));
  };

  // Handle signup similarly
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
    setIsDarkMode((prev) => !prev);
  };

  // Local Route Components
  const Home = () => (
    <div className="posts-container">
      <Post postId="post1" />
      <Post postId="post2" />
    </div>
  );

  const NewPost = () => (
    <div className="posts-container">
      <AddPost 
        user={loggedInUser} 
        onPostAdded={(updatedUser) => {
          setLoggedInUser(updatedUser);
          localStorage.setItem('loggedInUser', JSON.stringify(updatedUser));
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

  // Pass onUserUpdate so Profile can update parent state if needed.
  const ProfileComp = () => (
    <div className="posts-container">
      <Profile 
        user={loggedInUser} 
        onUserUpdate={(updatedUser) => {
          setLoggedInUser(updatedUser);
          localStorage.setItem('loggedInUser', JSON.stringify(updatedUser));
        }} 
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
          </div>
        </div>
      )}
    </Router>
  );
};

export default App;
