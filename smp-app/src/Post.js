import React, { useState, useEffect } from 'react';
import './Post.css';
import FavoriteTwoToneIcon from '@mui/icons-material/FavoriteTwoTone';
import ChatBubbleTwoToneIcon from '@mui/icons-material/ChatBubbleTwoTone';
import SendTwoToneIcon from '@mui/icons-material/SendTwoTone';
import Button from '@mui/material/Button';
import AccountCircleTwoToneIcon from '@mui/icons-material/AccountCircleTwoTone';
import Comment from './Comment';

const Post = ({ postId }) => {
  const [showComments, setShowComments] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);

  // Load like count and user like status from local storage
  useEffect(() => {
    const savedLikeCount = JSON.parse(localStorage.getItem(`likeCount_${postId}`)) || 0;
    const savedHasLiked = JSON.parse(localStorage.getItem(`hasLiked_${postId}`)) || false;
    setLikeCount(savedLikeCount);
    setHasLiked(savedHasLiked);
  }, [postId]);

  const handleLike = () => {
    if (!hasLiked) {
      const newLikeCount = likeCount + 1;
      setLikeCount(newLikeCount);
      setHasLiked(true);
      // Save like count and like status to local storage
      localStorage.setItem(`likeCount_${postId}`, JSON.stringify(newLikeCount));
      localStorage.setItem(`hasLiked_${postId}`, JSON.stringify(true));
    }
  };

  const handleClick = () => {
    setShowComments((prev) => !prev);
  };

  return (
    <div className="post-container">
      <div className={`post ${showComments ? 'blurred' : ''}`}>
        <img
          className="item1"
          src="https://images.pexels.com/photos/8952192/pexels-photo-8952192.jpeg?auto=compress&cs=tinysrgb&w=600&lazy=load"
          alt="Post content"
        />
        <div className="item2">
          <Button onClick={handleLike} disabled={hasLiked}>
            <FavoriteTwoToneIcon fontSize="medium" color={hasLiked ? "error" : "inherit"} />
            <span className="like-count">{likeCount}</span>
          </Button>
          <Button onClick={handleClick}>
            <ChatBubbleTwoToneIcon fontSize="medium" />
          </Button>
          <Button>
            <SendTwoToneIcon fontSize="medium" />
          </Button>
          <Button>
            <AccountCircleTwoToneIcon fontSize="medium" />
          </Button>
        </div>
      </div>

      {showComments && (
        <div className="comments-section">
          <Comment />
        </div>
      )}
    </div>
  );
};

export default Post;
