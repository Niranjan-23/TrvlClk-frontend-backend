import React, { useState, useEffect } from 'react';
import Avatar from '@mui/material/Avatar';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';
import './Search.css';

export default function Search() {
  const [searchQuery, setSearchQuery] = useState('');
  const [profiles, setProfiles] = useState([]);

  // Fetch users from the server based on the search query.
  const fetchUsers = async (query) => {
    try {
      const response = await fetch(`http://localhost:5000/api/search?query=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setProfiles(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setProfiles([]); // Clear profiles on error
    }
  };

  // On component mount, fetch default suggestions.
  useEffect(() => {
    fetchUsers(""); // With an empty query, the server returns default users.
  }, []);

  // Handle search input change.
  const handleSearchChange = (event) => {
    const query = event.target.value;
    setSearchQuery(query);
    // Fetch users whether query is empty or not—server will return defaults for empty.
    fetchUsers(query);
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
          <SearchIcon style={{ fill: "blue" }} />
        </IconButton>
      </form>
      <div className="profile-box">
        {profiles.map((profile) => (
          <div key={profile._id} className="profile-item">
            <Avatar alt={profile.name} src={profile.profileImage} className="avatar" />
            <div className="profile-content">
              <span>{profile.name}</span>
              <div className="button-group">
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  startIcon={<PersonAddAlt1Icon />}
                >
                  Follow
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
