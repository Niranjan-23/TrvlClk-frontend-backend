import React, { useState, useEffect, useCallback } from 'react';
import Avatar from '@mui/material/Avatar';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';
import './Search.css';

// Simple debounce function
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export default function Search() {
  const [searchQuery, setSearchQuery] = useState('');
  const [profiles, setProfiles] = useState([]);
  const [error, setError] = useState(null);
  // currentUser is stored as a state variable.
  const [currentUser, setCurrentUser] = useState(
    JSON.parse(localStorage.getItem('loggedInUser') || 'null')
  );

  // Helper to fetch the current user's data from the backend.
  const fetchCurrentUser = async () => {
    if (!currentUser || !currentUser._id) return;
    try {
      const response = await fetch(`http://localhost:5000/api/user/${currentUser._id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch current user');
      }
      const data = await response.json();
      setCurrentUser(data.user);
      localStorage.setItem('loggedInUser', JSON.stringify(data.user));
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchUsers = async (query) => {
    if (!currentUser || !currentUser._id) {
      setProfiles([]);
      setError('Please log in to search for profiles.');
      return;
    }
    try {
      const url =
        query && query.trim() !== ''
          ? `http://localhost:5000/api/search?query=${encodeURIComponent(query)}&excludeId=${currentUser._id}`
          : `http://localhost:5000/api/search?excludeId=${currentUser._id}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      // data.users includes followRequests and followers from the backend.
      setProfiles(data.users || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching users:', error);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?._id]);

  const handleSearchChange = (event) => {
    const query = event.target.value;
    setSearchQuery(query);
    debouncedFetchUsers(query);
  };

  const handleFollow = async (targetId) => {
    if (!currentUser || !currentUser._id) return;
    try {
      const response = await fetch(`http://localhost:5000/api/user/${targetId}/followRequest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requesterId: currentUser._id.toString() }),
      });
      const data = await response.json();
      if (response.ok) {
        alert('Follow request sent!');
        // Refresh profiles so that the target user's followRequests are updated.
        fetchUsers(searchQuery);
        // Refresh current user info if needed.
        fetchCurrentUser();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error sending follow request:', error);
    }
  };

  const handleUnfollow = async (targetId) => {
    if (!currentUser || !currentUser._id) return;
    try {
      const response = await fetch(`http://localhost:5000/api/user/${targetId}/unfollow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followerId: currentUser._id.toString() }),
      });
      const data = await response.json();
      if (response.ok) {
        alert('Unfollowed successfully!');
        // Update currentUser using the returned data from the unfollow endpoint.
        setCurrentUser(data.user);
        localStorage.setItem('loggedInUser', JSON.stringify(data.user));
        // Refresh profiles to update the UI.
        fetchUsers(searchQuery);
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error unfollowing:', error);
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
          // Determine if the current user already follows this profile by checking the backend data.
          const isFollowing =
            profile.followers &&
            profile.followers
              .map((id) => id.toString())
              .includes(currentUser._id.toString());

          // Check if a follow request is pending.
          const isRequested =
            profile.followRequests &&
            profile.followRequests
              .map((id) => id.toString())
              .includes(currentUser._id.toString());

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
