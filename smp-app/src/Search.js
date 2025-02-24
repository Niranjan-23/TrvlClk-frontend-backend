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
  const currentUser = JSON.parse(localStorage.getItem('loggedInUser') || 'null');

  const fetchUsers = async (query) => {
    if (!currentUser || !currentUser._id) {
      setProfiles([]);
      setError('Please log in to search for profiles.');
      return;
    }
    try {
      const url = query && query.trim() !== ''
        ? `http://localhost:5000/api/search?query=${encodeURIComponent(query)}&excludeId=${currentUser._id}`
        : `http://localhost:5000/api/search?excludeId=${currentUser._id}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setProfiles(data.users || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching users:', error);
      setProfiles([]);
      setError('Could not load profiles. Please try again.');
    }
  };

  // Debounced version of fetchUsers
  const debouncedFetchUsers = useCallback(debounce(fetchUsers, 300), [currentUser?._id]);

  useEffect(() => {
    if (currentUser && currentUser._id) {
      fetchUsers(''); // Initial fetch only once
    }
  }, [currentUser?._id]); // Depend on _id to avoid reference issues

  const handleSearchChange = (event) => {
    const query = event.target.value;
    setSearchQuery(query);
    debouncedFetchUsers(query); // Debounced fetch
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
        fetchUsers(searchQuery); // Refresh profiles
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
        fetchUsers(searchQuery); // Refresh profiles instead of reload
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
          const isFollowing =
            currentUser &&
            currentUser.following &&
            currentUser.following.map(id => id.toString()).includes(profile._id.toString());
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