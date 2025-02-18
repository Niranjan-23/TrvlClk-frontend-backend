import React, { useState } from 'react';
import Avatar from '@mui/material/Avatar';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';
import './Search.css';

export default function Search() {
  const initialData = [
    { name: "Paris", avatar: "https://images.pexels.com/photos/789555/pexels-photo-789555.jpeg" },
    { name: "London", avatar: "https://images.pexels.com/photos/41162/moon-landing-apollo-11-nasa-buzz-aldrin-41162.jpeg" },
    { name: "New York", avatar: "https://images.pexels.com/photos/30364871/pexels-photo-30364871.jpeg" },
  ];

  const [searchQuery, setSearchQuery] = useState('');
  const [profiles, setProfiles] = useState(initialData);

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const filteredProfiles = profiles.filter(profile =>
    profile.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="search-container">
      <form>
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
        {filteredProfiles.map((profile, index) => (
          <div key={profile.name} className="profile-item">
            <Avatar alt={profile.name} src={profile.avatar} className="avatar" />
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
