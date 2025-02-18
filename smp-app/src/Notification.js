import React, { useState } from 'react';
import Avatar from '@mui/material/Avatar';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import Button from '@mui/material/Button';
import './Notification.css';

export default function Notification() {
  const initialData = [
    { name: "John Doe", avatar: "https://randomuser.me/api/portraits/men/1.jpg" },
    { name: "Jane Smith", avatar: "https://randomuser.me/api/portraits/women/1.jpg" },
    { name: "Alice Johnson", avatar: "https://randomuser.me/api/portraits/women/2.jpg" },
  ];

  const [followers, setFollowers] = useState(initialData);

  const handleAccept = (index) => {
    const newFollowers = followers.filter((_, i) => i !== index);
    setFollowers(newFollowers);
  };

  const handleReject = (index) => {
    const newFollowers = followers.filter((_, i) => i !== index);
    setFollowers(newFollowers);
  };

  return (
    <div className="notification-container">
      <h2>Incoming Follower Requests</h2>
      {followers.length === 0 ? (
        <>
          <br />
          <p>No new follower requests</p>
        </>
      ) : (
        followers.map(({ name, avatar }, index) => (
          <div key={name} className="notification-item">
            <Avatar alt={name} src={avatar} className="avatar" />
            <div className="notification-content">
              <span>{name}</span>
              <div className="button-group">
                <Button
                  onClick={() => handleAccept(index)}
                  size="small"
                  variant="contained"
                  color="primary"
                  startIcon={<PersonAddAlt1Icon />}
                >
                  Accept
                </Button>
                <Button
                  onClick={() => handleReject(index)}
                  size="small"
                  variant="outlined"
                  color="secondary"
                >
                  Reject
                </Button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
