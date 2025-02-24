// Post.jsx (adjusted for backend data structure)
import React, { useState, useEffect } from 'react';
import './Post.css';
import FavoriteTwoToneIcon from '@mui/icons-material/FavoriteTwoTone';
import ChatBubbleTwoToneIcon from '@mui/icons-material/ChatBubbleTwoTone';
import SendTwoToneIcon from '@mui/icons-material/SendTwoTone';
import Button from '@mui/material/Button';
import Comment from './Comment';
import { Avatar } from '@mui/material';

const Post = ({ post, loggedInUser }) => {
  const [showComments, setShowComments] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);

  useEffect(() => {
    const savedLikeCount = JSON.parse(localStorage.getItem(`likeCount_${post._id || post.imageUrl}`)) || 0;
    const savedHasLiked = JSON.parse(localStorage.getItem(`hasLiked_${post._id || post.imageUrl}`)) || false;
    setLikeCount(savedLikeCount);
    setHasLiked(savedHasLiked);
  }, [post]);

  const handleLike = () => {
    if (!hasLiked) {
      const newLikeCount = likeCount + 1;
      setLikeCount(newLikeCount);
      setHasLiked(true);
      localStorage.setItem(`likeCount_${post._id || post.imageUrl}`, JSON.stringify(newLikeCount));
      localStorage.setItem(`hasLiked_${post._id || post.imageUrl}`, JSON.stringify(true));
    }
  };

  const handleCommentToggle = () => {
    setShowComments(prev => !prev);
  };

  return (
    <div className="post-wrapper">
      <div className="post-container">
        <div className="post-content">
          <img
            src={post.imageUrl || "https://images.pexels.com/photos/8952192/pexels-photo-8952192.jpeg?auto=compress&cs=tinysrgb&w=600&lazy=load"}
            alt="Post content"
          />
          <div className="action-bar">
            <div className="action-buttons">
              <Button onClick={handleLike} disabled={hasLiked} className="action-btn">
                <FavoriteTwoToneIcon fontSize="medium" color={hasLiked ? "error" : "inherit"} />
                <span className="count">{likeCount}</span>
              </Button>
              <Button onClick={handleCommentToggle} className="action-btn">
                <ChatBubbleTwoToneIcon fontSize="medium" />
              </Button>
              <Button className="action-btn">
                <SendTwoToneIcon fontSize="medium" />
              </Button>
            </div>
            <Button className="profile-btn">
              <Avatar
                alt={post.username || 'Unknown'}
                src={post.profileImage || '/default-avatar.png'}
                className="avatar"
                sx={{ width: 30, height: 30 }}
              />
              <span className="profile-name">{post.username || 'Unknown'}</span>
            </Button>
          </div>
        </div>
      </div>
      {showComments && (
        <div className="comment-area">
          <Comment />
        </div>
      )}
    </div>
  );
};

export default Post;