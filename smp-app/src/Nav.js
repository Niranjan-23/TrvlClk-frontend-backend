import React from 'react';
import { Link } from 'react-router-dom';
import Button from '@mui/material/Button';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import PersonSearchTwoToneIcon from '@mui/icons-material/PersonSearchTwoTone';
import NotificationsActiveTwoToneIcon from '@mui/icons-material/NotificationsActiveTwoTone';
import AccountCircleTwoToneIcon from '@mui/icons-material/AccountCircleTwoTone';
import './Nav.css';

const Nav = () => {
  return (
    <div className="nav-container">
      <div className="nav-title">TrvlClk</div>
      <div className="nav-links">
        <Link to="/" className="nav-link">
          <Button className="nav-button" color="success" variant="text">
            <HomeRoundedIcon fontSize="large" />
            Home
          </Button>
        </Link>
        <Link to="/Notification" className="nav-link">
          <Button color="success" className="nav-button" variant="text">
            <NotificationsActiveTwoToneIcon fontSize="large" />
            Notification
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
