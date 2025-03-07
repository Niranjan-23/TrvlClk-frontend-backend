import React, { useState, useEffect, useCallback } from 'react';
import Avatar from '@mui/material/Avatar';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';
import './Search.css';
import API_BASE_URL from './config';

// Simple debounce function
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export default function Search() {
  const [searchQuery, setSearchQuery] = useState('');
  const [profiles, setProfiles] = useState([]);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(
    JSON.parse(localStorage.getItem('loggedInUser')) || null
  );

  // Helper to fetch the current user's data from the backend.
  const fetchCurrentUser = async () => {
    if (!currentUser || !currentUser._id) return;
    try {
      const response = await fetch(`https://${API_BASE_URL}/api/user/${currentUser._id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch current user');
      }
      const data = await response.json();
      setCurrentUser(data.user);
      localStorage.setItem('loggedInUser', JSON.stringify(data.user));
    } catch (err) {
      console.error('Error fetching current user:', err);
    }
  };

  const fetchUsers = async (query) => {
    if (!currentUser || !currentUser._id) {
      setProfiles([]);
      setError('Please log in to search for profiles.');
      return;
    }
    try {
      let url = `https://${API_BASE_URL}/api/search?excludeId=${currentUser._id}`;
      if (query && query.trim() !== '') {
        url += `&query=${encodeURIComponent(query)}`;
      }
      console.log("Fetching users from:", url);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setProfiles(data.users || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setProfiles([]);
      setError('Could not load profiles. Please try again.');
    }
  };

  // Create a debounced version of fetchUsers.
  const debouncedFetchUsers = useCallback(debounce(fetchUsers, 300), [currentUser?._id]);

  // On mount, refresh both the current user and the profiles.
  useEffect(() => {
    if (currentUser && currentUser._id) {
      fetchCurrentUser();
      fetchUsers('');
    }
  }, [currentUser?._id]);

  const handleSearchChange = (event) => {
    const query = event.target.value;
    setSearchQuery(query);
    debouncedFetchUsers(query);
  };

  const handleFollow = async (targetId) => {
    if (!currentUser || !currentUser._id) return;
    try {
      const response = await fetch(`https://${API_BASE_URL}/api/user/${targetId}/followRequest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requesterId: currentUser._id }),
      });
      const data = await response.json();
      if (response.ok) {
        alert('Follow request sent!');
        // Refresh profiles and current user data.
        fetchUsers(searchQuery);
        fetchCurrentUser();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      console.error('Error sending follow request:', err);
    }
  };

  const handleUnfollow = async (targetId) => {
    if (!currentUser || !currentUser._id) return;
    try {
      const response = await fetch(`https://${API_BASE_URL}/api/user/${targetId}/unfollow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followerId: currentUser._id }),
      });
      const data = await response.json();
      if (response.ok) {
        alert('Unfollowed successfully!');
        setCurrentUser(data.user);
        localStorage.setItem('loggedInUser', JSON.stringify(data.user));
        fetchUsers(searchQuery);
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      console.error('Error unfollowing:', err);
    }
  };

  return (
    <div className="search-container">
      <form onSubmit={(e) => e.preventDefault()}>
        <TextField
          id="search-bar"
          className="text"
          value={searchQuery}
          onChange={handleSearchChange}
          label="Search Profile"
          variant="outlined"
          placeholder="Search..."
          size="small"
        />
        <IconButton type="submit" aria-label="search">
          <SearchIcon style={{ fill: 'blue' }} />
        </IconButton>
      </form>
      {error && <div className="error">{error}</div>}
      <div className="profile-box">
        {profiles.map((profile) => {
          // Determine if the current user already follows this profile.
          const isFollowing =
            profile.followers?.map((id) => id.toString()).includes(currentUser._id.toString());
          const isRequested =
            profile.followRequests?.map((id) => id.toString()).includes(currentUser._id.toString());

          return (
            <div key={profile._id} className="profile-item">
              <Avatar alt={profile.name} src={profile.profileImage} className="avatar" />
              <div className="profile-content">
                <span>{profile.name}</span>
                <div className="button-group">
                  {isFollowing ? (
                    <Button
                      onClick={() => handleUnfollow(profile._id)}
                      size="small"
                      variant="contained"
                      color="secondary"
                    >
                      Unfollow
                    </Button>
                  ) : isRequested ? (
                    <Button disabled size="small" variant="contained">
                      Requested
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleFollow(profile._id)}
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
          );
        })}
      </div>
    </div>
  );
}
