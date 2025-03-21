import React, { useState, useRef, useEffect } from 'react';
import './Post.css';
import FavoriteTwoToneIcon from '@mui/icons-material/FavoriteTwoTone';
import ChatBubbleTwoToneIcon from '@mui/icons-material/ChatBubbleTwoTone';
import SendTwoToneIcon from '@mui/icons-material/SendTwoTone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import Button from '@mui/material/Button';
import Comment from './Comment';
import { Avatar } from '@mui/material';
import API_BASE_URL from './config';
import { useNavigate } from 'react-router-dom';

const Post = ({ post, loggedInUser }) => {
  const [showComments, setShowComments] = useState(false);
  const [postLikes, setPostLikes] = useState(post.likes || []);
  const postContainerRef = useRef(null);
  const commentAreaRef = useRef(null);
  const navigate = useNavigate();

  const hasLiked = postLikes.some(id => id.toString() === loggedInUser._id);

  useEffect(() => {
    if (showComments && postContainerRef.current && commentAreaRef.current) {
      const height = postContainerRef.current.clientHeight;
      commentAreaRef.current.style.height = `${height}px`;
    }
  }, [showComments]);

  const handleLike = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/posts/${post._id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser._id }),
      });
      if (!response.ok) {
        console.error('Error liking post');
        return;
      }
      const data = await response.json();
      setPostLikes(data.post.likes);
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleCommentToggle = () => {
    setShowComments((prev) => !prev);
  };

  const handleProfileClick = () => {
    if (post.user._id === loggedInUser._id) {
      navigate(`/profile`);
    } else {
      navigate(`/user/${post.user._id}`);
    }
  };

  return (
    <div className="post-wrapper">
      <div className="post-container" ref={postContainerRef}>
        <div className="post-content">
          <img
            src={post.imageUrl || 'https://images.pexels.com/photos/8952192/pexels-photo-8952192.jpeg?auto=compress&cs=tinysrgb&w=600&lazy=load'}
            alt="Post content"
          />
          <div className="action-bar">
            <div className="action-buttons">
              <Button onClick={handleLike} disabled={hasLiked} className="action-btn">
                <FavoriteTwoToneIcon fontSize="medium" color={hasLiked ? 'error' : 'inherit'} />
                <span className="count">{postLikes.length}</span>
              </Button>
              <Button onClick={handleCommentToggle} className="action-btn">
                <ChatBubbleTwoToneIcon fontSize="medium" />
              </Button>
              <Button className="action-btn">
                <SendTwoToneIcon fontSize="medium" />
              </Button>
            </div>
            <Button onClick={handleProfileClick} className="profile-btn">
              <Avatar
                alt={post.user?.username || 'Unknown'}
                src={post.user?.profileImage || '/default-avatar.png'}
                className="avatar"
                sx={{ width: 30, height: 30 }}
              />
              <span className="profile-name">{post.user?.username || 'Unknown'}</span>
            </Button>
          </div>
          <div className="post-info">
            {post.description && <p className="post-description">{post.description}</p>}
            {post.location && (
              <p className="post-location">
                <LocationOnIcon fontSize="small" /> {post.location}
              </p>
            )}
          </div>
        </div>
      </div>
      {showComments && (
        <div className="comment-area" ref={commentAreaRef}>
          <Comment postId={post._id} loggedInUser={loggedInUser} />
        </div>
      )}
    </div>
  );
};

export default Post;